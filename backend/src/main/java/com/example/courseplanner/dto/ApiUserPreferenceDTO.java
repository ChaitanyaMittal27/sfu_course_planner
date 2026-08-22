package com.example.courseplanner.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * =========================================================
 * API USER PREFERENCE DTO
 * 
 * Simple DTO for transferring email notification preference.
 * 
 * Used by:
 * - GET /api/preferences/email-notifications
 * - PUT /api/preferences/email-notifications
 * 
 * JSON Format:
 * {
 *   "emailNotificationsEnabled": true
 * }
 * =========================================================
 */
@Schema(description = "The current user's email notification settings")
public class ApiUserPreferenceDTO {

    @Schema(description = "Whether enrollment notification emails are enabled", example = "true")
    private Boolean emailNotificationsEnabled;
    @Schema(description = "Optional preferred email address", example = "student@example.com")
    private String userEmail;

    public ApiUserPreferenceDTO() {
        // Default constructor
    }

    public ApiUserPreferenceDTO(Boolean emailNotificationsEnabled) {
        this.emailNotificationsEnabled = emailNotificationsEnabled;
    }

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public Boolean getEmailNotificationsEnabled() {
        return emailNotificationsEnabled;
    }

    public void setEmailNotificationsEnabled(Boolean emailNotificationsEnabled) {
        this.emailNotificationsEnabled = emailNotificationsEnabled;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
}
