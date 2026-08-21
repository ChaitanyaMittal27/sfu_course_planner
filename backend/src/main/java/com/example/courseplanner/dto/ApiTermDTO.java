package com.example.courseplanner.dto;

public class ApiTermDTO {
    private int year;
    private String term;
    private long semesterCode;

    public ApiTermDTO(int year, String term, long semesterCode) {
        this.year = year;
        this.term = term;
        this.semesterCode = semesterCode;
    }

    // Getters and setters
    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    public long getSemesterCode() {
        return semesterCode;
    }

    public void setSemesterCode(long semesterCode) {
        this.semesterCode = semesterCode;
    }
}