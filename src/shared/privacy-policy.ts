/** Private tab visits must never be written to the normal browsing history store. */
export function shouldPersistBrowsingHistory(isPrivate: boolean): boolean {
  return !isPrivate;
}

/** New tabs opened from a private tab should remain private by default. */
export function shouldOpenNewTabPrivately(activeTabIsPrivate: boolean): boolean {
  return activeTabIsPrivate;
}
