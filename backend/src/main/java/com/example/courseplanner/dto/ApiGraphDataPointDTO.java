/**
 * Data Transfer Object (DTO) representing a data point for graph visualization.
 * Includes details such as the semester code and total number of courses taken.
 * Used in the bonus `/api/graph` endpoint.
 */


package com.example.courseplanner.dto;

public class ApiGraphDataPointDTO {
    private long semesterCode;
    private long totalCoursesTaken;

    // Constructor
    public ApiGraphDataPointDTO(long semesterCode, long totalCoursesTaken) {
        this.semesterCode = semesterCode;
        this.totalCoursesTaken = totalCoursesTaken;
    }

    // Getters and Setters
    public long getSemesterCode() {
        return semesterCode;
    }

    public void setSemesterCode(long semesterCode) {
        this.semesterCode = semesterCode;
    }

    public long getTotalCoursesTaken() {
        return totalCoursesTaken;
    }

    public void setTotalCoursesTaken(long totalCoursesTaken) {
        this.totalCoursesTaken = totalCoursesTaken;
    }
}
