package com.example.courseplanner.dto;

import java.time.LocalDateTime;

public class ApiBookmarkDTO {

    private Long bookmarkId;
    private Long deptId;
    private Long courseId;
    private Long semesterCode;
    private String section;
    private LocalDateTime createdAt;

    // ----------------------------
    // Constructor
    // ----------------------------
    public ApiBookmarkDTO(
        Long bookmarkId,
        Long deptId,
        Long courseId,
        Long semesterCode,
        String section,
        LocalDateTime createdAt
    ) {
        this.bookmarkId = bookmarkId;
        this.deptId = deptId;
        this.courseId = courseId;
        this.semesterCode = semesterCode;
        this.section = section;
        this.createdAt = createdAt;
    }

    // ----------------------------
    // Getters & Setters
    // ----------------------------
    public Long getBookmarkId() {
        return bookmarkId;
    }

    public void setBookmarkId(Long bookmarkId) {
        this.bookmarkId = bookmarkId;
    }

    public Long getDeptId() {
        return deptId;
    }

    public void setDeptId(Long deptId) {
        this.deptId = deptId;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Long getSemesterCode() {
        return semesterCode;
    }

    public void setSemesterCode(Long semesterCode) {
        this.semesterCode = semesterCode;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
