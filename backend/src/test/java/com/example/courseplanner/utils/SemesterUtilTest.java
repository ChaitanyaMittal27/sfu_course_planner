package com.example.courseplanner.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SemesterUtilTest {

    @Test
    void buildsSfuSemesterCodes() {
        assertEquals(1251, SemesterUtil.buildSemesterCode(2025, "spring"));
        assertEquals(1254, SemesterUtil.buildSemesterCode(2025, "summer"));
        assertEquals(1257, SemesterUtil.buildSemesterCode(2025, "fall"));
    }

    @Test
    void decodesSfuSemesterCodes() {
        assertDecodedSemester(1251, 2025, "spring");
        assertDecodedSemester(1254, 2025, "summer");
        assertDecodedSemester(1257, 2025, "fall");
    }

    @Test
    void rejectsUnsupportedSemesterCodeSuffixes() {
        assertThrows(IllegalArgumentException.class,
                () -> SemesterUtil.decodeSemesterCode(1252));
    }

    private void assertDecodedSemester(long semesterCode, long expectedYear, String expectedTerm) {
        SemesterUtil.DecodedSemester decoded = SemesterUtil.decodeSemesterCode(semesterCode);

        assertEquals(expectedYear, decoded.year());
        assertEquals(expectedTerm, decoded.term());
    }
}
