/**
 * Model representing the complete result of a CourseSys API browse query.
 * 
 * Contains course metadata (department, number, title) along with term information
 * and a list of all course offerings/sections for that term.
 * 
 * Used as the return type for CourseSysClient.fetchCourseSections().
 * 
 * Example:
 *   CourseSysBrowseResult result = client.fetchCourseSections("CMPT", "276", 1257);
 *   result.getDept()        → "CMPT"
 *   result.getCourseNumber() → "276"
 *   result.getYear()        → 2025
 *   result.getSemester()    → "fall"
 *   result.getOfferings()   → List of all sections (D100, D200, etc.)
 */

package com.example.courseplanner.model;

import java.util.List;

public class CourseSysBrowseResult {

    private long year;
    private String semester;      // "fall", "spring", "summer"
    private long semesterCode;

    private String dept;
    private String courseNumber;
    private String title;

    private List<CourseSysOffering> offerings;

    // getters / setters

    public long getYear() {
        return year;
    }

    public void setYear(long year) {
        this.year = year;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public long getSemesterCode() {
        return semesterCode;
    }

    public void setSemesterCode(long semesterCode) {
        this.semesterCode = semesterCode;
    }

    public String getDept() {
        return dept;
    }

    public void setDept(String dept) {
        this.dept = dept;
    }

    public String getCourseNumber() {
        return courseNumber;
    }

    public void setCourseNumber(String courseNumber) {
        this.courseNumber = courseNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<CourseSysOffering> getOfferings() {
        return offerings;
    }

    public void setOfferings(List<CourseSysOffering> offerings) {
        this.offerings = offerings;
    }
}
