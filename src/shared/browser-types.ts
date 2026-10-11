import type { BrowserSettings } from './browser-settings';
export interface BrowserTabState { id: string; title: string; url: string; loading: boolean; canGoBack: boolean; canGoForward: boolean; isActive: boolean; isPrivate: boolean; isCrashed: boolean; navigationError?: string; }
export interface BrowserState { tabs: BrowserTabState[]; activeTabId: string | null; }
export interface BookmarkRecord { id: string; title: string; url: string; createdAt: string; updatedAt: string; }
export interface BookmarkImportResult { bookmarks: BookmarkRecord[]; added: number; updated: number; duplicatesSkipped: number; invalidSkipped: number; }
export interface HistoryRecord { id: string; title: string; url: string; visitedAt: string; }
export interface SitePermissionDecision { origin: string; permission: string; allowed: boolean; }
export type DownloadStatus = 'waiting' | 'progressing' | 'paused' | 'completed' | 'cancelled' | 'interrupted';
export interface DownloadRecord { id: string; filename: string; url: string; status: DownloadStatus; receivedBytes: number; totalBytes: number; canResume: boolean; savePath?: string; startedAt: string; }
export interface FindResult { tabId: string; requestId: number; activeMatchOrdinal: number; matches: number; finalUpdate: boolean; }
export interface WoHoBrowserApi {
  getState(): Promise<BrowserState>;
  getSettings(): Promise<BrowserSettings>;
  updateSettings(settings: BrowserSettings): Promise<BrowserSettings>;
  resetSettings(): Promise<BrowserSettings>;
  openTab(url?: string): Promise<void>;
  openPrivateTab(url?: string): Promise<void>;
  closeTab(id: string): Promise<void>;
  reopenClosedTab(): Promise<void>;
  selectTab(id: string): Promise<void>;
  navigate(url: string): Promise<void>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
  reload(): Promise<void>;
  stop(): Promise<void>;
  listBookmarks(): Promise<BookmarkRecord[]>;
  addBookmark(title: string, url: string): Promise<BookmarkRecord[]>;
  updateBookmark(id: string, title: string, url: string): Promise<BookmarkRecord[]>;
  removeBookmark(id: string): Promise<BookmarkRecord[]>;
  reorderBookmarks(ids: string[]): Promise<BookmarkRecord[]>;
  exportBookmarks(): Promise<boolean>;
  importBookmarks(): Promise<BookmarkImportResult | null>;
  listHistory(): Promise<HistoryRecord[]>;
  clearHistory(): Promise<void>;
  removeHistory(id: string): Promise<HistoryRecord[]>;
  removeHistoryEntries(ids: string[]): Promise<HistoryRecord[]>;
  removeHistoryRange(startAt: string, endAt: string): Promise<HistoryRecord[]>;
  clearSiteData(): Promise<void>;
  listSitePermissions(): Promise<SitePermissionDecision[]>;
  revokeSitePermission(origin: string, permission: string): Promise<void>;
  forgetSitePermission(origin: string, permission: string): Promise<void>;
  listDownloads(): Promise<DownloadRecord[]>;
  clearFinishedDownloads(): Promise<DownloadRecord[]>;
  removeDownloadRecord(id: string): Promise<DownloadRecord[]>;
  pauseDownload(id: string): Promise<void>;
  resumeDownload(id: string): Promise<void>;
  cancelDownload(id: string): Promise<void>;
  revealDownload(id: string): Promise<void>;
  setOverlayPanelOpen(open: boolean, height: number): Promise<void>;
  findInPage(query: string, forward: boolean, findNext: boolean): Promise<number>;
  stopFindInPage(): Promise<void>;
  onFindResults(callback: (result: FindResult) => void): () => void;
  onDownloadsChanged(callback: (downloads: DownloadRecord[]) => void): () => void;
  onStateChanged(callback: (state: BrowserState) => void): () => void;
}
declare global { interface Window { wohoBrowser: WoHoBrowserApi; } }
