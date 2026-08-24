package com.example.courseplanner.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CourseSysOfferingTest {

    @Test
    void parsesPlainEnrollmentAndCapacityValues() {
        CourseSysOffering offering = offering("96", "100");

        assertEquals(96, offering.getEnrolledCount());
        assertEquals(100, offering.getCapacityCount());
        assertEquals(96L, offering.getLoadPercent());
    }

    @Test
    void includesWaitlistedStudentsInEnrollmentAndLoad() {
        CourseSysOffering offering = offering("96 (+4)", "100");

        assertEquals(100, offering.getEnrolledCount());
        assertEquals(100L, offering.getLoadPercent());
    }

    @Test
    void roundsLoadAndRepresentsOverenrollment() {
        assertEquals(67L, offering("2", "3").getLoadPercent());
        assertEquals(120L, offering("120", "100").getLoadPercent());
    }

    @Test
    void handlesMissingOrMalformedValuesSafely() {
        assertEquals(0, offering(null, null).getEnrolledCount());
        assertEquals(0, offering("not available", "unknown").getEnrolledCount());
        assertEquals(0, offering("not available", "unknown").getCapacityCount());
        assertEquals(0L, offering("40", "0").getLoadPercent());
    }

    private CourseSysOffering offering(String enrolled, String capacity) {
        CourseSysOffering offering = new CourseSysOffering();
        offering.setEnrolled(enrolled);
        offering.setCapacity(capacity);
        return offering;
    }
}
