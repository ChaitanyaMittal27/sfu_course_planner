package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.entity.*;
import com.example.courseplanner.model.*;
import com.example.courseplanner.repository.*;
import com.example.courseplanner.service.CourseSysClient;
import com.example.courseplanner.utils.SemesterUtil;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

/**
 * =========================================================
 * GraphController
 *
 * Handles statistical data for graph visualization.
 *
 * Endpoints:
 * 1. /api/graph/grade-distribution?courseId={}
 *    - Returns CourseDiggers grade data (static)
 *    - Used for Chart C: Grade Distribution bar chart
 *
 * 2. /api/graph/enrollment-history?deptId={}&courseId={}&range=5yr
 *    - Returns time-series enrollment data (dynamic CourseSys API)
 *    - Used for Chart A: Load Over Time
 *    - Used for Chart B: Enrollment vs Capacity
 *
 * =========================================================
 */
@RestController
@RequestMapping("/api/graph")
public class GraphController {

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final TermRepository termRepository;
    private final CourseDiggerStatsRepository courseDiggerStatsRepository;
    private final CourseSysClient courseSysClient;

    public GraphController(
        CourseRepository courseRepository,
        DepartmentRepository departmentRepository,
        TermRepository termRepository,
        CourseDiggerStatsRepository courseDiggerStatsRepository,
        CourseSysClient courseSysClient
    ) {
        this.courseRepository = courseRepository;
        this.departmentRepository = departmentRepository;
        this.termRepository = termRepository;
        this.courseDiggerStatsRepository = courseDiggerStatsRepository;
        this.courseSysClient = courseSysClient;
    }

    // =====================================================
    // ENDPOINT 1: GET /api/graph/grade-distribution
    //
    // Returns grade distribution data from CourseDiggers
    // Used for Chart C (static bar chart)
    //
    // Query params:
    // - courseId: Course to get grades for
    //
    // Returns: ApiGradeDistributionDTO
    // =====================================================
    @GetMapping("/grade-distribution")
    public ResponseEntity<ApiGradeDistributionDTO> getGradeDistribution(
        @RequestParam Long courseId
    ) {
        // 1. Validate course exists and fetch with department
        Course course = courseRepository.findByIdWithDepartment(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Course not found"));

        // 2. Fetch CourseDiggers stats
        CourseDiggerStats stats = courseDiggerStatsRepository
                .findByCourseCourseId(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, 
                        "Grade distribution not available for this course"));

        // 3. Extract department and course info
        String deptCode = course.getDepartment().getDeptCode();
        String courseNumber = course.getCourseNumber();
        String title = course.getTitle();

        // 4. Extract grade stats
        String medianGrade = stats.getMedianGrade();
        Double failRate = stats.getFailRate();

        // 5. Convert grade distribution Map<String, Object> to Map<String, Long>
        Map<String, Long> distribution = new HashMap<>();
        
        if (stats.getGradeDistribution() != null) {
            for (Map.Entry<String, Object> entry : stats.getGradeDistribution().entrySet()) {
                String grade = entry.getKey();
                Object value = entry.getValue();
                
                // Skip non-grade keys (like "Median Grade", "Fail Rate")
                if (grade.matches("^[A-F][+-]?$") || grade.equals("F")) {
                    if (value instanceof Number) {
                        distribution.put(grade, ((Number) value).longValue());
                    }
                }
            }
        }

        // 6. Build and return DTO
        ApiGradeDistributionDTO dto = new ApiGradeDistributionDTO(
            deptCode,
            courseNumber,
            title,
            medianGrade,
            failRate,
            distribution
        );

        return ResponseEntity.ok(dto);
    }

    // =====================================================
    // ENDPOINT 2: GET /api/graph/enrollment-history
    //
    // Returns time-series enrollment data for a course
    // Fetches live data from CourseSys API
    // Used for Charts A & B
    //
    // Query params:
    // - deptId: Department ID
    // - courseId: Course ID
    // - range: Time range ("1yr", "3yr", "5yr")
    //
    // Returns: List<ApiEnrollmentDataPointDTO>
    // =====================================================
    @GetMapping("/enrollment-history")
    public ResponseEntity<List<ApiEnrollmentDataPointDTO>> getEnrollmentHistory(
        @RequestParam Long deptId,
        @RequestParam Long courseId,
        @RequestParam(defaultValue = "5yr") String range
    ) {
        // 1. Validate course
        Course course = courseRepository.findByIdWithDepartment(courseId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        String dept = course.getDepartment().getDeptCode();   // CMPT
        String number = course.getCourseNumber();             // 276

        // 2. Get enrolling term (optional)
        Optional<Term> enrollingOpt = termRepository.findByIsEnrollingTrue();

        long year;
        String term;
        long semesterCode;

        if (enrollingOpt.isPresent()) {
            Term enrolling = enrollingOpt.get();
            year = enrolling.getYear();        // 2026
            term = enrolling.getTerm();        // spring
            semesterCode = SemesterUtil.buildSemesterCode(year, term);
        } else {
            // fallback to current term or latest known term
            Term current = termRepository.findByIsCurrentTrue()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.INTERNAL_SERVER_ERROR, "No term data"));

            year = current.getYear();
            term = current.getTerm();
            semesterCode = SemesterUtil.buildSemesterCode(year, term);
        }

        List<ApiEnrollmentDataPointDTO> results = new ArrayList<>();
        int numSemesters = parseSemesterRange(range);

        // 3. Iterate backwards for num_semesters based on range
        for (int i = 0; i < numSemesters; i++) {

            CourseSysBrowseResult browse =
                    courseSysClient.fetchCourseSections(dept, number, semesterCode);

            // Calculate total enrolled and capacity across all offerings for same semester
            int totalEnrolled = 0;
            int totalCapacity = 0;
            for (CourseSysOffering offering : browse.getOfferings()) {                       
                // @TODO: only consider lecture sections (includes D, SEM, LAB?, etc)
                totalCapacity += offering.getCapacityCount();
                totalEnrolled += offering.getEnrolledCount();
            }
            
            // Always add data point (even if 0) to show gaps when course wasn't offered
            ApiEnrollmentDataPointDTO dto = new ApiEnrollmentDataPointDTO(
                        semesterCode,
                        capitalize(term),  // ← Capitalize for frontend
                        year,
                        totalEnrolled,
                        totalCapacity,
                        totalCapacity == 0 ? 0.0 : (totalEnrolled * 100.0) / totalCapacity
            );
            results.add(dto);

            // move to previous semester
            SemesterUtil.Prev prev = SemesterUtil.previous(year, term);
            year = prev.year();
            term = prev.term();
            semesterCode = prev.semesterCode();
        }

        // Reverse to get chronological order (oldest → newest)
        Collections.reverse(results);        
        return ResponseEntity.ok(results);
    }

    // Helper to parse range string into number of semesters
    private int parseSemesterRange(String range) {
        switch (range) {
            case "1yr":
                return 3;   
            case "3yr":
                return 9;   
            case "5yr":
            default:
                return 15; 
        }
    }

    // Helper to capitalize first letter
    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}