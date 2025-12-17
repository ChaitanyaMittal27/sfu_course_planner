/**
 * Encapsulates the semester code of an offering and provides methods to convert it
 * into a human-readable format (e.g., "1147" -> "2014 Fall").
 *
 * Features:
 * - Extracts the year and term from the semester code.
 * - Provides term details as a string (e.g., "Spring", "Summer", "Fall").
 */


package com.example.courseplanner.model;

public class Semester {
    private int semesterCode;

    public Semester(int semesterCode) {
        this.semesterCode = semesterCode;
    }

    public int getSemesterCode() {
        return semesterCode;
    }

    public String getTerm() {
        String semesterCodeString = String.valueOf(semesterCode);
        String termCode = String.valueOf(semesterCodeString.charAt(3));
        String term = switch (termCode) {
            case "1" -> "Spring";
            case "4" -> "Summer";
            case "7" -> "Fall";
            default -> "Unknown Term";
        };
        return term;
    }

    public int getYear() {
        String semesterCodeString = String.valueOf(semesterCode);
        return 1900 + Integer.parseInt(semesterCodeString.substring(0, 3));
    }

    @Override
    public String toString() {
        return getYear() + " " + getTerm();
    }

}
