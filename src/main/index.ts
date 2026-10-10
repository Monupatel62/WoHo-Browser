import { app, BrowserWindow, WebContentsView, ipcMain, session, shell, dialog, type DownloadItem, type IpcMainInvokeEvent } from 'electron';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BrowserDataStore } from './browser-data';
import { isAllowedNavigationTarget, resolveAddressInput } from '../shared/navigation';
import type { BrowserState, BrowserTabState, DownloadRecord, DownloadStatus } from '../shared/browser-types';

const CHROME_HEIGHT = 108;
const HOME_URL = 'https://www.google.com/';
let mainWindow: BrowserWindow | null = null;
let browserSession: Electron.Session;
let activeTabId: string | null = null;
const tabOrder: string[] = [];
const views = new Map<string, WebContentsView>();
let browserDataStore: BrowserDataStore;
const downloads = new Map<string, DownloadRecord>();
const downloadItems = new Map<string, DownloadItem>();
const MAX_DOWNLOAD_RECORDS = 100;

function publishDownloads(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('browser:downloads', [...downloads.values()].map((record) => ({ ...record })));
  }
}

function setDownloadStatus(id: string, status: DownloadStatus): void {
  const record = downloads.get(id);
  if (!record) return;
  record.status = status;
  const item = downloadItems.get(id);
  if (item) {
    record.receivedBytes = item.getReceivedBytes();
    record.totalBytes = item.getTotalBytes();
    record.canResume = item.canResume();
    if (item.getSavePath()) record.savePath = item.getSavePath();
  }
  publishDownloads();
}

function pruneDownloadRecords(): void {
  if (downloads.size <= MAX_DOWNLOAD_RECORDS) return;
  for (const [id, record] of downloads) {
    if (downloads.size <= MAX_DOWNLOAD_RECORDS) break;
    if (record.status === 'completed' || record.status === 'cancelled' || record.status === 'interrupted') downloads.delete(id);
  }
}

function registerDownloadHandling(): void {
  browserSession.on('will-download', (event, item) => {
    const id = randomUUID();
    const record: DownloadRecord = {
      id,
      filename: item.getFilename().slice(0, 255) || 'download',
      url: item.getURL().slice(0, 4096),
      status: 'waiting',
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      canResume: item.canResume(),
      startedAt: new Date().toISOString(),
    };
    downloads.set(id, record);
    downloadItems.set(id, item);
    pruneDownloadRecords();
    publishDownloads();
    item.on('updated', (_updateEvent, state) => {
      if (state === 'interrupted') setDownloadStatus(id, 'interrupted');
      else if (item.isPaused()) setDownloadStatus(id, 'paused');
      else setDownloadStatus(id, 'progressing');
    });
    item.once('done', (_doneEvent, state) => {
      if (state === 'completed') setDownloadStatus(id, 'completed');
      else if (state === 'cancelled') setDownloadStatus(id, 'cancelled');
      else setDownloadStatus(id, 'interrupted');
      downloadItems.delete(id);
      pruneDownloadRecords();
      publishDownloads();
    });
    void (async () => {
      if (!mainWindow || mainWindow.isDestroyed()) { item.cancel(); return; }
      const choice = await dialog.showSaveDialog(mainWindow, {
        title: 'Save download',
        defaultPath: record.filename,
        buttonLabel: 'Save',
      });
      if (choice.canceled || !choice.filePath) {
        if (downloadItems.get(id) === item) item.cancel();
        return;
      }
      if (downloadItems.get(id) !== item) return;
      record.savePath = choice.filePath;
      item.setSavePath(choice.filePath);
      setDownloadStatus(id, item.isPaused() ? 'paused' : 'progressing');
    })().catch((error: unknown) => {
      console.error('Could not prepare download:', error instanceof Error ? error.message : 'Unknown download error');
      if (downloadItems.get(id) === item) {
        item.cancel();
        setDownloadStatus(id, 'interrupted');
      }
    });
  });
}

function assertTrustedChrome(event: IpcMainInvokeEvent): void {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== event.sender.mainFrame) {
    throw new Error('Untrusted IPC sender.');
  }
  const senderUrl = event.sender.getURL();
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    const actual = new URL(senderUrl);
    const expected = new URL(devUrl);
    if (actual.origin !== expected.origin || actual.pathname !== expected.pathname) throw new Error('IPC sender origin rejected.');
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
  wc.on('did-navigate', (_event, url) => {
    changed();
    void browserDataStore.recordVisit(url, wc.getTitle()).catch((error: unknown) => {
      console.error('Could not persist browser history:', error instanceof Error ? error.message : 'Unknown storage error');
    });
  });
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
  handle('browser:stop', () => activeView()?.webContents.stop());
  handle('browser:list-bookmarks', () => browserDataStore.listBookmarks());
  handle('browser:add-bookmark', (_event, title: unknown, url: unknown) => {
    if (typeof title !== 'string' || typeof url !== 'string' || title.length > 512 || url.length > 4096) {
      throw new Error('Invalid bookmark payload.');
    }
    return browserDataStore.addBookmark(title, url);
  });
  handle('browser:remove-bookmark', (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length > 100) throw new Error('Invalid bookmark ID.');
    return browserDataStore.removeBookmark(id);
  });
  handle('browser:list-history', () => browserDataStore.listHistory());
  handle('browser:clear-history', () => browserDataStore.clearHistory());
  handle('browser:list-downloads', () => [...downloads.values()].map((record) => ({ ...record })));
  handle('browser:pause-download', (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length > 100) throw new Error('Invalid download ID.');
    const item = downloadItems.get(id);
    if (!item || item.isDestroyed() || !item.isPaused() && downloads.get(id)?.status !== 'progressing') throw new Error('Download cannot be paused.');
    item.pause();
    setDownloadStatus(id, 'paused');
  });
  handle('browser:resume-download', (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length > 100) throw new Error('Invalid download ID.');
    const item = downloadItems.get(id);
    if (!item || item.isDestroyed() || !item.isPaused() || !item.canResume()) throw new Error('Download cannot be resumed.');
    item.resume();
    setDownloadStatus(id, 'progressing');
  });
  handle('browser:cancel-download', (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length > 100) throw new Error('Invalid download ID.');
    const item = downloadItems.get(id);
    if (!item || item.isDestroyed()) throw new Error('Download is no longer active.');
    item.cancel();
    setDownloadStatus(id, 'cancelled');
  });
  handle('browser:reveal-download', (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length > 100) throw new Error('Invalid download ID.');
    const record = downloads.get(id);
    if (!record || record.status !== 'completed' || !record.savePath) throw new Error('Only completed downloads can be revealed.');
    shell.showItemInFolder(record.savePath);
  });
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
      try { const actual = new URL(value);
      const expected = new URL(rendererUrl);
      return actual.origin === expected.origin && actual.pathname === expected.pathname; } catch { return false; }
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
  browserDataStore = new BrowserDataStore(join(app.getPath('userData'), 'browser-data.json'));
  browserSession = session.fromPartition('persist:woho-browser');
  browserSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  registerDownloadHandling();
  browserSession.setPermissionCheckHandler(() => false);
  registerIpc();
  createWindow();
  void createTab(HOME_URL);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { createWindow(); void createTab(HOME_URL); } });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
