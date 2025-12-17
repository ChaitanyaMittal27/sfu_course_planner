/**
 * Represents an offering of a course in a specific semester and location.
 * Each offering includes its associated semester, location, instructors, and sections.
 */

 package com.example.courseplanner.model;

import java.util.*;

public class Offering {
    private Semester semester;
    private String location;
    private String instructors;
    private Map<String, Section> sections = new HashMap<>();
    private long id;

    public Offering(int semesterCode, String location, String instructors, long id) {
        this.semester = new Semester(semesterCode);
        this.location = location;
        this.instructors = formatInstructors(instructors);
        this.id = id;
    }

    public Semester getSemester() {
        return semester;
    }

    public String getLocation() {
        return location;
    }

    public String getInstructors() {
        return instructors;
    }

    public Map<String, Section> getSections() {
        return sections;
    }

    public void addSection(Section section) {
        sections.put(section.getComponentCode(), section);
    }

    private String formatInstructors(String rawInstructors) {
        String[] instructorArray = rawInstructors.split(",");
        Set<String> uniqueInstructors = new LinkedHashSet<>();
        for (String instructor : instructorArray) {
            if (!instructor.trim().isEmpty()) {
                uniqueInstructors.add(instructor.trim());
            }
        }
        return String.join(", ", uniqueInstructors);
    }


    public void setInstructors(String instructors) {
        this.instructors = instructors;
    }
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public void aggregateSections() {
        Map<String, Section> aggregatedSections = new HashMap<>();

        for (Section section : this.sections.values()) {
            String type = section.getComponentCode().trim().toUpperCase();
            aggregatedSections.computeIfAbsent(type, key -> new Section(type, 0, 0))
                    .aggregate(section); // Aggregate enrollment and capacity
        }

        // Replace sections with aggregated data
        this.sections.clear();
        this.sections.putAll(aggregatedSections);

        // Deduplicate instructors
        this.instructors = deduplicateInstructors(this.instructors);
    }

    public void mergeWith(Offering other) {
        for (Section section : other.getSections().values()) {
            this.sections.computeIfAbsent(section.getComponentCode(), key -> new Section(section.getComponentCode(), 0, 0))
                    .aggregate(section); // Aggregate enrollment and capacity
        }

        this.instructors = deduplicateInstructors(this.instructors + ", " + other.instructors);
    }

    private static String deduplicateInstructors(String instructors) {
        if (instructors == null || instructors.trim().isEmpty()) {
            return ""; // Return an empty string for null or blank input
        }

        // Split the instructors into individual names, trim whitespace, and add to a Set to deduplicate
        Set<String> uniqueInstructors = new LinkedHashSet<>();
        for (String instructor : instructors.split(",")) {
            String trimmed = instructor.trim();
            if (!trimmed.isEmpty() && !trimmed.equals(".")) {
                uniqueInstructors.add(trimmed);
            }
        }

        // Join the unique instructor names back into a comma-separated string
        return String.join(", ", uniqueInstructors);
    }



}
