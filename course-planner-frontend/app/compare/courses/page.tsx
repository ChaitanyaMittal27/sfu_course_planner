/**
 * =========================================================
 * Course Comparison Page
 * =========================================================
 *
 * MODE 1: Compare different courses to decide which to take.
 *
 * PURPOSE:
 * --------
 * Helps students compare academic courses side-by-side to make
 * informed decisions about course selection for their degree.
 *
 * COMPARISON CRITERIA:
 * -------------------
 * - Course identity (dept, number, title)
 * - Academic requirements (prerequisites, corequisites, units)
 * - Difficulty indicators (median grade, fail rate)
 * - Grade distribution (histogram comparison)
 * - Course metadata (description, degree level, designation)
 *
 * USER FLOW:
 * ----------
 * 1. Select department → course (repeat 2-3x)
 * 2. Click "Compare" when 2+ courses selected
 * 3. View side-by-side comparison table
 * 4. Share URL or clear to start new comparison
 *
 * DATA FLOW:
 * ----------
 * For each selected course:
 *   → GET /api/departments/{deptId}/courses/{courseId}/offerings/{latestSemester}
 *   → Extract course-level metadata + CourseDiggers stats
 *   → Ignore semester-specific data (sections, enrollment)
 *
 * URL STATE (via nuqs):
 * ---------------------
 * ?courses=deptId:courseId,deptId:courseId,deptId:courseId
 * Example: ?courses=14:4004,14:4010,14:3500
 *
 * CONSTRAINTS:
 * ------------
 * - Minimum: 2 courses
 * - Maximum: 3 courses (UI clarity)
 * - Cross-department allowed (CMPT vs MATH)
 * - Duplicate courses prevented
 *
 * FUTURE ENHANCEMENTS:
 * -------------------
 * - Highlight "better" metrics (lower fail rate, etc.)
 * - "Students also compared" suggestions
 * - Export comparison as PDF/image
 * =========================================================
 */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useQueryState } from "nuqs";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import GradeHistogram from "@/components/GradeHistogram";
import { api, Department, Course, OfferingDetail } from "@/lib/api";
import Link from "next/link";

type SelectedCourse = {
  deptId: number;
  courseId: number;
  deptCode: string;
  courseNumber: string;
};

