/**
 * Controller to handle adding new course offerings to the model.
 * Exposes the `/api/addoffering` endpoint for updating the model with new data.
 * Integrates with the watcher system to record changes.
 */


package com.example.courseplanner.controller;

import com.example.courseplanner.dto.ApiOfferingDataDTO;
import com.example.courseplanner.model.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api")
public class AddOfferingController {
    private final Map<Long, Department> departmentMap;
    private final WatcherController watcherController;
    private final AtomicLong courseIdCounter = new AtomicLong(1);
    private final AtomicLong offeringIdCounter = new AtomicLong(1);


    public AddOfferingController(Map<Long, Department> departmentMap, WatcherController watcherController) {
        this.departmentMap = departmentMap;
        this.watcherController = watcherController;
    }

    @PostMapping("/addoffering")
    public ResponseEntity<String> addOffering(@RequestBody ApiOfferingDataDTO data) {
        if (data.getSubjectName() == null || data.getCatalogNumber() == null || data.getSemester() == null ||
                data.getLocation() == null || data.getComponent() == null || data.getInstructor() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid input data.");
        }

        // Update model hierarchy
        Department department = findOrCreateDepartment(data.getSubjectName());
        Course course = findOrCreateCourse(department, data.getCatalogNumber());
        Offering offering = findOrCreateOffering(course, Integer.parseInt(data.getSemester()), data.getLocation(), data.getInstructor());

        // Add or aggregate the section
        Section section = offering.getSections().get(data.getComponent());
        if (section == null) {
            section = new Section(data.getComponent(), data.getEnrollmentTotal(), data.getEnrollmentCap());
            offering.addSection(section);
        } else {
            section.aggregate(new Section(data.getComponent(), data.getEnrollmentTotal(), data.getEnrollmentCap()));
        }

        // Record an event using the WatcherController with an updated description
        String semesterYear = String.valueOf(offering.getSemester().getYear());
        String semesterTerm = offering.getSemester().getTerm();
        ZonedDateTime now = ZonedDateTime.now(ZoneId.systemDefault());
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE MMM dd HH:mm:ss z yyyy");
        String formattedDateTime = now.format(formatter);
        String eventDescription = String.format("%s: Added section %s with enrollment (%d / %d) to offering %s %s",
                formattedDateTime, data.getComponent(), data.getEnrollmentTotal(), data.getEnrollmentCap(), semesterTerm, semesterYear);
        watcherController.recordEvent(data.getSubjectName(), data.getCatalogNumber(), eventDescription);

        // Ensure graph is updated for all semesters
        initializeMissingSemesters(department);
        return ResponseEntity.ok("Offering added successfully");
    }

    private Department findOrCreateDepartment(String subjectName) {
        return departmentMap.values().stream()
                .filter(dept -> dept.getSubject().equalsIgnoreCase(subjectName))
                .findFirst()
                .orElseGet(() -> {
                    long id = departmentMap.size() + 1;
                    Department department = new Department(subjectName, id);
                    departmentMap.put(id, department);
                    return department;
                });
    }

    private Course findOrCreateCourse(Department department, String catalogNumber) {
        return department.getCourses().computeIfAbsent(
                courseIdCounter.getAndIncrement(),
                id -> new Course(catalogNumber, id)
        );
    }

    private Offering findOrCreateOffering(Course course, int semesterCode, String location, String instructors) {
        return course.getOfferings().computeIfAbsent(
                offeringIdCounter.getAndIncrement(),
                id -> new Offering(semesterCode, location, instructors, id)
        );
    }

    // Add missing semesters with 0 LEC enrollment
    private void initializeMissingSemesters(Department department) {
        Map<Integer, Long> enrollmentsBySemester = new TreeMap<>();
        department.getCourses().values().forEach(course -> {
            course.getOfferings().values().forEach(offering -> {
                enrollmentsBySemester.putIfAbsent(offering.getSemester().getSemesterCode(), 0L);
            });
        });
    }
}
