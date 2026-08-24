package com.example.courseplanner.controller;

import com.example.courseplanner.dto.ApiCourseDTO;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BrowseController.class)
@Import(GlobalExceptionHandler.class)
class BrowseControllerTest {

    private static final long DEPT_ID = 14L;
    private static final long COURSE_ID = 3998L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DepartmentRepository departmentRepository;

    @MockBean
    private CourseRepository courseRepository;

    @MockBean
    private TermRepository termRepository;

    @MockBean
    private CourseSysClient courseSysClient;

    @MockBean
    private CourseDiggerStatsRepository courseDiggerStatsRepository;

    @Test
    void listsDepartmentsInCaseInsensitiveCodeOrder() throws Exception {
        Department math = department(3L, "MATH", "Mathematics");
        Department cmpt = department(DEPT_ID, "CMPT", "Computing Science");
        when(departmentRepository.findAll()).thenReturn(List.of(math, cmpt));

        mockMvc.perform(get("/api/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].deptCode").value("CMPT"))
                .andExpect(jsonPath("$[1].deptCode").value("MATH"));
    }

    @Test
    void listsCoursesForAnExistingDepartment() throws Exception {
        ApiCourseDTO course = new ApiCourseDTO(COURSE_ID, DEPT_ID, "276", "Software Engineering",
                "Description", 3L, "undergraduate", null, null, null);
        when(departmentRepository.existsById(DEPT_ID)).thenReturn(true);
        when(courseRepository.findByDeptId(DEPT_ID)).thenReturn(List.of(course));

        mockMvc.perform(get("/api/departments/{deptId}/courses", DEPT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].courseId").value(COURSE_ID))
                .andExpect(jsonPath("$[0].courseNumber").value("276"));
    }

    @Test
    void rejectsUnknownDepartmentsWhenListingCourses() throws Exception {
        when(departmentRepository.existsById(DEPT_ID)).thenReturn(false);

        mockMvc.perform(get("/api/departments/{deptId}/courses", DEPT_ID))
                .andExpect(status().isNotFound());

        verifyNoInteractions(courseRepository);
    }

    @Test
    void listsTwelveTermsOfOfferingsStartingWithTheEnrollingTerm() throws Exception {
        Course course = course(DEPT_ID, "CMPT", "276");
        Term enrolling = new Term(2026, "summer");
        CourseSysBrowseResult firstResult = courseSysResult(1264L, 2026L, "summer", List.of(offering("D100")));
        CourseSysBrowseResult emptyResult = courseSysResult(0L, 0L, null, List.of());
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course));
        when(termRepository.findByIsEnrollingTrue()).thenReturn(Optional.of(enrolling));
        when(courseSysClient.fetchCourseSections(eq("CMPT"), eq("276"), anyLong()))
                .thenAnswer(invocation -> invocation.getArgument(2, Long.class) == 1264L ? firstResult : emptyResult);

        mockMvc.perform(get("/api/departments/{deptId}/courses/{courseId}/offerings", DEPT_ID, COURSE_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].section").value("D100"))
                .andExpect(jsonPath("$[0].term").value("Summer"))
                .andExpect(jsonPath("$[0].semesterCode").value(1264))
                .andExpect(jsonPath("$[0].isEnrolling").value(true));

        ArgumentCaptor<Long> semesterCaptor = ArgumentCaptor.forClass(Long.class);
        verify(courseSysClient, times(12)).fetchCourseSections(eq("CMPT"), eq("276"), semesterCaptor.capture());
        org.junit.jupiter.api.Assertions.assertEquals(1264L, semesterCaptor.getAllValues().get(0));
    }

