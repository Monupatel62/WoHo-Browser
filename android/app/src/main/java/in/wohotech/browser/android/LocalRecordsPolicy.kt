package `in`.wohotech.browser.android

import org.json.JSONArray

/** Parsing boundary for user-owned bookmark/history preferences. Null means preserve, do not replace. */
internal object LocalRecordsPolicy {
    internal const val MAX_RECORDS_JSON_CHARS = 2_000_000
    private const val MAX_NESTING_DEPTH = 128

    internal fun parseRecords(raw: String): JSONArray? {
        if (raw.length > MAX_RECORDS_JSON_CHARS) return null
        val input = raw.trim()
        if (input.length < 2 || input.first() != '[' || input.last() != ']') return null

        return try {
            if (!StrictJsonValidator(input).validateTopLevelArray()) null else {
                val canonical = input.substring(1, input.length - 1).let { "[$it]" }
                val records = JSONArray(canonical)
                // Never silently drop a malformed record during the next save.
                // Invalid shapes or unsafe URLs make the whole store read-only for recovery.
                for (index in 0 until records.length()) {
                    val record = records.optJSONObject(index) ?: return null
                    val rawUrl = record.opt("url") as? String ?: return null
                    if (!BrowserUrlPolicy.isAllowedUrl(rawUrl)) return null
                }
                records
            }
        } catch (_: Exception) {
            null
        }
    }

    internal fun recoveryBackupFileName(key: String): String? = when (key) {
        "bookmarks" -> "woho-browser-bookmarks-recovery-backup.json"
        "history" -> "woho-browser-history-recovery-backup.json"
        else -> null
    }

    /**
     * Validates JSON grammar before handing data to Android's permissive org.json parser.
     * Prevents malformed preferences from being silently coerced into empty/string values.
     */
    private class StrictJsonValidator(private val source: String) {
        private var index = 0

        fun validateTopLevelArray(): Boolean {
            skipWhitespace()
            if (!consume('[')) return false
            skipWhitespace()
            if (!consume(']')) {
                while (true) {
                    if (!parseValue(0)) return false
                    skipWhitespace()
                    if (consume(']')) break
                    if (!consume(',')) return false
                    skipWhitespace()
                }
            }
            skipWhitespace()
            return index == source.length
        }

        private fun parseValue(depth: Int): Boolean {
            if (depth > MAX_NESTING_DEPTH || index >= source.length) return false
            return when (source[index]) {
                '"' -> parseString()
                '{' -> parseObject(depth + 1)
                '[' -> parseArray(depth + 1)
                't' -> consumeLiteral("true")
                'f' -> consumeLiteral("false")
                'n' -> consumeLiteral("null")
                '-', in '0'..'9' -> parseNumber()
                else -> false
            }
        }

        private fun parseObject(depth: Int): Boolean {
            if (!consume('{')) return false
            skipWhitespace()
            if (consume('}')) return true
            while (true) {
                if (index >= source.length || source[index] != '"' || !parseString()) return false
                skipWhitespace()
                if (!consume(':')) return false
                skipWhitespace()
                if (!parseValue(depth)) return false
                skipWhitespace()
                if (consume('}')) return true
                if (!consume(',')) return false
                skipWhitespace()
            }
        }

        private fun parseArray(depth: Int): Boolean {
            if (!consume('[')) return false
            skipWhitespace()
            if (consume(']')) return true
            while (true) {
                if (!parseValue(depth)) return false
                skipWhitespace()
                if (consume(']')) return true
                if (!consume(',')) return false
                skipWhitespace()
            }
        }

        private fun parseString(): Boolean {
            if (!consume('"')) return false
            while (index < source.length) {
                val character = source[index++]
                when {
                    character == '"' -> return true
                    character == '\\' -> {
                        if (index >= source.length) return false
                        when (source[index++]) {
                            '"', '\\', '/', 'b', 'f', 'n', 'r', 't' -> Unit
                            'u' -> {
                                repeat(4) {
                                    if (index >= source.length || source[index].digitToIntOrNull(16) == null) return false
                                    index++
                                }
                            }
                            else -> return false
                        }
                    }
                    character.code < 0x20 -> return false
                }
            }
            return false
        }

        private fun parseNumber(): Boolean {
            val start = index
            consume('-')
            if (consume('0')) {
                if (index < source.length && source[index] in '0'..'9') return false
            } else {
                if (index >= source.length || source[index] !in '1'..'9') return false
                while (index < source.length && source[index] in '0'..'9') index++
            }
            if (consume('.')) {
                if (index >= source.length || source[index] !in '0'..'9') return false
                while (index < source.length && source[index] in '0'..'9') index++
            }
            if (index < source.length && source[index] in "eE") {
                index++
                if (index < source.length && source[index] in "+-") index++
                if (index >= source.length || source[index] !in '0'..'9') return false
                while (index < source.length && source[index] in '0'..'9') index++
            }
            return index > start
        }

        private fun consumeLiteral(literal: String): Boolean {
            if (!source.startsWith(literal, index)) return false
            index += literal.length
            return true
        }

        private fun consume(character: Char): Boolean {
            if (index >= source.length || source[index] != character) return false
            index++
            return true
        }

        private fun skipWhitespace() {
            while (index < source.length && source[index] in charArrayOf(' ', '\t', '\n', '\r')) index++
        }
    }
}
