package com.example.courseplanner.controller;

import com.example.courseplanner.dto.*;
import com.example.courseplanner.entity.*;
import com.example.courseplanner.model.*;
import com.example.courseplanner.repository.*;
import com.example.courseplanner.service.*;
import com.example.courseplanner.utils.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;
import java.util.Comparator;
import java.util.Collections;
import java.util.UUID;

/**
 * =========================================================
 * BookmarkController (JWT Protected)
 * 
 * Manages user course-offering bookmarks with JWT authentication.
 * 
 * Security:
 * - All endpoints require valid JWT in Authorization header
 * - UserId extracted from JWT (not from URL)
 * - Users can only access their own bookmarks
 * 
 * Endpoints:
 * - GET    /api/bookmarks                    → List user's bookmarks
 * - GET    /api/bookmarks/offerings          → Get watched offerings data
 * - POST   /api/bookmarks                    → Create bookmark
 * - DELETE /api/bookmarks/{bookmarkId}        → Delete bookmark
 * =========================================================
 */
@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {

    private final BookmarkRepository bookmarkRepository;
    private final CourseRepository courseRepository;
    private final TermRepository termRepository;
    private final CourseSysClient courseSysClient;
    private final JwtService jwtService;

    public BookmarkController(
        BookmarkRepository bookmarkRepository,
        CourseRepository courseRepository,
        TermRepository termRepository,
        CourseSysClient courseSysClient,
        JwtService jwtService
    ) {
        this.bookmarkRepository = bookmarkRepository;
        this.courseRepository = courseRepository;
        this.termRepository = termRepository;
        this.courseSysClient = courseSysClient;
        this.jwtService = jwtService;
    }

    // =====================================================
    // GET /api/bookmarks
    // 
    // Returns all bookmarks for authenticated user
    // Used to build the Bookmarks page list
    // 
    // Headers: Authorization: Bearer <JWT>
    // Returns: List<ApiBookmarkDTO>
    // =====================================================
    @GetMapping
    public List<ApiBookmarkDTO> getBookmarks(
        @RequestHeader("Authorization") String authHeader
    ) {
        // Extract userId from JWT
        UUID userId = UUID.fromString(jwtService.extractUserId(authHeader));

        // Get bookmarks for this user
        return bookmarkRepository.findAllByUserId(userId)
            .stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    // =====================================================
    // GET /api/bookmarks/offerings
    // 
    // Returns all watched offerings for authenticated user
    // Used to populate offering data on dashboard
    // 
    // Headers: Authorization: Bearer <JWT>
    // Returns: List<ApiCourseOfferingDTO>
    // =====================================================
    @GetMapping("/offerings")
    public ResponseEntity<List<ApiCourseOfferingDTO>> getBookmarkedOfferings(
        @RequestHeader("Authorization") String authHeader
    ) {
        // Extract userId from JWT
        UUID userId = UUID.fromString(jwtService.extractUserId(authHeader));

        // Load bookmarks for user
        List<Bookmark> bookmarks = bookmarkRepository.findAllByUserId(userId);

        if (bookmarks.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        // Cache enrolling semester once (optional but efficient)
        Optional<Term> enrollingOpt = termRepository.findByIsEnrollingTrue();
        Long enrollingSemesterCode = enrollingOpt
                .map(t -> SemesterUtil.buildSemesterCode(t.getYear(), t.getTerm()))
                .orElse(null);

        List<ApiCourseOfferingDTO> results = new ArrayList<>();

        // Resolve each bookmark → CourseSys offering
        for (Bookmark bookmark : bookmarks) {

            // a) Validate course
            Course course = courseRepository.findByIdWithDepartment(bookmark.getCourseId())
                    .orElseThrow(() ->
                            new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

            String dept = course.getDepartment().getDeptCode();   // CMPT
            String number = course.getCourseNumber();             // 276

            // b) Decode semesterCode → year + term
            SemesterUtil.DecodedSemester decoded =
                    SemesterUtil.decodeSemesterCode(bookmark.getSemesterCode());

            long year = decoded.year();
            String term = decoded.term(); // "spring", "fall", etc.

            // c) Fetch CourseSys data for EXACT semester
            CourseSysBrowseResult browse =
                    courseSysClient.fetchCourseSections(dept, number, bookmark.getSemesterCode());

            // d) Match exact section
            for (CourseSysOffering offering : browse.getOfferings()) {

                if (!offering.getSection().equalsIgnoreCase(bookmark.getSection())) {
                    continue;
                }

                boolean isEnrolling =
                        enrollingSemesterCode != null &&
                        enrollingSemesterCode.equals(bookmark.getSemesterCode());

                ApiCourseOfferingDTO dto = new ApiCourseOfferingDTO(
                        offering.getSection(),
                        offering.getInfoUrl(),
                        term,
                        year,
                        bookmark.getSemesterCode(),
                        isEnrolling,
                        offering.getCampus(),
                        offering.getInstructor(),
                        offering.getEnrolled(),
                        offering.getCapacity(),
                        offering.getLoadPercent()
                );

                results.add(dto);
                break; // section is unique per semester
            }
        }

        // Sort newest first (same as Browse)
        results.sort(
                Comparator.comparing(ApiCourseOfferingDTO::getSemesterCode).reversed()
        );

        return ResponseEntity.ok(results);
    }

    // =====================================================
    // POST /api/bookmarks
    // 
    // Creates a new bookmark for authenticated user
    // 
    // Headers: Authorization: Bearer <JWT>
    // Body: {
    //   deptId: number,
    //   courseId: number,
    //   semesterCode: number,
    //   section: string
    // }
    // Returns: ApiBookmarkDTO
    // =====================================================
    @PostMapping
    public ResponseEntity<ApiBookmarkDTO> createBookmark(
        @RequestHeader("Authorization") String authHeader,
        @RequestBody ApiBookmarkDTO payload
    ) {
        // Extract userId from JWT
        UUID userId = UUID.fromString(jwtService.extractUserId(authHeader));

        // Prevent duplicates (same user + same offering)
        boolean exists = bookmarkRepository.existsByUserIdAndDeptIdAndCourseIdAndSemesterCodeAndSection(
            userId,
            payload.getDeptId(),
            payload.getCourseId(),
            payload.getSemesterCode(),
            payload.getSection()
        );

        if (exists) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Bookmark already exists for this offering"
            );
        }

        // Create entity
        Bookmark bookmark = new Bookmark(
            userId,
            payload.getDeptId(),
            payload.getCourseId(),
            payload.getSemesterCode(),
            payload.getSection()
        );

        Bookmark saved = bookmarkRepository.save(bookmark);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(toDTO(saved));
    }

    // =====================================================
    // DELETE /api/bookmarks/{bookmarkId}
    // 
    // Deletes a bookmark (with ownership check)
    // 
    // Headers: Authorization: Bearer <JWT>
    // Path: bookmarkId (Long)
    // Returns: 204 No Content
    // =====================================================
    @DeleteMapping("/{bookmarkId}")
    public ResponseEntity<Void> deleteBookmark(
        @RequestHeader("Authorization") String authHeader,
        @PathVariable Long bookmarkId
    ) {
        // Extract userId from JWT
        UUID userId = UUID.fromString(jwtService.extractUserId(authHeader));

        // Find bookmark
        Bookmark bookmark = bookmarkRepository.findById(bookmarkId)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found")
            );

        // Ownership check (IMPORTANT!)
        if (!bookmark.getUserId().equals(userId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You can only delete your own bookmarks.. how did you get here?"
            );
        }

        bookmarkRepository.delete(bookmark);
        return ResponseEntity.noContent().build();
    }

    // =====================================================
    // INTERNAL MAPPER
    // 
    // Entity → DTO
    // =====================================================
    private ApiBookmarkDTO toDTO(Bookmark w) {
        return new ApiBookmarkDTO(
            w.getBookmarkId(),
            w.getDeptId(),
            w.getCourseId(),
            w.getSemesterCode(),
            w.getSection(),
            w.getCreatedAt()
        );
    }
}