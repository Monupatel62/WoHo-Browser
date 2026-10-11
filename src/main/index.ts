import { app, BrowserWindow, WebContentsView, ipcMain, session, shell, dialog, Menu, clipboard, type DownloadItem, type IpcMainInvokeEvent } from 'electron';
import { join } from 'node:path';
import { readFileBounded } from './bounded-file-read';
import { randomUUID } from 'node:crypto';
import { atomicWriteFile, BrowserDataStore, MAX_BOOKMARK_IMPORT_BYTES } from './browser-data';
import { openRecoverableBrowserDataStore } from './recoverable-browser-data';
import { BrowserSettingsStore } from './browser-settings';
import { openRecoverableBrowserSettingsStore } from './recoverable-browser-settings';
import { BrowserSessionStore } from './browser-session-store';
import { openRecoverableBrowserSessionStore } from './recoverable-browser-session';
import { DownloadHistoryStore } from './download-history';
import { safeDownloadFilename, safeDownloadUrl } from '../shared/download-policy';
import { normalizeFindQuery } from '../shared/find-query';
import { createPermissionGrantKey, getPermissionOrigin } from '../shared/permission-policy';
import { isAllowedFrameNavigationTarget, isAllowedNavigationTarget, isSafeContextMenuLink, resolveAddressInput } from '../shared/navigation';
import { shouldPersistBrowsingHistory } from '../shared/privacy-policy';
import { DEFAULT_BROWSER_SETTINGS, getSearchEnginePrefix, type BrowserSettings } from '../shared/browser-settings';
import { selectRestorableTabUrls, shouldPersistSessionTabs } from '../shared/session-policy';
import { isFinishedDownloadStatus, pruneDownloadRecordsDurably } from '../shared/download-retention';
import { getOrCreatePermissionPrompt, PermissionPromptEpoch, runPermissionPromptForEpoch } from '../shared/permission-prompt';
import { getNavigationFailureMessage } from '../shared/navigation-error';
import { clearSiteDataForSession } from './site-data';
import { resolveActiveSession } from './session-scope';
import { isTrustedIpcSender } from './ipc-security';
import { isTrustedRendererUrl } from './trusted-renderer';
import { PrivateTabRegistry } from './private-tab-registry';
import { TabCrashRegistry } from './tab-crash-registry';
import type { BrowserState, BrowserTabState, DownloadRecord, DownloadStatus, FindResult } from '../shared/browser-types';

const CHROME_HEIGHT = 108;
const DATA_PANEL_HEIGHT = 360;
let overlayPanelHeight = 0;
let browserSettingsStore: BrowserSettingsStore;
let browserSettings: BrowserSettings = { ...DEFAULT_BROWSER_SETTINGS };
let browserSessionStore: BrowserSessionStore | null = null;
let pendingSessionStoreWrite: Promise<unknown> = Promise.resolve();
let isRestoringSession = false;
let isClosingWindow = false;
let allowWindowCloseAfterSessionSave = false;
let mainWindow: BrowserWindow | null = null;
let startupComplete = false;
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
const permissionPromptEpochsBySession = new WeakMap<Electron.Session, PermissionPromptEpoch>();
const privateTabRegistry = new PrivateTabRegistry();
const tabCrashRegistry = new TabCrashRegistry();
const navigationErrorsByTab = new Map<string, string>();
const privateSessionsByTab = new Map<string, Electron.Session>();
const privateDownloadItemsBySession = new WeakMap<Electron.Session, Set<DownloadItem>>();
const disposedPrivateSessions = new WeakSet<Electron.Session>();

function queueSessionStoreWrite(urls: string[]): Promise<string[]> {
  if (!browserSessionStore) return Promise.reject(new Error('Browser session store is unavailable.'));
  const pending = browserSessionStore.save(urls);
  pendingSessionStoreWrite = pending;
  return pending;
}

