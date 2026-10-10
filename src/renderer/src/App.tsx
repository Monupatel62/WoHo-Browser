import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { BrowserState } from '../../shared/browser-types';

const emptyState: BrowserState = { tabs: [], activeTabId: null };

export default function App() {
  const [state, setState] = useState<BrowserState>(emptyState);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const addressRef = useRef<HTMLInputElement>(null);
  const active = state.tabs.find((tab) => tab.id === state.activeTabId);

  useEffect(() => {
    let mounted = true;
    void window.wohoBrowser.getState().then((next) => { if (mounted) setState(next); }).catch(() => setError('Could not connect to the browser process.'));
    const unsubscribe = window.wohoBrowser.onStateChanged((next) => {
      setState(next);
      if (document.activeElement !== addressRef.current) {
        const current = next.tabs.find((tab) => tab.id === next.activeTabId);
        setAddress(current?.url ?? '');
      }
    });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  useEffect(() => { setAddress(active?.url ?? ''); }, [active?.id, active?.url]);

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
      } else if (event.key === 'Escape' && active?.loading) {
        event.preventDefault(); void window.wohoBrowser.stop();
      } else if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault(); void window.wohoBrowser.goBack();
      } else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault(); void window.wohoBrowser.goForward();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);

  async function submitAddress(event: FormEvent) {
    event.preventDefault(); setError('');
    try { await window.wohoBrowser.navigate(address); addressRef.current?.blur(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Navigation failed.'); }
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
      <button className="profile-button" aria-label="Browser profile" title="Profile settings are not implemented">●</button>
    </div>
    {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
  </main>;
}
