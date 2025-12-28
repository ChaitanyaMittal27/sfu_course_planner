/**
 * =========================================================
 * Section Comparison Page
 * =========================================================
 *
 * MODE 2: Compare sections of the same course in a semester.
 *
 * PURPOSE:
 * --------
 * Helps students choose between different sections (D100, D200, etc.)
 * of the same course by comparing instructors, campus, and availability.
 *
 * COMPARISON CRITERIA:
 * -------------------
 * - Section identifier (D100, D200, etc.)
 * - Instructor(s) teaching the section
 * - Campus location (Burnaby, Surrey, Vancouver)
 * - Enrollment status (enrolled/capacity)
 * - Load percentage (how full the section is)
 * - Section info URL (link to CourseSys)
 *
 * USER FLOW:
 * ----------
 * 1. Select department → course
 * 2. Select semester (defaults to enrolling, last 3 years available)
 * 3. View available sections for that offering
 * 4. Select 2-3 sections to compare
 * 5. View side-by-side comparison
 * 6. Share URL or adjust selections
 *
 * DATA FLOW:
 * ----------
 * Step 1: User selects course + semester
 *   → GET /api/departments/{deptId}/courses/{courseId}/offerings/{semesterCode}
 *   → Returns OfferingDetail with sections[] array
 *
 * Step 2: User selects specific sections from the list
 *   → Filter sections[] to show only selected ones
 *   → Display side-by-side
 *
 * URL STATE (via nuqs):
 * ---------------------
 * ?deptId=14&courseId=4004&semester=1267&sections=D100,D200,D300
 *
 * CONSTRAINTS:
 * ------------
 * - Single course only (can't compare CMPT 276 D100 vs CMPT 295 D100)
 * - Single semester only (can't compare Fall 2024 D100 vs Spring 2025 D100)
 * - Minimum: 2 sections
 * - Maximum: 3 sections (UI clarity)
 * - Only shows semesters from last 3 years (9 semesters max)
 *
 * FUTURE ENHANCEMENTS:
 * -------------------
 * - RateMyProfessor integration for instructor ratings
 * - Historical enrollment trends per section
 * - Section-specific grade data (if available)
 * - Waitlist information
 * =========================================================
 */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useQueryState } from "nuqs";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { api, Department, Course, OfferingDetail, CourseOffering } from "@/lib/api";

