package com.example.courseplanner.controller;

import com.example.courseplanner.entity.Term;
import com.example.courseplanner.exception.ForbiddenException;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.repository.TermRepository;
import com.example.courseplanner.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TermsController.class)
@Import(GlobalExceptionHandler.class)
class TermsControllerTest {

    private static final String AUTH_HEADER = "Bearer admin-token";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private TermRepository termRepository;

    @Test
    void listsTermsInDescendingChronologicalOrderForAdmins() throws Exception {
        Term fall2025 = term(1L, 2025, "fall", true, false);
        Term spring2026 = term(2L, 2026, "spring", false, false);
        Term summer2026 = term(3L, 2026, "summer", false, true);
        when(termRepository.findAll()).thenReturn(List.of(fall2025, spring2026, summer2026));

        mockMvc.perform(get("/api/admin/terms").header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].year").value(2026))
                .andExpect(jsonPath("$[0].term").value("summer"))
                .andExpect(jsonPath("$[0].isEnrolling").value(true))
                .andExpect(jsonPath("$[1].term").value("spring"))
                .andExpect(jsonPath("$[2].year").value(2025))
                .andExpect(jsonPath("$[2].isCurrent").value(true));

        verify(jwtService).verifyAdmin(AUTH_HEADER);
    }

    @Test
    void updatesExistingCurrentAndEnrollingTerms() throws Exception {
        Term oldCurrent = term(1L, 2025, "fall", true, false);
        Term current = term(2L, 2026, "spring", false, false);
        Term enrolling = term(3L, 2026, "summer", false, false);
        List<Term> terms = List.of(oldCurrent, current, enrolling);
        when(termRepository.findAll()).thenReturn(terms);
        when(termRepository.findByYearAndTerm(2026, "spring")).thenReturn(Optional.of(current));
        when(termRepository.findByYearAndTerm(2026, "summer")).thenReturn(Optional.of(enrolling));

        mockMvc.perform(put("/api/admin/terms")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequestJson(2026, "spring", 2026, "summer")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].term").value("summer"))
                .andExpect(jsonPath("$[0].isEnrolling").value(true))
                .andExpect(jsonPath("$[1].term").value("spring"))
                .andExpect(jsonPath("$[1].isCurrent").value(true));

        verify(termRepository).saveAll(terms);
        verify(termRepository).save(current);
        verify(termRepository).save(enrolling);
        org.junit.jupiter.api.Assertions.assertFalse(oldCurrent.getIsCurrent());
        org.junit.jupiter.api.Assertions.assertFalse(oldCurrent.getIsEnrolling());
        org.junit.jupiter.api.Assertions.assertTrue(current.getIsCurrent());
        org.junit.jupiter.api.Assertions.assertFalse(current.getIsEnrolling());
        org.junit.jupiter.api.Assertions.assertFalse(enrolling.getIsCurrent());
        org.junit.jupiter.api.Assertions.assertTrue(enrolling.getIsEnrolling());
    }

    @Test
    void createsMissingSelectedTerms() throws Exception {
        List<Term> terms = new ArrayList<>(List.of(term(1L, 2025, "fall", true, false)));
        when(termRepository.findAll()).thenReturn(terms);
        when(termRepository.findByYearAndTerm(2026, "spring")).thenReturn(Optional.empty());
        when(termRepository.findByYearAndTerm(2026, "summer")).thenReturn(Optional.empty());
        when(termRepository.save(any(Term.class))).thenAnswer(invocation -> {
            Term saved = invocation.getArgument(0);
            if (saved.getTermId() == null) {
                saved.setTermId((long) (terms.size() + 1));
                terms.add(saved);
            }
            return saved;
        });

        mockMvc.perform(put("/api/admin/terms")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequestJson(2026, "spring", 2026, "summer")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].term").value("summer"))
                .andExpect(jsonPath("$[1].term").value("spring"));

        verify(termRepository, times(2)).save(any(Term.class));
        org.junit.jupiter.api.Assertions.assertEquals(3, terms.size());
    }

    @Test
    void acceptsCaseInsensitiveTermsAndUsesCanonicalLowercaseValues() throws Exception {
        Term current = term(2L, 2026, "spring", false, false);
        Term enrolling = term(3L, 2026, "summer", false, false);
        when(termRepository.findAll()).thenReturn(List.of(current, enrolling));
        when(termRepository.findByYearAndTerm(2026, "spring")).thenReturn(Optional.of(current));
        when(termRepository.findByYearAndTerm(2026, "summer")).thenReturn(Optional.of(enrolling));

        mockMvc.perform(put("/api/admin/terms")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequestJson(2026, "SPRING", 2026, "Summer")))
                .andExpect(status().isOk());

        verify(termRepository).findByYearAndTerm(2026, "spring");
        verify(termRepository).findByYearAndTerm(2026, "summer");
    }

    @Test
    void rejectsInvalidTermUpdateRequests() throws Exception {
        mockMvc.perform(put("/api/admin/terms")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentYear\":2026}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("All fields are required"));

        mockMvc.perform(put("/api/admin/terms")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{" + "\"currentYear\":2026," + "\"currentTerm\":\"winter\"," +
                                "\"enrollingYear\":2026," + "\"enrollingTerm\":\"summer\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Term must be spring, summer, or fall"));

        mockMvc.perform(put("/api/admin/terms")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequestJson(2026, "spring", 2026, "spring")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current and enrolling cannot be the same term"));

        mockMvc.perform(put("/api/admin/terms")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequestJson(2026, "summer", 2026, "spring")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Enrolling term must be after current term"));

        verify(termRepository, never()).saveAll(any());
    }

    @Test
    void rejectsNonAdmins() throws Exception {
        doThrow(new ForbiddenException("Access denied: not an admin"))
                .when(jwtService).verifyAdmin(AUTH_HEADER);

        mockMvc.perform(get("/api/admin/terms").header("Authorization", AUTH_HEADER))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        verifyNoInteractions(termRepository);
    }

    private Term term(Long id, int year, String term, boolean current, boolean enrolling) {
        Term value = new Term(year, term);
        value.setTermId(id);
        value.setIsCurrent(current);
        value.setIsEnrolling(enrolling);
        return value;
    }

    private String updateRequestJson(int currentYear, String currentTerm, int enrollingYear, String enrollingTerm) {
        return String.format("""
                {
                  "currentYear": %d,
                  "currentTerm": "%s",
                  "enrollingYear": %d,
                  "enrollingTerm": "%s"
                }
                """, currentYear, currentTerm, enrollingYear, enrollingTerm);
    }
}
