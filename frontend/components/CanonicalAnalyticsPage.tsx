"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { BarChart2, TrendingUp, Users } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import AnalyticsCourseSelector from "@/components/analytics/AnalyticsCourseSelector";
import ErrorMessage from "@/components/ErrorMessage";
import GradeHistogram from "@/components/GradeHistogram";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageContainer from "@/components/PageContainer";
import TaskEmptyState from "@/components/TaskEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { bodyStyles, displayStyles, headerStyles, labelStyles } from "@/app/fonts";
import { api } from "@/lib/api";
import { graphCourseHref, normalizeCourseIdentity } from "@/lib/course-routes";
import { resolveCourseIdentity, type ResolvedCourseRoute } from "@/lib/course-resolver";
import type { Course, Department, EnrollmentDataPoint, GradeDistribution } from "@/lib/types";

type AnalyticsKind = "grades" | "enrollment" | "load";

const content: Record<AnalyticsKind, { title: string; description: string; empty: string }> = {
  grades: { title: "Grade Distribution", description: "View historical grade breakdowns from CourseDiggers.", empty: "Choose a course to view grade data." },
  enrollment: { title: "Enrollment vs Capacity", description: "Compare enrolled students to total capacity over time.", empty: "Choose a course to compare enrollment." },
  load: { title: "Load Over Time", description: "Track enrollment percentage across semesters.", empty: "Choose a course to view enrollment load." },
};

export default function CanonicalAnalyticsPage({ kind }: { kind: AnalyticsKind }) {
  const params = useParams<{ deptCode: string; courseNumber: string }>();
  const router = useRouter();
  const [range, setRange] = useQueryState("range", { defaultValue: "5yr" });
  const identity = useMemo(() => normalizeCourseIdentity(params.deptCode, params.courseNumber), [params.courseNumber, params.deptCode]);
  const [resolved, setResolved] = useState<ResolvedCourseRoute | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [data, setData] = useState<GradeDistribution | EnrollmentDataPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identity) return;
    let active = true;
    void Promise.all([resolveCourseIdentity(identity), api.getDepartments()]).then(([course, depts]) => {
      if (!active) return;
      if (!course) setError("This course could not be found.");
      else {
        setResolved(course);
        setDepartments(depts);
        setCourses([course.course]);
      }
    }).catch(() => active && setError("Failed to resolve this course link."));
    return () => { active = false; };
  }, [identity]);

  useEffect(() => {
    if (!resolved) return;
    let active = true;
    const request = kind === "grades"
      ? api.getGradeDistribution(resolved.courseId)
      : api.getEnrollmentHistory(resolved.deptId, resolved.courseId, range);
    void request.then((result) => active && setData(result)).catch(() => active && setError(`Failed to load ${content[kind].title.toLowerCase()} data.`));
    return () => { active = false; };
  }, [kind, range, resolved]);

  const selectedDepartment = resolved?.department;
  const selectedCourse = resolved?.course;
  const handleDepartmentChange = async (value: string) => {
    const deptId = Number(value);
    const department = departments.find((item) => item.deptId === deptId);
    if (!department) return;
    setCourses(await api.getCourses(deptId));
    setResolved(null);
    setData(null);
  };
  const handleCourseChange = (value: string) => {
    const course = courses.find((item) => item.courseId === Number(value));
    const department = departments.find((item) => item.deptId === course?.deptId);
    if (course && department) router.push(graphCourseHref(kind, department.deptCode, course.courseNumber, kind === "grades" ? undefined : { range }));
  };

  if (!identity) return <PageContainer><ErrorMessage message="This analytics link is invalid." /></PageContainer>;
  if (error) return <PageContainer><ErrorMessage message={error} /></PageContainer>;
  if (!resolved) return <LoadingSpinner />;

  return <PageContainer>
    <div className="mb-6"><h1 className={`${displayStyles.sm} text-text-primary`}>{content[kind].title}</h1><p className={`${bodyStyles.md} text-text-muted mt-1`}>{content[kind].description}</p></div>
    <AnalyticsCourseSelector departments={departments} courses={courses} selectedDepartmentId={String(resolved.deptId)} selectedCourseId={String(resolved.courseId)} selectedDepartment={selectedDepartment} selectedCourse={selectedCourse} isLoadingCourses={false} onDepartmentChange={handleDepartmentChange} onCourseChange={handleCourseChange}>
      {kind !== "grades" && <div className="border-t border-accent/20 pt-4"><span className={`block ${labelStyles.md} text-text-primary mb-2`}>Time range</span><div className="flex gap-2">{["1yr", "3yr", "5yr"].map((value) => <button key={value} onClick={() => setRange(value)} className={`rounded-lg px-4 py-2 ${labelStyles.lg} ${range === value ? "bg-primary text-primary-foreground" : "bg-surface-raised text-text-muted"}`}>{value}</button>)}</div></div>}
    </AnalyticsCourseSelector>
    {!data && <LoadingSpinner />}
    {kind === "grades" && data && <Card className="p-6"><CardContent className="p-0"><div className="flex gap-8 mb-6"><div><p className={`${bodyStyles.md} text-text-muted`}>Median Grade</p><p className={`${headerStyles.lg} text-text-primary`}>{(data as GradeDistribution).medianGrade || "N/A"}</p></div><div><p className={`${bodyStyles.md} text-text-muted`}>Fail Rate</p><p className={`${headerStyles.lg} text-text-primary`}>{(data as GradeDistribution).failRate?.toFixed(2) ?? "N/A"}%</p></div></div><GradeHistogram distribution={(data as GradeDistribution).distribution} /></CardContent></Card>}
    {kind !== "grades" && data && <Card className="p-6"><CardContent className="p-0"><div className="h-96"><ResponsiveContainer width="100%" height="100%"><LineChart data={data as EnrollmentDataPoint[]}><XAxis dataKey="semesterCode" /><YAxis /><Tooltip /><Line type="monotone" dataKey={kind === "load" ? "loadPercent" : "enrolled"} stroke="var(--primary)" /><Line type="monotone" dataKey={kind === "load" ? undefined : "capacity"} stroke="var(--text-subtle)" /></LineChart></ResponsiveContainer></div></CardContent></Card>}
    {!data && <TaskEmptyState icon={kind === "grades" ? BarChart2 : kind === "load" ? TrendingUp : Users} title={content[kind].empty} description="Choose a valid course to continue." />}
  </PageContainer>;
}
