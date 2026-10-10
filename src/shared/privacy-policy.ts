/** Private tab visits must never be written to the normal browsing history store. */
export function shouldPersistBrowsingHistory(isPrivate: boolean): boolean {
  return !isPrivate;
}