async function disposePrivateSession(tabId: string): Promise<void> {
  const privateSession = privateSessionsByTab.get(tabId);
  if (!privateSession) return;
  privateSessionsByTab.delete(tabId);
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

function permissionPromptEpoch(targetSession: Electron.Session): PermissionPromptEpoch {
  let epoch = permissionPromptEpochsBySession.get(targetSession);
  if (!epoch) { epoch = new PermissionPromptEpoch(); permissionPromptEpochsBySession.set(targetSession, epoch); }
  return epoch;
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
    const promptWindow = mainWindow;
    const epoch = permissionPromptEpoch(targetSession);
    const capturedGeneration = epoch.capture();
    const prompt = getOrCreatePermissionPrompt(pendingPermissionPrompts(targetSession), key, () =>
      runPermissionPromptForEpoch(epoch, capturedGeneration, async () => {
        if (!promptWindow || promptWindow.isDestroyed() || disposedPrivateSessions.has(targetSession)) return false;
        const { response } = await dialog.showMessageBox(promptWindow, {
          type: 'question', title: 'Website permission request',
          message: origin + ' wants access to ' + label + '.',
          detail: 'Allow only if you trust this website. This decision applies only to this browser session.',
          buttons: ['Allow for this session', 'Block'], defaultId: 1, cancelId: 1, noLink: true,
        });
        if (promptWindow.isDestroyed() || disposedPrivateSessions.has(targetSession)) return false;
        const allowed = response === 0;
        if (epoch.isCurrent(capturedGeneration)) decisions.set(key, allowed);
        return allowed;
      }),
    );
    void prompt.then((allowed) => callback(disposedPrivateSessions.has(targetSession) || !epoch.isCurrent(capturedGeneration) ? false : allowed)).catch(() => callback(false));
  });
  targetSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    if (!webContents || disposedPrivateSessions.has(targetSession)) return false;
    const origin = getPermissionOrigin(requestingOrigin || webContents.getURL());
    const key = origin ? createPermissionGrantKey(origin, permission) : null;
    return key ? permissionDecisions(targetSession).get(key) === true : false;
  });
}

function registerPrivateDownloadHandling(privateSession: Electron.Session): void {
  privateSession.on('will-download', (event, item) => {
    // A late download event can arrive after tab disposal has begun. Reject it
    // before pausing the item or opening a native Save dialog.
    if (disposedPrivateSessions.has(privateSession) || !safeDownloadUrl(item.getURL())) {
      event.preventDefault();
      return;
    }
    // Pause synchronously so the download cannot write to the default folder
    // while the asynchronous Save dialog is open.
    item.pause();
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
      item.resume();
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

let pendingDownloadPrune: Promise<void> = Promise.resolve();

function pruneDownloadRecords(maxRecords = MAX_DOWNLOAD_RECORDS): Promise<void> {
  const pending = pendingDownloadPrune.catch(() => undefined).then(async () => {
    try {
      await pruneDownloadRecordsDurably(
        [...downloads.values()],
        maxRecords,
        (id) => downloadHistoryStore.remove(id),
        (id) => {
          downloads.delete(id);
          downloadItems.delete(id);
        },
      );
    } catch (error) {
      // Keep the record visible when its durable deletion fails. A full list may
      // temporarily block a new download rather than lose history on restart.
      console.error('Could not prune download history:', error instanceof Error ? error.message : 'Unknown storage error');
    }
    publishDownloads();
  });
  pendingDownloadPrune = pending;
  return pending;
}

function registerDownloadHandling(): void {
  browserSession.on('will-download', (event, item) => {
    const safeUrl = safeDownloadUrl(item.getURL());
    if (!safeUrl) { event.preventDefault(); return; }
    // Pause synchronously so no bytes reach an implicit default path while
    // durable retention is checked before admitting another record.
    item.pause();
    void prepareDownload(item, safeUrl).catch((error: unknown) => {
      console.error('Could not prepare download:', error instanceof Error ? error.message : 'Unknown download error');
      try { item.cancel(); } catch { /* The item may already be finished. */ }
    });
  });
}

async function prepareDownload(item: DownloadItem, safeUrl: string): Promise<void> {
  await pruneDownloadRecords(MAX_DOWNLOAD_RECORDS - 1);
  if (downloads.size >= MAX_DOWNLOAD_RECORDS) {
    item.cancel();
    return;
  }
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
    void pruneDownloadRecords();
    publishDownloads();
  });
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
  item.resume();
  setDownloadStatus(id, item.isPaused() ? 'paused' : 'progressing');
}

function assertTrustedChrome(event: IpcMainInvokeEvent): void {
  if (!mainWindow || mainWindow.isDestroyed()) throw new Error('Untrusted IPC sender.');
  const trusted = isTrustedIpcSender({
    expectedSender: mainWindow.webContents,
    sender: event.sender,
    senderFrame: event.senderFrame,
    mainFrame: event.sender.mainFrame,
    senderUrl: event.sender.getURL(),
    devRendererUrl: process.env.ELECTRON_RENDERER_URL,
    expectedRendererPath: join(__dirname, '../renderer/index.html'),
  });
  if (!trusted) throw new Error('Untrusted IPC sender or renderer origin.');
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
      isPrivate: privateTabRegistry.has(id),
      isCrashed: tabCrashRegistry.has(id),
      ...(navigationErrorsByTab.has(id) ? { navigationError: navigationErrorsByTab.get(id)! } : {}),
    }];
  });
  return { tabs, activeTabId };
}

