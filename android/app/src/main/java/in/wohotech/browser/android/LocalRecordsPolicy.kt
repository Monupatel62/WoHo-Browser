package `in`.wohotech.browser.android

import org.json.JSONArray
import org.json.JSONTokener

/** Parsing boundary for user-owned bookmark/history preferences. Null means preserve, do not replace. */
object LocalRecordsPolicy {
    const val MAX_RECORDS_JSON_CHARS = 2_000_000

    fun parseRecords(raw: String): JSONArray? {
        if (raw.length > MAX_RECORDS_JSON_CHARS) return null
        return try {
            val tokener = JSONTokener(raw)
            val value = tokener.nextValue()
            // JSONTokener.nextValue() accepts some non-strict forms; require an array
            // and reject trailing content so corrupt data cannot be treated as valid.
            if (value !is JSONArray || tokener.nextClean() != '\u0000') null else value
        } catch (_: Exception) {
            null
        }
    }
}
