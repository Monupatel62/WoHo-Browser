/** Use the selected tab's session for tab-scoped privacy controls. */
export function resolveActiveSession<T>(activeTabSession: T | null | undefined, normalSession: T): T {
  return activeTabSession ?? normalSession;
}
