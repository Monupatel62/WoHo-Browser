export interface BrowserTabState { id: string; title: string; url: string; loading: boolean; canGoBack: boolean; canGoForward: boolean; isActive: boolean; }
export interface BrowserState { tabs: BrowserTabState[]; activeTabId: string | null; }
export interface BookmarkRecord { id: string; title: string; url: string; createdAt: string; updatedAt: string; }
export interface HistoryRecord { id: string; title: string; url: string; visitedAt: string; }
export interface WoHoBrowserApi {
  getState(): Promise<BrowserState>;
  openTab(url?: string): Promise<void>;
  closeTab(id: string): Promise<void>;
  selectTab(id: string): Promise<void>;
  navigate(url: string): Promise<void>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
  reload(): Promise<void>;
  stop(): Promise<void>;
  listBookmarks(): Promise<BookmarkRecord[]>;
  addBookmark(title: string, url: string): Promise<BookmarkRecord[]>;
  removeBookmark(id: string): Promise<BookmarkRecord[]>;
  listHistory(): Promise<HistoryRecord[]>;
  clearHistory(): Promise<void>;
  onStateChanged(callback: (state: BrowserState) => void): () => void;
}
declare global { interface Window { wohoBrowser: WoHoBrowserApi; } }
