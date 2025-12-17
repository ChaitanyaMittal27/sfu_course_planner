/**
 * Data Transfer Object (DTO) representing a course.
 * Includes course-specific details such as its ID and catalog number.
 * Typically used when listing or interacting with courses.
 */


package com.example.courseplanner.dto;

public class ApiCourseDTO {
    public long courseId;
    public String catalogNumber;

    public ApiCourseDTO(long courseId, String catalogNumber) {
        this.courseId = courseId;
        this.catalogNumber = catalogNumber;
    }

    public long getCourseId() {
        return courseId;
    }

    public void setCourseId(long courseId) {
        this.courseId = courseId;
    }

    public String getCatalogNumber() {
        return catalogNumber;
    }

    public void setCatalogNumber(String catalogNumber) {
        this.catalogNumber = catalogNumber;
    }
}