function currentSessionTabUrls(): string[] {
  return selectRestorableTabUrls(tabOrder.map((id) => {
    const view = views.get(id);
    return {
      url: view && !view.webContents.isDestroyed() ? view.webContents.getURL() : '',
      isPrivate: privateTabRegistry.has(id),
    };
  }));
}

function persistSessionTabs(): void {
  if (!browserSessionStore || !shouldPersistSessionTabs(browserSettings.restoreSession, isRestoringSession, isClosingWindow)) return;
  void queueSessionStoreWrite(currentSessionTabUrls()).catch((error: unknown) => {
    console.error('Could not persist normal-tab session:', error instanceof Error ? error.message : 'Unknown session storage error');
  });
}

async function restoreSessionTabs(): Promise<void> {
  let urls: string[] = [];
  if (browserSettings.restoreSession && browserSessionStore) {
    try { urls = await browserSessionStore.load(); }
    catch (error) {
      console.error('Could not load saved tab session:', error instanceof Error ? error.message : 'Unknown session load error');
    }
  }
  if (urls.length === 0) {
    void createTab();
    return;
  }
  isRestoringSession = true;
  try {
    await Promise.all(urls.map((url) => createTab(url)));
  } finally {
    isRestoringSession = false;
    persistSessionTabs();
  }
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
    navigationErrorsByTab.delete(id);
    changed();
    persistSessionTabs();
    if (!shouldPersistBrowsingHistory(privateTabRegistry.has(id))) return;
    void browserDataStore.recordVisit(url, wc.getTitle()).catch((error: unknown) => {
      console.error('Could not persist browser history:', error instanceof Error ? error.message : 'Unknown storage error');
    });
  });
  wc.on('did-navigate-in-page', () => { changed(); persistSessionTabs(); });
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
  wc.on('did-start-loading', () => { navigationErrorsByTab.delete(id); tabCrashRegistry.markReloading(id); changed(); });
  wc.on('did-stop-loading', changed);
  wc.on('did-fail-load', (_event, errorCode, errorDescription, _validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    const message = getNavigationFailureMessage(errorCode, errorDescription);
    if (message) navigationErrorsByTab.set(id, message);
    else navigationErrorsByTab.delete(id);
    changed();
  });
  wc.on('render-process-gone', () => { tabCrashRegistry.markCrashed(id); changed(); });
  wc.on('will-navigate', (event, targetUrl) => {
    if (!isAllowedNavigationTarget(targetUrl)) event.preventDefault();
  });
  // Electron exposes this runtime event, but some Electron 44 typings omit it
  // from WebContents' overload list. Keep the runtime listener narrowly typed.
  const listenForFrameNavigation = wc.on as unknown as (
    eventName: string,
    listener: (event: { preventDefault(): void }, details: { url: string }) => void,
  ) => typeof wc;
  listenForFrameNavigation.call(wc, 'will-frame-navigate', (event, details) => {
    if (!isAllowedFrameNavigationTarget(details.url)) event.preventDefault();
  });
  wc.on('will-redirect', (event, targetUrl) => {
    if (!isAllowedNavigationTarget(targetUrl)) event.preventDefault();
  });
  wc.setWindowOpenHandler(() => ({ action: 'deny' }));
  wc.on('context-menu', (_event, params) => {
    const linkUrl = params.linkURL;
    if (!mainWindow || mainWindow.isDestroyed() || !isSafeContextMenuLink(linkUrl)) return;
    const openPrivately = privateTabRegistry.has(id);
    const menu = Menu.buildFromTemplate([
      {
        label: 'Open Link in New Tab',
        click: () => { void createTab(linkUrl, openPrivately); },
      },
      { type: 'separator' },
      {
        label: 'Copy Link Address',
        click: () => clipboard.writeText(linkUrl),
      },
    ]);
    menu.popup({ window: mainWindow });
  });
  wc.on('destroyed', () => {
    privateTabRegistry.onDestroyed(id);
    tabCrashRegistry.remove(id);
    navigationErrorsByTab.delete(id);
    views.delete(id);
    void disposePrivateSession(id);
    const index = tabOrder.indexOf(id);
    if (index >= 0) tabOrder.splice(index, 1);
    persistSessionTabs();
    if (activeTabId === id) activeTabId = tabOrder[Math.max(0, index - 1)] ?? tabOrder[0] ?? null;
    layoutViews();
    publishState();
  });
}

