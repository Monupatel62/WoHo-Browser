import { app, BrowserWindow, WebContentsView, ipcMain, session, shell, dialog, type DownloadItem, type IpcMainInvokeEvent } from 'electron';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BrowserDataStore } from './browser-data';
import { DownloadHistoryStore } from './download-history';
import { safeDownloadFilename, safeDownloadUrl } from '../shared/download-policy';
import { normalizeFindQuery } from '../shared/find-query';
import { createPermissionGrantKey, getPermissionOrigin } from '../shared/permission-policy';
import { isAllowedNavigationTarget, resolveAddressInput } from '../shared/navigation';
import { shouldPersistBrowsingHistory } from '../shared/privacy-policy';
import { getDownloadIdsToPrune } from '../shared/download-retention';
import { getOrCreatePermissionPrompt } from '../shared/permission-prompt';
import type { BrowserState, BrowserTabState, DownloadRecord, DownloadStatus, FindResult } from '../shared/browser-types';

const CHROME_HEIGHT = 108;
const DATA_PANEL_HEIGHT = 360;
let overlayPanelHeight = 0;
const HOME_URL = 'https://www.google.com/';
let mainWindow: BrowserWindow | null = null;
let browserSession: Electron.Session;
let activeTabId: string | null = null;
const tabOrder: string[] = [];
const views = new Map<string, WebContentsView>();
let browserDataStore: BrowserDataStore;
let downloadHistoryStore: DownloadHistoryStore;
const downloads = new Map<string, DownloadRecord>();
const downloadItems = new Map<string, DownloadItem>();
const MAX_DOWNLOAD_RECORDS = 100;
const permissionDecisionsBySession = new WeakMap<Electron.Session, Map<string, boolean>>();
const pendingPermissionPromptsBySession = new WeakMap<Electron.Session, Map<string, Promise<boolean>>>();
const privateTabIds = new Set<string>();
const privateSessionsByTab = new Map<string, Electron.Session>();
const privateDownloadItemsBySession = new WeakMap<Electron.Session, Set<DownloadItem>>();
const disposedPrivateSessions = new WeakSet<Electron.Session>();

async function disposePrivateSession(tabId: string): Promise<void> {
  const privateSession = privateSessionsByTab.get(tabId);
  if (!privateSession) return;
  privateSessionsByTab.delete(tabId);
  privateTabIds.delete(tabId);
  disposedPrivateSessions.add(privateSession);
  const activeItems = privateDownloadItemsBySession.get(privateSession);
  if (activeItems) {
    for (const item of activeItems) {
      try { item.cancel(); } catch { /* The download may already have completed. */ }
    }
    activeItems.clear();
  }
  try {
    await Promise.all([
      privateSession.clearStorageData(),
      privateSession.clearCache(),
      privateSession.clearAuthCache(),
    ]);
  } catch (error) {
    console.error('Could not fully clear private session data:', error instanceof Error ? error.message : 'Unknown cleanup error');
  }
}

function permissionDecisions(targetSession: Electron.Session): Map<string, boolean> {
  let decisions = permissionDecisionsBySession.get(targetSession);
  if (!decisions) { decisions = new Map<string, boolean>(); permissionDecisionsBySession.set(targetSession, decisions); }
  return decisions;
}

function pendingPermissionPrompts(targetSession: Electron.Session): Map<string, Promise<boolean>> {
  let prompts = pendingPermissionPromptsBySession.get(targetSession);
  if (!prompts) { prompts = new Map<string, Promise<boolean>>(); pendingPermissionPromptsBySession.set(targetSession, prompts); }
  return prompts;
}

