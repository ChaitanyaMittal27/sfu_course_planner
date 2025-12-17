/**
 * Data Transfer Object (DTO) representing a watcher.
 * Includes watcher ID, associated department and course, and a list of events triggered by updates.
 * Used in responses for watcher-related requests.
 */


package com.example.courseplanner.dto;
import java.util.List;

public class ApiWatcherDTO {
    private long id;
    private ApiDepartmentDTO department;
    private ApiCourseDTO watchedcourse;
    private List<String> events;


    // Constructor
    public ApiWatcherDTO(long id, ApiDepartmentDTO department, ApiCourseDTO course, List<String> events) {
        this.id = id;
        this.department = department;
        this.watchedcourse = course;
        this.events = events;
    }

    // Getters and Setters
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public ApiDepartmentDTO getDepartment() {
        return department;
    }

    public void setDepartment(ApiDepartmentDTO department) {
        this.department = department;
    }

    public ApiCourseDTO getCourse() {
        return watchedcourse;
    }

    public void setCourse(ApiCourseDTO course) {
        this.watchedcourse = course;
    }

    public List<String> getEvents() {
        return events;
    }

    public void setEvents(List<String> events) {
        this.events = events;
    }
}
