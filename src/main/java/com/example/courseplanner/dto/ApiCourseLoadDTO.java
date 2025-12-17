package com.example.courseplanner.dto;

public class ApiCourseLoadDTO {
    private int semester;           // e.g., 1147
    private int enrolled;           // Total LEC enrollment
    private int capacity;           // Total LEC capacity
    private double load;            // enrolled/capacity * 100
    private String location;        // e.g., "BURNABY"
    private String instructors;     // e.g., "Brian Fraser, John Doe"

    public ApiCourseLoadDTO(int semester, int enrolled, int capacity, double load, 
                            String location, String instructors) {
        this.semester = semester;
        this.enrolled = enrolled;
        this.capacity = capacity;
        this.load = load;
        this.location = location;
        this.instructors = instructors;
    }

    // Getters and setters
    public int getSemester() { return semester; }
    public void setSemester(int semester) { this.semester = semester; }
    
    public int getEnrolled() { return enrolled; }
    public void setEnrolled(int enrolled) { this.enrolled = enrolled; }
    
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    
    public double getLoad() { return load; }
    public void setLoad(double load) { this.load = load; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getInstructors() { return instructors; }
    public void setInstructors(String instructors) { this.instructors = instructors; }
}