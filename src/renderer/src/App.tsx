import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { BookmarkRecord, BrowserState, DownloadRecord, HistoryRecord } from '../../shared/browser-types';

const emptyState: BrowserState = { tabs: [], activeTabId: null };
type DataPanel = 'bookmarks' | 'history' | 'downloads' | null;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return (bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 1) + ' ' + units[unit];
}

export default function App() {
  const [state, setState] = useState<BrowserState>(emptyState);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [panel, setPanel] = useState<DataPanel>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const active = state.tabs.find((tab) => tab.id === state.activeTabId);
  const isBookmarked = Boolean(active?.url && bookmarks.some((bookmark) => bookmark.url === active.url));

  useEffect(() => {
    let mounted = true;
    void window.wohoBrowser.getState().then((next) => { if (mounted) setState(next); }).catch(() => setError('Could not connect to the browser process.'));
    void window.wohoBrowser.listBookmarks().then((items) => { if (mounted) setBookmarks(items); }).catch(() => setError('Could not load bookmarks.'));
    void window.wohoBrowser.listDownloads().then((items) => { if (mounted) setDownloads(items); }).catch(() => setError('Could not load downloads.'));
    const unsubscribeDownloads = window.wohoBrowser.onDownloadsChanged((items) => setDownloads(items));
    const unsubscribe = window.wohoBrowser.onStateChanged((next) => {
      setState(next);
      if (document.activeElement !== addressRef.current) {
        const current = next.tabs.find((tab) => tab.id === next.activeTabId);
        setAddress(current?.url ?? '');
      }
    });
    return () => { mounted = false; unsubscribe(); unsubscribeDownloads(); };
  }, []);

  useEffect(() => { setAddress(active?.url ?? ''); }, [active?.id, active?.url]);

  useEffect(() => {
    void window.wohoBrowser.setOverlayPanelOpen(Boolean(panel)).catch(() => setError('Could not update browser panel layout.'));
  }, [panel]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault(); addressRef.current?.focus(); addressRef.current?.select();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
        event.preventDefault(); void window.wohoBrowser.openTab();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'w') {
        event.preventDefault(); if (active) void window.wohoBrowser.closeTab(active.id);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
        event.preventDefault(); void window.wohoBrowser.reload();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'h') {
        event.preventDefault(); void showPanel('history');
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault(); void showPanel('bookmarks');
      } else if (event.key === 'Escape' && active?.loading) {
        event.preventDefault(); void window.wohoBrowser.stop();
      } else if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault(); void window.wohoBrowser.goBack();
      } else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault(); void window.wohoBrowser.goForward();
      } else if (event.key === 'Escape' && panel) {
        setPanel(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, panel]);

  async function showPanel(next: Exclude<DataPanel, null>) {
    setError('');
    if (panel === next) { setPanel(null); return; }
    try {
      if (next === 'bookmarks') setBookmarks(await window.wohoBrowser.listBookmarks());
      else if (next === 'history') setHistory(await window.wohoBrowser.listHistory());
      else setDownloads(await window.wohoBrowser.listDownloads());
      setPanel(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load browser data.');
    }
  }

  async function toggleBookmark() {
    if (!active || !/^https?:\/\//i.test(active.url)) return;
    setError('');
    try {
      const existing = bookmarks.find((bookmark) => bookmark.url === active.url);
      const next = existing
        ? await window.wohoBrowser.removeBookmark(existing.id)
        : await window.wohoBrowser.addBookmark(active.title, active.url);
      setBookmarks(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update bookmark.');
    }
  }

  async function submitAddress(event: FormEvent) {
    event.preventDefault(); setError('');
    try { await window.wohoBrowser.navigate(address); addressRef.current?.blur(); setPanel(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Navigation failed.'); }
  }

  async function openSavedUrl(url: string) {
    try { await window.wohoBrowser.navigate(url); setPanel(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open saved page.'); }
  }

  async function runDownloadAction(action: 'pause' | 'resume' | 'cancel' | 'reveal', id: string) {
    setError('');
    try {
      if (action === 'pause') await window.wohoBrowser.pauseDownload(id);
      else if (action === 'resume') await window.wohoBrowser.resumeDownload(id);
      else if (action === 'cancel') await window.wohoBrowser.cancelDownload(id);
      else await window.wohoBrowser.revealDownload(id);
      setDownloads(await window.wohoBrowser.listDownloads());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Download action failed.');
    }
  }

  async function clearHistory() {
    if (!window.confirm('Clear all saved browsing history? This cannot be undone.')) return;
    try {
      await window.wohoBrowser.clearHistory();
      setHistory([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not clear history.');
    }
  }

  return <main className="browser-chrome">
    <div className="tab-strip">
      <div className="brand"><span className="brand-mark">W</span><span>WoHo</span></div>
      <div className="tabs" role="tablist" aria-label="Browser tabs">
        {state.tabs.map((tab) => <div className={`tab ${tab.isActive ? 'active' : ''}`} key={tab.id} role="presentation">
          <button className="tab-select" role="tab" aria-selected={tab.isActive} title={tab.title} onClick={() => void window.wohoBrowser.selectTab(tab.id)}>
            <span className={`tab-dot ${tab.loading ? 'loading' : ''}`}></span><span className="tab-title">{tab.title}</span>
          </button>
          <button className="tab-close" aria-label={`Close ${tab.title}`} onClick={() => void window.wohoBrowser.closeTab(tab.id)}>×</button>
        </div>)}
      </div>
      <button className="new-tab" aria-label="New tab" title="New tab (Ctrl+T)" onClick={() => void window.wohoBrowser.openTab()}>+</button>
    </div>
    <div className="toolbar">
      <div className="nav-actions">
        <button className="icon-button" title="Back (Alt+Left)" aria-label="Back" disabled={!active?.canGoBack} onClick={() => void window.wohoBrowser.goBack()}>‹</button>
        <button className="icon-button" title="Forward (Alt+Right)" aria-label="Forward" disabled={!active?.canGoForward} onClick={() => void window.wohoBrowser.goForward()}>›</button>
        <button className="icon-button" title={active?.loading ? 'Stop loading (Esc)' : 'Reload (Ctrl+R)'} aria-label={active?.loading ? 'Stop loading' : 'Reload'} onClick={() => void (active?.loading ? window.wohoBrowser.stop() : window.wohoBrowser.reload())}>{active?.loading ? '×' : '↻'}</button>
      </div>
      <form className="address-form" onSubmit={submitAddress}>
        <span className="security-icon" aria-hidden="true">{active?.url.startsWith('https://') ? '◆' : '○'}</span>
        <input ref={addressRef} value={address} onChange={(event) => setAddress(event.target.value)} aria-label="Search or enter website address" placeholder="Search or enter website address" autoComplete="off" spellCheck={false} />
        {address && <button type="button" className="clear-address" aria-label="Clear address" onClick={() => { setAddress(''); addressRef.current?.focus(); }}>×</button>}
        <button type="submit" className="go-button">Go</button>
      </form>
      <button className={`bookmark-toggle ${isBookmarked ? 'saved' : ''}`} aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'} title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'} disabled={!active?.url || !/^https?:\/\//i.test(active.url)} onClick={() => void toggleBookmark()}>{isBookmarked ? '★' : '☆'}</button>
      <button className={`data-button ${panel === 'bookmarks' ? 'selected' : ''}`} onClick={() => void showPanel('bookmarks')} title="Bookmarks (Ctrl+B)">Bookmarks</button>
      <button className={`data-button ${panel === 'history' ? 'selected' : ''}`} onClick={() => void showPanel('history')} title="History (Ctrl+H)">History</button>
      <button className={`data-button ${panel === 'downloads' ? 'selected' : ''}`} onClick={() => void showPanel('downloads')} title="Downloads">Downloads{downloads.some((item) => item.status === 'progressing' || item.status === 'waiting' || item.status === 'paused') ? ' •' : ''}</button>
    </div>
    {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
    {panel && <section className="data-panel" aria-label={panel === 'bookmarks' ? 'Saved bookmarks' : panel === 'history' ? 'Browsing history' : 'Downloads'}>
      <header className="data-panel-header">
        <strong>{panel === 'bookmarks' ? 'Bookmarks' : panel === 'history' ? 'History' : 'Downloads'}</strong>
        <div>
          {panel === 'history' && <button className="panel-action" onClick={() => void clearHistory()} disabled={history.length === 0}>Clear all</button>}
          <button className="panel-close" onClick={() => setPanel(null)} aria-label="Close panel">×</button>
        </div>
      </header>
      {panel === 'bookmarks' && (bookmarks.length ? <ul className="saved-list">{bookmarks.map((bookmark) => <li key={bookmark.id}>
        <button className="saved-open" onClick={() => void openSavedUrl(bookmark.url)}><strong>{bookmark.title}</strong><span>{bookmark.url}</span></button>
        <button className="saved-remove" aria-label={`Remove bookmark ${bookmark.title}`} onClick={() => void window.wohoBrowser.removeBookmark(bookmark.id).then(setBookmarks).catch(() => setError('Could not remove bookmark.'))}>×</button>
      </li>)}</ul> : <p className="empty-data">No bookmarks yet. Use ☆ to save the current page.</p>)}
      {panel === 'history' && (history.length ? <ul className="saved-list">{history.map((entry) => <li key={entry.id}>
        <button className="saved-open" onClick={() => void openSavedUrl(entry.url)}><strong>{entry.title}</strong><span>{entry.url}</span><small>{new Date(entry.visitedAt).toLocaleString()}</small></button>
      </li>)}</ul> : <p className="empty-data">No browsing history saved.</p>)}
      {panel === 'downloads' && (downloads.length ? <ul className="download-list">{[...downloads].reverse().map((item) => {
        const progress = item.totalBytes > 0 ? Math.min(100, Math.round(item.receivedBytes / item.totalBytes * 100)) : 0;
        const activeDownload = item.status === 'waiting' || item.status === 'progressing' || item.status === 'paused';
        return <li className="download-item" key={item.id}>
          <div className="download-summary"><strong title={item.filename}>{item.filename}</strong><span>{item.status === 'waiting' ? 'Waiting for save location…' : item.status === 'progressing' ? `${formatBytes(item.receivedBytes)} / ${item.totalBytes > 0 ? formatBytes(item.totalBytes) : 'size unknown'}` : item.status === 'paused' ? `Paused · ${formatBytes(item.receivedBytes)}` : item.status === 'completed' ? `Completed · ${formatBytes(item.receivedBytes)}` : item.status === 'cancelled' ? 'Cancelled' : 'Interrupted'}</span>
          {item.status === 'progressing' && <div className="download-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: item.totalBytes > 0 ? progress + '%' : '100%' }} /></div>}
          </div>
          <div className="download-actions">
            {item.status === 'progressing' && <button className="panel-action" onClick={() => void runDownloadAction('pause', item.id)}>Pause</button>}
            {item.status === 'paused' && item.canResume && <button className="panel-action" onClick={() => void runDownloadAction('resume', item.id)}>Resume</button>}
            {activeDownload && <button className="panel-action" onClick={() => void runDownloadAction('cancel', item.id)}>Cancel</button>}
            {item.status === 'completed' && <button className="panel-action" onClick={() => void runDownloadAction('reveal', item.id)}>Show in folder</button>}
          </div>
        </li>;
      })}</ul> : <p className="empty-data">No downloads yet. Files will appear here when a website starts a download.</p>)}
    </section>}
  </main>;
}
