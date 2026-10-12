package `in`.wohotech.browser.android

import org.json.JSONArray
import org.json.JSONTokener

/** Parsing boundary for user-owned bookmark/history preferences. Null means preserve, do not replace. */
internal object LocalRecordsPolicy {
    internal const val MAX_RECORDS_JSON_CHARS = 2_000_000

    internal fun parseRecords(raw: String): JSONArray? {
        if (raw.length > MAX_RECORDS_JSON_CHARS) return null
        return try {
            val tokener = JSONTokener(raw)
            val value = tokener.nextValue()
            val trailing = tokener.nextClean()
            // org.json JSONTokener uses NUL to represent end-of-input.
            if (value !is JSONArray || (trailing != '\u0000' && trailing.code != 0)) null else value
        } catch (_: Exception) {
            null
        }
    }
}
