package in.wohotech.browser.android

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
    @Test fun normalizesHostsAndSearchQueries() {
        assertEquals("https://example.com", BrowserUrlPolicy.normalizeAddressInput("example.com"))
        assertEquals("https://www.google.com/search?q=hello%20world", BrowserUrlPolicy.normalizeAddressInput("hello world"))
        assertNull(BrowserUrlPolicy.normalizeAddressInput("javascript:alert(1)"))
        assertNull(BrowserUrlPolicy.normalizeAddressInput(""))
        assertNull(BrowserUrlPolicy.normalizeAddressInput("x".repeat(4097)))
    }
}
