package `in`.wohotech.browser.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BrowserUrlPolicyTest {
    @Test fun acceptsOnlyHttpAndHttpsHostsWithoutCredentials() {
        assertTrue(BrowserUrlPolicy.isAllowedUrl("https://example.com/path"))
        assertTrue(BrowserUrlPolicy.isAllowedUrl("http://localhost:8080"))
        assertFalse(BrowserUrlPolicy.isAllowedUrl("javascript:alert(1)"))
        assertFalse(BrowserUrlPolicy.isAllowedUrl("file:///etc/passwd"))
        assertFalse(BrowserUrlPolicy.isAllowedUrl("https://user:pass@example.com"))
        assertFalse(BrowserUrlPolicy.isAllowedUrl("https:///missing-host"))
    }
    @Test fun sanitizesDownloadFilenamesAsSafeLeafNames() {
        assertEquals("report.pdf", BrowserUrlPolicy.sanitizeDownloadFilename("../../report.pdf"))
        assertEquals("download", BrowserUrlPolicy.sanitizeDownloadFilename(".."))
        assertEquals("download", BrowserUrlPolicy.sanitizeDownloadFilename("   "))
        assertEquals("safe_name.txt", BrowserUrlPolicy.sanitizeDownloadFilename("C:\\fakepath\\safe:name.txt"))
        assertEquals(120, BrowserUrlPolicy.sanitizeDownloadFilename("a".repeat(200)).length)
    }
    @Test fun historySanitizationRemovesQueryAndFragmentSecrets() {
        assertEquals("https://example.com/path", BrowserUrlPolicy.sanitizeHistoryUrl("https://example.com/path?access_token=secret#section"))
        assertEquals("https://example.com/path", BrowserUrlPolicy.sanitizeHistoryUrl("https://example.com/path#section"))
        assertEquals("http://localhost:8080/path", BrowserUrlPolicy.sanitizeHistoryUrl("http://localhost:8080/path?debug=1#top"))
        assertNull(BrowserUrlPolicy.sanitizeHistoryUrl("javascript:alert(1)"))
        assertNull(BrowserUrlPolicy.sanitizeHistoryUrl("https://user:pass@example.com/path?token=secret"))
    }
    @Test fun normalizesHostsAndSearchQueries() {
        assertEquals("https://example.com", BrowserUrlPolicy.normalizeAddressInput("example.com"))
        assertEquals("https://localhost", BrowserUrlPolicy.normalizeAddressInput("localhost"))
        assertEquals("https://api.localhost", BrowserUrlPolicy.normalizeAddressInput("api.localhost"))
        assertEquals("https://localhost:8080", BrowserUrlPolicy.normalizeAddressInput("localhost:8080"))
        assertEquals("https://example.com:8443/path", BrowserUrlPolicy.normalizeAddressInput("example.com:8443/path"))
        assertEquals("https://example.com:8443?mode=compact", BrowserUrlPolicy.normalizeAddressInput("example.com:8443?mode=compact"))
        assertEquals("https://example.com:8443#section", BrowserUrlPolicy.normalizeAddressInput("example.com:8443#section"))
        assertEquals("https://www.google.com/search?q=hello%20world", BrowserUrlPolicy.normalizeAddressInput("hello world"))
        assertNull(BrowserUrlPolicy.normalizeAddressInput("javascript:alert(1)"))
        assertNull(BrowserUrlPolicy.normalizeAddressInput(""))
        assertNull(BrowserUrlPolicy.normalizeAddressInput("x".repeat(4097)))
    }
}