function CourseComparisonContent() {
  // ===================================
  // STATE MANAGEMENT
  // ===================================
  const [coursesParam, setCoursesParam] = useQueryState("courses");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [comparisonData, setComparisonData] = useState<OfferingDetail[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===================================
  // LOAD DEPARTMENTS ON MOUNT
  // ===================================
  useEffect(() => {
    loadDepartments();
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

  // ===================================
  // URL STATE SYNC
  // ===================================
  const loadFromURL = () => {
    if (!coursesParam) return;

    try {
      // Parse: "14:4004,14:4010" → [{deptId:14, courseId:4004}, ...]
      const parsed = coursesParam.split(",").map((pair) => {
        const [deptId, courseId] = pair.split(":").map(Number);
        return { deptId, courseId, deptCode: "", courseNumber: "" };
      });

      setSelectedCourses(parsed);
      fetchComparisonData(parsed);
    } catch {
      setError("Invalid URL parameters");
    }
  };

  const updateURL = (courses: SelectedCourse[]) => {
    if (courses.length === 0) {
      setCoursesParam(null);
    } else {
      const param = courses.map((c) => `${c.deptId}:${c.courseId}`).join(",");
      setCoursesParam(param);
    }
  };

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
  // ADD COURSE TO COMPARISON
  // ===================================
  const addCourse = () => {
    if (!selectedDept || !selectedCourse) return;
    if (selectedCourses.length >= 3) {
      setError("Maximum 3 courses allowed");
      return;
    }

    // Check for duplicates
    if (selectedCourses.some((c) => c.courseId === selectedCourse)) {
      setError("Course already added");
      return;
    }

    const dept = departments.find((d) => d.deptId === selectedDept);
    const course = courses.find((c) => c.courseId === selectedCourse);

    if (!dept || !course) return;

    const newCourse: SelectedCourse = {
      deptId: selectedDept,
      courseId: selectedCourse,
      deptCode: dept.deptCode,
      courseNumber: course.courseNumber,
    };

    const updated = [...selectedCourses, newCourse];
    setSelectedCourses(updated);
    updateURL(updated);

    // Reset selections
    setSelectedDept(null);
    setSelectedCourse(null);
    setCourses([]);
    setError(null);
  };

  // ===================================
  // REMOVE COURSE
  // ===================================
  const removeCourse = (courseId: number) => {
    const updated = selectedCourses.filter((c) => c.courseId !== courseId);
    setSelectedCourses(updated);
    updateURL(updated);
    setComparisonData([]);
  };

  // ===================================
  // FETCH COMPARISON DATA
  // ===================================
  const fetchComparisonData = async (courses: SelectedCourse[]) => {
    if (courses.length < 2) {
      setError("Select at least 2 courses to compare");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch latest offering for each course
      // TODO: Need to determine semesterCode (use enrolling or current)
      const latestSemester = 1267; // Placeholder - should fetch from /api/terms

      const promises = courses.map((c) => api.getOfferingDetail(c.deptId, c.courseId, latestSemester));

      const results = await Promise.all(promises);
      setComparisonData(results);
    } catch (err) {
      setError("Failed to fetch course data. Some courses may not be offered this semester.");
      setComparisonData([]);
    } finally {
      setLoading(false);
    }
  };

  // ===================================
  // RENDER
  // ===================================
  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Compare Courses</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Select 2-3 courses to compare prerequisites, difficulty, and grade distributions.
          </p>
        </div>

        {/* Selection Panel */}
        <div className="light-card dark:dark-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Select Courses</h2>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Department Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <select
                title="dept"
                value={selectedDept || ""}
                onChange={(e) => setSelectedDept(Number(e.target.value))}
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
                onChange={(e) => setSelectedCourse(Number(e.target.value))}
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

            {/* Add Button */}
            <div className="flex items-end">
              <button onClick={addCourse} disabled={!selectedCourse} className="btn-primary w-full">
                Add to Comparison
              </button>
            </div>
          </div>

          {/* Selected Courses List */}
          {selectedCourses.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selected ({selectedCourses.length}/3):
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedCourses.map((course) => (
                  <div
                    key={course.courseId}
                    className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-2"
                  >
                    <span className="font-medium">
                      {course.deptCode} {course.courseNumber}
                    </span>
                    <button
                      onClick={() => removeCourse(course.courseId)}
                      className="hover:text-red-600 dark:hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compare Button */}
          {selectedCourses.length >= 2 && (
            <div className="mt-4">
              <button onClick={() => fetchComparisonData(selectedCourses)} className="btn-primary">
                Compare {selectedCourses.length} Courses
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Comparison Results */}
        {!loading && comparisonData.length > 0 && (
          <div className="space-y-8">
            {/* Basic Info Comparison */}
            <ComparisonSection title="Basic Information">
              <ComparisonTable>
                <ComparisonRow label="Course">
                  {comparisonData.map((data, idx) => (
                    <td key={idx} className="table-cell font-semibold">
                      {data.deptCode} {data.courseNumber}
                    </td>
                  ))}
                </ComparisonRow>
                <ComparisonRow label="Title">
                  {comparisonData.map((data, idx) => (
                    <td key={idx} className="table-cell">
                      {data.title}
                    </td>
                  ))}
                </ComparisonRow>
                <ComparisonRow label="Units">
                  {comparisonData.map((data, idx) => (
                    <td key={idx} className="table-cell">
                      {data.units}
                    </td>
                  ))}
                </ComparisonRow>
                <ComparisonRow label="Degree Level">
                  {comparisonData.map((data, idx) => (
                    <td key={idx} className="table-cell">
                      {data.degreeLevel}
                    </td>
                  ))}
                </ComparisonRow>
                {comparisonData.some((d) => d.designation) && (
                  <ComparisonRow label="Designation">
                    {comparisonData.map((data, idx) => (
                      <td key={idx} className="table-cell">
                        {data.designation || "—"}
                      </td>
                    ))}
                  </ComparisonRow>
                )}
              </ComparisonTable>
            </ComparisonSection>

            {/* Description */}
            <ComparisonSection title="Course Description">
              <div className="grid md:grid-cols-3 gap-4">
                {comparisonData.map((data, idx) => (
                  <div key={idx} className="light-card dark:dark-card p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {data.description || "No description available"}
                    </p>
                  </div>
                ))}
              </div>
            </ComparisonSection>

            {/* Prerequisites & Corequisites */}
            <ComparisonSection title="Requirements">
              <ComparisonTable>
                <ComparisonRow label="Prerequisites">
                  {comparisonData.map((data, idx) => (
                    <td key={idx} className="table-cell text-sm">
                      {data.prerequisites || "None"}
                    </td>
                  ))}
                </ComparisonRow>
                <ComparisonRow label="Corequisites">
                  {comparisonData.map((data, idx) => (
                    <td key={idx} className="table-cell text-sm">
                      {data.corequisites || "None"}
                    </td>
                  ))}
                </ComparisonRow>
              </ComparisonTable>
            </ComparisonSection>

            {/* Grade Statistics */}
            <ComparisonSection title="Grade Statistics">
              <ComparisonTable>
                <ComparisonRow label="Median Grade">
                  {comparisonData.map((data, idx) => (
                    <td key={idx} className="table-cell font-semibold text-lg">
                      {data.medianGrade || "N/A"}
                    </td>
                  ))}
                </ComparisonRow>
                <ComparisonRow label="Fail Rate">
                  {comparisonData.map((data, idx) => (
                    <td key={idx} className="table-cell">
                      {data.failRate ? `${data.failRate.toFixed(2)}%` : "N/A"}
                    </td>
                  ))}
                </ComparisonRow>
              </ComparisonTable>
            </ComparisonSection>

            {/* Grade Distribution Charts */}
            {comparisonData.some((d) => d.gradeDistribution) && (
              <ComparisonSection title="Grade Distribution">
                <div className="grid md:grid-cols-3 gap-4">
                  {comparisonData.map((data, idx) => (
                    <div key={idx} className="light-card dark:dark-card p-4">
                      <h4 className="font-semibold text-center mb-4 text-gray-900 dark:text-white">
                        {data.deptCode} {data.courseNumber}
                      </h4>
                      {data.gradeDistribution ? (
                        <GradeHistogram distribution={data.gradeDistribution} />
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No data available</p>
                      )}
                    </div>
                  ))}
                </div>
              </ComparisonSection>
            )}

            {/* Links to Browse */}
            <ComparisonSection title="View Full Details">
              <div className="grid md:grid-cols-3 gap-4">
                {selectedCourses.map((course, idx) => (
                  <Link
                    key={idx}
                    href={`/browse?dept=${course.deptId}&course=${course.courseId}`}
                    className="light-card dark:dark-card p-4 text-center hover:scale-105 transition-transform"
                  >
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">
                      {course.deptCode} {course.courseNumber}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">View in Browse →</p>
                  </Link>
                ))}
              </div>
            </ComparisonSection>
          </div>
        )}

        {/* Empty State */}
        {!loading && comparisonData.length === 0 && selectedCourses.length === 0 && (
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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Courses Selected</h3>
            <p className="text-gray-600 dark:text-gray-300">Select 2-3 courses above to start comparing</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

// ===================================
// HELPER COMPONENTS
// ===================================

function ComparisonSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="light-card dark:dark-card p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ComparisonTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function ComparisonRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="table-cell font-medium text-gray-700 dark:text-gray-300 w-1/4">{label}</td>
      {children}
    </tr>
  );
}

export default function CourseComparison() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CourseComparisonContent />
    </Suspense>
  );
}