function SectionComparisonContent() {
  // ===================================
  // STATE MANAGEMENT
  // ===================================
  const [deptIdParam, setDeptIdParam] = useQueryState("deptId");
  const [courseIdParam, setCourseIdParam] = useQueryState("courseId");
  const [semesterParam, setSemesterParam] = useQueryState("semester");
  const [sectionsParam, setSectionsParam] = useQueryState("sections");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<{ code: number; label: string }[]>([]);

  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const [offeringData, setOfferingData] = useState<OfferingDetail | null>(null);
  const [availableSections, setAvailableSections] = useState<CourseOffering[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===================================
  // LOAD INITIAL DATA
  // ===================================
  useEffect(() => {
    loadDepartments();
    generateSemesters();
    loadFromURL();
  }, []);

  const loadDepartments = async () => {
    try {
      const depts = await api.getDepartments();
      setDepartments(depts);
    } catch (err) {
      setError("Failed to load departments");
    }
  };

  // Generate last 3 years of semesters (9 total)
  const generateSemesters = async () => {
    try {
      // Fetch enrolling term from backend
      const enrolling = await api.getEnrollingTerm();

      const sems: { code: number; label: string }[] = [];
      let year = enrolling.year;
      let term = enrolling.term;

      // Generate 9 semesters (3 years) backwards from enrolling
      for (let i = 0; i < 9; i++) {
        const termCode = term === "spring" ? 1 : term === "summer" ? 4 : 7;
        const code = (year - 1900) * 10 + termCode;
        const label = `${term.charAt(0).toUpperCase() + term.slice(1)} ${year}`;

        sems.push({ code, label });

        // Move to previous semester
        const prev = getPreviousSemester(year, term);
        year = prev.year;
        term = prev.term;
      }

      setSemesters(sems);

      // Auto-select enrolling semester as default
      setSelectedSemester(enrolling.semesterCode);
    } catch (err) {
      setError("Failed to load semesters");
      console.error(err);
    }
  };

  // ===================================
  // URL STATE SYNC
  // ===================================
  const loadFromURL = async () => {
    if (deptIdParam && courseIdParam && semesterParam) {
      const deptId = Number(deptIdParam);
      const courseId = Number(courseIdParam);
      const semester = Number(semesterParam);

      setSelectedDept(deptId);
      setSelectedCourse(courseId);
      setSelectedSemester(semester);

      if (sectionsParam) {
        setSelectedSections(sectionsParam.split(","));
      }

      await fetchOfferingData(deptId, courseId, semester);
    }
  };

  const updateURL = () => {
    setDeptIdParam(selectedDept?.toString() || null);
    setCourseIdParam(selectedCourse?.toString() || null);
    setSemesterParam(selectedSemester?.toString() || null);
    setSectionsParam(selectedSections.length > 0 ? selectedSections.join(",") : null);
  };

  useEffect(() => {
    updateURL();
  }, [selectedDept, selectedCourse, selectedSemester, selectedSections]);

  // ===================================
  // LOAD COURSES WHEN DEPT CHANGES
  // ===================================
  useEffect(() => {
    if (selectedDept) {
      loadCourses(selectedDept);
    }
  }, [selectedDept]);

  const loadCourses = async (deptId: number) => {
    try {
      const coursesData = await api.getCourses(deptId);
      setCourses(coursesData);
    } catch {
      setError("Failed to load courses");
    }
  };

  // ===================================
  // FETCH OFFERING DATA
  // ===================================
  const fetchOfferingData = async (deptId: number, courseId: number, semesterCode: number) => {
    if (!deptId || !courseId || !semesterCode) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.getOfferingDetail(deptId, courseId, semesterCode);
      setOfferingData(data);
      setAvailableSections(data.sections);
      setSelectedSections([]); // Reset selections when data changes
    } catch (err) {
      setError("Failed to fetch offering data. This course may not be offered in the selected semester.");
      setOfferingData(null);
      setAvailableSections([]);
    } finally {
      setLoading(false);
    }
  };

  // ===================================
  // SECTION SELECTION
  // ===================================
  const toggleSection = (section: string) => {
    setSelectedSections((prev) => {
      if (prev.includes(section)) {
        return prev.filter((s) => s !== section);
      } else {
        if (prev.length >= 3) {
          setError("Maximum 3 sections allowed");
          return prev;
        }
        return [...prev, section];
      }
    });
    setError(null);
  };

  // Get comparison data
  const comparisonSections = availableSections.filter((s) => selectedSections.includes(s.section));

  // ===================================
  // RENDER
  // ===================================
  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Compare Sections</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Select a course and semester, then compare different sections to find the best fit.
          </p>
        </div>

        {/* Selection Panel */}
        <div className="light-card dark:dark-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Select Course & Semester</h2>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Department Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <select
                title="dept"
                value={selectedDept || ""}
                onChange={(e) => {
                  setSelectedDept(Number(e.target.value));
                  setSelectedCourse(null);
                  setOfferingData(null);
                }}
                className="input-field"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.deptId} value={dept.deptId}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
              <select
                title="course"
                value={selectedCourse || ""}
                onChange={(e) => {
                  setSelectedCourse(Number(e.target.value));
                  setOfferingData(null);
                }}
                className="input-field"
                disabled={!selectedDept}
              >
                <option value="">Select Course</option>
                {courses
                  .sort((a, b) => a.courseNumber.localeCompare(b.courseNumber))
                  .map((course) => (
                    <option key={course.courseId} value={course.courseId}>
                      {course.courseNumber} - {course.title}
                    </option>
                  ))}
              </select>
            </div>

            {/* Semester Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester</label>
              <select
                title="sem"
                value={selectedSemester || ""}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="input-field"
                disabled={!selectedCourse}
              >
                <option value="">Select Semester</option>
                {semesters.map((sem) => (
                  <option key={sem.code} value={sem.code}>
                    {sem.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Load Sections Button */}
          {selectedDept && selectedCourse && selectedSemester && !offeringData && (
            <button
              onClick={() => fetchOfferingData(selectedDept, selectedCourse, selectedSemester)}
              className="btn-primary"
            >
              Load Sections
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Available Sections */}
        {!loading && offeringData && availableSections.length > 0 && (
          <div className="light-card dark:dark-card p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Available Sections ({availableSections.length})
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select 2-3 sections to compare. Selected: {selectedSections.length}/3
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableSections.map((section) => (
                <button
                  key={section.section}
                  onClick={() => toggleSection(section.section)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedSections.includes(section.section)
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700"
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">{section.section}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{section.instructors}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {section.enrolled}/{section.capacity} • {section.loadPercent}% full
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {!loading && comparisonSections.length >= 2 && (
          <div className="space-y-6">
            <div className="light-card dark:dark-card p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Section Comparison</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    <ComparisonRow label="Section">
                      {comparisonSections.map((s, idx) => (
                        <td key={idx} className="table-cell font-bold text-lg">
                          {s.section}
                        </td>
                      ))}
                    </ComparisonRow>

                    <ComparisonRow label="Instructor">
                      {comparisonSections.map((s, idx) => (
                        <td key={idx} className="table-cell">
                          {s.instructors}
                        </td>
                      ))}
                    </ComparisonRow>

                    <ComparisonRow label="Campus">
                      {comparisonSections.map((s, idx) => (
                        <td key={idx} className="table-cell">
                          {s.location}
                        </td>
                      ))}
                    </ComparisonRow>

                    <ComparisonRow label="Enrollment">
                      {comparisonSections.map((s, idx) => (
                        <td key={idx} className="table-cell">
                          {s.enrolled} / {s.capacity}
                        </td>
                      ))}
                    </ComparisonRow>

                    <ComparisonRow label="Capacity Used">
                      {comparisonSections.map((s, idx) => (
                        <td key={idx} className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                                style={{ width: `${Math.min(s.loadPercent, 100)}%` }}
                              />
                            </div>
                            <span className="font-semibold">{s.loadPercent}%</span>
                          </div>
                        </td>
                      ))}
                    </ComparisonRow>

                    <ComparisonRow label="CourseSys Link">
                      {comparisonSections.map((s, idx) => (
                        <td key={idx} className="table-cell">
                          <a
                            href={`https://coursys.sfu.ca${s.infoUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 dark:text-orange-400 hover:underline text-sm"
                          >
                            View Details →
                          </a>
                        </td>
                      ))}
                    </ComparisonRow>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - No Course Selected */}
        {!loading && !offeringData && (
          <div className="light-card dark:dark-card p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Sections Loaded</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Select a course and semester above to view available sections
            </p>
          </div>
        )}

        {/* Empty State - Sections Available but None Selected */}
        {!loading && offeringData && availableSections.length > 0 && selectedSections.length < 2 && (
          <div className="light-card dark:dark-card p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select Sections to Compare</h3>
            <p className="text-gray-600 dark:text-gray-300">Choose at least 2 sections from the list above</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

// ===================================
// HELPER COMPONENTS
// ===================================

function ComparisonRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="table-cell font-medium text-gray-700 dark:text-gray-300 w-1/5">{label}</td>
      {children}
    </tr>
  );
}

function getPreviousSemester(year: number, term: string): { year: number; term: string } {
  if (term === "spring") {
    return { year: year - 1, term: "fall" };
  } else if (term === "summer") {
    return { year, term: "spring" };
  } else {
    // fall
    return { year, term: "summer" };
  }
}

export default function SectionComparisonPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SectionComparisonContent />
    </Suspense>
  );
}
