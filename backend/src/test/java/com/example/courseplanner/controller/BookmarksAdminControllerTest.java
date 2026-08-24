package com.example.courseplanner.controller;

import com.example.courseplanner.dto.AdminBookmarkMonthDTO;
import com.example.courseplanner.dto.AdminDeptRankingDTO;
import com.example.courseplanner.dto.AdminTopCourseDTO;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.repository.BookmarkRepository;
import com.example.courseplanner.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BookmarksAdminController.class)
@Import(GlobalExceptionHandler.class)
class BookmarksAdminControllerTest {

    private static final String AUTHORIZATION = "Bearer admin-token";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private BookmarkRepository bookmarkRepository;

    @Test
    void returnsBookmarkAnalyticsAndDerivedStatistics() throws Exception {
        when(jdbcTemplate.query(contains("JOIN courses"), org.mockito.ArgumentMatchers.<RowMapper<AdminTopCourseDTO>>any())).thenReturn(List.of(
                new AdminTopCourseDTO("CMPT", "225", "Data Structures", "Computing Science", 12)
        ));
        when(jdbcTemplate.query(contains("GROUP BY d.dept_code, d.name"), org.mockito.ArgumentMatchers.<RowMapper<AdminDeptRankingDTO>>any())).thenReturn(List.of(
                new AdminDeptRankingDTO("CMPT", "Computing Science", 12, 0),
                new AdminDeptRankingDTO("MATH", "Mathematics", 3, 0)
        ));
        when(jdbcTemplate.query(contains("TO_CHAR(created_at"), org.mockito.ArgumentMatchers.<RowMapper<AdminBookmarkMonthDTO>>any())).thenReturn(List.of(
                new AdminBookmarkMonthDTO("2026-07", 4),
                new AdminBookmarkMonthDTO("2026-08", 11)
        ));
        when(bookmarkRepository.count()).thenReturn(15L);
        when(jdbcTemplate.queryForObject(contains("COUNT(DISTINCT user_id)"), eq(Integer.class))).thenReturn(4);
        when(jdbcTemplate.queryForObject(contains("COUNT(DISTINCT course_id)"), eq(Integer.class))).thenReturn(7);

        mockMvc.perform(get("/api/admin/bookmarks").header("Authorization", AUTHORIZATION))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.totalBookmarks").value(15))
                .andExpect(jsonPath("$.stats.avgPerUser").value(3.8))
                .andExpect(jsonPath("$.stats.uniqueCourses").value(7))
                .andExpect(jsonPath("$.stats.topDepartment").value("CMPT"))
                .andExpect(jsonPath("$.departmentRankings[0].percentage").value(80.0))
                .andExpect(jsonPath("$.departmentRankings[1].percentage").value(20.0))
                .andExpect(jsonPath("$.topCourses[0].courseNumber").value("225"))
                .andExpect(jsonPath("$.monthlyGrowth[1].month").value("2026-08"));

        verify(jwtService).verifyAdmin(AUTHORIZATION);
    }

    @Test
    void returnsSafeStatisticsWhenThereAreNoBookmarks() throws Exception {
        when(jdbcTemplate.query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<Object>>any())).thenReturn(List.of());
        when(bookmarkRepository.count()).thenReturn(0L);
        when(jdbcTemplate.queryForObject(contains("COUNT(DISTINCT user_id)"), eq(Integer.class))).thenReturn(null);
        when(jdbcTemplate.queryForObject(contains("COUNT(DISTINCT course_id)"), eq(Integer.class))).thenReturn(null);

        mockMvc.perform(get("/api/admin/bookmarks").header("Authorization", AUTHORIZATION))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.totalBookmarks").value(0))
                .andExpect(jsonPath("$.stats.avgPerUser").value(0.0))
                .andExpect(jsonPath("$.stats.uniqueCourses").value(0))
                .andExpect(jsonPath("$.stats.topDepartment").value("—"))
                .andExpect(jsonPath("$.stats.topDepartmentName").value(""))
                .andExpect(jsonPath("$.topCourses").isEmpty())
                .andExpect(jsonPath("$.departmentRankings").isEmpty())
                .andExpect(jsonPath("$.monthlyGrowth").isEmpty());
    }
}
