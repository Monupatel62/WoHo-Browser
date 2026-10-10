/** Convert Chromium navigation failures to safe, actionable UI messages. */
export function getNavigationFailureMessage(errorCode: number, errorDescription: string): string | null {
  // ERR_ABORTED commonly means the user navigated away or stopped loading.
  if (errorCode === -3 || errorDescription === 'ERR_ABORTED') return null;

  if ((errorCode <= -200 && errorCode >= -299) || /^ERR_CERT_/.test(errorDescription) || /^ERR_SSL_/.test(errorDescription)) {
    return 'The site’s security certificate or encrypted connection could not be verified. WoHo Browser blocked the connection.';
  }
  switch (errorCode) {
    case -106:
      return 'You appear to be offline. Check your internet connection and try again.';
    case -105:
      return 'WoHo Browser could not find this website. Check the address and try again.';
    case -118:
      return 'This website took too long to respond. Try again in a moment.';
    case -102:
      return 'This website refused the connection. Check the address or try again later.';
    case -101:
      return 'The connection was interrupted. Check your network and try again.';
    case -109:
      return 'This website could not be reached from your network.';
    default:
      return 'This page could not be loaded. Check the address or your connection and try again.';
  }
}
