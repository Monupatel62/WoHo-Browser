import { exportBookmarkData, parseBookmarkImport } from './bookmarks.mjs';

const fileInput = document.querySelector('#bookmark-file');
const status = document.querySelector('#bookmark-status');
const list = document.querySelector('#bookmark-list');
const exportButton = document.querySelector('#export-example');

function renderBookmarks(bookmarks) {
  list.replaceChildren();
  for (const bookmark of bookmarks) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = bookmark.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = bookmark.title;
    const url = document.createElement('small');
    url.textContent = bookmark.url;
    item.append(link, url);
    list.append(item);
  }
}
fileInput.addEventListener('change', async () => {
  list.replaceChildren();
  const file = fileInput.files?.[0];
  if (!file) { status.textContent = 'No file selected.'; return; }
  if (file.size > 1024 * 1024) {
    status.textContent = 'Import failed: file exceeds the 1 MiB limit.';
    fileInput.value = '';
    return;
  }
  try {
    const bookmarks = parseBookmarkImport(await file.text());
    renderBookmarks(bookmarks);
    status.textContent = 'Loaded ' + bookmarks.length + ' bookmark(s). This file was processed locally; no upload was made.';
  } catch (error) {
    status.textContent = 'Import failed: ' + (error instanceof Error ? error.message : 'Invalid bookmark file.');
  }
});
exportButton.addEventListener('click', () => {
  try {
    const sample = [{ title: 'WoHo Browser project', url: 'https://github.com/Monupatel62/WoHo-Browser' }];
    const blob = new Blob([exportBookmarkData(sample)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'woho-bookmarks.json';
    anchor.click();
    URL.revokeObjectURL(url);
    status.textContent = 'Sample bookmark file exported locally.';
  } catch (error) {
    status.textContent = 'Export failed: ' + (error instanceof Error ? error.message : 'Could not export bookmarks.');
  }
});
