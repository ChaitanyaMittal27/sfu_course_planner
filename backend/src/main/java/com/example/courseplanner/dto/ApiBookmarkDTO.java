package com.example.courseplanner.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "A course offering saved by a user")
public class ApiBookmarkDTO {

    @Schema(accessMode = Schema.AccessMode.READ_ONLY, description = "Server-generated bookmark ID", example = "123")
    private Long bookmarkId;
    @Schema(description = "Database department ID", example = "1")
    private Long deptId;
    @Schema(description = "Database course ID", example = "42")
    private Long courseId;
    @Schema(description = "SFU semester code", example = "1257")
    private Long semesterCode;
    @Schema(description = "Offering section", example = "D100")
    private String section;
    @Schema(accessMode = Schema.AccessMode.READ_ONLY, description = "Bookmark creation time")
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
