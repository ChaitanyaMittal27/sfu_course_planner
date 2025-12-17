/**
 * Data Transfer Object (DTO) representing a specific course offering.
 * Includes details such as location, instructors, term, semester code, and year.
 * Used in responses involving course offering data.
 */

package com.example.courseplanner.dto;

public class ApiCourseOfferingDTO {
    private long courseOfferingId;  // Unique identifier for the course offering
    private String location;        // Location of the offering (e.g., "Burnaby")
    private String instructors;     // Comma-separated list of instructor names
    private String term;            // Term of the offering (e.g., "Fall")
    private long semesterCode;      // SFU semester code (e.g., 1191)
    private int year;               // Year of the offering (e.g., 2023)

    // Constructor
    public ApiCourseOfferingDTO(long courseOfferingId, String location, String instructors, String term, long semesterCode, int year) {
        this.courseOfferingId = courseOfferingId;
        this.location = location;
        this.instructors = instructors;
        this.term = term;
        this.semesterCode = semesterCode;
        this.year = year;
    }

    public long getCourseOfferingId() {
        return courseOfferingId;
    }

    public void setCourseOfferingId(long courseOfferingId) {
        this.courseOfferingId = courseOfferingId;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getInstructors() {
        return instructors;
    }

    public void setInstructors(String instructors) {
        this.instructors = instructors;
    }

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    public long getSemesterCode() {
        return semesterCode;
    }

    public void setSemesterCode(long semesterCode) {
        this.semesterCode = semesterCode;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }
}
