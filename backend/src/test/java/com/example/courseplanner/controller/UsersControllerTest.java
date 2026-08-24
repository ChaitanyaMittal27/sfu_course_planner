package com.example.courseplanner.controller;

import com.example.courseplanner.dto.AdminUserDTO;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.repository.BookmarkRepository;
import com.example.courseplanner.repository.BookmarkWithCourseInfo;
import com.example.courseplanner.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UsersController.class)
@Import(GlobalExceptionHandler.class)
class UsersControllerTest {

    private static final String AUTHORIZATION = "Bearer admin-token";
    private static final String USER_ID = "7a7c0f24-8e69-42f7-8a00-46a849f0a978";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private BookmarkRepository bookmarkRepository;

    @Test
    void returnsUsersWithComputedStatistics() throws Exception {
        AdminUserDTO googleUser = user(USER_ID, "google@example.com", "google", Instant.now().minusSeconds(3600), true, 2);
        AdminUserDTO emailUser = user("04ebfeee-211e-453e-a4d4-e1580dd5dc4e", "email@example.com", "email", Instant.now().minusSeconds(40L * 24 * 60 * 60), false, 0);
        when(jdbcTemplate.query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<AdminUserDTO>>any()))
                .thenReturn(List.of(googleUser, emailUser));

        mockMvc.perform(get("/api/admin/users").header("Authorization", AUTHORIZATION))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.totalUsers").value(2))
                .andExpect(jsonPath("$.stats.newThisMonth").value(2))
                .andExpect(jsonPath("$.stats.optedInNotifications").value(1))
                .andExpect(jsonPath("$.stats.activeInLast30Days").value(1))
                .andExpect(jsonPath("$.stats.providerGoogle").value(1))
                .andExpect(jsonPath("$.stats.providerEmail").value(1))
                .andExpect(jsonPath("$.users[0].email").value("google@example.com"))
                .andExpect(jsonPath("$.users[0].bookmarkCount").value(2));

        verify(jwtService).verifyAdmin(AUTHORIZATION);
    }

    @Test
    void returnsUserAndTheirBookmarks() throws Exception {
        AdminUserDTO user = user(USER_ID, "student@example.com", "azure", Instant.now(), false, 1);
        BookmarkWithCourseInfo bookmark = bookmark(42L, "CMPT", "225", "Data Structures", "D100", 1257L);
        when(jdbcTemplate.query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<AdminUserDTO>>any(), eq(USER_ID)))
                .thenReturn(List.of(user));
        when(bookmarkRepository.findAllByUserIdsWithCourseInfo(new String[]{USER_ID})).thenReturn(List.of(bookmark));

        mockMvc.perform(get("/api/admin/users/{id}", USER_ID).header("Authorization", AUTHORIZATION))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value(USER_ID))
                .andExpect(jsonPath("$.user.provider").value("azure"))
                .andExpect(jsonPath("$.bookmarks[0].bookmarkId").value(42))
                .andExpect(jsonPath("$.bookmarks[0].deptCode").value("CMPT"))
                .andExpect(jsonPath("$.bookmarks[0].semesterCode").value(1257));
    }

    @Test
    void rejectsMalformedUserIdsBeforeQueryingData() throws Exception {
        mockMvc.perform(get("/api/admin/users/not-a-uuid").header("Authorization", AUTHORIZATION))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid user ID"));

        verify(jwtService).verifyAdmin(AUTHORIZATION);
        verifyNoInteractions(jdbcTemplate, bookmarkRepository);
    }

    @Test
    void reportsMissingUsers() throws Exception {
        when(jdbcTemplate.query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<AdminUserDTO>>any(), eq(USER_ID)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/admin/users/{id}", USER_ID).header("Authorization", AUTHORIZATION))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found"));

        verifyNoInteractions(bookmarkRepository);
    }

    private AdminUserDTO user(String id, String email, String provider, Instant lastSignInAt, boolean optedIn, int bookmarkCount) {
        AdminUserDTO user = new AdminUserDTO();
        user.setId(id);
        user.setEmail(email);
        user.setCreatedAt(Instant.now().toString());
        user.setLastSignInAt(lastSignInAt.toString());
        user.setProvider(provider);
        user.setEmailNotificationsEnabled(optedIn);
        user.setBookmarkCount(bookmarkCount);
        return user;
    }

    private BookmarkWithCourseInfo bookmark(Long id, String deptCode, String courseNumber, String title, String section, Long semesterCode) {
        return new BookmarkWithCourseInfo() {
            public Long getBookmarkId() { return id; }
            public String getUserId() { return USER_ID; }
            public Long getDeptId() { return 14L; }
            public Long getCourseId() { return 3998L; }
            public Long getSemesterCode() { return semesterCode; }
            public String getSection() { return section; }
            public String getDeptCode() { return deptCode; }
            public String getCourseNumber() { return courseNumber; }
            public String getTitle() { return title; }
        };
    }
}
