package com.example.courseplanner.controller;

import com.example.courseplanner.entity.Term;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.repository.TermRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AboutController.class)
@Import(GlobalExceptionHandler.class)
class AboutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TermRepository termRepository;

    @Test
    void returnsApplicationMetadata() throws Exception {
        mockMvc.perform(get("/api/about"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appName").value("CoursePlanner"))
                .andExpect(jsonPath("$.authorName").value("Anonymouse"));
    }

    @Test
    void returnsTheConfiguredEnrollingTermAndSemesterCode() throws Exception {
        when(termRepository.findByIsEnrollingTrue()).thenReturn(Optional.of(new Term(2026, "fall")));

        mockMvc.perform(get("/api/terms/enrolling"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.year").value(2026))
                .andExpect(jsonPath("$.term").value("fall"))
                .andExpect(jsonPath("$.semesterCode").value(1267));
    }

    @Test
    void reportsMissingEnrollingTermConfiguration() throws Exception {
        when(termRepository.findByIsEnrollingTrue()).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/terms/enrolling"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No enrolling term found"));
    }
}
