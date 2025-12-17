/**
 * DatabaseLoader is responsible for loading course data from Supabase
 * and constructing a hierarchical model of departments, courses, offerings, and sections.
 */

package com.example.courseplanner.service;

import com.example.courseplanner.model.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.*;

public class DBLoader {
    private final DataSource dataSource;
    private long departmentIDcounter = 1;
    private long courseIDCounter = 1;
    private long offeringIDCounter = 1;

    public DBLoader(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public Map<Long, Department> loadAllData() {
        Map<String, Department> departments = new HashMap<>(); // Keyed by SUBJECT
        Map<Long, Department> departmentsById = new HashMap<>();

        String query = "SELECT * FROM course_data ORDER BY \"SEMESTER\", \"SUBJECT\", \"CATALOGNUMBER\"";

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(query)) {

            while (resultSet.next()) {
                // Extract fields from database row
                int semesterCode = resultSet.getInt("SEMESTER");
                String subject = resultSet.getString("SUBJECT").trim();
                String catalogNumber = resultSet.getString("CATALOGNUMBER").trim();
                String location = resultSet.getString("LOCATION").trim();
                int enrollmentCapacity = resultSet.getInt("ENROLMENTCAPACITY");
                int enrollmentTotal = resultSet.getInt("ENROLMENTTOTAL");
                String instructors = sanitizeInstructors(resultSet.getString("INSTRUCTORS"));
                String componentCode = resultSet.getString("COMPONENTCODE").trim();

                // Build the hierarchical model (same logic as CSVParser)
                Department department = getOrCreateDepartment(departments, departmentsById, subject);
                Course course = getOrCreateCourse(department, catalogNumber);
                Offering offering = getOrCreateOffering(course, semesterCode, location, instructors);
                addSectionIfNotExists(offering, componentCode, enrollmentTotal, enrollmentCapacity);
            }

        } catch (Exception e) {
            throw new RuntimeException("Error loading data from database", e);
        }

        return departmentsById;
    }

    private Department getOrCreateDepartment(Map<String, Department> departments,
                                             Map<Long, Department> departmentsById,
                                             String subject) {
        return departments.computeIfAbsent(subject, subject1 -> {
            Department newDepartment = new Department(subject1, departmentIDcounter);
            departmentsById.put(departmentIDcounter, newDepartment);
            departmentIDcounter++;
            return newDepartment;
        });
    }

    private Course getOrCreateCourse(Department department, String catalogNumber) {
        return department.getCourses().computeIfAbsent(courseIDCounter, id -> {
            Course newCourse = new Course(catalogNumber, courseIDCounter);
            courseIDCounter++;
            return newCourse;
        });
    }

    private Offering getOrCreateOffering(Course course, int semesterCode, String location, String instructors) {
        return course.getOfferings().computeIfAbsent(offeringIDCounter, id -> {
            Offering newOffering = new Offering(semesterCode, location, instructors, offeringIDCounter);
            offeringIDCounter++;
            return newOffering;
        });
    }

    private void addSectionIfNotExists(Offering offering, String componentCode,
                                       int enrollmentTotal, int enrollmentCapacity) {
        if (!offering.getSections().containsKey(componentCode)) {
            Section section = new Section(componentCode, enrollmentTotal, enrollmentCapacity);
            offering.addSection(section);
        }
    }

    private String sanitizeInstructors(String rawInstructors) {
        if (rawInstructors == null || rawInstructors.trim().isEmpty() ||
                rawInstructors.trim().equalsIgnoreCase("(null)")) {
            return "";
        }
        return rawInstructors.trim();
    }
}