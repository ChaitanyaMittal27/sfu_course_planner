/**
 * Data Transfer Object (DTO) representing a section of a course offering.
 * Includes section type (e.g., LEC, LAB) and enrollment details such as capacity and total enrolled.
 * Typically used when breaking down offering data into specific sections.
 */


package com.example.courseplanner.dto;

public class ApiOfferingSectionDTO {
    private String type;
    private int enrollmentCap;
    private int enrollmentTotal;

    // Constructor
    public ApiOfferingSectionDTO(String type, int enrollmentCap, int enrollmentTotal) {
        this.type = type;
        this.enrollmentCap = enrollmentCap;
        this.enrollmentTotal = enrollmentTotal;
    }

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getEnrollmentCap() {
        return enrollmentCap;
    }

    public void setEnrollmentCap(int enrollmentCap) {
        this.enrollmentCap = enrollmentCap;
    }

    public int getEnrollmentTotal() {
        return enrollmentTotal;
    }

    public void setEnrollmentTotal(int enrollmentTotal) {
        this.enrollmentTotal = enrollmentTotal;
    }
}
