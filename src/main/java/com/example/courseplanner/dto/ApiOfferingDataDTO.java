/**
 * Data Transfer Object (DTO) representing detailed information about a specific course offering.
 * Includes information such as semester, subject, catalog number, location, component,
 * enrollment details, and instructor.
 * Used in detailed offering-related responses.
 */


package com.example.courseplanner.dto;

public class ApiOfferingDataDTO {
    public String semester;
    public String subjectName;
    public String catalogNumber;
    public String location;
    public int enrollmentCap;
    public String component;
    public int enrollmentTotal;
    public String instructor;

    public ApiOfferingDataDTO(String semester, String subjectName, String catalogNumber, String location, int enrollmentCap, String component, int enrollmentTotal, String instructor) {
        this.semester = semester;
        this.subjectName = subjectName;
        this.catalogNumber = catalogNumber;
        this.location = location;
        this.enrollmentCap = enrollmentCap;
        this.component = component;
        this.enrollmentTotal = enrollmentTotal;
        this.instructor = instructor;
    }

    // Getters and Setters
    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public String getCatalogNumber() {
        return catalogNumber;
    }

    public void setCatalogNumber(String catalogNumber) {
        this.catalogNumber = catalogNumber;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public int getEnrollmentCap() {
        return enrollmentCap;
    }

    public void setEnrollmentCap(int enrollmentCap) {
        this.enrollmentCap = enrollmentCap;
    }

    public String getComponent() {
        return component;
    }

    public void setComponent(String component) {
        this.component = component;
    }

    public int getEnrollmentTotal() {
        return enrollmentTotal;
    }

    public void setEnrollmentTotal(int enrollmentTotal) {
        this.enrollmentTotal = enrollmentTotal;
    }

    public String getInstructor() {
        return instructor;
    }

    public void setInstructor(String instructor) {
        this.instructor = instructor;
    }
}
