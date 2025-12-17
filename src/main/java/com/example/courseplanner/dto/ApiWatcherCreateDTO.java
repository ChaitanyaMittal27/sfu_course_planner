/**
 * Data Transfer Object (DTO) for creating a watcher.
 * Contains details such as the department ID and course ID to associate the watcher with.
 * Used in the `/api/add-watcher` endpoint.
 */


package com.example.courseplanner.dto;

public final class ApiWatcherCreateDTO {
    public long deptId;
    public long courseId;

    // Constructor
    public ApiWatcherCreateDTO(long deptId, long courseId) {
        this.deptId = deptId;
        this.courseId = courseId;
    }

    // Getters and Setters
    public long getDeptId() {
        return deptId;
    }

    public void setDeptId(long deptId) {
        this.deptId = deptId;
    }

    public long getCourseId() {
        return courseId;
    }

    public void setCourseId(long courseId) {
        this.courseId = courseId;
    }
}
