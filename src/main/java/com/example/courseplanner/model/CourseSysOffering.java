/**
 * Model representing a single course offering/section from CourseSys.
 * 
 * Contains section-specific data including enrollment numbers, instructor,
 * campus location, and computed values like load percentage.
 * 
 * Handles parsing of enrollment strings that may include waitlist numbers
 * (e.g., "115 (+31)" means 115 enrolled + 31 waitlisted).
 * 
 * Example:
 *   CourseSysOffering offering = new CourseSysOffering();
 *   offering.setSection("D100");
 *   offering.setEnrolled("96 (+4)");
 *   offering.setCapacity("100");
 *   
 *   offering.getEnrolledCount() → 100 (96 + 4 waitlist)
 *   offering.getCapacityCount() → 100
 *   offering.getLoadPercent()   → 100 (100/100 * 100)
 */

package com.example.courseplanner.model;

import java.util.regex.Pattern;
import java.util.regex.Matcher;

public class CourseSysOffering {
    private String section;
    private String instructor;
    private String enrolled;
    private String capacity;
    private String campus;
    private String infoUrl;

    // getters / setters
    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public String getInstructor() {
        return instructor;
    }

    public void setInstructor(String instructor) {
        this.instructor = instructor;
    }

    public String getEnrolled() {
        return enrolled;
    }

    public void setEnrolled(String enrolled) {
        this.enrolled = enrolled;
    }

    public String getCapacity() {
        return capacity;
    }

    public void setCapacity(String capacity) {
        this.capacity = capacity;
    }

    public String getCampus() {
        return campus;
    }

    public void setCampus(String campus) {
        this.campus = campus;
    }

    public String getInfoUrl() {
        return infoUrl;
    }

    public void setInfoUrl(String infoUrl) {
        this.infoUrl = infoUrl;
    }

    // specials ---------------------------------
    /**
     * Parses enrolled string and returns total count including waitlist.
     * 
     * Handles formats:
     *   "96"         → 96
     *   "115 (+31)"  → 146 (115 + 31 waitlist)
     * 
     * @return Total enrolled count (base + waitlist), or 0 if parsing fails
     */
    public int getEnrolledCount() {
        return parseWithWaitlist(enrolled);
    }

    /**
     * Parses capacity string and returns numeric value.
     * 
     * @return Capacity as integer, or 0 if parsing fails
     */
    public int getCapacityCount() {
        return parsePlainNumber(capacity);
    }

    /**
     * Parses enrollment string that may include waitlist notation.
     * 
     * @param raw Enrollment string (e.g., "115" or "115 (+31)")
     * @return Total count (base + waitlist), or 0 if parsing fails
     */
    private int parseWithWaitlist(String raw) {
        if (raw == null) return 0;

        // Match numbers like "115", "115 (+31)"
        // Groups: base, waitlist (optional)
        Pattern p = Pattern.compile("(\\d+)(?:\\s*\\(\\+(\\d+)\\))?");
        Matcher m = p.matcher(raw.trim());

        if (!m.matches()) return 0;

        int base = Integer.parseInt(m.group(1));
        int waitlist = (m.group(2) != null) ? Integer.parseInt(m.group(2)) : 0;

        return base + waitlist;
    }

   /**
     * Calculates enrollment load percentage.
     * 
     * Formula: (enrolled / capacity) * 100
     * 
     * @return Load percentage rounded to nearest whole number,
     *         or 0 if capacity is 0 or invalid
     *         
     * Example:
     *   enrolled=96, capacity=100  → 96%
     *   enrolled=115 (+31), capacity=100 → 146% (overenrolled)
     */
    public Long getLoadPercent() {
        int enrolled = getEnrolledCount();   // includes waitlist
        int capacity = getCapacityCount();

        if (capacity <= 0) return 0L;

        return Math.round((enrolled * 100.0) / capacity);
    }

    /**
     * Parses a plain numeric string.
     * 
     * @param raw Numeric string (e.g., "100")
     * @return Parsed integer, or 0 if parsing fails
     */
    private int parsePlainNumber(String raw) {
        if (raw == null) return 0;

        Pattern p = Pattern.compile("(\\d+)");
        Matcher m = p.matcher(raw.trim());

        if (!m.find()) return 0;

        return Integer.parseInt(m.group(1));
    }
}
