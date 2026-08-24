package com.example.courseplanner.controller;

import com.example.courseplanner.entity.ContactSubmission;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.repository.ContactSubmissionRepository;
import com.example.courseplanner.service.EmailService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ContactController.class)
@Import(GlobalExceptionHandler.class)
class ContactControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EmailService emailService;

    @MockBean
    private ContactSubmissionRepository contactSubmissionRepository;

    @Test
    void persistsAndForwardsAValidContactSubmission() throws Exception {
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Jane Doe",
                                  "email": "jane@example.com",
                                  "reason": "Feedback",
                                  "message": "The planner is useful."
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("sent"));

        verify(emailService).sendContactFormEmail(
                "Jane Doe", "jane@example.com", "Feedback: The planner is useful."
        );
        ArgumentCaptor<ContactSubmission> submissionCaptor = ArgumentCaptor.forClass(ContactSubmission.class);
        verify(contactSubmissionRepository).save(submissionCaptor.capture());
        ContactSubmission submission = submissionCaptor.getValue();
        org.junit.jupiter.api.Assertions.assertEquals("Jane Doe", submission.getName());
        org.junit.jupiter.api.Assertions.assertEquals("jane@example.com", submission.getEmail());
        org.junit.jupiter.api.Assertions.assertEquals("Feedback", submission.getReason());
        org.junit.jupiter.api.Assertions.assertEquals("The planner is useful.", submission.getMessage());
    }

    @Test
    void forwardsTheMessageWithoutAPrefixWhenReasonIsOmitted() throws Exception {
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Jane Doe",
                                  "email": "jane@example.com",
                                  "message": "The planner is useful."
                                }
                                """))
                .andExpect(status().isCreated());

        verify(emailService).sendContactFormEmail(
                "Jane Doe", "jane@example.com", "The planner is useful."
        );
    }

    @Test
    void rejectsMissingRequiredContactFieldsWithoutSideEffects() throws Exception {
        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"jane@example.com\",\"message\":\"Hello\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Name is required"));

        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Jane\",\"message\":\"Hello\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is required"));

        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Jane\",\"email\":\"jane@example.com\",\"message\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Message is required"));

        verify(emailService, never()).sendContactFormEmail(any(), any(), any());
        verify(contactSubmissionRepository, never()).save(any());
    }
}
