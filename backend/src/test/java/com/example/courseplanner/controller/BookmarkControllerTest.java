package com.example.courseplanner.controller;

import com.example.courseplanner.entity.Bookmark;
import com.example.courseplanner.entity.Course;
import com.example.courseplanner.entity.Department;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.model.CourseSysBrowseResult;
import com.example.courseplanner.model.CourseSysOffering;
import com.example.courseplanner.repository.BookmarkRepository;
import com.example.courseplanner.repository.CourseRepository;
import com.example.courseplanner.repository.TermRepository;
import com.example.courseplanner.service.CourseSysClient;
import com.example.courseplanner.service.JwtService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BookmarkController.class)
@Import(GlobalExceptionHandler.class)
class BookmarkControllerTest {

    private static final String AUTH_HEADER = "Bearer user-token";
    private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
    private static final UUID OTHER_USER_ID = UUID.fromString("6ba7b810-9dad-11d1-80b4-00c04fd430c8");

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookmarkRepository bookmarkRepository;

    @MockBean
    private CourseRepository courseRepository;

    @MockBean
    private TermRepository termRepository;

    @MockBean
    private CourseSysClient courseSysClient;

    @MockBean
    private JwtService jwtService;

    @Test
    void listsOnlyTheAuthenticatedUsersBookmarks() throws Exception {
        Bookmark bookmark = bookmark(11L, USER_ID, 14L, 3998L, 1257L, "D100");
        when(jwtService.extractUserId(AUTH_HEADER)).thenReturn(USER_ID.toString());
        when(bookmarkRepository.findAllByUserId(USER_ID)).thenReturn(List.of(bookmark));

        mockMvc.perform(get("/api/bookmarks").header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bookmarkId").value(11))
                .andExpect(jsonPath("$[0].deptId").value(14))
                .andExpect(jsonPath("$[0].courseId").value(3998))
                .andExpect(jsonPath("$[0].semesterCode").value(1257))
                .andExpect(jsonPath("$[0].section").value("D100"));

        verify(bookmarkRepository).findAllByUserId(USER_ID);
    }

    @Test
    void createsABookmarkForTheAuthenticatedUserAndIgnoresServerOwnedFields() throws Exception {
        Bookmark saved = bookmark(99L, USER_ID, 14L, 3998L, 1257L, "D100");
        when(jwtService.extractUserId(AUTH_HEADER)).thenReturn(USER_ID.toString());
        when(bookmarkRepository.existsByUserIdAndDeptIdAndCourseIdAndSemesterCodeAndSection(
                USER_ID, 14L, 3998L, 1257L, "D100"
        )).thenReturn(false);
        when(bookmarkRepository.save(any(Bookmark.class))).thenReturn(saved);

        mockMvc.perform(post("/api/bookmarks")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "bookmarkId": 12345,
                                  "deptId": 14,
                                  "courseId": 3998,
                                  "semesterCode": 1257,
                                  "section": "D100"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookmarkId").value(99))
                .andExpect(jsonPath("$.section").value("D100"));

        ArgumentCaptor<Bookmark> bookmarkCaptor = ArgumentCaptor.forClass(Bookmark.class);
        verify(bookmarkRepository).save(bookmarkCaptor.capture());
        Bookmark created = bookmarkCaptor.getValue();
        org.junit.jupiter.api.Assertions.assertEquals(USER_ID, created.getUserId());
        org.junit.jupiter.api.Assertions.assertEquals(14L, created.getDeptId());
        org.junit.jupiter.api.Assertions.assertEquals(3998L, created.getCourseId());
        org.junit.jupiter.api.Assertions.assertEquals(1257L, created.getSemesterCode());
        org.junit.jupiter.api.Assertions.assertEquals("D100", created.getSection());
        org.junit.jupiter.api.Assertions.assertNull(created.getBookmarkId());
    }

    @Test
    void rejectsDuplicateBookmarksForTheAuthenticatedUser() throws Exception {
        when(jwtService.extractUserId(AUTH_HEADER)).thenReturn(USER_ID.toString());
        when(bookmarkRepository.existsByUserIdAndDeptIdAndCourseIdAndSemesterCodeAndSection(
                USER_ID, 14L, 3998L, 1257L, "D100"
        )).thenReturn(true);

        mockMvc.perform(post("/api/bookmarks")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookmarkRequestJson()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Bookmark already exists for this offering"));

        verify(bookmarkRepository, never()).save(any());
    }

    @Test
    void deletesABookmarkOwnedByTheAuthenticatedUser() throws Exception {
        Bookmark bookmark = bookmark(11L, USER_ID, 14L, 3998L, 1257L, "D100");
        when(jwtService.extractUserId(AUTH_HEADER)).thenReturn(USER_ID.toString());
        when(bookmarkRepository.findById(11L)).thenReturn(Optional.of(bookmark));

        mockMvc.perform(delete("/api/bookmarks/11").header("Authorization", AUTH_HEADER))
                .andExpect(status().isNoContent());

        verify(bookmarkRepository).delete(bookmark);
    }

    @Test
    void rejectsDeletingABookmarkThatDoesNotExist() throws Exception {
        when(jwtService.extractUserId(AUTH_HEADER)).thenReturn(USER_ID.toString());
        when(bookmarkRepository.findById(11L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/bookmarks/11").header("Authorization", AUTH_HEADER))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Bookmark not found"));

        verify(bookmarkRepository, never()).delete(any());
    }

    @Test
    void rejectsDeletingAnotherUsersBookmark() throws Exception {
        Bookmark bookmark = bookmark(11L, OTHER_USER_ID, 14L, 3998L, 1257L, "D100");
        when(jwtService.extractUserId(AUTH_HEADER)).thenReturn(USER_ID.toString());
        when(bookmarkRepository.findById(11L)).thenReturn(Optional.of(bookmark));

        mockMvc.perform(delete("/api/bookmarks/11").header("Authorization", AUTH_HEADER))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        verify(bookmarkRepository, never()).delete(any());
    }

    @Test
    void returnsNoOfferingsWithoutBookmarksAndDoesNotCallCourseSys() throws Exception {
        when(jwtService.extractUserId(AUTH_HEADER)).thenReturn(USER_ID.toString());
        when(bookmarkRepository.findAllByUserId(USER_ID)).thenReturn(List.of());

        mockMvc.perform(get("/api/bookmarks/offerings").header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        verifyNoInteractions(courseRepository, termRepository, courseSysClient);
    }

    @Test
    void mapsTheMatchingCourseSysOfferingToTheBookmarkResponse() throws Exception {
        Bookmark bookmark = bookmark(11L, USER_ID, 14L, 3998L, 1257L, "D100");
        Department department = new Department("CMPT", "Computing Science");
        Course course = new Course(department, "276");
        CourseSysOffering offering = new CourseSysOffering();
        offering.setSection("D100");
        offering.setInfoUrl("/browse/info/1257-cmpt-276-d100");
        offering.setCampus("Burnaby");
        offering.setInstructor("Ada Lovelace");
        offering.setEnrolled("96");
        offering.setCapacity("100");
        CourseSysBrowseResult browseResult = new CourseSysBrowseResult();
        browseResult.setOfferings(List.of(offering));

        when(jwtService.extractUserId(AUTH_HEADER)).thenReturn(USER_ID.toString());
        when(bookmarkRepository.findAllByUserId(USER_ID)).thenReturn(List.of(bookmark));
        when(termRepository.findByIsEnrollingTrue()).thenReturn(Optional.empty());
        when(courseRepository.findByIdWithDepartment(3998L)).thenReturn(Optional.of(course));
        when(courseSysClient.fetchCourseSections("CMPT", "276", 1257L)).thenReturn(browseResult);

        mockMvc.perform(get("/api/bookmarks/offerings").header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bookmarkId").value(11))
                .andExpect(jsonPath("$[0].deptId").value(14))
                .andExpect(jsonPath("$[0].courseId").value(3998))
                .andExpect(jsonPath("$[0].section").value("D100"))
                .andExpect(jsonPath("$[0].semesterCode").value(1257))
                .andExpect(jsonPath("$[0].isEnrolling").value(false));

        verify(courseSysClient).fetchCourseSections("CMPT", "276", 1257L);
    }

    private Bookmark bookmark(
            Long bookmarkId,
            UUID userId,
            Long deptId,
            Long courseId,
            Long semesterCode,
            String section
    ) {
        Bookmark bookmark = new Bookmark(userId, deptId, courseId, semesterCode, section);
        bookmark.setBookmarkId(bookmarkId);
        return bookmark;
    }

    private String bookmarkRequestJson() {
        return """
                {
                  "deptId": 14,
                  "courseId": 3998,
                  "semesterCode": 1257,
                  "section": "D100"
                }
                """;
    }
}
