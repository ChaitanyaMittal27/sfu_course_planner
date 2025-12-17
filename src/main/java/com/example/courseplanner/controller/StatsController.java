/**
 * Controller for statistical data about the model.
 * Exposes endpoints under `/api/stats`, including:
 * - `/students-per-semester`: Aggregates student enrollment data for graph visualization.
 * - `/course-load`: Aggregates course load (enrollment %) per semester for a specific course.
 */

package com.example.courseplanner.controller;

import com.example.courseplanner.dto.ApiGraphDataPointDTO;
import com.example.courseplanner.dto.ApiCourseLoadDTO;
import com.example.courseplanner.model.Department;
import com.example.courseplanner.model.Course;
import com.example.courseplanner.model.Offering;
import com.example.courseplanner.model.Section;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stats")
public class StatsController {
    private final Map<Long, Department> departmentMap;

    public StatsController(Map<Long, Department> departmentMap) {
        this.departmentMap = departmentMap;
    }

    @GetMapping("/students-per-semester")
    public ResponseEntity<List<ApiGraphDataPointDTO>> getStudentsPerSemester(@RequestParam long deptId) {
        Department department = departmentMap.get(deptId);
        if (department == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        // Initialize enrollmentsBySemester with all semesters
        Map<Integer, Long> enrollmentsBySemester = new TreeMap<>();
        department.getCourses().values().forEach(course -> {
            course.getOfferings().values().forEach(offering -> {
                enrollmentsBySemester.putIfAbsent(offering.getSemester().getSemesterCode(), 0L);
            });
        });

        // Add LEC enrollment totals to the initialized map
        department.getCourses().values().forEach(course -> {
            course.getOfferings().values().forEach(offering -> {
                long lecEnrollment = getTotalEnrollment(offering);
                enrollmentsBySemester.merge(offering.getSemester().getSemesterCode(), lecEnrollment, Long::sum);
            });
        });

        // Convert aggregated data to DTOs
        List<ApiGraphDataPointDTO> graphData = enrollmentsBySemester.entrySet().stream()
                .map(entry -> new ApiGraphDataPointDTO(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(graphData);
    }

    @GetMapping("/course-load")
    public ResponseEntity<List<ApiCourseLoadDTO>> getCourseLoad(
            @RequestParam long deptId,
            @RequestParam long courseId) {
        
        Department department = departmentMap.get(deptId);
        if (department == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Course course = department.getCourses().get(courseId);
        if (course == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        // Map to aggregate load data by semester
        Map<Integer, LoadAggregator> loadBySemester = new TreeMap<>();

        // Process each offering
        course.getOfferings().values().forEach(offering -> {
            int semesterCode = offering.getSemester().getSemesterCode();
            
            // Calculate LEC enrollment and capacity for this offering
            int lecEnrolled = 0;
            int lecCapacity = 0;
            
            for (Section section : offering.getSections().values()) {
                if ("LEC".equalsIgnoreCase(section.getComponentCode())) {
                    lecEnrolled += section.getEnrollmentTotal();
                    lecCapacity += section.getEnrollmentCapacity();
                }
            }

            // Only process if there are LEC sections
            if (lecCapacity > 0) {
                LoadAggregator aggregator = loadBySemester.getOrDefault(
                    semesterCode, 
                    new LoadAggregator()
                );
                
                aggregator.addEnrolled(lecEnrolled);
                aggregator.addCapacity(lecCapacity);
                aggregator.addLocation(offering.getLocation());
                aggregator.addInstructor(offering.getInstructors());
                
                loadBySemester.put(semesterCode, aggregator);
            }
        });

        // Convert to DTOs
        List<ApiCourseLoadDTO> result = loadBySemester.entrySet().stream()
                .map(entry -> {
                    int semester = entry.getKey();
                    LoadAggregator agg = entry.getValue();
                    
                    double load = (agg.capacity > 0) 
                        ? Math.round((agg.enrolled * 100.0 / agg.capacity) * 10.0) / 10.0
                        : 0.0;
                    
                    return new ApiCourseLoadDTO(
                        semester,
                        agg.enrolled,
                        agg.capacity,
                        load,
                        String.join(", ", agg.locations),
                        String.join(", ", agg.instructors)
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    private long getTotalEnrollment(Offering offering) {
        return offering.getSections().values().stream()
                .filter(section -> "LEC".equalsIgnoreCase(section.getComponentCode()))
                .mapToLong(Section::getEnrollmentTotal)
                .sum();
    }

    // Helper class for aggregating load data
    private static class LoadAggregator {
        int enrolled = 0;
        int capacity = 0;
        Set<String> locations = new LinkedHashSet<>();
        Set<String> instructors = new LinkedHashSet<>();

        void addEnrolled(int e) { enrolled += e; }
        void addCapacity(int c) { capacity += c; }
        void addLocation(String loc) { 
            if (loc != null && !loc.trim().isEmpty()) {
                locations.add(loc.trim()); 
            }
        }
        void addInstructor(String inst) { 
            if (inst != null && !inst.trim().isEmpty()) {
                instructors.add(inst.trim()); 
            }
        }
    }
}