/**
 * Represents a department within the university.
 * Each department is identified by its subject code (e.g., "CMPT") and contains a list of courses.
 *
 */


package com.example.courseplanner.model;

import java.util.*;

public class Department implements Iterable<Course>{
    private String subject; // Department code, e.g., "CMPT"
    private Map<Long, Course> courses = new HashMap<>();
    private long id;

    public Department(String subject, long id) {
        this.subject = subject;
        this.id = id;
    }

    public String getSubject() {
        return subject;
    }

    public Map<Long, Course> getCourses() { // Changed return type to Map
        return courses;
    }

    public void addCourse(Course course) {
        // Check for duplicates before adding
        if (!courses.containsKey(course.getId())) {
            courses.put(course.getId(), course);
        }
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }
    @Override
    public Iterator<Course> iterator() {
        return courses.values().iterator(); // Adjusted to iterate over values of the map
    }

    public Map<String, Course> groupCourses() {
        Map<String, Course> groupedCourses = new HashMap<>();

        for (Course course : this.courses.values()) {
            groupedCourses.merge(course.getCatalogNumber(), course, (existing, newCourse) -> {
                existing.getOfferings().putAll(newCourse.groupOfferings()); // Add grouped offerings
                return existing;
            });
        }

        return groupedCourses;
    }
}
