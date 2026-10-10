import { contextBridge, ipcRenderer } from 'electron';
import type { BrowserState, WoHoBrowserApi } from '../shared/browser-types';

const api: WoHoBrowserApi = {
  getState: () => ipcRenderer.invoke('browser:get-state') as Promise<BrowserState>,
  openTab: (url) => ipcRenderer.invoke('browser:open-tab', url),
  closeTab: (id) => ipcRenderer.invoke('browser:close-tab', id),
  selectTab: (id) => ipcRenderer.invoke('browser:select-tab', id),
  navigate: (url) => ipcRenderer.invoke('browser:navigate', url),
  goBack: () => ipcRenderer.invoke('browser:back'),
  goForward: () => ipcRenderer.invoke('browser:forward'),
  reload: () => ipcRenderer.invoke('browser:reload'),
  onStateChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: BrowserState) => callback(state);
    ipcRenderer.on('browser:state', listener);
    return () => ipcRenderer.removeListener('browser:state', listener);
  },
};

contextBridge.exposeInMainWorld('wohoBrowser', api);
