package `in`.wohotech.browser.android

import java.net.URI
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

object BrowserUrlPolicy {
    fun isAllowedUrl(value: String): Boolean = try {
        val uri = URI(value)
        val scheme = uri.scheme?.lowercase()
        (scheme == "http" || scheme == "https") && !uri.host.isNullOrBlank() && uri.rawUserInfo == null
    } catch (_: Exception) { false }

    /** Return a leaf filename safe to pass to DownloadManager as a relative path. */
    fun sanitizeDownloadFilename(value: String): String {
        val leaf = value.substringAfterLast('/').substringAfterLast('\\')
        val safe = leaf.replace(Regex("[^A-Za-z0-9._ -]"), "_")
            .trim()
            .trim('.')
            .take(120)
        return safe.takeIf { it.isNotBlank() && it != "." && it != ".." } ?: "download"
    }

    /** Remove query and fragment data from history without altering the live navigation URL. */
    fun sanitizeHistoryUrl(value: String): String? {
        if (!isAllowedUrl(value)) return null
        // Query and fragment delimiters are structural URL characters; remove
        // them from the original string to preserve escaped path bytes exactly.
        return value.substringBefore('#').substringBefore('?').takeIf(::isAllowedUrl)
    }

    fun normalizeAddressInput(input: String): String? {
        val value = input.trim()
        if (value.isEmpty() || value.length > 4096) return null
        // A host:port is not a URI scheme. Query and fragment delimiters are
        // valid immediately after the port even when the URL has no path.
        val isHostWithPort = Regex("^[^/\\s:]+:\\d+(?:[/?#]|$)").containsMatchIn(value)
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
