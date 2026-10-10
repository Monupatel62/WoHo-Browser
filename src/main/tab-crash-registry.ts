/** Tracks renderer crashes until a fresh load starts or the tab is destroyed. */
export class TabCrashRegistry {
  private readonly crashedTabIds = new Set<string>();

  markCrashed(tabId: string): void {
    this.crashedTabIds.add(tabId);
  }

  markReloading(tabId: string): void {
    this.crashedTabIds.delete(tabId);
  }

  remove(tabId: string): void {
    this.crashedTabIds.delete(tabId);
  }

  has(tabId: string): boolean {
    return this.crashedTabIds.has(tabId);
  }
}