function configurePermissionHandlers(targetSession: Electron.Session): void {
  targetSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (disposedPrivateSessions.has(targetSession)) { callback(false); return; }
    const origin = getPermissionOrigin(details.requestingUrl || webContents.getURL());
    const key = origin ? createPermissionGrantKey(origin, permission) : null;
    if (!key || !origin || !mainWindow || mainWindow.isDestroyed()) { callback(false); return; }
    const decisions = permissionDecisions(targetSession);
    const existingDecision = decisions.get(key);
    if (existingDecision !== undefined) { callback(existingDecision); return; }
    const label = PERMISSION_LABELS[permission];
    if (!label) { callback(false); return; }
    const prompt = getOrCreatePermissionPrompt(pendingPermissionPrompts(targetSession), key, async () => {
      const { response } = await dialog.showMessageBox(mainWindow!, {
        type: 'question', title: 'Website permission request',
        message: origin + ' wants access to ' + label + '.',
        detail: 'Allow only if you trust this website. This decision applies only to this browser session.',
        buttons: ['Allow for this session', 'Block'], defaultId: 1, cancelId: 1, noLink: true,
      });
      if (disposedPrivateSessions.has(targetSession)) return false;
      const allowed = response === 0;
      decisions.set(key, allowed);
      return allowed;
    });
    void prompt.then((allowed) => callback(disposedPrivateSessions.has(targetSession) ? false : allowed)).catch(() => callback(false));
  });
  targetSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    if (!webContents) return false;
    const origin = getPermissionOrigin(requestingOrigin || webContents.getURL());
    const key = origin ? createPermissionGrantKey(origin, permission) : null;
    return key ? permissionDecisions(targetSession).get(key) === true : false;
  });
}

function registerPrivateDownloadHandling(privateSession: Electron.Session): void {
  privateSession.on('will-download', (event, item) => {
    if (!safeDownloadUrl(item.getURL())) { event.preventDefault(); return; }
    let activeItems = privateDownloadItemsBySession.get(privateSession);
    if (!activeItems) { activeItems = new Set<DownloadItem>(); privateDownloadItemsBySession.set(privateSession, activeItems); }
    activeItems.add(item);
    item.once('done', () => { activeItems?.delete(item); });
    void (async () => {
      if (!mainWindow || mainWindow.isDestroyed()) { item.cancel(); return; }
      const choice = await dialog.showSaveDialog(mainWindow, {
        title: 'Save private download', defaultPath: safeDownloadFilename(item.getFilename()), buttonLabel: 'Save',
        message: 'Private downloads are saved to disk and will remain after this private tab closes.',
      });
      if (choice.canceled || !choice.filePath || disposedPrivateSessions.has(privateSession)) { item.cancel(); return; }
      item.setSavePath(choice.filePath);
    })().catch((error: unknown) => {
      console.error('Could not prepare private download:', error instanceof Error ? error.message : 'Unknown download error');
      item.cancel();
    });
  });
}
const PERMISSION_LABELS: Record<string, string> = {
  media: 'camera or microphone',
  geolocation: 'your location',
  notifications: 'notifications',
  'clipboard-read': 'clipboard contents',
};

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
  const snapshot = downloads.get(id);
  if (snapshot && downloadHistoryStore) void downloadHistoryStore.upsert(snapshot).catch((error: unknown) => {
    console.error('Could not persist download history:', error instanceof Error ? error.message : 'Unknown storage error');
  });
}

function pruneDownloadRecords(maxRecords = MAX_DOWNLOAD_RECORDS): void {
  const idsToPrune = getDownloadIdsToPrune([...downloads.values()], maxRecords);
  for (const id of idsToPrune) {
    downloads.delete(id);
    void downloadHistoryStore.remove(id).catch((error: unknown) => {
      console.error('Could not prune download history:', error instanceof Error ? error.message : 'Unknown storage error');
    });
  }
}

