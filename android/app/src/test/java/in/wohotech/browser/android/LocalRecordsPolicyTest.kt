package `in`.wohotech.browser.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

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

}
