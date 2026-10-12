package `in`.wohotech.browser.android

import org.json.JSONArray
import org.json.JSONTokener

/** Parsing boundary for user-owned bookmark/history preferences. Null means preserve, do not replace. */
internal object LocalRecordsPolicy {
    internal const val MAX_RECORDS_JSON_CHARS = 2_000_000

    internal fun parseRecords(raw: String): JSONArray? {
        if (raw.length > MAX_RECORDS_JSON_CHARS) return null
        return try {
            val trimmed = raw.trim()
            if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null
            // JSONArray's Android org.json parser validates the array payload. The
            // explicit boundaries above prevent accepting non-array values or
            // concatenated trailing content; keep the stored text intact on error.
            JSONArray(trimmed)
        } catch (_: Exception) {
            null
        }
    }
}
