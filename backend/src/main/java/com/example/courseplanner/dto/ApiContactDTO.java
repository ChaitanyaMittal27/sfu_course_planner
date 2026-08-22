package com.example.courseplanner.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Public support contact submission")
public class ApiContactDTO {

    @Schema(description = "Sender name", example = "Jane Doe")
    private String name;
    @Schema(description = "Reply email address", example = "jane@example.com")
    private String email;
    @Schema(description = "Optional message category", example = "Feedback")
    private String reason;
    @Schema(description = "Message body", example = "I found an issue with a course listing.")
    private String message;

    public ApiContactDTO() {}

    public ApiContactDTO(String name, String email, String message) {
        this.name = name;
        this.email = email;
        this.message = message;
    }

    public ApiContactDTO(String name, String email, String reason, String message) {
        this.name = name;
        this.email = email;
        this.reason = reason;
        this.message = message;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