    @Test
    void fallsBackToTheCurrentTermWhenNoEnrollingTermExists() throws Exception {
        Course course = course(DEPT_ID, "CMPT", "276");
        Term current = new Term(2025, "fall");
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course));
        when(termRepository.findByIsEnrollingTrue()).thenReturn(Optional.empty());
        when(termRepository.findByIsCurrentTrue()).thenReturn(Optional.of(current));
        when(courseSysClient.fetchCourseSections(eq("CMPT"), eq("276"), anyLong()))
                .thenReturn(courseSysResult(0L, 0L, null, List.of()));

        mockMvc.perform(get("/api/departments/{deptId}/courses/{courseId}/offerings", DEPT_ID, COURSE_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        ArgumentCaptor<Long> semesterCaptor = ArgumentCaptor.forClass(Long.class);
        verify(courseSysClient, times(12)).fetchCourseSections(eq("CMPT"), eq("276"), semesterCaptor.capture());
        org.junit.jupiter.api.Assertions.assertEquals(1257L, semesterCaptor.getAllValues().get(0));
    }

    @Test
    void reportsMissingTermConfiguration() throws Exception {
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course(DEPT_ID, "CMPT", "276")));
        when(termRepository.findByIsEnrollingTrue()).thenReturn(Optional.empty());
        when(termRepository.findByIsCurrentTrue()).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/departments/{deptId}/courses/{courseId}/offerings", DEPT_ID, COURSE_ID))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("No term data"));

        verifyNoInteractions(courseSysClient);
    }

    @Test
    void rejectsCoursesThatDoNotBelongToTheRequestedDepartment() throws Exception {
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course(3L, "MATH", "276")));

        mockMvc.perform(get("/api/departments/{deptId}/courses/{courseId}/offerings", DEPT_ID, COURSE_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Course not found"));

        verifyNoInteractions(termRepository, courseSysClient);
    }

    @Test
    void returnsOfferingDetailWithCourseSysAndCourseDiggersData() throws Exception {
        Department department = department(DEPT_ID, "CMPT", "Computing Science");
        Course course = course(DEPT_ID, "CMPT", "276");
        course.setTitle("Software Engineering");
        course.setDescription("Design and implementation");
        course.setUnits(3L);
        course.setDegreeLevel("undergraduate");
        CourseDiggerStats stats = new CourseDiggerStats();
        stats.setMedianGrade("A-");
        stats.setFailRate(2.5);
        stats.setGradeDistribution(Map.of("A", 45, "B", 30.9, "invalid", "ignored"));
        CourseSysBrowseResult courseSysResult = courseSysResult(1257L, 2025L, "fall", List.of(offering("D100")));
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course));
        when(departmentRepository.findById(DEPT_ID)).thenReturn(Optional.of(department));
        when(courseSysClient.fetchCourseSections("CMPT", "276", 1257L)).thenReturn(courseSysResult);
        when(courseDiggerStatsRepository.findByCourseCourseId(COURSE_ID)).thenReturn(Optional.of(stats));

        mockMvc.perform(get("/api/departments/{deptId}/courses/{courseId}/offerings/{semesterCode}",
                        DEPT_ID, COURSE_ID, 1257L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deptCode").value("CMPT"))
                .andExpect(jsonPath("$.courseNumber").value("276"))
                .andExpect(jsonPath("$.year").value(2025))
                .andExpect(jsonPath("$.term").value("fall"))
                .andExpect(jsonPath("$.campus").value("Burnaby"))
                .andExpect(jsonPath("$.medianGrade").value("A-"))
                .andExpect(jsonPath("$.failRate").value(2.5))
                .andExpect(jsonPath("$.gradeDistribution.A").value(45))
                .andExpect(jsonPath("$.gradeDistribution.B").value(30))
                .andExpect(jsonPath("$.sections[0].isEnrolling").value(false))
                .andExpect(jsonPath("$.outlineUrl").value("https://www.sfu.ca/outlines.html?dept=CMPT&number=276"));
    }

    @Test
    void returnsOfferingDetailWhenCourseDiggersStatsAreUnavailable() throws Exception {
        Department department = department(DEPT_ID, "CMPT", "Computing Science");
        Course course = course(DEPT_ID, "CMPT", "276");
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course));
        when(departmentRepository.findById(DEPT_ID)).thenReturn(Optional.of(department));
        when(courseSysClient.fetchCourseSections("CMPT", "276", 1257L))
                .thenReturn(courseSysResult(1257L, 2025L, "fall", List.of()));
        when(courseDiggerStatsRepository.findByCourseCourseId(COURSE_ID)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/departments/{deptId}/courses/{courseId}/offerings/{semesterCode}",
                        DEPT_ID, COURSE_ID, 1257L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.medianGrade").doesNotExist())
                .andExpect(jsonPath("$.failRate").value(0.0))
                .andExpect(jsonPath("$.sections").isEmpty());
    }

    @Test
    void rejectsMismatchedDepartmentAndCourseForOfferingDetail() throws Exception {
        when(courseRepository.findByIdWithDepartment(COURSE_ID)).thenReturn(Optional.of(course(3L, "MATH", "276")));
        when(departmentRepository.findById(DEPT_ID)).thenReturn(Optional.of(department(DEPT_ID, "CMPT", "Computing Science")));

        mockMvc.perform(get("/api/departments/{deptId}/courses/{courseId}/offerings/{semesterCode}",
                        DEPT_ID, COURSE_ID, 1257L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Course not found"));

        verifyNoInteractions(courseSysClient, courseDiggerStatsRepository);
    }

    private Department department(long id, String code, String name) {
        Department department = new Department(code, name);
        department.setDeptId(id);
        return department;
    }

    private Course course(long deptId, String deptCode, String courseNumber) {
        Course course = new Course(department(deptId, deptCode, deptCode + " Department"), courseNumber);
        course.setCourseId(COURSE_ID);
        return course;
    }

    private CourseSysOffering offering(String section) {
        CourseSysOffering offering = new CourseSysOffering();
        offering.setSection(section);
        offering.setInfoUrl("/browse/info/1257-cmpt-276-d100");
        offering.setCampus("Burnaby");
        offering.setInstructor("Ada Lovelace");
        offering.setEnrolled("96");
        offering.setCapacity("100");
        return offering;
    }

    private CourseSysBrowseResult courseSysResult(
            long semesterCode,
            long year,
            String semester,
            List<CourseSysOffering> offerings
    ) {
        CourseSysBrowseResult result = new CourseSysBrowseResult();
        result.setSemesterCode(semesterCode);
        result.setYear(year);
        result.setSemester(semester);
        result.setOfferings(offerings);
        return result;
    }
}
