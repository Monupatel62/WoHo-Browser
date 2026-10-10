import { contextBridge, ipcRenderer } from 'electron';
import type { BookmarkRecord, BrowserState, DownloadRecord, HistoryRecord, WoHoBrowserApi } from '../shared/browser-types';

const api: WoHoBrowserApi = {
  getState: () => ipcRenderer.invoke('browser:get-state') as Promise<BrowserState>,
  openTab: (url) => ipcRenderer.invoke('browser:open-tab', url),
  closeTab: (id) => ipcRenderer.invoke('browser:close-tab', id),
  selectTab: (id) => ipcRenderer.invoke('browser:select-tab', id),
  navigate: (url) => ipcRenderer.invoke('browser:navigate', url),
  goBack: () => ipcRenderer.invoke('browser:back'),
  goForward: () => ipcRenderer.invoke('browser:forward'),
  reload: () => ipcRenderer.invoke('browser:reload'),
  stop: () => ipcRenderer.invoke('browser:stop'),
  listBookmarks: () => ipcRenderer.invoke('browser:list-bookmarks') as Promise<BookmarkRecord[]>,
  addBookmark: (title, url) => ipcRenderer.invoke('browser:add-bookmark', title, url) as Promise<BookmarkRecord[]>,
  removeBookmark: (id) => ipcRenderer.invoke('browser:remove-bookmark', id) as Promise<BookmarkRecord[]>,
  listHistory: () => ipcRenderer.invoke('browser:list-history') as Promise<HistoryRecord[]>,
  clearHistory: () => ipcRenderer.invoke('browser:clear-history'),
  listDownloads: () => ipcRenderer.invoke('browser:list-downloads') as Promise<DownloadRecord[]>,
  pauseDownload: (id) => ipcRenderer.invoke('browser:pause-download', id),
  resumeDownload: (id) => ipcRenderer.invoke('browser:resume-download', id),
  cancelDownload: (id) => ipcRenderer.invoke('browser:cancel-download', id),
  revealDownload: (id) => ipcRenderer.invoke('browser:reveal-download', id),
  onStateChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: BrowserState) => callback(state);
    ipcRenderer.on('browser:state', listener);
    return () => ipcRenderer.removeListener('browser:state', listener);
  },
};

contextBridge.exposeInMainWorld('wohoBrowser', api);
