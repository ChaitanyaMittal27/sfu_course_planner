package com.example.courseplanner.controller;

import com.example.courseplanner.entity.Course;
import com.example.courseplanner.entity.CourseDiggerStats;
import com.example.courseplanner.entity.Department;
import com.example.courseplanner.entity.Term;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.model.CourseSysBrowseResult;
import com.example.courseplanner.model.CourseSysOffering;
import com.example.courseplanner.repository.CourseDiggerStatsRepository;
import com.example.courseplanner.repository.CourseRepository;
import com.example.courseplanner.repository.DepartmentRepository;
import com.example.courseplanner.repository.TermRepository;
import com.example.courseplanner.service.CourseSysClient;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GraphController.class)
@Import(GlobalExceptionHandler.class)
class GraphControllerTest {

    private static final long DEPT_ID = 14L;
    private static final long COURSE_ID = 3998L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CourseRepository courseRepository;

    @MockBean
    private DepartmentRepository departmentRepository;

    @MockBean
    private TermRepository termRepository;

    @MockBean
    private CourseDiggerStatsRepository courseDiggerStatsRepository;

    @MockBean
    private CourseSysClient courseSysClient;

    @Test
    void returnsGradeDistributionWithOnlyNumericLetterGrades() throws Exception {
        CourseDiggerStats stats = new CourseDiggerStats();
        stats.setMedianGrade("A-");
        stats.setFailRate(2.5);
        stats.setGradeDistribution(Map.of(
                "A", 45,
                "B+", 30.9,
                "F", 4,
                "Median Grade", "A-",
                "invalid", 7
        ));
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course(DEPT_ID, "CMPT", "276")));
        when(courseDiggerStatsRepository.findByCourseCourseId(COURSE_ID)).thenReturn(Optional.of(stats));

        mockMvc.perform(get("/api/graph/grade-distribution").param("courseId", String.valueOf(COURSE_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deptCode").value("CMPT"))
                .andExpect(jsonPath("$.courseNumber").value("276"))
                .andExpect(jsonPath("$.medianGrade").value("A-"))
                .andExpect(jsonPath("$.failRate").value(2.5))
                .andExpect(jsonPath("$.distribution.A").value(45))
                .andExpect(jsonPath("$.distribution['B+']").value(30))
                .andExpect(jsonPath("$.distribution.F").value(4))
                .andExpect(jsonPath("$.distribution['Median Grade']").doesNotExist())
                .andExpect(jsonPath("$.distribution.invalid").doesNotExist());
    }

    @Test
    void reportsMissingCoursesAndGradeData() throws Exception {
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/graph/grade-distribution").param("courseId", String.valueOf(COURSE_ID)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Course not found"));

        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course(DEPT_ID, "CMPT", "276")));
        when(courseDiggerStatsRepository.findByCourseCourseId(COURSE_ID)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/graph/grade-distribution").param("courseId", String.valueOf(COURSE_ID)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Grade distribution not available for this course"));
    }

    @Test
    void aggregatesAndOrdersOneYearEnrollmentHistory() throws Exception {
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course(DEPT_ID, "CMPT", "276")));
        when(termRepository.findByIsEnrollingTrue()).thenReturn(Optional.empty());
        when(termRepository.findByIsCurrentTrue()).thenReturn(Optional.of(new Term(2025, "fall")));
        when(courseSysClient.fetchCourseSections(eq("CMPT"), eq("276"), anyLong()))
                .thenAnswer(invocation -> switch (invocation.getArgument(2, Long.class).intValue()) {
                    case 1257 -> courseSysResult(List.of(
                            offering("D100", "96 (+4)", "100"),
                            offering("D200", "20", "25")
                    ));
                    case 1251 -> courseSysResult(List.of(offering("D100", "30", "30")));
                    default -> courseSysResult(List.of());
                });

        mockMvc.perform(get("/api/graph/enrollment-history")
                        .param("deptId", String.valueOf(DEPT_ID))
                        .param("courseId", String.valueOf(COURSE_ID))
                        .param("range", "1yr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].semesterCode").value(1251))
                .andExpect(jsonPath("$[0].enrolled").value(30))
                .andExpect(jsonPath("$[1].semesterCode").value(1254))
                .andExpect(jsonPath("$[1].enrolled").value(0))
                .andExpect(jsonPath("$[1].capacity").value(0))
                .andExpect(jsonPath("$[2].semesterCode").value(1257))
                .andExpect(jsonPath("$[2].enrolled").value(120))
                .andExpect(jsonPath("$[2].capacity").value(125))
                .andExpect(jsonPath("$[2].loadPercent").value(96.0));

        ArgumentCaptor<Long> semesterCaptor = ArgumentCaptor.forClass(Long.class);
        verify(courseSysClient, times(3)).fetchCourseSections(eq("CMPT"), eq("276"), semesterCaptor.capture());
        org.junit.jupiter.api.Assertions.assertEquals(List.of(1257L, 1254L, 1251L), semesterCaptor.getAllValues());
    }

    @Test
    void rejectsMismatchedDepartmentAndCourseIds() throws Exception {
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course(3L, "MATH", "276")));

        mockMvc.perform(get("/api/graph/enrollment-history")
                        .param("deptId", String.valueOf(DEPT_ID))
                        .param("courseId", String.valueOf(COURSE_ID))
                        .param("range", "1yr"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Course not found"));

        verifyNoInteractions(termRepository, courseSysClient);
    }

    @Test
    void rejectsUnsupportedHistoryRangesBeforeLookingUpData() throws Exception {
        mockMvc.perform(get("/api/graph/enrollment-history")
                        .param("deptId", String.valueOf(DEPT_ID))
                        .param("courseId", String.valueOf(COURSE_ID))
                        .param("range", "forever"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Range must be 1yr, 3yr, or 5yr"));

        verifyNoInteractions(courseRepository, termRepository, courseSysClient);
    }

    @Test
    void reportsMissingTermConfigurationForEnrollmentHistory() throws Exception {
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course(DEPT_ID, "CMPT", "276")));
        when(termRepository.findByIsEnrollingTrue()).thenReturn(Optional.empty());
        when(termRepository.findByIsCurrentTrue()).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/graph/enrollment-history")
                        .param("deptId", String.valueOf(DEPT_ID))
                        .param("courseId", String.valueOf(COURSE_ID))
                        .param("range", "1yr"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("No term data"));

        verifyNoInteractions(courseSysClient);
    }

    private Course course(long departmentId, String departmentCode, String courseNumber) {
        Department department = new Department(departmentCode, departmentCode + " Department");
        department.setDeptId(departmentId);
        Course course = new Course(department, courseNumber);
        course.setCourseId(COURSE_ID);
        course.setTitle("Software Engineering");
        return course;
    }

    private CourseSysOffering offering(String section, String enrolled, String capacity) {
        CourseSysOffering offering = new CourseSysOffering();
        offering.setSection(section);
        offering.setEnrolled(enrolled);
        offering.setCapacity(capacity);
        return offering;
    }

    private CourseSysBrowseResult courseSysResult(List<CourseSysOffering> offerings) {
        CourseSysBrowseResult result = new CourseSysBrowseResult();
        result.setOfferings(offerings);
        return result;
    }
}
