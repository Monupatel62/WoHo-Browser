import { contextBridge, ipcRenderer } from 'electron';
import type { BrowserSettings } from '../shared/browser-settings';
import type { ZoomAction } from '../shared/zoom-policy';
import type { BookmarkImportResult, BookmarkRecord, BrowserState, DownloadRecord, FindResult, HistoryRecord, SitePermissionDecision, WoHoBrowserApi } from '../shared/browser-types';

const api: WoHoBrowserApi = {
  getState: () => ipcRenderer.invoke('browser:get-state') as Promise<BrowserState>,
  getSettings: () => ipcRenderer.invoke('browser:get-settings') as Promise<BrowserSettings>,
  updateSettings: (settings) => ipcRenderer.invoke('browser:update-settings', settings) as Promise<BrowserSettings>,
  resetSettings: () => ipcRenderer.invoke('browser:reset-settings') as Promise<BrowserSettings>,
  openTab: (url) => ipcRenderer.invoke('browser:open-tab', url),
  openPrivateTab: (url) => ipcRenderer.invoke('browser:open-private-tab', url),
  closeTab: (id) => ipcRenderer.invoke('browser:close-tab', id),
  reopenClosedTab: () => ipcRenderer.invoke('browser:reopen-closed-tab'),
  selectTab: (id) => ipcRenderer.invoke('browser:select-tab', id),
  navigate: (url) => ipcRenderer.invoke('browser:navigate', url),
  goBack: () => ipcRenderer.invoke('browser:back'),
  goForward: () => ipcRenderer.invoke('browser:forward'),
  reload: () => ipcRenderer.invoke('browser:reload'),
  stop: () => ipcRenderer.invoke('browser:stop'),
  setZoom: (action: ZoomAction) => ipcRenderer.invoke('browser:set-zoom', action) as Promise<number>,
  listBookmarks: () => ipcRenderer.invoke('browser:list-bookmarks') as Promise<BookmarkRecord[]>,
  addBookmark: (title, url) => ipcRenderer.invoke('browser:add-bookmark', title, url) as Promise<BookmarkRecord[]>,
  updateBookmark: (id, title, url) => ipcRenderer.invoke('browser:update-bookmark', id, title, url) as Promise<BookmarkRecord[]>,
  removeBookmark: (id) => ipcRenderer.invoke('browser:remove-bookmark', id) as Promise<BookmarkRecord[]>,
  reorderBookmarks: (ids) => ipcRenderer.invoke('browser:reorder-bookmarks', ids) as Promise<BookmarkRecord[]>,
  exportBookmarks: () => ipcRenderer.invoke('browser:export-bookmarks') as Promise<boolean>,
  importBookmarks: () => ipcRenderer.invoke('browser:import-bookmarks') as Promise<BookmarkImportResult | null>,
  listHistory: () => ipcRenderer.invoke('browser:list-history') as Promise<HistoryRecord[]>,
  clearHistory: () => ipcRenderer.invoke('browser:clear-history'),
  removeHistory: (id) => ipcRenderer.invoke('browser:remove-history', id) as Promise<HistoryRecord[]>,
  removeHistoryEntries: (ids) => ipcRenderer.invoke('browser:remove-history-entries', ids) as Promise<HistoryRecord[]>,
  removeHistoryRange: (startAt, endAt) => ipcRenderer.invoke('browser:remove-history-range', startAt, endAt) as Promise<HistoryRecord[]>,
  clearSiteData: () => ipcRenderer.invoke('browser:clear-site-data'),
  listSitePermissions: () => ipcRenderer.invoke('browser:list-site-permissions') as Promise<SitePermissionDecision[]>,
  revokeSitePermission: (origin, permission) => ipcRenderer.invoke('browser:revoke-site-permission', origin, permission),
  forgetSitePermission: (origin, permission) => ipcRenderer.invoke('browser:forget-site-permission', origin, permission),
  listDownloads: () => ipcRenderer.invoke('browser:list-downloads') as Promise<DownloadRecord[]>,
  clearFinishedDownloads: () => ipcRenderer.invoke('browser:clear-finished-downloads') as Promise<DownloadRecord[]>,
  removeDownloadRecord: (id) => ipcRenderer.invoke('browser:remove-download-record', id) as Promise<DownloadRecord[]>,
  pauseDownload: (id) => ipcRenderer.invoke('browser:pause-download', id),
  resumeDownload: (id) => ipcRenderer.invoke('browser:resume-download', id),
  cancelDownload: (id) => ipcRenderer.invoke('browser:cancel-download', id),
  revealDownload: (id) => ipcRenderer.invoke('browser:reveal-download', id),
  setOverlayPanelOpen: (open, height) => ipcRenderer.invoke('browser:set-overlay-panel-open', open, height),
  findInPage: (query, forward, findNext) => ipcRenderer.invoke('browser:find-in-page', query, forward, findNext) as Promise<number>,
  stopFindInPage: () => ipcRenderer.invoke('browser:stop-find-in-page'),
  onFindResults: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, result: FindResult) => callback(result);
    ipcRenderer.on('browser:find-results', listener);
    return () => ipcRenderer.removeListener('browser:find-results', listener);
  },
  onDownloadsChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, items: DownloadRecord[]) => callback(items);
    ipcRenderer.on('browser:downloads', listener);
    return () => ipcRenderer.removeListener('browser:downloads', listener);
  },
  onStateChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: BrowserState) => callback(state);
    ipcRenderer.on('browser:state', listener);
    return () => ipcRenderer.removeListener('browser:state', listener);
  },
};

contextBridge.exposeInMainWorld('wohoBrowser', api);
