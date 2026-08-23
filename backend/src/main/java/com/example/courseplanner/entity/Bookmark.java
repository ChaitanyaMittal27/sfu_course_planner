package com.example.courseplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "bookmarks",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {
            "dept_id",
            "user_id",
            "course_id",
            "semester_code",
            "section"
        })
    },
    indexes = {
        @Index(
            name = "idx_bookmarks_user",
            columnList = "user_id, dept_id, course_id, semester_code, section"
        )
    }
)
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bookmark_id")
    private Long bookmarkId;

    @Column(name = "dept_id", nullable = false)
    private Long deptId;

    @Column(name = "user_id", nullable = false, columnDefinition = "UUID")
    private UUID userId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "semester_code", nullable = false)
    private Long semesterCode;

    @Column(name = "section", nullable = false, length = 50)
    private String section;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // ----------------------------
    // Constructors
    // ----------------------------
    public Bookmark() {}

    public Bookmark(UUID userId, Long deptId, Long courseId, Long semesterCode, String section) {
        this.userId = userId;
        this.deptId = deptId;
        this.courseId = courseId;
        this.semesterCode = semesterCode;
        this.section = section;
    }


    // ----------------------------
    // Lifecycle hooks
    // ----------------------------
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
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

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
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
}
