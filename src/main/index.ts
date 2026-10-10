import { app, BrowserWindow, WebContentsView, ipcMain, session, type IpcMainInvokeEvent } from 'electron';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { isAllowedNavigationTarget, resolveAddressInput } from '../shared/navigation';
import type { BrowserState, BrowserTabState } from '../shared/browser-types';

const CHROME_HEIGHT = 108;
const HOME_URL = 'https://www.google.com/';
let mainWindow: BrowserWindow | null = null;
let browserSession: Electron.Session;
let activeTabId: string | null = null;
const tabOrder: string[] = [];
const views = new Map<string, WebContentsView>();

function assertTrustedChrome(event: IpcMainInvokeEvent): void {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== event.sender.mainFrame) {
    throw new Error('Untrusted IPC sender.');
  }
  const senderUrl = event.sender.getURL();
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    if (new URL(senderUrl).origin !== new URL(devUrl).origin) throw new Error('IPC sender origin rejected.');
  } else if (!senderUrl.startsWith('file://') || !senderUrl.endsWith('/out/renderer/index.html')) {
    throw new Error('IPC sender origin rejected.');
  }
}

function activeView(): WebContentsView | undefined {
  return activeTabId ? views.get(activeTabId) : undefined;
}

function getState(): BrowserState {
  const tabs: BrowserTabState[] = tabOrder.flatMap((id) => {
    const view = views.get(id);
    if (!view || view.webContents.isDestroyed()) return [];
    const wc = view.webContents;
    return [{
      id,
      title: wc.getTitle().trim() || 'New Tab',
      url: wc.getURL() || '',
      loading: wc.isLoading(),
      canGoBack: wc.navigationHistory.canGoBack(),
      canGoForward: wc.navigationHistory.canGoForward(),
      isActive: id === activeTabId,
    }];
  });
  return { tabs, activeTabId };
}

function publishState(): void {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('browser:state', getState());
}

function layoutViews(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { width, height } = mainWindow.getContentBounds();
  for (const [id, view] of views) {
    view.setVisible(id === activeTabId);
    view.setBounds({
      x: 0,
      y: CHROME_HEIGHT,
      width: Math.max(0, width),
      height: Math.max(0, height - CHROME_HEIGHT),
    });
  }
}

function wireTabEvents(id: string, view: WebContentsView): void {
  const wc = view.webContents;
  const changed = () => { layoutViews(); publishState(); };
  wc.on('did-navigate', changed);
  wc.on('did-navigate-in-page', changed);
  wc.on('page-title-updated', changed);
  wc.on('did-start-loading', changed);
  wc.on('did-stop-loading', changed);
  wc.on('did-fail-load', changed);
  wc.on('render-process-gone', changed);
  wc.on('will-navigate', (event, targetUrl) => {
    if (!isAllowedNavigationTarget(targetUrl)) event.preventDefault();
  });
  wc.on('will-redirect', (event, targetUrl) => {
    if (!isAllowedNavigationTarget(targetUrl)) event.preventDefault();
  });
  wc.setWindowOpenHandler(() => ({ action: 'deny' }));
  wc.on('destroyed', () => {
    views.delete(id);
    const index = tabOrder.indexOf(id);
    if (index >= 0) tabOrder.splice(index, 1);
    if (activeTabId === id) activeTabId = tabOrder[Math.max(0, index - 1)] ?? tabOrder[0] ?? null;
    layoutViews();
    publishState();
  });
}

async function createTab(target = HOME_URL): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const id = randomUUID();
  const view = new WebContentsView({
    webPreferences: {
      session: browserSession,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });
  views.set(id, view);
  tabOrder.push(id);
  activeTabId = id;
  mainWindow.contentView.addChildView(view);
  wireTabEvents(id, view);
  layoutViews();
  publishState();
  try {
    const url = resolveAddressInput(target);
    await view.webContents.loadURL(url);
  } catch (error) {
    console.error('Tab navigation failed:', error instanceof Error ? error.message : 'Unknown error');
    publishState();
  }
}

function registerIpc(): void {
  const handle = (channel: string, fn: (event: IpcMainInvokeEvent, ...args: any[]) => unknown) => {
    ipcMain.handle(channel, (event, ...args) => {
      assertTrustedChrome(event);
      return fn(event, ...args);
    });
  };
  handle('browser:get-state', () => getState());
  handle('browser:open-tab', (_event, url?: unknown) => {
    if (url !== undefined && (typeof url !== 'string' || url.length > 4096)) throw new Error('Invalid URL payload.');
    return createTab(typeof url === 'string' ? url : HOME_URL);
  });
  handle('browser:select-tab', (_event, id: unknown) => {
    if (typeof id !== 'string' || !views.has(id)) throw new Error('Unknown tab.');
    activeTabId = id; layoutViews(); publishState();
  });
  handle('browser:close-tab', (_event, id: unknown) => {
    if (typeof id !== 'string' || !views.has(id)) throw new Error('Unknown tab.');
    const view = views.get(id)!;
    const index = tabOrder.indexOf(id);
    mainWindow?.contentView.removeChildView(view);
    views.delete(id);
    if (index >= 0) tabOrder.splice(index, 1);
    if (activeTabId === id) activeTabId = tabOrder[Math.max(0, index - 1)] ?? tabOrder[0] ?? null;
    if (!view.webContents.isDestroyed()) view.webContents.close();
    if (tabOrder.length === 0) void createTab(HOME_URL);
    layoutViews(); publishState();
  });
  handle('browser:navigate', async (_event, value: unknown) => {
    if (typeof value !== 'string' || value.length > 4096) throw new Error('Invalid address input.');
    const view = activeView();
    if (!view) return createTab(value);
    const target = resolveAddressInput(value);
    if (!isAllowedNavigationTarget(target)) throw new Error('Navigation target blocked.');
    await view.webContents.loadURL(target);
    publishState();
  });
  handle('browser:back', () => { const view = activeView(); if (view?.webContents.navigationHistory.canGoBack()) view.webContents.navigationHistory.goBack(); });
  handle('browser:forward', () => { const view = activeView(); if (view?.webContents.navigationHistory.canGoForward()) view.webContents.navigationHistory.goForward(); });
  handle('browser:reload', () => activeView()?.webContents.reload());
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 720,
    minHeight: 520,
    title: 'WoHo Browser',
    backgroundColor: '#0b1020',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  const isTrustedRendererUrl = (value: string) => {
    if (rendererUrl) {
      try { return new URL(value).origin === new URL(rendererUrl).origin; } catch { return false; }
    }
    return value.startsWith('file://') && value.endsWith('/out/renderer/index.html');
  };
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedRendererUrl(url)) event.preventDefault();
  });
  mainWindow.webContents.on('will-redirect', (event, url) => {
    if (!isTrustedRendererUrl(url)) event.preventDefault();
  });
  mainWindow.on('resize', layoutViews);
  mainWindow.on('closed', () => {
    mainWindow = null;
    for (const view of views.values()) if (!view.webContents.isDestroyed()) view.webContents.close();
    views.clear(); tabOrder.length = 0; activeTabId = null;
  });
  if (rendererUrl) void mainWindow.loadURL(rendererUrl);
  else void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  mainWindow.webContents.on('did-finish-load', () => { layoutViews(); publishState(); });
}

app.whenReady().then(() => {
  browserSession = session.fromPartition('persist:woho-browser');
  browserSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  browserSession.setPermissionCheckHandler(() => false);
  registerIpc();
  createWindow();
  void createTab(HOME_URL);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { createWindow(); void createTab(HOME_URL); } });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
