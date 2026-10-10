import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { BookmarkRecord, BrowserState, DownloadRecord, HistoryRecord, SitePermissionDecision } from '../../shared/browser-types';
import { DEFAULT_BROWSER_SETTINGS, SEARCH_PROVIDERS, type BrowserSettings, type SearchProviderId } from '../../shared/browser-settings';
import { shouldOpenNewTabPrivately } from '../../shared/privacy-policy';
import { filterSavedEntries } from '../../shared/saved-entry-search';

const emptyState: BrowserState = { tabs: [], activeTabId: null };
type DataPanel = 'bookmarks' | 'history' | 'downloads' | 'permissions' | 'settings' | 'find' | null;

function localDateKey(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  const [notice, setNotice] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [bookmarkEditTitle, setBookmarkEditTitle] = useState('');
  const [bookmarkEditUrl, setBookmarkEditUrl] = useState('');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [sitePermissions, setSitePermissions] = useState<SitePermissionDecision[]>([]);
  const [settings, setSettings] = useState<BrowserSettings>({ ...DEFAULT_BROWSER_SETTINGS });
  const [settingsDraft, setSettingsDraft] = useState<BrowserSettings>({ ...DEFAULT_BROWSER_SETTINGS });
  const [panel, setPanel] = useState<DataPanel>(null);
  const [savedSearch, setSavedSearch] = useState('');
  const [findQuery, setFindQuery] = useState('');
  const [findMatches, setFindMatches] = useState(0);
  const [findOrdinal, setFindOrdinal] = useState(0);
  const findInputRef = useRef<HTMLInputElement>(null);
  const findRequestIdRef = useRef<number | null>(null);
  const activeTabIdRef = useRef<string | null>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const active = state.tabs.find((tab) => tab.id === state.activeTabId);
  const isBookmarked = Boolean(active?.url && bookmarks.some((bookmark) => bookmark.url === active.url));
  const visibleBookmarks = filterSavedEntries(bookmarks, savedSearch);
  const visibleHistory = filterSavedEntries(history, savedSearch).filter((entry) => {
    const date = localDateKey(entry.visitedAt);
    return Boolean(date) && (!historyStartDate || date >= historyStartDate) && (!historyEndDate || date <= historyEndDate);
  });
  const historyRangeValid = Boolean(historyStartDate && historyEndDate && historyStartDate <= historyEndDate);
  const visibleHistoryIds = visibleHistory.map((entry) => entry.id);
  const selectedVisibleCount = visibleHistoryIds.filter((id) => selectedHistoryIds.includes(id)).length;
  const allVisibleHistorySelected = visibleHistoryIds.length > 0 && selectedVisibleCount === visibleHistoryIds.length;
  activeTabIdRef.current = active?.id ?? null;

  useEffect(() => {
    let mounted = true;
    void window.wohoBrowser.getState().then((next) => { if (mounted) setState(next); }).catch(() => setError('Could not connect to the browser process.'));
    void window.wohoBrowser.listBookmarks().then((items) => { if (mounted) setBookmarks(items); }).catch(() => setError('Could not load bookmarks.'));
    void window.wohoBrowser.listDownloads().then((items) => { if (mounted) setDownloads(items); }).catch(() => setError('Could not load downloads.'));
    const unsubscribeDownloads = window.wohoBrowser.onDownloadsChanged((items) => setDownloads(items));
    const unsubscribeFind = window.wohoBrowser.onFindResults((result) => {
      if (result.tabId !== activeTabIdRef.current) return;
      if (findRequestIdRef.current !== null && result.requestId !== findRequestIdRef.current) return;
      setFindMatches(result.matches);
      setFindOrdinal(result.activeMatchOrdinal);
    });
    const unsubscribe = window.wohoBrowser.onStateChanged((next) => {
      setState(next);
      if (document.activeElement !== addressRef.current) {
        const current = next.tabs.find((tab) => tab.id === next.activeTabId);
        setAddress(current?.url ?? '');
      }
    });
    return () => { mounted = false; unsubscribe(); unsubscribeDownloads(); unsubscribeFind(); };
  }, []);

  useEffect(() => { setAddress(active?.url ?? ''); }, [active?.id, active?.url]);

  useEffect(() => { setSelectedHistoryIds([]); }, [savedSearch, historyStartDate, historyEndDate]);

  useEffect(() => {
    void window.wohoBrowser.setOverlayPanelOpen(Boolean(panel), panel === 'find' ? 100 : 360).catch(() => setError('Could not update browser panel layout.'));
    if (panel === 'find') {
      window.setTimeout(() => { findInputRef.current?.focus(); findInputRef.current?.select(); }, 0);
    } else {
      findRequestIdRef.current = null;
      void window.wohoBrowser.stopFindInPage().catch(() => undefined);
    }
  }, [panel]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'n') {
        event.preventDefault(); void window.wohoBrowser.openPrivateTab();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault(); addressRef.current?.focus(); addressRef.current?.select();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
        event.preventDefault();
        if (shouldOpenNewTabPrivately(Boolean(active?.isPrivate))) void window.wohoBrowser.openPrivateTab();
        else void window.wohoBrowser.openTab();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'w') {
        event.preventDefault(); if (active) void window.wohoBrowser.closeTab(active.id);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
        event.preventDefault(); void window.wohoBrowser.reload();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'h') {
        event.preventDefault(); void showPanel('history');
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault(); void showPanel('bookmarks');
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault(); void showPanel('find');
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
    setSavedSearch('');
    setSelectedHistoryIds([]);
    setEditingBookmarkId(null);
    if (panel === next) { setPanel(null); return; }
    try {
      if (next === 'bookmarks') setBookmarks(await window.wohoBrowser.listBookmarks());
      else if (next === 'history') setHistory(await window.wohoBrowser.listHistory());
      else if (next === 'downloads') setDownloads(await window.wohoBrowser.listDownloads());
      else if (next === 'permissions') setSitePermissions(await window.wohoBrowser.listSitePermissions());
      else if (next === 'settings') {
        const current = await window.wohoBrowser.getSettings();
        setSettings(current);
        setSettingsDraft(current);
      }
      setPanel(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load browser data.');
    }
  }

  async function runFind(query: string, forward = true, findNext = false) {
    const boundedQuery = query.slice(0, 500);
    setFindQuery(boundedQuery);
    if (!boundedQuery.trim()) {
      findRequestIdRef.current = null;
      setFindMatches(0); setFindOrdinal(0);
      await window.wohoBrowser.stopFindInPage().catch(() => undefined);
      return;
    }
    setError('');
    try {
      findRequestIdRef.current = null;
      const requestId = await window.wohoBrowser.findInPage(boundedQuery, forward, findNext);
      findRequestIdRef.current = requestId;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Find in page failed.');
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

  function startEditingBookmark(bookmark: BookmarkRecord) {
    setEditingBookmarkId(bookmark.id);
    setBookmarkEditTitle(bookmark.title);
    setBookmarkEditUrl(bookmark.url);
    setError('');
  }

  function cancelEditingBookmark() {
    setEditingBookmarkId(null);
    setBookmarkEditTitle('');
    setBookmarkEditUrl('');
  }

  async function saveBookmarkEdit(id: string) {
    setError(''); setNotice('');
    try {
      const next = await window.wohoBrowser.updateBookmark(id, bookmarkEditTitle, bookmarkEditUrl);
      setBookmarks(next);
      cancelEditingBookmark();
      setNotice('Bookmark updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update bookmark.');
    }
  }

  async function exportBookmarks() {
    if (!window.confirm('Export saved bookmarks to a JSON file? The export may contain sensitive URLs. Keep the file in a secure location.')) return;
    setError(''); setNotice('');
    try {
      if (await window.wohoBrowser.exportBookmarks()) setNotice('Bookmarks exported successfully.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not export bookmarks.');
    }
  }

  async function importBookmarks() {
    setError(''); setNotice('');
    try {
      const next = await window.wohoBrowser.importBookmarks();
      if (next === null) return;
      setBookmarks(next);
      setNotice('Bookmarks imported. Matching URLs were updated; saved files and browsing history were not changed.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not import bookmarks.');
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

  async function openSavedUrlInNewTab(url: string) {
    try {
      if (shouldOpenNewTabPrivately(Boolean(active?.isPrivate))) await window.wohoBrowser.openPrivateTab(url);
      else await window.wohoBrowser.openTab(url);
      setPanel(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open saved page in a new tab.');
    }
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

  async function updateSitePermission(action: 'revoke' | 'forget', decision: SitePermissionDecision) {
    setError('');
    try {
      if (action === 'revoke') await window.wohoBrowser.revokeSitePermission(decision.origin, decision.permission);
      else await window.wohoBrowser.forgetSitePermission(decision.origin, decision.permission);
      setSitePermissions(await window.wohoBrowser.listSitePermissions());
      setNotice(action === 'revoke' ? `Access blocked for ${decision.origin}.` : `Saved decision forgotten for ${decision.origin}; the site will need to ask again.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update site permission.');
    }
  }

  async function saveSettings() {
    setError(''); setNotice('');
    try {
      const saved = await window.wohoBrowser.updateSettings(settingsDraft);
      setSettings(saved);
      setSettingsDraft(saved);
      setNotice('Browser settings saved. New tabs and searches will use these settings.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save browser settings.');
    }
  }

  async function resetSettings() {
    if (!window.confirm('Reset the search provider and home page to WoHo Browser defaults?')) return;
    setError(''); setNotice('');
    try {
      const defaults = await window.wohoBrowser.resetSettings();
      setSettings(defaults);
      setSettingsDraft(defaults);
      setNotice('Browser settings reset to defaults.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not reset browser settings.');
    }
  }

  async function clearSiteData() {
    if (!window.confirm('Clear cookies, cached files, authentication cache, and website storage for all normal-profile sites? This may sign you out of websites. Browsing history and bookmarks will remain.')) return;
    setError(''); setNotice('');
    try {
      await window.wohoBrowser.clearSiteData();
      setSitePermissions([]);
      setNotice('Cookies, cache, authentication cache, and website storage cleared for all normal-profile sites. Reload open pages if they still show old state.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not clear site data.');
    }
  }

  async function clearHistory() {
    if (!window.confirm('Clear all saved browsing history? This cannot be undone.')) return;
    try {
      await window.wohoBrowser.clearHistory();
      setHistory([]);
      setSelectedHistoryIds([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not clear history.');
    }
  }

  async function clearHistoryRange() {
    if (!historyRangeValid) {
      setError('Choose a valid start date and end date.');
      return;
    }
    if (!window.confirm(`Delete browsing history from ${historyStartDate} through ${historyEndDate}? This cannot be undone.`)) return;
    setError(''); setNotice('');
    try {
      const startAt = new Date(`${historyStartDate}T00:00:00`).toISOString();
      const endAt = new Date(`${historyEndDate}T23:59:59.999`).toISOString();
      setHistory(await window.wohoBrowser.removeHistoryRange(startAt, endAt));
      setSelectedHistoryIds([]);
      setNotice(`History from ${historyStartDate} through ${historyEndDate} deleted.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete history range.');
    }
  }

  function toggleHistorySelection(id: string, checked: boolean) {
    setSelectedHistoryIds((current) => checked
      ? [...new Set([...current, id])]
      : current.filter((item) => item !== id));
  }

  function toggleVisibleHistorySelection(checked: boolean) {
    setSelectedHistoryIds((current) => {
      if (checked) return [...new Set([...current, ...visibleHistoryIds])];
      const visible = new Set(visibleHistoryIds);
      return current.filter((id) => !visible.has(id));
    });
  }

  async function deleteSelectedHistory() {
    const ids = selectedHistoryIds.filter((id) => history.some((entry) => entry.id === id));
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected history ${ids.length === 1 ? 'entry' : 'entries'}? This cannot be undone.`)) return;
    setError(''); setNotice('');
    try {
      setHistory(await window.wohoBrowser.removeHistoryEntries(ids));
      setSelectedHistoryIds([]);
      setNotice(`Deleted ${ids.length} history ${ids.length === 1 ? 'entry' : 'entries'}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete selected history entries.');
    }
  }

  async function removeHistoryEntry(id: string) {
    setError('');
    try {
      setHistory(await window.wohoBrowser.removeHistory(id));
      setSelectedHistoryIds((current) => current.filter((item) => item !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete history entry.');
    }
  }

  async function clearFinishedDownloads() {
    if (!window.confirm('Remove finished download records? Downloaded files on disk will not be deleted.')) return;
    setError('');
    try {
      setDownloads(await window.wohoBrowser.clearFinishedDownloads());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not clear finished download records.');
    }
  }

  async function removeDownloadRecord(id: string) {
    setError('');
    try {
      setDownloads(await window.wohoBrowser.removeDownloadRecord(id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove download record.');
    }
  }

  return <main className="browser-chrome">
    <div className="tab-strip">
      <div className="brand"><span className="brand-mark">W</span><span>WoHo</span>{active?.isPrivate && <span className="private-badge">Private</span>}</div>
      <div className="tabs" role="tablist" aria-label="Browser tabs">
        {state.tabs.map((tab) => <div className={`tab ${tab.isActive ? 'active' : ''}`} key={tab.id} role="presentation">
          <button className="tab-select" role="tab" aria-selected={tab.isActive} title={tab.title} onClick={() => void window.wohoBrowser.selectTab(tab.id)}>
            <span className={`tab-dot ${tab.loading ? 'loading' : ''} ${tab.isCrashed ? 'crashed' : ''}`}></span><span className="tab-title">{tab.isPrivate ? '◈ ' : ''}{tab.isCrashed ? 'Crashed · ' : ''}{tab.title}</span>
          </button>
          <button className="tab-close" aria-label={`Close ${tab.title}`} onClick={() => void window.wohoBrowser.closeTab(tab.id)}>×</button>
        </div>)}
      </div>
      <button className="new-tab" aria-label={active?.isPrivate ? 'New private tab' : 'New tab'} title={active?.isPrivate ? 'New private tab (Ctrl+T)' : 'New tab (Ctrl+T)'} onClick={() => { if (shouldOpenNewTabPrivately(Boolean(active?.isPrivate))) void window.wohoBrowser.openPrivateTab(); else void window.wohoBrowser.openTab(); }}>+</button>
      <button className="private-tab-button" aria-label="New private tab" title="Open an isolated private tab" onClick={() => void window.wohoBrowser.openPrivateTab()}>Private</button>
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
      <button className={`data-button ${panel === 'permissions' ? 'selected' : ''}`} onClick={() => void showPanel('permissions')} title="Site permissions">Permissions</button>
      <button className={`data-button ${panel === 'settings' ? 'selected' : ''}`} onClick={() => void showPanel('settings')} title="Browser settings">Settings</button>
      <button className={`data-button ${panel === 'find' ? 'selected' : ''}`} onClick={() => void showPanel('find')} title="Find in page (Ctrl+F)">Find</button>
    </div>
    {(error || active?.isCrashed) && <div className="error-banner" role="alert"><span>{error || 'This page stopped unexpectedly. Reload the tab to try again.'}</span>{active?.isCrashed && <button className="panel-action" onClick={() => void window.wohoBrowser.reload()}>Reload tab</button>}{error && <button onClick={() => setError('')} aria-label="Dismiss error">×</button>}</div>}
    {notice && <div className="notice-banner" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></div>}
    {panel && <section className={`data-panel ${panel === 'find' ? 'find-panel' : ''}`} aria-label={panel === 'bookmarks' ? 'Saved bookmarks' : panel === 'history' ? 'Browsing history' : panel === 'downloads' ? 'Downloads' : panel === 'permissions' ? 'Site permissions' : panel === 'settings' ? 'Browser settings' : 'Find in page'}>
      <header className="data-panel-header">
        <strong>{panel === 'bookmarks' ? 'Bookmarks' : panel === 'history' ? 'History' : panel === 'downloads' ? 'Downloads' : panel === 'permissions' ? 'Site permissions' : panel === 'settings' ? 'Settings' : 'Find in page'}</strong>
        <div>
          {panel === 'bookmarks' && <><button className="panel-action" onClick={() => void importBookmarks()}>Import</button><button className="panel-action" onClick={() => void exportBookmarks()}>Export</button></>}
          {panel === 'history' && <><button className="panel-action" onClick={() => void deleteSelectedHistory()} disabled={selectedHistoryIds.length === 0}>Delete selected ({selectedHistoryIds.length})</button><button className="panel-action" onClick={() => void clearHistory()} disabled={history.length === 0}>Clear history</button><button className="panel-action" onClick={() => void clearSiteData()}>Clear all site data</button></>}
          {panel === 'downloads' && <button className="panel-action" onClick={() => void clearFinishedDownloads()} disabled={!downloads.some((item) => item.status === 'completed' || item.status === 'cancelled' || item.status === 'interrupted')}>Clear finished</button>}
          <button className="panel-close" onClick={() => setPanel(null)} aria-label="Close panel">×</button>
        </div>
      </header>
      {(panel === 'bookmarks' || panel === 'history') && <div className="find-controls">
        <input value={savedSearch} onChange={(event) => setSavedSearch(event.target.value.slice(0, 200))} aria-label={panel === 'bookmarks' ? 'Search bookmarks' : 'Search browsing history'} placeholder={panel === 'bookmarks' ? 'Search bookmarks' : 'Search history'} maxLength={200} />
        {panel === 'history' && <>
          <label className="history-select-all"><input type="checkbox" aria-label="Select all visible history entries" checked={allVisibleHistorySelected} onChange={(event) => toggleVisibleHistorySelection(event.target.checked)} disabled={visibleHistory.length === 0} /> Select visible</label>
          <label>From <input type="date" value={historyStartDate} aria-label="Filter history from date" onChange={(event) => setHistoryStartDate(event.target.value)} /></label>
          <label>To <input type="date" value={historyEndDate} aria-label="Filter history through date" onChange={(event) => setHistoryEndDate(event.target.value)} /></label>
          <button type="button" className="panel-action" disabled={!historyRangeValid || history.length === 0} onClick={() => void clearHistoryRange()}>Delete range</button>
        </>}
        <button type="button" className="panel-action" disabled={!savedSearch && !historyStartDate && !historyEndDate} onClick={() => { setSavedSearch(''); setHistoryStartDate(''); setHistoryEndDate(''); }}>Clear filters</button>
      </div>}
      {panel === 'find' && <form className="find-controls" onSubmit={(event) => { event.preventDefault(); void runFind(findQuery, true, true); }}>
        <input ref={findInputRef} value={findQuery} onChange={(event) => { setFindQuery(event.target.value); void runFind(event.target.value, true, false); }} aria-label="Find text on current page" placeholder="Find on this page" maxLength={500} />
        <span className="find-count">{findMatches ? `${findOrdinal} of ${findMatches}` : findQuery ? 'No matches' : 'Enter text'}</span>
        <button type="button" className="panel-action" disabled={!findQuery.trim()} onClick={() => void runFind(findQuery, false, true)} aria-label="Previous match">↑</button>
        <button type="submit" className="panel-action" disabled={!findQuery.trim()} aria-label="Next match">↓</button>
      </form>}
      {panel === 'settings' && <div className="settings-form">
        <label htmlFor="settings-search-provider">Default search provider</label>
        <select id="settings-search-provider" value={settingsDraft.searchProvider} onChange={(event) => setSettingsDraft((current) => ({ ...current, searchProvider: event.target.value as SearchProviderId }))}>
          {Object.entries(SEARCH_PROVIDERS).map(([id, provider]) => <option key={id} value={id}>{provider.label}</option>)}
        </select>
        <p>Plain-text searches are sent to the selected provider. Search text is not stored as browser history unless a website navigation is committed.</p>
        <label htmlFor="settings-home-page">Home page and new-tab address</label>
        <input id="settings-home-page" value={settingsDraft.homePageUrl} onChange={(event) => setSettingsDraft((current) => ({ ...current, homePageUrl: event.target.value.slice(0, 2048) }))} maxLength={2048} placeholder="https://example.com/" spellCheck={false} />
        <p>Use an HTTP or HTTPS URL. Search-provider and home-page changes are saved locally and apply to future searches and tabs; already-open tabs are unchanged.</p>
        <label className="settings-toggle"><input type="checkbox" checked={settingsDraft.restoreSession} onChange={(event) => setSettingsDraft((current) => ({ ...current, restoreSession: event.target.checked }))} /> Restore normal tabs on startup</label>
        <p>When enabled, WoHo Browser saves up to 50 normal-tab HTTP(S) URLs locally and restores them next time. Private tabs are never saved. URLs can contain sensitive query values. This option is off by default.</p>
        <div className="settings-actions"><button className="panel-action" onClick={() => void saveSettings()} disabled={settingsDraft.searchProvider === settings.searchProvider && settingsDraft.homePageUrl === settings.homePageUrl && settingsDraft.restoreSession === settings.restoreSession}>Save settings</button><button className="panel-action" onClick={() => void resetSettings()}>Reset defaults</button></div>
      </div>}
      {panel === 'permissions' && (sitePermissions.length ? <ul className="saved-list">{sitePermissions.map((decision) => <li key={decision.origin + '::' + decision.permission}>
        <div className="permission-entry">
          <strong>{decision.permission === 'media' ? 'Camera / microphone' : decision.permission === 'geolocation' ? 'Location' : decision.permission === 'notifications' ? 'Notifications' : decision.permission === 'clipboard-read' ? 'Clipboard access' : decision.permission}</strong>
          <span>{decision.origin}</span>
          <small className={decision.allowed ? 'permission-allowed' : 'permission-blocked'}>{decision.allowed ? 'Allowed for this session' : 'Blocked for this session'}</small>
        </div>
        <div className="download-actions">
          {decision.allowed && <button className="panel-action" onClick={() => void updateSitePermission('revoke', decision)}>Block</button>}
          <button className="panel-action" onClick={() => void updateSitePermission('forget', decision)}>Forget</button>
        </div>
      </li>)}</ul> : <p className="empty-data">No site permission decisions yet. Sites must ask through the browser’s trusted prompt.</p>)}
      {panel === 'bookmarks' && (bookmarks.length ? (visibleBookmarks.length ? <ul className="saved-list">{visibleBookmarks.map((bookmark) => <li key={bookmark.id}>
        {editingBookmarkId === bookmark.id ? <form className="bookmark-edit-form" onSubmit={(event) => { event.preventDefault(); void saveBookmarkEdit(bookmark.id); }}>
          <label>Title<input value={bookmarkEditTitle} onChange={(event) => setBookmarkEditTitle(event.target.value.slice(0, 512))} maxLength={512} /></label>
          <label>URL<input value={bookmarkEditUrl} onChange={(event) => setBookmarkEditUrl(event.target.value.slice(0, 2048))} maxLength={2048} spellCheck={false} /></label>
          <div><button type="submit" className="panel-action">Save</button><button type="button" className="panel-action" onClick={cancelEditingBookmark}>Cancel</button></div>
        </form> : <>
          <button className="saved-open" onClick={() => void openSavedUrl(bookmark.url)}><strong>{bookmark.title}</strong><span>{bookmark.url}</span></button>
          <button className="panel-action" aria-label={`Open bookmark ${bookmark.title} in a new tab`} onClick={() => void openSavedUrlInNewTab(bookmark.url)}>New tab</button>
          <button className="panel-action" aria-label={`Edit bookmark ${bookmark.title}`} onClick={() => startEditingBookmark(bookmark)}>Edit</button>
          <button className="saved-remove" aria-label={`Remove bookmark ${bookmark.title}`} onClick={() => void window.wohoBrowser.removeBookmark(bookmark.id).then(setBookmarks).catch(() => setError('Could not remove bookmark.'))}>×</button>
        </>}
      </li>)}</ul> : <p className="empty-data">No bookmarks match your search.</p>) : <p className="empty-data">No bookmarks yet. Use ☆ to save the current page.</p>)}
      {panel === 'history' && (history.length ? (visibleHistory.length ? <ul className="saved-list">{visibleHistory.map((entry) => <li key={entry.id}>
        <label className="history-select-entry"><input type="checkbox" checked={selectedHistoryIds.includes(entry.id)} onChange={(event) => toggleHistorySelection(entry.id, event.target.checked)} aria-label={`Select history entry ${entry.title}`} /></label>
        <button className="saved-open" onClick={() => void openSavedUrl(entry.url)}><strong>{entry.title}</strong><span>{entry.url}</span><small>{new Date(entry.visitedAt).toLocaleString()}</small></button>
        <button className="panel-action" aria-label={`Open history entry ${entry.title} in a new tab`} onClick={() => void openSavedUrlInNewTab(entry.url)}>New tab</button>
        <button className="saved-remove" aria-label={`Delete history entry ${entry.title}`} onClick={() => void removeHistoryEntry(entry.id)}>×</button>
      </li>)}</ul> : <p className="empty-data">No history entries match your search.</p>) : <p className="empty-data">No browsing history saved.</p>)}
      {panel === 'downloads' && (downloads.length ? <ul className="download-list">{[...downloads].reverse().map((item) => {
        const progress = item.totalBytes > 0 ? Math.min(100, Math.round(item.receivedBytes / item.totalBytes * 100)) : 0;
        const activeDownload = item.status === 'waiting' || item.status === 'progressing' || item.status === 'paused';
        return <li className="download-item" key={item.id}>
          <div className="download-summary"><strong title={item.filename}>{item.filename}</strong><span>{item.status === 'waiting' ? 'Waiting for save location…' : item.status === 'progressing' ? `${formatBytes(item.receivedBytes)} / ${item.totalBytes > 0 ? formatBytes(item.totalBytes) : 'size unknown'}` : item.status === 'paused' ? `Paused · ${formatBytes(item.receivedBytes)}` : item.status === 'completed' ? `Completed · ${formatBytes(item.receivedBytes)}` : item.status === 'cancelled' ? 'Cancelled' : 'Interrupted'}</span>
          {item.status === 'progressing' && <div className={`download-progress ${item.totalBytes > 0 ? '' : 'indeterminate'}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} {...(item.totalBytes > 0 ? { 'aria-valuenow': progress } : {})}><span style={{ width: item.totalBytes > 0 ? progress + '%' : '35%' }} /></div>}
          </div>
          <div className="download-actions">
            {item.status === 'progressing' && <button className="panel-action" onClick={() => void runDownloadAction('pause', item.id)}>Pause</button>}
            {item.status === 'paused' && item.canResume && <button className="panel-action" onClick={() => void runDownloadAction('resume', item.id)}>Resume</button>}
            {activeDownload && <button className="panel-action" onClick={() => void runDownloadAction('cancel', item.id)}>Cancel</button>}
            {item.status === 'completed' && <button className="panel-action" onClick={() => void runDownloadAction('reveal', item.id)}>Show in folder</button>}
            {!activeDownload && <button className="panel-action" aria-label={`Remove download record ${item.filename}; saved file will remain`} title="Remove this record only; the file on disk will remain" onClick={() => void removeDownloadRecord(item.id)}>Remove</button>}
          </div>
        </li>;
      })}</ul> : <p className="empty-data">No downloads yet. Files will appear here when a website starts a download.</p>)}
    </section>}
  </main>;
}
