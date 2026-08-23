package com.example.courseplanner.dto;

/**
 * Live CourseSys data for one bookmarked offering.
 *
 * Unlike a generic offering response, this includes the bookmark and course
 * identifiers required to associate it with the authenticated user's watchlist.
 */
public class ApiBookmarkOfferingDTO extends ApiCourseOfferingDTO {
    private Long bookmarkId;
    private Long deptId;
    private Long courseId;

    public ApiBookmarkOfferingDTO(
            Long bookmarkId,
            Long deptId,
            Long courseId,
            String section,
            String infoUrl,
            String term,
            Long year,
            Long semesterCode,
            boolean isEnrolling,
            String location,
            String instructors,
            String enrolled,
            String capacity,
            Long loadPercent
    ) {
        super(section, infoUrl, term, year, semesterCode, isEnrolling, location, instructors, enrolled, capacity, loadPercent);
        this.bookmarkId = bookmarkId;
        this.deptId = deptId;
        this.courseId = courseId;
    }

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
}
