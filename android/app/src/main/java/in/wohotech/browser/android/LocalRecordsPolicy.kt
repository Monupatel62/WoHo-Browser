package `in`.wohotech.browser.android

import org.json.JSONArray

/** Parsing boundary for user-owned bookmark/history preferences. Null means preserve, do not replace. */
object LocalRecordsPolicy {
    const val MAX_RECORDS_JSON_CHARS = 2_000_000

    fun parseRecords(raw: String): JSONArray? {
        if (raw.length > MAX_RECORDS_JSON_CHARS) return null
        return try { JSONArray(raw) } catch (_: Exception) { null }
    }
}
