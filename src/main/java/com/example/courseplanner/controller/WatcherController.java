/**
 * Controller for managing watchers.
 * Exposes endpoints under `/api/watchers` to:
 * - Create watchers.
 * - List existing watchers.
 * - Fetch details of a specific watcher.
 * - Delete a watcher.
 * Tracks events for course updates and associates them with relevant watchers.
 */


package com.example.courseplanner.controller;

import com.example.courseplanner.dto.ApiWatcherCreateDTO;
import com.example.courseplanner.dto.ApiWatcherDTO;
import com.example.courseplanner.dto.ApiDepartmentDTO;
import com.example.courseplanner.dto.ApiCourseDTO;
import com.example.courseplanner.model.Department;
import com.example.courseplanner.model.Course;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;


@RestController
@RequestMapping("/api/watchers")
public class WatcherController {
    private final Map<Long, Department> departmentMap;
    private final Map<Long, ApiWatcherDTO> watchers = new HashMap<>();
    private final AtomicLong watcherIdCounter = new AtomicLong(1);

    public WatcherController(Map<Long, Department> departmentMap) {
        this.departmentMap = departmentMap;
    }

    @GetMapping
    public List<ApiWatcherDTO> listWatchers() {
        return new ArrayList<>(watchers.values());
    }

    @PostMapping
    public ResponseEntity<String> createWatcher(@RequestBody ApiWatcherCreateDTO data) {
        Department department = departmentMap.get(data.getDeptId());
        if (department == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Department not found");
        }

        Course course = department.getCourses().get(data.getCourseId());
        if (course == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Course not found");
        }

        long watcherId = watcherIdCounter.getAndIncrement();
        ApiDepartmentDTO departmentDTO = new ApiDepartmentDTO(department.getId(), department.getSubject());
        ApiCourseDTO courseDTO = new ApiCourseDTO(course.getId(), course.getCatalogNumber());
        ApiWatcherDTO newWatcher = new ApiWatcherDTO(watcherId, departmentDTO, courseDTO, new ArrayList<>());

        watchers.put(watcherId, newWatcher);
        return ResponseEntity.status(HttpStatus.CREATED).body("Watcher created with ID: " + watcherId);
    }

    @GetMapping("/{watcherId}")
    public ResponseEntity<ApiWatcherDTO> getWatcher(@PathVariable long watcherId) {
        ApiWatcherDTO watcher = watchers.get(watcherId);
        if (watcher == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        return ResponseEntity.ok(watcher);
    }

    @DeleteMapping("/{watcherId}")
    public ResponseEntity<String> deleteWatcher(@PathVariable long watcherId) {
        ApiWatcherDTO watcher = watchers.remove(watcherId);
        if (watcher == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Watcher not found");
        }
        return ResponseEntity.ok("Watcher deleted");
    }

    public void recordEvent(String subjectName, String catalogNumber, String event) {
        watchers.values().stream()
                .filter(watcher ->
                        watcher.getDepartment().getName().equalsIgnoreCase(subjectName) &&
                                watcher.getCourse().getCatalogNumber().equalsIgnoreCase(catalogNumber)
                )
                .forEach(watcher -> watcher.getEvents().add(event));
    }
}