function registerDownloadHandling(): void {
  browserSession.on('will-download', (event, item) => {
    const safeUrl = safeDownloadUrl(item.getURL());
    if (!safeUrl) { event.preventDefault(); return; }
    pruneDownloadRecords(MAX_DOWNLOAD_RECORDS - 1);
    if (downloads.size >= MAX_DOWNLOAD_RECORDS) { event.preventDefault(); return; }
    const id = randomUUID();
    const record: DownloadRecord = {
      id,
      filename: safeDownloadFilename(item.getFilename()),
      url: safeUrl,
      status: 'waiting',
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      canResume: item.canResume(),
      startedAt: new Date().toISOString(),
    };
    downloads.set(id, record);
    downloadItems.set(id, item);
    void downloadHistoryStore.upsert(record).catch((error: unknown) => {
      console.error('Could not persist download history:', error instanceof Error ? error.message : 'Unknown storage error');
    });
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
      isPrivate: privateTabIds.has(id),
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
      y: CHROME_HEIGHT + overlayPanelHeight,
      width: Math.max(0, width),
      height: Math.max(0, height - CHROME_HEIGHT - overlayPanelHeight),
    });
  }
}

function wireTabEvents(id: string, view: WebContentsView): void {
  const wc = view.webContents;
  const changed = () => { layoutViews(); publishState(); };
  wc.on('did-navigate', (_event, url) => {
    changed();
    if (!shouldPersistBrowsingHistory(privateTabIds.has(id))) return;
    void browserDataStore.recordVisit(url, wc.getTitle()).catch((error: unknown) => {
      console.error('Could not persist browser history:', error instanceof Error ? error.message : 'Unknown storage error');
    });
  });
  wc.on('did-navigate-in-page', changed);
  wc.on('found-in-page', (_event, result) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const payload: FindResult = {
        tabId: id,
        requestId: result.requestId,
        activeMatchOrdinal: result.activeMatchOrdinal,
        matches: result.matches,
        finalUpdate: result.finalUpdate,
      };
      mainWindow.webContents.send('browser:find-results', payload);
    }
  });
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
    void disposePrivateSession(id);
    const index = tabOrder.indexOf(id);
    if (index >= 0) tabOrder.splice(index, 1);
    if (activeTabId === id) activeTabId = tabOrder[Math.max(0, index - 1)] ?? tabOrder[0] ?? null;
    layoutViews();
    publishState();
  });
}

