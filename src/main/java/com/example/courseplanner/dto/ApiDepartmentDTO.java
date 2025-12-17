/**
 * Data Transfer Object (DTO) representing a department.
 * Includes details such as the department's unique identifier and name.
 * Used in responses involving department-related data.
 */


package com.example.courseplanner.dto;

public class ApiDepartmentDTO {
    private long deptId;
    private String name;

    // Constructor
    public ApiDepartmentDTO(long deptId, String name) {
        this.deptId = deptId;
        this.name = name;
    }

    // Getters and Setters
    public long getDeptId() {
        return deptId;
    }

    public void setDeptId(long deptId) {
        this.deptId = deptId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

