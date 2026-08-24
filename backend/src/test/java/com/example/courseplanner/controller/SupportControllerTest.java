package com.example.courseplanner.controller;

import com.example.courseplanner.entity.ContactSubmission;
import com.example.courseplanner.exception.ForbiddenException;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.repository.ContactSubmissionRepository;
import com.example.courseplanner.service.EmailService;
import com.example.courseplanner.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SupportController.class)
@Import(GlobalExceptionHandler.class)
class SupportControllerTest {

    private static final String AUTH_HEADER = "Bearer admin-token";
    private static final UUID SUBMISSION_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private ContactSubmissionRepository contactSubmissionRepository;

    @MockBean
    private EmailService emailService;

    @Test
    void listsActiveSubmissionsAndCurrentStats() throws Exception {
        ContactSubmission submission = submission(false, false, false);
        when(contactSubmissionRepository.findAllByIsArchivedFalseOrderBySubmittedAtDesc()).thenReturn(List.of(submission));
        when(contactSubmissionRepository.count()).thenReturn(4L);
        when(contactSubmissionRepository.countByIsReadFalseAndIsArchivedFalse()).thenReturn(2L);
        when(contactSubmissionRepository.findAllByIsArchivedTrueOrderBySubmittedAtDesc()).thenReturn(List.of(submission(true, false, false)));

        mockMvc.perform(get("/api/admin/support/submissions").header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.totalSubmissions").value(4))
                .andExpect(jsonPath("$.stats.unreadCount").value(2))
                .andExpect(jsonPath("$.stats.archivedCount").value(1))
                .andExpect(jsonPath("$.submissions[0].id").value(SUBMISSION_ID.toString()))
                .andExpect(jsonPath("$.submissions[0].isArchived").value(false));

        verify(jwtService).verifyAdmin(AUTH_HEADER);
    }

    @Test
    void usesTheRequestedSupportFilter() throws Exception {
        configureEmptyStats();
        when(contactSubmissionRepository.findAllByIsRepliedFalseAndIsArchivedFalseOrderByIsReadAscSubmittedAtDesc())
                .thenReturn(List.of());

        mockMvc.perform(get("/api/admin/support/submissions")
                        .header("Authorization", AUTH_HEADER)
                        .param("filter", "unresolved"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submissions").isEmpty());

        configureEmptyStats();
        when(contactSubmissionRepository.findAllByIsArchivedTrueOrderBySubmittedAtDesc()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/support/submissions")
                        .header("Authorization", AUTH_HEADER)
                        .param("filter", "archived"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submissions").isEmpty());
    }

    @Test
    void marksAnExistingSubmissionAsRead() throws Exception {
        ContactSubmission submission = submission(false, false, false);
        when(contactSubmissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));

        mockMvc.perform(patch("/api/admin/support/submissions/{id}/read", SUBMISSION_ID)
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead").value(true));

        org.junit.jupiter.api.Assertions.assertTrue(submission.getIsRead());
        verify(contactSubmissionRepository).save(submission);
    }

    @Test
    void togglesArchiveStateForAnExistingSubmission() throws Exception {
        ContactSubmission submission = submission(false, false, false);
        when(contactSubmissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));

        mockMvc.perform(patch("/api/admin/support/submissions/{id}/archive", SUBMISSION_ID)
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isArchived").value(true));

        org.junit.jupiter.api.Assertions.assertTrue(submission.getIsArchived());
        verify(contactSubmissionRepository).save(submission);
    }

    @Test
    void returnsNotFoundForUnknownSupportSubmissions() throws Exception {
        when(contactSubmissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/admin/support/submissions/{id}/read", SUBMISSION_ID)
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Submission not found"));

        verify(contactSubmissionRepository, never()).save(any());
    }

    @Test
    void rejectsBlankRepliesWithoutSendingOrSaving() throws Exception {
        mockMvc.perform(post("/api/admin/support/submissions/{id}/reply", SUBMISSION_ID)
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Reply message is required"));

        verifyNoInteractions(contactSubmissionRepository, emailService);
    }

    @Test
    void sendsAReplyRequestAndMarksTheSubmissionAsReplied() throws Exception {
        ContactSubmission submission = submission(false, false, false);
        when(contactSubmissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));

        mockMvc.perform(post("/api/admin/support/submissions/{id}/reply", SUBMISSION_ID)
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Thanks for your report.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead").value(true))
                .andExpect(jsonPath("$.isReplied").value(true))
                .andExpect(jsonPath("$.replyMessage").value("Thanks for your report."))
                .andExpect(jsonPath("$.replySentTo").value("jane@example.com"))
                .andExpect(jsonPath("$.repliedAt").exists());

        verify(emailService).sendSupportReply(
                "jane@example.com", "Jane Doe", "Thanks for your report."
        );
        verify(contactSubmissionRepository).save(submission);
        org.junit.jupiter.api.Assertions.assertTrue(submission.getIsRead());
        org.junit.jupiter.api.Assertions.assertTrue(submission.getIsReplied());
        org.junit.jupiter.api.Assertions.assertEquals("jane@example.com", submission.getReplySentTo());
        org.junit.jupiter.api.Assertions.assertNotNull(submission.getRepliedAt());
    }

    @Test
    void rejectsNonAdminsBeforeReadingSupportData() throws Exception {
        doThrow(new ForbiddenException("Access denied: not an admin"))
                .when(jwtService).verifyAdmin(AUTH_HEADER);

        mockMvc.perform(get("/api/admin/support/submissions").header("Authorization", AUTH_HEADER))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        verifyNoInteractions(contactSubmissionRepository, emailService);
    }

    private void configureEmptyStats() {
        when(contactSubmissionRepository.count()).thenReturn(0L);
        when(contactSubmissionRepository.countByIsReadFalseAndIsArchivedFalse()).thenReturn(0L);
        when(contactSubmissionRepository.findAllByIsArchivedTrueOrderBySubmittedAtDesc()).thenReturn(List.of());
    }

    private ContactSubmission submission(boolean archived, boolean read, boolean replied) {
        ContactSubmission submission = new ContactSubmission();
        submission.setId(SUBMISSION_ID);
        submission.setName("Jane Doe");
        submission.setEmail("jane@example.com");
        submission.setReason("Feedback");
        submission.setMessage("The planner is useful.");
        submission.setIsArchived(archived);
        submission.setIsRead(read);
        submission.setIsReplied(replied);
        submission.setSubmittedAt(Instant.parse("2026-08-23T12:00:00Z"));
        return submission;
    }
}
