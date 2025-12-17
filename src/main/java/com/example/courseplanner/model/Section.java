/**
 * Represents a specific section of a course offering.
 * Each section is identified by its component type (e.g., "LEC", "LAB") and
 * includes enrollment details such as total enrolled and capacity.
 */


package com.example.courseplanner.model;

public class Section {
    private String componentCode; // e.g., "LEC", "LAB"
    private int enrollmentTotal;
    private int enrollmentCapacity;

    public Section(String componentCode, int enrollmentTotal, int enrollmentCapacity) {
        this.componentCode = componentCode;
        this.enrollmentTotal = enrollmentTotal;
        this.enrollmentCapacity = enrollmentCapacity;
    }

    public String getComponentCode() {
        return componentCode;
    }

    public int getEnrollmentTotal() {
        return enrollmentTotal;
    }

    public int getEnrollmentCapacity() {
        return enrollmentCapacity;
    }

    public void setEnrollmentTotal(int i) {
        enrollmentTotal = i;
    }

    public void setEnrollmentCapacity(int i) {
        enrollmentCapacity = i;
    }

    public void aggregate(Section other) {
        this.enrollmentTotal += other.getEnrollmentTotal();
        this.enrollmentCapacity += other.getEnrollmentCapacity();
    }

}
