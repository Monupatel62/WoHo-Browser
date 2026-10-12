package `in`.wohotech.browser.android

import android.net.Uri
import java.net.URI
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

object BrowserUrlPolicy {
    fun isAllowedUrl(value: String): Boolean = try {
        val uri = URI(value)
        val scheme = uri.scheme?.lowercase()
        (scheme == "http" || scheme == "https") && !uri.host.isNullOrBlank() && uri.rawUserInfo == null
    } catch (_: Exception) { false }

    /** Remove query and fragment data from history without altering the live navigation URL. */
    fun sanitizeHistoryUrl(value: String): String? {
        if (!isAllowedUrl(value)) return null
        return try {
            Uri.parse(value).buildUpon().clearQuery().fragment(null).build().toString().takeIf(::isAllowedUrl)
        } catch (_: Exception) { null }
    }

    fun normalizeAddressInput(input: String): String? {
        val value = input.trim()
        if (value.isEmpty() || value.length > 4096) return null
        val isHostWithPort = Regex("^[^/\\s:]+:\\d+(?:/|$)").containsMatchIn(value)
        val hasExplicitScheme = !isHostWithPort && Regex("^[a-zA-Z][a-zA-Z0-9+.-]*:").containsMatchIn(value)
        val candidate = when {
            hasExplicitScheme -> value
            value.any(Char::isWhitespace) || (!value.contains('.') && !isHostWithPort) ->
                "https://www.google.com/search?q=" + URLEncoder.encode(value, StandardCharsets.UTF_8.toString()).replace("+", "%20")
            else -> "https://$value"
        }
        return candidate.takeIf(::isAllowedUrl)
    }
}
