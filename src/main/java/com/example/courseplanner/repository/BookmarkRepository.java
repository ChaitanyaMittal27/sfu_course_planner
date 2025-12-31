package com.example.courseplanner.repository;

import com.example.courseplanner.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    // Use native query with explicit UUID casting (to avoid jpa error)
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END " +
                   "FROM bookmarks " +
                   "WHERE user_id = CAST(:userId AS UUID) " +
                   "AND dept_id = :deptId " +
                   "AND course_id = :courseId " +
                   "AND semester_code = :semesterCode " +
                   "AND section = :section",
           nativeQuery = true)
    boolean existsByUserIdAndDeptIdAndCourseIdAndSemesterCodeAndSection(
        @Param("userId") UUID userId,
        @Param("deptId") Long deptId,
        @Param("courseId") Long courseId,
        @Param("semesterCode") Long semesterCode,
        @Param("section") String section
    );

    @Query(value = "SELECT * FROM bookmarks " +
                   "WHERE user_id = CAST(:userId AS UUID) " +
                   "AND dept_id = :deptId " +
                   "AND course_id = :courseId " +
                   "AND semester_code = :semesterCode " +
                   "AND section = :section",
           nativeQuery = true)
    Optional<Bookmark> findByUserIdAndDeptIdAndCourseIdAndSemesterCodeAndSection(
        @Param("userId") UUID userId,
        @Param("deptId") Long deptId,
        @Param("courseId") Long courseId,
        @Param("semesterCode") Long semesterCode,
        @Param("section") String section
    );

    @Query(value = "SELECT * FROM bookmarks WHERE user_id = CAST(:userId AS UUID)", 
           nativeQuery = true)
    List<Bookmark> findAllByUserId(@Param("userId") UUID userId);
}