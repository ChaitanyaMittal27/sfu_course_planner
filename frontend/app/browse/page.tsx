"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { api } from "@/lib/api";
import { courseHref } from "@/lib/course-routes";
import type { Course, Department } from "@/lib/types";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const selectClass = `w-full rounded-md border border-border bg-background text-text-primary px-3 py-2 ${bodyStyles.md} focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50`;

function sortAlphaNum(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function BrowsePageContent() {
  const router = useRouter();
  const [deptId, setDeptId] = useQueryState("dept");
  const [, setCourseId] = useQueryState("course");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ dept: Department; course: Course }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [courseCache, setCourseCache] = useState<Record<number, Course[]>>({});


  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDept = useMemo(
    () => departments.find((d) => d.deptId === Number(deptId)) ?? null,
    [departments, deptId],
  );


  useEffect(() => {
    (async () => {
      try {
        setLoadingDepartments(true);
        const data = await api.getDepartments();
        const sorted = [...data].sort((a, b) => sortAlphaNum(a.deptCode ?? a.name, b.deptCode ?? b.name));
        setDepartments(sorted);
      } catch {
        setError("Failed to load departments.");
      } finally {
        setLoadingDepartments(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!deptId) {
      setCourses([]);
      setCourseId(null);
      return;
    }

    const did = Number(deptId);
    (async () => {
      try {
        setError(null);
        setLoadingCourses(true);

        if (courseCache[did]) {
          setCourses(courseCache[did]);
          return;
        }

        const data = await api.getCourses(did);
        const sorted = [...data].sort((a, b) => sortAlphaNum(a.courseNumber, b.courseNumber));
        setCourses(sorted);
        setCourseCache((prev) => ({ ...prev, [did]: sorted }));
      } catch {
        setError("Failed to load courses.");
      } finally {
        setLoadingCourses(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptId]);


  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const match = q.toUpperCase().match(/^([A-Z]{2,5})\s*([0-9]{2,4}[A-Z]?)$/);
    if (!match) {
      setSearchResults([]);
      setShowSearchResults(true);
      return;
    }

    const deptCode = match[1];
    const courseNumPart = match[2];
    const dept = departments.find((d) => (d.deptCode ?? "").toUpperCase() === deptCode);
    if (!dept) {
      setSearchResults([]);
      setShowSearchResults(true);
      return;
    }

    (async () => {
      const did = dept.deptId;
      let deptCourses = courseCache[did];

      if (!deptCourses) {
        try {
          const data = await api.getCourses(did);
          const sorted = [...data].sort((a, b) => sortAlphaNum(a.courseNumber, b.courseNumber));
          deptCourses = sorted;
          setCourseCache((prev) => ({ ...prev, [did]: sorted }));
        } catch {
          setSearchResults([]);
          setShowSearchResults(true);
          return;
        }
      }

      const results = deptCourses
        .filter((c) => c.courseNumber.toUpperCase().includes(courseNumPart))
        .slice(0, 10)
        .map((course) => ({ dept, course }));

      setSearchResults(results);
      setShowSearchResults(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, departments]);

  const selectFromSearch = (dept: Department, course: Course) => {
    router.push(courseHref(dept.deptCode, course.courseNumber));
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const mainGridRef = useScrollReveal();

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-7 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h1 className={`${displayStyles.mdResponsive} text-text-primary`}>Browse Courses</h1>
        <p className={`${bodyStyles.lg} text-text-muted mt-1`}>
          Search by course code, or choose a department and course to see available offerings.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative max-w-3xl">
        <label htmlFor="course-search" className={`${labelStyles.lg} text-text-primary mb-2 block`}>
          Find a course
        </label>
        <div className="relative">
          <input
            id="course-search"
            type="text"
            placeholder="Try CMPT 213"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            className={`w-full pl-12 ${searchQuery ? "pr-12" : "pr-4"} py-3 border-2 border-border rounded-lg bg-background text-text-primary ${bodyStyles.lg} focus:outline-none focus:ring-2 focus:ring-ring transition-all`}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-subtle" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setShowSearchResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Clear course search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {showSearchResults && (
            <div className="absolute z-10 w-full mt-2 bg-surface-raised border border-border rounded-lg shadow-xl max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map(({ dept, course }) => (
                  <button
                    key={`${dept.deptId}-${course.courseId}`}
                    onClick={() => selectFromSearch(dept, course)}
                    className="w-full text-left px-4 py-3 hover:bg-surface transition-colors border-b border-border last:border-b-0"
                  >
                    <div className={`${labelStyles.lg} text-text-primary`}>
                      {dept.deptCode} {course.courseNumber}
                    </div>
                    <div className={`${bodyStyles.md} text-text-subtle`}>{dept.name}</div>
                  </button>
                ))
              ) : (
                <div className={`p-4 ${bodyStyles.md} text-text-muted`}>
                  No matches. Use format like <span className="font-semibold">CMPT 213</span>.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={() => setError(null)} />
        </div>
      )}

      <div ref={mainGridRef} className="max-w-3xl">
          <Card className="p-5 sm:p-6 rounded-2xl">
            <p className={`${bodyStyles.md} text-text-muted mb-5`}>Choose a department, then a course to view its available offerings.</p>
            <label htmlFor="department-select" className={`${headerStyles.md} text-text-primary mb-3 block`}>
              Department
            </label>

            <select
              id="department-select"
              title="select_dept"
              className={selectClass}
              value={deptId || ""}
              onChange={(e) => {
                setDeptId(e.target.value || null);
                setCourseId(null);
              }}
              disabled={loadingDepartments}
            >
              <option value="">Select a department…</option>
              {departments.map((d) => (
                <option key={d.deptId} value={d.deptId}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="mt-6">
              <label htmlFor="course-select" className={`${headerStyles.md} text-text-primary mb-3 block`}>Course</label>
              <select id="course-select" className={selectClass} value="" disabled={!selectedDept || loadingCourses} onChange={(event) => { const course = courses.find((item) => item.courseId === Number(event.target.value)); if (course && selectedDept) router.push(courseHref(selectedDept.deptCode, course.courseNumber)); }}>
                <option value="">{loadingCourses ? "Loading courses…" : selectedDept ? "Select a course…" : "Select a department first…"}</option>
                {courses.map((course) => <option key={course.courseId} value={course.courseId}>{course.courseNumber} — {course.title}</option>)}
              </select>
            </div>
          </Card>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BrowsePageContent />
    </Suspense>
  );
}