async function createTab(target = HOME_URL, isPrivate = false): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const id = randomUUID();
  const tabSession = isPrivate ? session.fromPartition('woho-private-' + randomUUID()) : browserSession;
  if (isPrivate) {
    privateTabIds.add(id);
    privateSessionsByTab.set(id, tabSession);
    configurePermissionHandlers(tabSession);
    registerPrivateDownloadHandling(tabSession);
  }
  const view = new WebContentsView({
    webPreferences: {
      session: tabSession,
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
  handle('browser:find-in-page', (_event, rawQuery: unknown, forward: unknown, findNext: unknown) => {
    if (typeof forward !== 'boolean' || typeof findNext !== 'boolean') throw new Error('Invalid find-in-page request.');
    const query = normalizeFindQuery(rawQuery);
    const view = activeView();
    if (!view) throw new Error('No active tab.');
    if (!query) { view.webContents.stopFindInPage('clearSelection'); return 0; }
    return view.webContents.findInPage(query, { forward, findNext });
  });
  handle('browser:stop-find-in-page', () => activeView()?.webContents.stopFindInPage('clearSelection'));
  handle('browser:set-overlay-panel-open', (_event, open: unknown, height: unknown) => {
    if (typeof open !== 'boolean' || typeof height !== 'number' || !Number.isInteger(height) || height < 0 || height > DATA_PANEL_HEIGHT) throw new Error('Invalid panel state.');
    overlayPanelHeight = open ? height : 0;
    layoutViews();
  });
  handle('browser:open-tab', (_event, url?: unknown) => {
    if (url !== undefined && (typeof url !== 'string' || url.length > 4096)) throw new Error('Invalid URL payload.');
    return createTab(typeof url === 'string' ? url : HOME_URL);
  });
  handle('browser:open-private-tab', (_event, url?: unknown) => {
    if (url !== undefined && (typeof url !== 'string' || url.length > 4096)) throw new Error('Invalid URL payload.');
    return createTab(typeof url === 'string' ? url : HOME_URL, true);
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
    void disposePrivateSession(id);
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
  handle('browser:clear-site-data', async () => {
    await Promise.all([browserSession.clearStorageData(), browserSession.clearCache(), browserSession.clearAuthCache()]);
    permissionDecisions(browserSession).clear();
  });
  handle('browser:list-site-permissions', () => [...permissionDecisions(browserSession).entries()].map(([key, allowed]) => {
    const separator = key.lastIndexOf('::');
    return { origin: key.slice(0, separator), permission: key.slice(separator + 2), allowed };
  }).sort((a, b) => a.origin.localeCompare(b.origin) || a.permission.localeCompare(b.permission)));
  handle('browser:revoke-site-permission', (_event, rawOrigin: unknown, rawPermission: unknown) => {
    if (typeof rawOrigin !== 'string' || typeof rawPermission !== 'string') throw new Error('Invalid site permission request.');
    const origin = getPermissionOrigin(rawOrigin);
    const key = origin ? createPermissionGrantKey(origin, rawPermission) : null;
    if (!key || origin !== rawOrigin) throw new Error('Unsupported site permission.');
    permissionDecisions(browserSession).set(key, false);
  });
  handle('browser:forget-site-permission', (_event, rawOrigin: unknown, rawPermission: unknown) => {
    if (typeof rawOrigin !== 'string' || typeof rawPermission !== 'string') throw new Error('Invalid site permission request.');
    const origin = getPermissionOrigin(rawOrigin);
    const key = origin ? createPermissionGrantKey(origin, rawPermission) : null;
    if (!key || origin !== rawOrigin) throw new Error('Unsupported site permission.');
    permissionDecisions(browserSession).delete(key);
  });
  handle('browser:list-downloads', () => [...downloads.values()].map((record) => ({ ...record })));
  handle('browser:clear-finished-downloads', async () => {
    const finished = [...downloads.values()].filter((record) =>
      record.status === 'completed' || record.status === 'cancelled' || record.status === 'interrupted');
    for (const record of finished) {
      downloads.delete(record.id);
      downloadItems.delete(record.id);
    }
    await Promise.all(finished.map((record) => downloadHistoryStore.remove(record.id)));
    publishDownloads();
    return [...downloads.values()].map((record) => ({ ...record }));
  });
  handle('browser:pause-download', (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length > 100) throw new Error('Invalid download ID.');
    const item = downloadItems.get(id);
    if (!item || item.isPaused() || downloads.get(id)?.status !== 'progressing') throw new Error('Download cannot be paused.');
    item.pause();
    setDownloadStatus(id, 'paused');
  });
  handle('browser:resume-download', (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length > 100) throw new Error('Invalid download ID.');
    const item = downloadItems.get(id);
    if (!item || !item.isPaused() || downloads.get(id)?.status !== 'paused' || !item.canResume()) throw new Error('Download cannot be resumed.');
    item.resume();
    setDownloadStatus(id, 'progressing');
  });
  handle('browser:cancel-download', (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length > 100) throw new Error('Invalid download ID.');
    const item = downloadItems.get(id);
    if (!item) throw new Error('Download is no longer active.');
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
    overlayPanelHeight = 0;
    for (const view of views.values()) if (!view.webContents.isDestroyed()) view.webContents.close();
    views.clear(); tabOrder.length = 0; activeTabId = null;
  });
  if (rendererUrl) void mainWindow.loadURL(rendererUrl);
  else void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  mainWindow.webContents.on('did-finish-load', () => { layoutViews(); publishState(); });
}

app.whenReady().then(async () => {
  browserDataStore = new BrowserDataStore(join(app.getPath('userData'), 'browser-data.json'));
  downloadHistoryStore = new DownloadHistoryStore(join(app.getPath('userData'), 'download-history.json'));
  for (const record of await downloadHistoryStore.list()) downloads.set(record.id, record);
  browserSession = session.fromPartition('persist:woho-browser');
  configurePermissionHandlers(browserSession);
  registerDownloadHandling();
  registerIpc();
  createWindow();
  void createTab(HOME_URL);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { createWindow(); void createTab(HOME_URL); } });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