async function createTab(target?: string, isPrivate = false): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const id = randomUUID();
  const tabSession = isPrivate ? session.fromPartition('woho-private-' + randomUUID()) : browserSession;
  if (isPrivate) {
    privateTabRegistry.add(id);
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
    const url = resolveAddressInput(target ?? browserSettings.homePageUrl, getSearchEnginePrefix(browserSettings.searchProvider));
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
  handle('browser:get-settings', () => browserSettingsStore.get());
  handle('browser:update-settings', async (_event, candidate: unknown) => {
    browserSettings = await browserSettingsStore.update(candidate);
    if (browserSettings.restoreSession) {
      persistSessionTabs();
    } else if (browserSessionStore) {
      // Do not report that session restore is disabled until sensitive saved URLs
      // have actually been removed from the local session file.
      await queueSessionStoreWrite([]);
    }
    return { ...browserSettings };
  });
  handle('browser:reset-settings', async () => {
    browserSettings = await browserSettingsStore.reset();
    if (browserSessionStore) await queueSessionStoreWrite([]);
    return { ...browserSettings };
  });
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
    return createTab(typeof url === 'string' ? url : undefined);
  });
  handle('browser:open-private-tab', (_event, url?: unknown) => {
    if (url !== undefined && (typeof url !== 'string' || url.length > 4096)) throw new Error('Invalid URL payload.');
    return createTab(typeof url === 'string' ? url : undefined, true);
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
    if (tabOrder.length === 0) void createTab();
    layoutViews(); publishState();
  });
  handle('browser:navigate', async (_event, value: unknown) => {
    if (typeof value !== 'string' || value.length > 4096) throw new Error('Invalid address input.');
    const view = activeView();
    if (!view) return createTab(value);
    const target = resolveAddressInput(value, getSearchEnginePrefix(browserSettings.searchProvider));
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
  handle('browser:update-bookmark', (_event, id: unknown, title: unknown, url: unknown) => {
    if (typeof id !== 'string' || id.length === 0 || id.length > 100 ||
        typeof title !== 'string' || title.length > 512 ||
        typeof url !== 'string' || url.length > 4096) {
      throw new Error('Invalid bookmark payload.');
    }
    return browserDataStore.updateBookmark(id, title, url);
  });
  handle('browser:remove-bookmark', (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length > 100) throw new Error('Invalid bookmark ID.');
    return browserDataStore.removeBookmark(id);
  });
  handle('browser:reorder-bookmarks', (_event, ids: unknown) => {
    if (!Array.isArray(ids) || ids.length > 500 ||
        ids.some((id) => typeof id !== 'string' || id.length === 0 || id.length > 100)) {
      throw new Error('Invalid bookmark order.');
    }
    return browserDataStore.reorderBookmarks(ids);
  });
  handle('browser:export-bookmarks', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) throw new Error('Browser window is unavailable.');
    const choice = await dialog.showSaveDialog(mainWindow, {
      title: 'Export bookmarks',
      defaultPath: 'WoHo-Bookmarks.json',
      buttonLabel: 'Export',
      filters: [{ name: 'WoHo Bookmarks', extensions: ['json'] }],
    });
    if (choice.canceled || !choice.filePath) return false;
    await atomicWriteFile(choice.filePath, await browserDataStore.exportBookmarksJson());
    return true;
  });
  handle('browser:import-bookmarks', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) throw new Error('Browser window is unavailable.');
    const choice = await dialog.showOpenDialog(mainWindow, {
      title: 'Import bookmarks',
      properties: ['openFile'],
      filters: [{ name: 'WoHo Bookmarks', extensions: ['json'] }],
    });
    if (choice.canceled || !choice.filePaths[0]) return null;
    const filePath = choice.filePaths[0];
    let raw: Buffer;
    try {
      raw = await readFileBounded(filePath, MAX_BOOKMARK_IMPORT_BYTES);
    } catch (error) {
      if (error instanceof Error && error.message.includes('byte limit')) {
        throw new Error('Bookmark import file exceeds the 1 MiB limit.');
      }
      throw error;
    }
    const preview = await browserDataStore.previewBookmarkImportJson(raw.toString('utf8'));
    const skippedRows = preview.rows.filter((row) => row.status === 'invalid' || row.status === 'duplicate');
    const visibleSkippedRows = skippedRows.slice(0, 12);
    const rowDetails = visibleSkippedRows.map((row) => 'Row ' + row.row + ': ' + (row.reason ?? row.status)).join('\n');
    const moreRows = skippedRows.length > visibleSkippedRows.length
      ? '\n…plus ' + (skippedRows.length - visibleSkippedRows.length) + ' more skipped rows.'
      : '';
    if (!preview.canImport) {
      await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Bookmark import cannot proceed',
        message: preview.limitError ?? 'No valid bookmarks were found in this file.',
        detail: rowDetails + moreRows,
        buttons: ['Close'],
        noLink: true,
      });
      return null;
    }
    const detail = [
      'New bookmarks: ' + preview.newCount,
      'Existing bookmarks to update: ' + preview.updateCount,
      'Duplicate rows skipped: ' + preview.duplicateCount,
      'Invalid rows skipped: ' + preview.invalidCount,
      rowDetails,
      moreRows,
      '',
      'Only validated rows will be imported. Existing matching URLs will be updated.',
    ].filter(Boolean).join('\n');
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: 'Review bookmark import',
      message: 'Import ' + preview.validBookmarks.length + ' unique valid bookmarks?',
      detail,
      buttons: ['Import valid bookmarks', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      noLink: true,
    });
    if (response !== 0) return null;
    const imported = await browserDataStore.importBookmarksJson(JSON.stringify({
      format: 'woho-bookmarks',
      version: 1,
      bookmarks: preview.validBookmarks,
    }));
    return {
      bookmarks: imported,
      added: preview.newCount,
      updated: preview.updateCount,
      duplicatesSkipped: preview.duplicateCount,
      invalidSkipped: preview.invalidCount,
    };
  });
  handle('browser:list-history', () => browserDataStore.listHistory());
  handle('browser:clear-history', () => browserDataStore.clearHistory());
  handle('browser:remove-history', (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length === 0 || id.length > 100) throw new Error('Invalid history ID.');
    return browserDataStore.removeHistory(id);
  });
  handle('browser:remove-history-entries', (_event, ids: unknown) => {
    if (!Array.isArray(ids) || ids.length > 500 ||
        ids.some((id) => typeof id !== 'string' || id.length === 0 || id.length > 100) ||
        new Set(ids).size !== ids.length) {
      throw new Error('Invalid history entry selection.');
    }
    return browserDataStore.removeHistoryEntries(ids);
  });
  handle('browser:remove-history-range', (_event, startAt: unknown, endAt: unknown) => {
    if (typeof startAt !== 'string' || startAt.length > 64 ||
        typeof endAt !== 'string' || endAt.length > 64) {
      throw new Error('Invalid history date range.');
    }
    return browserDataStore.removeHistoryRange(startAt, endAt);
  });
  handle('browser:clear-site-data', async () => {
    // Clear the session for the selected tab. In private mode this must not leave
    // the active private session's cookies or permissions untouched.
    const targetSession = resolveActiveSession(activeView()?.webContents.session, browserSession);
    await clearSiteDataForSession(
      targetSession,
      permissionDecisions(targetSession),
      permissionPromptEpoch(targetSession),
    );
  });
  handle('browser:list-site-permissions', () => {
    const targetSession = resolveActiveSession(activeView()?.webContents.session, browserSession);
    return [...permissionDecisions(targetSession).entries()].map(([key, allowed]) => {
      const separator = key.lastIndexOf('::');
      return { origin: key.slice(0, separator), permission: key.slice(separator + 2), allowed };
    }).sort((a, b) => a.origin.localeCompare(b.origin) || a.permission.localeCompare(b.permission));
  });
  handle('browser:revoke-site-permission', (_event, rawOrigin: unknown, rawPermission: unknown) => {
    if (typeof rawOrigin !== 'string' || typeof rawPermission !== 'string') throw new Error('Invalid site permission request.');
    const origin = getPermissionOrigin(rawOrigin);
    const key = origin ? createPermissionGrantKey(origin, rawPermission) : null;
    if (!key || origin !== rawOrigin) throw new Error('Unsupported site permission.');
    const targetSession = resolveActiveSession(activeView()?.webContents.session, browserSession);
    permissionDecisions(targetSession).set(key, false);
  });
  handle('browser:forget-site-permission', (_event, rawOrigin: unknown, rawPermission: unknown) => {
    if (typeof rawOrigin !== 'string' || typeof rawPermission !== 'string') throw new Error('Invalid site permission request.');
    const origin = getPermissionOrigin(rawOrigin);
    const key = origin ? createPermissionGrantKey(origin, rawPermission) : null;
    if (!key || origin !== rawOrigin) throw new Error('Unsupported site permission.');
    const targetSession = resolveActiveSession(activeView()?.webContents.session, browserSession);
    permissionDecisions(targetSession).delete(key);
  });
  handle('browser:list-downloads', () => [...downloads.values()].map((record) => ({ ...record })));
  handle('browser:clear-finished-downloads', async () => {
    const finished = [...downloads.values()].filter((record) => isFinishedDownloadStatus(record.status));
    for (const record of finished) {
      // Remove the durable row first. If storage fails, keep the item visible so
      // the user can retry rather than losing it until the next restart.
      await downloadHistoryStore.remove(record.id);
      downloads.delete(record.id);
      downloadItems.delete(record.id);
      publishDownloads();
    }
    return [...downloads.values()].map((record) => ({ ...record }));
  });
  handle('browser:remove-download-record', async (_event, id: unknown) => {
    if (typeof id !== 'string' || id.length === 0 || id.length > 100) throw new Error('Invalid download ID.');
    const record = downloads.get(id);
    if (!record) throw new Error('Download record no longer exists.');
    if (!isFinishedDownloadStatus(record.status)) {
      throw new Error('Active downloads cannot be removed from the list.');
    }
    await downloadHistoryStore.remove(id);
    downloads.delete(id);
    downloadItems.delete(id);
    publishDownloads();
    return [...downloads.values()].map((item) => ({ ...item }));
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
  isClosingWindow = false;
  allowWindowCloseAfterSessionSave = false;
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
  const expectedRendererPath = join(__dirname, '../renderer/index.html');
  const isAllowedChromeNavigation = (value: string) =>
    isTrustedRendererUrl(value, rendererUrl, expectedRendererPath);
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedChromeNavigation(url)) event.preventDefault();
  });
  mainWindow.webContents.on('will-redirect', (event, url) => {
    if (!isAllowedChromeNavigation(url)) event.preventDefault();
  });
  mainWindow.on('resize', layoutViews);
  mainWindow.on('close', (event) => {
    if (allowWindowCloseAfterSessionSave) {
      isClosingWindow = true;
      return;
    }

    // Always wait for an in-flight session write, including the clear operation
    // triggered when the user disables restore or resets settings.
    event.preventDefault();
    const closingWindow = mainWindow;
    const shouldSaveSnapshot = Boolean(browserSessionStore) &&
      shouldPersistSessionTabs(browserSettings.restoreSession, isRestoringSession, isClosingWindow);
    const pending = shouldSaveSnapshot
      ? queueSessionStoreWrite(currentSessionTabUrls())
      : pendingSessionStoreWrite;
    isClosingWindow = true;
    void pending
      .catch((error: unknown) => {
        console.error('Could not finish session persistence during close:', error instanceof Error ? error.message : 'Unknown session storage error');
      })
      .finally(() => {
        allowWindowCloseAfterSessionSave = true;
        if (closingWindow && !closingWindow.isDestroyed()) closingWindow.close();
      });
  });
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

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      // The initial ready handler creates the first window; avoid racing it.
      if (!startupComplete) return;
      createWindow();
      void createTab();
      return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
  const userDataPath = app.getPath('userData');
  browserSettingsStore = await openRecoverableBrowserSettingsStore(
    join(userDataPath, 'settings.json'),
    join(userDataPath, 'settings-recovery.json'),
    () => join(userDataPath, 'settings-' + randomUUID() + '.json'),
    async (title, message, detail) => {
      await dialog.showMessageBox({
        type: 'warning', title, message, detail, buttons: ['Continue'], noLink: true,
      });
    },
  );
  browserSettings = await browserSettingsStore.get();
  browserSessionStore = await openRecoverableBrowserSessionStore(
    join(userDataPath, 'session-state.json'),
    join(userDataPath, 'session-state-recovery.json'),
    () => join(userDataPath, 'session-state-' + randomUUID() + '.json'),
    async (title, message, detail) => {
      await dialog.showMessageBox({
        type: 'warning', title, message, detail, buttons: ['Continue'], noLink: true,
      });
    },
  );
  if (!browserSettings.restoreSession) {
    await queueSessionStoreWrite([]);
  }
  browserDataStore = await openRecoverableBrowserDataStore(
    join(userDataPath, 'browser-data.json'),
    join(userDataPath, 'browser-data-recovery.json'),
    () => join(userDataPath, 'browser-data-' + randomUUID() + '.json'),
    async (title, message, detail) => {
      await dialog.showMessageBox({
        type: 'warning', title, message, detail, buttons: ['Continue'], noLink: true,
      });
    },
  );
  const primaryDownloadHistoryPath = join(userDataPath, 'download-history.json');
  downloadHistoryStore = new DownloadHistoryStore(primaryDownloadHistoryPath);
  try {
    for (const record of await downloadHistoryStore.list()) downloads.set(record.id, record);
  } catch (error) {
    // A malformed or incompatible history file must not prevent the browser from launching.
    // Keep the original untouched and use a separate store for future downloads.
    await dialog.showMessageBox({
      type: 'warning',
      title: 'Download history could not be loaded',
      message: 'WoHo Browser will continue using a separate download history file. The original history file has not been overwritten.',
      detail: error instanceof Error ? error.message : 'Unknown download history error.',
      buttons: ['Continue'],
      noLink: true,
    });
    const recoveryPath = join(userDataPath, 'download-history-recovery.json');
    downloadHistoryStore = new DownloadHistoryStore(recoveryPath);
    try {
      for (const record of await downloadHistoryStore.list()) downloads.set(record.id, record);
    } catch (recoveryError) {
      await dialog.showMessageBox({
        type: 'warning',
        title: 'Recovery download history unavailable',
        message: 'The recovery history file is also unreadable. WoHo Browser will start with an empty, separate download history file; both existing files will be preserved.',
        detail: recoveryError instanceof Error ? recoveryError.message : 'Unknown recovery history error.',
        buttons: ['Continue'],
        noLink: true,
      });
      downloadHistoryStore = new DownloadHistoryStore(join(userDataPath, 'download-history-' + randomUUID() + '.json'));
    }
  }
  browserSession = session.fromPartition('persist:woho-browser');
  configurePermissionHandlers(browserSession);
  registerDownloadHandling();
  registerIpc();
  createWindow();
  void restoreSessionTabs();
  startupComplete = true;
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { createWindow(); void restoreSessionTabs(); } });
  });
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
