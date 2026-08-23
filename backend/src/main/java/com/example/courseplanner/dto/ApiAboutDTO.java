/**
 * Data Transfer Object (DTO) for providing information about the application.
 * Contains metadata such as the application name and the author's name.
 * Used in the `/api/about` endpoint response.
 */


package com.example.courseplanner.dto;

public class ApiAboutDTO {
    public String appName;
    public String authorName;

    public ApiAboutDTO(String appName, String authorName) {
        this.appName = appName;
        this.authorName = authorName;
    }

    public String getAppName() {
        return appName;
    }

    public void setAppName(String appName) {
        this.appName = appName;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }
}
