"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList } from "lucide-react";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageContainer from "@/components/PageContainer";
import TaskEmptyState from "@/components/TaskEmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { bodyStyles, displayStyles, headerStyles, labelStyles } from "@/app/fonts";
import { api, type Course, type Department } from "@/lib/api";
import { sectionCode, sectionComparisonHref } from "@/lib/course-routes";
import { resolveCourseIds } from "@/lib/course-resolver";

type Semester = {
  code: number;
  label: string;
};

type SelectFieldProps = {
  id: string;
  label: string;
  value: number | null;
  disabled?: boolean;
  onChange: (value: number | null) => void;
  children: React.ReactNode;
};

const selectClass = `w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary ${bodyStyles.md} focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50`;

function previousSemester(year: number, term: string) {
  if (term === "spring") return { year: year - 1, term: "fall" };
  if (term === "summer") return { year, term: "spring" };
  return { year, term: "summer" };
}

function buildSemesterOptions(year: number, term: string): Semester[] {
  const semesters: Semester[] = [];
  let optionYear = year;
  let optionTerm = term;

  for (let index = 0; index < 9; index += 1) {
    const termDigit = optionTerm === "spring" ? 1 : optionTerm === "summer" ? 4 : 7;
    semesters.push({
      code: (optionYear - 1900) * 10 + termDigit,
      label: `${optionTerm.charAt(0).toUpperCase()}${optionTerm.slice(1)} ${optionYear}`,
    });

    const previous = previousSemester(optionYear, optionTerm);
    optionYear = previous.year;
    optionTerm = previous.term;
  }

  return semesters;
}

function SelectField({ id, label, value, disabled, onChange, children }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={`mb-2 block ${labelStyles.md} text-text-primary`}>
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value) || null)}
        className={selectClass}
      >
        {children}
      </select>
    </div>
  );
}

function SectionComparisonDiscovery() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedSemesterCode, setSelectedSemesterCode] = useState<number | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([api.getDepartments(), api.getEnrollingTerm()])
      .then(([loadedDepartments, enrollingTerm]) => {
        if (!active) return;
        setDepartments(loadedDepartments);
        setSemesters(buildSemesterOptions(enrollingTerm.year, enrollingTerm.term));
        setSelectedSemesterCode(enrollingTerm.semesterCode);
      })
      .catch(() => active && setError("Failed to load course selection data."));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const departmentId = Number(searchParams.get("deptId"));
    const courseId = Number(searchParams.get("courseId"));
    const semesterCode = Number(searchParams.get("semester"));

    if (!Number.isSafeInteger(departmentId) || !Number.isSafeInteger(courseId) || !Number.isSafeInteger(semesterCode)) return;

    let active = true;
    void resolveCourseIds(departmentId, courseId)
      .then((course) => {
        if (!active) return;
        if (!course) {
          setError("This section comparison link is invalid.");
          return;
        }
        const sections = (searchParams.get("sections") ?? "").split(",").map(sectionCode).filter(Boolean);
        router.replace(sectionComparisonHref(course.deptCode, course.courseNumber, semesterCode, sections));
      })
      .catch(() => active && setError("This section comparison link is invalid."));

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  const selectedDepartment = departments.find((department) => department.deptId === selectedDepartmentId);
  const selectedCourse = courses.find((course) => course.courseId === selectedCourseId);
  const canStartComparison = Boolean(selectedDepartment && selectedCourse && selectedSemesterCode);

  const startComparison = () => {
    if (!selectedDepartment || !selectedCourse || !selectedSemesterCode) return;
    router.push(sectionComparisonHref(selectedDepartment.deptCode, selectedCourse.courseNumber, selectedSemesterCode));
  };

  const selectDepartment = (departmentId: number | null) => {
    setSelectedDepartmentId(departmentId);
    setSelectedCourseId(null);
    setCourses([]);
    setError(null);
    if (!departmentId) return;

    setLoadingCourses(true);
    void api
      .getCourses(departmentId)
      .then((loadedCourses) => setCourses(loadedCourses))
      .catch(() => setError("Failed to load courses for this department."))
      .finally(() => setLoadingCourses(false));
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className={`${displayStyles.mdResponsive} mb-2 text-text-primary`}>Compare Sections</h1>
        <p className={`${bodyStyles.md} text-text-muted`}>
          Choose a course and term, then compare the available sections side by side.
        </p>
      </div>

      <Card className="mb-6 p-5 sm:mb-8 sm:p-6">
        <CardContent className="p-0">
          <h2 className={`${headerStyles.md} mb-1 text-text-primary`}>Select a course and term</h2>
          <p className={`${bodyStyles.md} mb-4 text-text-muted`}>You can compare up to three sections at a time.</p>

          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              id="compare-section-department"
              label="Department"
              value={selectedDepartmentId}
              onChange={selectDepartment}
            >
              <option value="">Select a department…</option>
              {departments.map((department) => (
                <option key={department.deptId} value={department.deptId}>
                  {department.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              id="compare-section-course"
              label="Course"
              value={selectedCourseId}
              disabled={!selectedDepartmentId || loadingCourses}
              onChange={setSelectedCourseId}
            >
              <option value="">{loadingCourses ? "Loading courses…" : "Select a course…"}</option>
              {[...courses]
                .sort((first, second) => first.courseNumber.localeCompare(second.courseNumber))
                .map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.courseNumber} — {course.title}
                  </option>
                ))}
            </SelectField>

            <SelectField
              id="compare-section-semester"
              label="Term"
              value={selectedSemesterCode}
              disabled={!selectedCourseId}
              onChange={setSelectedSemesterCode}
            >
              <option value="">Select a term…</option>
              {semesters.map((semester) => (
                <option key={semester.code} value={semester.code}>
                  {semester.label}
                </option>
              ))}
            </SelectField>
          </div>

          <Button className="mt-4 w-full sm:w-auto" onClick={startComparison} disabled={!canStartComparison}>
            Load Sections
          </Button>
        </CardContent>
      </Card>

      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
      {!error && (
        <TaskEmptyState
          icon={ClipboardList}
          title="Choose a course and term"
          description="Load a course’s sections, then select at least two to compare."
        />
      )}
    </PageContainer>
  );
}

export default function SectionComparisonPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SectionComparisonDiscovery />
    </Suspense>
  );
}
