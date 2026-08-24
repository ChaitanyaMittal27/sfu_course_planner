package com.example.courseplanner.controller;

import com.example.courseplanner.entity.UserPreference;
import com.example.courseplanner.exception.GlobalExceptionHandler;
import com.example.courseplanner.repository.UserPreferenceRepository;
import com.example.courseplanner.service.JwtService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserPreferenceController.class)
@Import(GlobalExceptionHandler.class)
class UserPreferenceControllerTest {

    private static final String AUTH_HEADER = "Bearer user-token";
    private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserPreferenceRepository userPreferenceRepository;

    @MockBean
    private JwtService jwtService;

    @Test
    void initializesPreferencesDisabledByDefault() throws Exception {
        authenticatedUser();
        when(userPreferenceRepository.existsById(USER_ID)).thenReturn(false);

        mockMvc.perform(post("/api/preferences")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userEmail": "student@sfu.ca",
                                  "emailNotificationsEnabled": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.emailNotificationsEnabled").value(false))
                .andExpect(jsonPath("$.userEmail").value("student@sfu.ca"));

        ArgumentCaptor<UserPreference> preferenceCaptor = ArgumentCaptor.forClass(UserPreference.class);
        verify(userPreferenceRepository).save(preferenceCaptor.capture());
        UserPreference created = preferenceCaptor.getValue();
        org.junit.jupiter.api.Assertions.assertEquals(USER_ID, created.getUserId());
        org.junit.jupiter.api.Assertions.assertFalse(created.getEmailNotificationsEnabled());
        org.junit.jupiter.api.Assertions.assertEquals("student@sfu.ca", created.getUserEmail());
    }

    @Test
    void returnsExistingPreferencesWithoutOverwritingThemDuringInitialization() throws Exception {
        UserPreference existing = preference(true, "preferred@sfu.ca");
        authenticatedUser();
        when(userPreferenceRepository.existsById(USER_ID)).thenReturn(true);
        when(userPreferenceRepository.findById(USER_ID)).thenReturn(Optional.of(existing));

        mockMvc.perform(post("/api/preferences")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userEmail\":\"other@sfu.ca\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailNotificationsEnabled").value(true))
                .andExpect(jsonPath("$.userEmail").value("preferred@sfu.ca"));

        verify(userPreferenceRepository, never()).save(any());
    }

    @Test
    void returnsSavedPreferencesForTheAuthenticatedUser() throws Exception {
        authenticatedUser();
        when(userPreferenceRepository.findById(USER_ID))
                .thenReturn(Optional.of(preference(true, "preferred@sfu.ca")));

        mockMvc.perform(get("/api/preferences/email-notifications")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailNotificationsEnabled").value(true))
                .andExpect(jsonPath("$.userEmail").value("preferred@sfu.ca"));

        verify(userPreferenceRepository).findById(USER_ID);
    }

    @Test
    void returnsDisabledDefaultsWhenPreferencesDoNotExistYet() throws Exception {
        authenticatedUser();
        when(userPreferenceRepository.findById(USER_ID)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/preferences/email-notifications")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailNotificationsEnabled").value(false))
                .andExpect(jsonPath("$.userEmail").doesNotExist());
    }

    @Test
    void updatesNotificationsWithoutClearingTheExistingEmail() throws Exception {
        UserPreference existing = preference(false, "preferred@sfu.ca");
        authenticatedUser();
        when(userPreferenceRepository.findById(USER_ID)).thenReturn(Optional.of(existing));
        when(userPreferenceRepository.save(any(UserPreference.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/preferences/email-notifications")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"emailNotificationsEnabled\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailNotificationsEnabled").value(true))
                .andExpect(jsonPath("$.userEmail").value("preferred@sfu.ca"));

        verify(userPreferenceRepository).save(existing);
    }

    @Test
    void updatesThePreferredEmailWhenItIsProvided() throws Exception {
        UserPreference existing = preference(true, "old@sfu.ca");
        authenticatedUser();
        when(userPreferenceRepository.findById(USER_ID)).thenReturn(Optional.of(existing));
        when(userPreferenceRepository.save(any(UserPreference.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/preferences/email-notifications")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userEmail\":\"new@sfu.ca\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailNotificationsEnabled").value(true))
                .andExpect(jsonPath("$.userEmail").value("new@sfu.ca"));
    }

    @Test
    void createsPreferencesWhenUpdatingBeforeInitialization() throws Exception {
        authenticatedUser();
        when(userPreferenceRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(userPreferenceRepository.save(any(UserPreference.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/preferences/email-notifications")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "emailNotificationsEnabled": true,
                                  "userEmail": "student@sfu.ca"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailNotificationsEnabled").value(true))
                .andExpect(jsonPath("$.userEmail").value("student@sfu.ca"));

        ArgumentCaptor<UserPreference> preferenceCaptor = ArgumentCaptor.forClass(UserPreference.class);
        verify(userPreferenceRepository).save(preferenceCaptor.capture());
        org.junit.jupiter.api.Assertions.assertEquals(USER_ID, preferenceCaptor.getValue().getUserId());
    }

    private void authenticatedUser() {
        when(jwtService.extractUserId(AUTH_HEADER)).thenReturn(USER_ID.toString());
    }

    private UserPreference preference(boolean emailNotificationsEnabled, String userEmail) {
        UserPreference preference = new UserPreference(USER_ID, emailNotificationsEnabled);
        preference.setUserEmail(userEmail);
        return preference;
    }
}
