/**
 * Represents a course within a department.
 * Each course is identified by its catalog number and contains a list of offerings.
 *
 */


package com.example.courseplanner.model;

import java.util.*;

public class Course implements Iterable<Offering>{
    private String catalogNumber; // Course code = "213"
    private Map<Long, Offering> offerings = new HashMap<>();
    private long id;

    public Course(String catalogNumber, long id) {
        this.catalogNumber = catalogNumber;
        this.id = id;
    }

    public String getCatalogNumber() {
        return catalogNumber;
    }

    public Map<Long, Offering> getOfferings() { // Changed return type to Map
        return offerings;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    @Override
    public Iterator<Offering> iterator() {
        return offerings.values().iterator();
    }
    public void addOffering(Offering offering) {
        this.offerings.putIfAbsent(offering.getId(), offering);
    }

    public Map<Long, Offering> groupOfferings() {
        Map<String, Offering> groupedByKey = new HashMap<>(); // Temporary map keyed by {semesterCode}_{location}

        for (Offering offering : this.offerings.values()) {
            String key = offering.getSemester().getSemesterCode() + "_" + offering.getLocation();
            groupedByKey.merge(key, offering, (existing, newOffering) -> {
                existing.mergeWith(newOffering); // Merge logic to aggregate sections and instructors
                return existing;
            });
        }

        // Convert groupedByKey to Map<Long, Offering> with unique IDs
        Map<Long, Offering> groupedOfferings = new HashMap<>();
        for (Offering offering : groupedByKey.values()) {
            groupedOfferings.put(offering.getId(), offering); // Use existing offering ID
        }

        return groupedOfferings;
    }



}
