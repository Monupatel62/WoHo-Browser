package `in`.wohotech.browser.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.json.JSONObject
import org.junit.Test
import java.io.ByteArrayOutputStream

class LocalRecordsPolicyTest {
    @Test fun parsesValidArray() {
        assertEquals(1, LocalRecordsPolicy.parseRecords("""[{"title":"Example","url":"https://example.com"}]""")?.length())
    }

    @Test fun rejectsMalformedJsonWithoutReturningAnEmptyReplacement() {
        assertNull(LocalRecordsPolicy.parseRecords("""[{"title":]"""))
    }

    @Test fun rejectsNonArrayJson() {
        assertNull(LocalRecordsPolicy.parseRecords("""{"title":"Example"}"""))
        assertNull(LocalRecordsPolicy.parseRecords("null"))
        assertNull(LocalRecordsPolicy.parseRecords("\"text\""))
    }

    @Test fun rejectsTrailingGarbage() {
        assertNull(LocalRecordsPolicy.parseRecords("""[{"title":"Example"}] garbage"""))
    }

    @Test fun rejectsOversizedJson() {
        assertNull(LocalRecordsPolicy.parseRecords(" ".repeat(LocalRecordsPolicy.MAX_RECORDS_JSON_CHARS + 1)))
    }
    @Test fun rejectsNonObjectRecordsAndMissingUrls() {
        assertNull(LocalRecordsPolicy.parseRecords("""[null]"""))
        assertNull(LocalRecordsPolicy.parseRecords("""["https://example.com"]"""))
        assertNull(LocalRecordsPolicy.parseRecords("""[{}]"""))
        assertNull(LocalRecordsPolicy.parseRecords("""[{"title":"missing URL"}]"""))
    }

    @Test fun rejectsUnsafeOrNonStringRecordUrlsWithoutReturningAReplacement() {
        assertNull(LocalRecordsPolicy.parseRecords("""[{"url":7}]"""))
        assertNull(LocalRecordsPolicy.parseRecords("""[{"url":"javascript:alert(1)"}]"""))
        assertNull(LocalRecordsPolicy.parseRecords("""[{"url":"https://user:pass@example.com/"}]"""))
    }

    @Test fun recoveryBackupNamesAreRestrictedToKnownStores() {
        assertEquals("woho-browser-bookmarks-recovery-backup.json", LocalRecordsPolicy.recoveryBackupFileName("bookmarks"))
        assertEquals("woho-browser-history-recovery-backup.json", LocalRecordsPolicy.recoveryBackupFileName("history"))
        assertNull(LocalRecordsPolicy.recoveryBackupFileName("unexpected"))
    }

    @Test fun recoveryBackupPreservesRawStoredTextWithoutNormalization() {
        val raw = "corrupt raw content\\n"
        val output = ByteArrayOutputStream()
        LocalRecordsPolicy.writeRawBackup(raw, output)
        assertEquals(raw, String(output.toByteArray(), Charsets.UTF_8))
    }

    @Test fun rawStringRecoveryBackupIsByteExact() {
        val raw = "corrupt raw content\\n"
        assertEquals(raw, String(LocalRecordsPolicy.recoveryBackupContent("history", raw)!!, Charsets.UTF_8))
    }

    @Test fun wrongTypeStringSetExportsExplicitTypedRecoveryEnvelope() {
        val content = LocalRecordsPolicy.recoveryBackupContent("bookmarks", setOf("second", "first"))!!
        val envelope = JSONObject(String(content, Charsets.UTF_8))
        assertEquals("woho-browser-preference-recovery", envelope.getString("format"))
        assertEquals("bookmarks", envelope.getString("key"))
        assertEquals("StringSet", envelope.getString("valueType"))
        assertEquals("first", envelope.getJSONArray("value").getString(0))
        assertEquals("second", envelope.getJSONArray("value").getString(1))
    }

    @Test fun unsupportedWrongTypeValuesAreNotMisrepresentedAsRecoverable() {
        assertNull(LocalRecordsPolicy.recoveryBackupContent("history", Any()))
        assertNull(LocalRecordsPolicy.recoveryBackupContent("unexpected", "data"))
        assertNull(LocalRecordsPolicy.recoveryBackupContent("history", null))
    }

}
