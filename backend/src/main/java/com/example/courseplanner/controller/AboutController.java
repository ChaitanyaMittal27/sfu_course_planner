/**
 * Controller to provide metadata about the application.
 * Exposes the `/api/about` endpoint, returning application name and author details.
 */


package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.entity.Term;
import com.example.courseplanner.utils.SemesterUtil;
import com.example.courseplanner.repository.TermRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
@Tag(name = "Public information", description = "Application metadata and currently enrolling term")
public class AboutController {
    private final TermRepository termRepository;

    public AboutController(TermRepository termRepository) {
        this.termRepository = termRepository;
    }

    @GetMapping("/about")
    @Operation(summary = "Get application metadata")
    public ApiAboutDTO getAboutInfo() {
        String name = "Anonymouse";
        return new ApiAboutDTO("CoursePlanner", name);
    }

    @GetMapping("/terms/enrolling")
    @Operation(summary = "Get the currently enrolling term")
    public ApiTermDTO getEnrollingTerm() {
        Term enrolling = termRepository.findByIsEnrollingTrue()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No enrolling term found"));
        
        return new ApiTermDTO(
            enrolling.getYear(),
            enrolling.getTerm(),
            SemesterUtil.buildSemesterCode(enrolling.getYear(), enrolling.getTerm())
        );
}
}
