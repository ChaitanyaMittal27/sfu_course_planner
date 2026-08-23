import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { bodyStyles, headerStyles, labelStyles } from "@/app/fonts";
import type { Course, Department } from "@/lib/api";

type AnalyticsCourseSelectorProps = {
  departments: Department[];
  courses: Course[];
  selectedDepartmentId: string | null;
  selectedCourseId: string | null;
  selectedDepartment?: Department;
  selectedCourse?: Course;
  isLoadingCourses: boolean;
  onDepartmentChange: (value: string) => void;
  onCourseChange: (value: string) => void;
  children?: ReactNode;
};

const selectClass = `w-full rounded-md border border-border bg-background text-text-primary px-3 py-2 ${bodyStyles.md} focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50`;

export default function AnalyticsCourseSelector({
  departments,
  courses,
  selectedDepartmentId,
  selectedCourseId,
  selectedDepartment,
  selectedCourse,
  isLoadingCourses,
  onDepartmentChange,
  onCourseChange,
  children,
}: AnalyticsCourseSelectorProps) {
  const hasSelection = selectedDepartment && selectedCourse;

  return (
    <Card className="p-5 sm:p-6 mb-6 sm:mb-8">
      <CardContent className="p-0">
        <h2 className={`${headerStyles.md} text-text-primary mb-4`}>Select a course</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="analytics-department" className={`block ${labelStyles.md} text-text-primary mb-2`}>
              Department
            </label>
            <select
              id="analytics-department"
              value={selectedDepartmentId || ""}
              onChange={(event) => onDepartmentChange(event.target.value)}
              className={selectClass}
            >
              <option value="">Select a department…</option>
              {departments.map((department) => (
                <option key={department.deptId} value={department.deptId}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="analytics-course" className={`block ${labelStyles.md} text-text-primary mb-2`}>
              Course
            </label>
            <select
              id="analytics-course"
              value={selectedCourseId || ""}
              onChange={(event) => onCourseChange(event.target.value)}
              className={selectClass}
              disabled={!selectedDepartmentId || isLoadingCourses}
            >
              <option value="">{isLoadingCourses ? "Loading courses…" : "Select a course…"}</option>
              {[...courses]
                .sort((a, b) => a.courseNumber.localeCompare(b.courseNumber))
                .map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.courseNumber} — {course.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {hasSelection && (
          <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span className={`${labelStyles.lg} text-text-primary`}>
                {selectedDepartment.deptCode} {selectedCourse.courseNumber} — {selectedCourse.title}
              </span>
            </div>
            {children && <div className="mt-4">{children}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
