/**
 * Controller to handle browsing of departments, courses, and offerings.
 * Exposes multiple endpoints:
 * - `/api/departments`: Lists all departments.
 * - `/api/departments/{deptId}/courses`: Lists courses in a department.
 * - `/api/departments/{deptId}/courses/{courseId}/offerings`: Lists offerings for a course.
 * - `/api/departments/{deptId}/courses/{courseId}/offerings/{offeringId}`: Details of a specific offering.
 */


package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.model.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class BrowseController {
    private final Map<Long, Department> departmentMap;

    public BrowseController(Map<Long, Department> departmentMap) {
        this.departmentMap = departmentMap;
    }

    @GetMapping("/departments")
    public ResponseEntity<List<ApiDepartmentDTO>> getDepartments() {
        if (departmentMap == null || departmentMap.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        List<ApiDepartmentDTO> departmentDTOs = departmentMap.values().stream()
                .sorted(Comparator.comparing(Department::getSubject, String.CASE_INSENSITIVE_ORDER))
                .map(department -> new ApiDepartmentDTO(department.getId(), department.getSubject()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(departmentDTOs); // Return 200 OK with the list of departments
    }


    @GetMapping("/departments/{deptId}/courses")
    public ResponseEntity<List<ApiCourseDTO>> getCourses(@PathVariable long deptId) {
        try {
            Department department = departmentMap.get(deptId);
            if (department == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
            // Group courses by catalog number
            Map<String, Course> groupedCourses = department.groupCourses();

            List<ApiCourseDTO> courses = groupedCourses.values().stream()
                    .sorted(Comparator.comparing(Course::getCatalogNumber, String.CASE_INSENSITIVE_ORDER))
                    .map(course -> new ApiCourseDTO(course.getId(), course.getCatalogNumber()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(courses);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }


    @GetMapping("/departments/{deptId}/courses/{courseId}/offerings")
    public ResponseEntity<List<ApiCourseOfferingDTO>> getOfferings(@PathVariable long deptId, @PathVariable long courseId) {
        try {
            Department department = departmentMap.get(deptId);
            if (department == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
            Course course = department.getCourses().get(courseId);
            if (course == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }

            // Group offerings by {semester code, location}
            Map<Long, Offering> groupedOfferings = course.groupOfferings();

            List<ApiCourseOfferingDTO> offerings = groupedOfferings.values().stream()
                    .sorted(Comparator.comparing(o -> o.getSemester().getSemesterCode()))
                    .map(offering -> new ApiCourseOfferingDTO(
                            offering.getId(),
                            offering.getLocation(),
                            offering.getInstructors(),
                            offering.getSemester().getTerm(),
                            offering.getSemester().getSemesterCode(),
                            offering.getSemester().getYear()
                    ))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(offerings);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }


    @GetMapping("/departments/{deptId}/courses/{courseId}/offerings/{offeringId}")
    public ResponseEntity<List<ApiOfferingSectionDTO>> getSpecificOffering(
            @PathVariable long deptId,
            @PathVariable long courseId,
            @PathVariable long offeringId) {
        try {
            Department department = departmentMap.get(deptId);
            if (department == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }

            Course course = department.getCourses().get(courseId);
            if (course == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }

            Offering offering = course.getOfferings().get(offeringId);
            if (offering == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }

            // No additional aggregation needed, just return sections for the specific offering
            List<ApiOfferingSectionDTO> sections = offering.getSections().values().stream()
                    .sorted(Comparator.comparing(Section::getComponentCode, String.CASE_INSENSITIVE_ORDER))
                    .map(section -> new ApiOfferingSectionDTO(
                            section.getComponentCode(),
                            section.getEnrollmentCapacity(),
                            section.getEnrollmentTotal()
                    ))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(sections);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    private Course findCourseById(long deptId, long courseId) {
        Department department = departmentMap.get(deptId);
        if (department == null) {
            throw new IllegalArgumentException("Department not found");
        }

        Course course = department.getCourses().get(courseId);
        if (course == null) {
            throw new IllegalArgumentException("Course not found");
        }
        return course;
    }
}
