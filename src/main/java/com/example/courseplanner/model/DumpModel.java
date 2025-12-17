/**
 * Generates a complete textual representation of the course model for the 'Debug Dump' function.
 * This class is responsible for aggregating and formatting the data from the departments,
 * courses, offerings, and sections to produce a human-readable dump of the system's model.
 */

 package com.example.courseplanner.model;

import java.util.*;
import java.util.stream.Collectors;

public class DumpModel {
    private final Map<Long, Department> departmentMap;

    public DumpModel(Map<Long, Department> departmentMap) {
        this.departmentMap = departmentMap;
    }

    public String generateDump() {
        StringBuilder dumpBuilder = new StringBuilder();

        // Sort departments alphabetically
        List<Department> sortedDepartments = departmentMap.values().stream()
                .sorted(Comparator.comparing(Department::getSubject, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());

        for (Department department : sortedDepartments) {
            // Use the new groupCourses method to aggregate courses
            Map<String, Course> groupedCourses = department.groupCourses();

            for (Course course : groupedCourses.values()) {
                dumpBuilder.append(department.getSubject()).append(" ").append(course.getCatalogNumber()).append("\n");

                // Use the new groupOfferings method to aggregate offerings
                Map<Long, Offering> groupedOfferings = course.groupOfferings();

                for (Offering offering : groupedOfferings.values()) {
                    dumpBuilder.append("    Offering: ")
                            .append(offering.getSemester().getSemesterCode())
                            .append(" in ")
                            .append(offering.getLocation())
                            .append(" by ")
                            .append(offering.getInstructors()).append("\n");

                    // Sort sections alphabetically by component code
                    List<Section> sortedSections = new ArrayList<>(offering.getSections().values());
                    sortedSections.sort(Comparator.comparing(Section::getComponentCode, String.CASE_INSENSITIVE_ORDER));

                    for (Section section : sortedSections) {
                        dumpBuilder.append("      Section: ")
                                .append(section.getComponentCode())
                                .append(", Enrollment: ")
                                .append(section.getEnrollmentTotal())
                                .append("/")
                                .append(section.getEnrollmentCapacity())
                                .append("\n");
                    }
                }
            }
        }

        return dumpBuilder.toString();
    }

    private static String deduplicateInstructors(String rawInstructors) {
        String[] instructors = rawInstructors.split(",");
        Set<String> uniqueInstructors = new LinkedHashSet<>();

        for (String instructor : instructors) {
            if (instructor != null && !instructor.trim().isEmpty() && !instructor.trim().equals(".")) {
                uniqueInstructors.add(instructor.trim());
            }
        }
        return String.join(", ", uniqueInstructors);
    }

    private static Set<String> getComponentTypesForOffering(Offering offering) {
        return offering.getSections().values().stream()
                .map(Section::getComponentCode)
                .map(code -> code.trim().toUpperCase())
                .collect(Collectors.toSet());
    }
}
