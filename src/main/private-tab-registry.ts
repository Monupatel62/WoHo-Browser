/** Tracks private-tab identity until WebContents is actually destroyed. */
export class PrivateTabRegistry {
  private readonly tabIds = new Set<string>();

  add(tabId: string): void {
    this.tabIds.add(tabId);
  }

  has(tabId: string): boolean {
    return this.tabIds.has(tabId);
  }

  /** Call only from the WebContents destroyed event, never when close is requested. */
  onDestroyed(tabId: string): void {
    this.tabIds.delete(tabId);
  }
}
