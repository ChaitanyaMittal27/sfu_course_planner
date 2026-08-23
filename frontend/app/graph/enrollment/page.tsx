"use client";

import { useState, useEffect, Suspense } from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { graphCourseHref } from "@/lib/course-routes";
import { Users, BarChart2 } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import AnalyticsCourseSelector from "@/components/analytics/AnalyticsCourseSelector";
import TaskEmptyState from "@/components/TaskEmptyState";
import { api, Department, Course, EnrollmentDataPoint } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

function EnrollmentVsCapacityPageContent() {
  const router = useRouter();
  const [selectedDeptId, setSelectedDeptId] = useQueryState("deptId");
  const [selectedCourseId, setSelectedCourseId] = useQueryState("courseId");
  const [range, setRange] = useQueryState("range", { defaultValue: "5yr" });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chartData, setChartData] = useState<EnrollmentDataPoint[]>([]);

  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await api.getDepartments();
        setDepartments(data);
      } catch {
        setError("Failed to load departments");
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (!selectedDeptId) {
      setCourses([]);
      setSelectedCourseId(null);
      setChartData([]);
      return;
    }
    const fetchCourses = async () => {
      setLoadingCourses(true);
      setError(null);
      try {
        const data = await api.getCourses(parseInt(selectedDeptId));
        setCourses(data);
      } catch {
        setError("Failed to load courses");
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [selectedDeptId, setSelectedCourseId]);

  useEffect(() => {
    if (!selectedDeptId || !selectedCourseId) {
      setChartData([]);
      return;
    }
    const fetchChartData = async () => {
      setLoadingChart(true);
      setError(null);
      try {
        const data = await api.getEnrollmentHistory(parseInt(selectedDeptId), parseInt(selectedCourseId), range);
        setChartData(data);
      } catch {
        setError("Failed to load enrollment data");
        setChartData([]);
      } finally {
        setLoadingChart(false);
      }
    };
    fetchChartData();
  }, [selectedDeptId, selectedCourseId, range]);

  const selectedDept = departments.find((d) => d.deptId === parseInt(selectedDeptId || "0"));
  const selectedCourse = courses.find((c) => c.courseId === parseInt(selectedCourseId || "0"));

  useEffect(() => {
    if (selectedDept && selectedCourse) router.replace(graphCourseHref("enrollment", selectedDept.deptCode, selectedCourse.courseNumber, { range }));
  }, [range, router, selectedCourse, selectedDept]);

  const formatSemester = (semesterCode: number) => {
    const year = Math.floor(semesterCode / 10) - 100;
    const termCode = semesterCode % 10;
    const term = termCode === 1 ? "Sp" : termCode === 4 ? "Su" : "Fa";
    return `${term} ${year}`;
  };

  if (loadingDepts) {
    return (
      <PageContainer title="Enrollment vs Capacity">
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary`}>Enrollment vs Capacity</h1>
        <p className={`${bodyStyles.md} text-text-muted mt-1`}>
          Compare enrolled students to total capacity over time.
        </p>
      </div>

      <AnalyticsCourseSelector
        departments={departments}
        courses={courses}
        selectedDepartmentId={selectedDeptId}
        selectedCourseId={selectedCourseId}
        selectedDepartment={selectedDept}
        selectedCourse={selectedCourse}
        isLoadingCourses={loadingCourses}
        onDepartmentChange={(value) => setSelectedDeptId(value || null)}
        onCourseChange={(value) => setSelectedCourseId(value || null)}
      >
        <div className="border-t border-accent/20 pt-4">
          <span className={`block ${labelStyles.md} text-text-primary mb-2`}>Time range</span>
          <div className="flex flex-wrap gap-2">
            {["1yr", "3yr", "5yr"].map((value) => (
              <button
                key={value}
                onClick={() => setRange(value)}
                className={`rounded-lg px-4 py-2 ${labelStyles.lg} transition-all ${
                  range === value
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                    : "bg-surface-raised text-text-muted hover:bg-border"
                }`}
              >
                {value === "1yr" ? "1 year" : value === "3yr" ? "3 years" : "5 years"}
              </button>
            ))}
          </div>
        </div>
      </AnalyticsCourseSelector>

      {error && <ErrorMessage message={error} onRetry={() => window.location.reload()} />}

      {loadingChart && (
        <Card className="p-8">
          <LoadingSpinner />
        </Card>
      )}

      {!loadingChart && !error && chartData.length > 0 && (
        <Card className="p-6">
          <CardContent className="p-0">
            <h3 className={`${headerStyles.md} text-text-primary mb-6`}>Student Enrollment Trends</h3>

            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis
                    dataKey="semesterCode"
                    tickFormatter={formatSemester}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="var(--text-muted)"
                    tick={{ fill: "var(--text-muted)" }}
                  />
                  <YAxis
                    label={{ value: "Students", angle: -90, position: "insideLeft", fill: "var(--text-muted)" }}
                    stroke="var(--text-muted)"
                    tick={{ fill: "var(--text-muted)" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div
                            style={{
                              background: "var(--surface-raised)",
                              border: "1px solid var(--border)",
                              color: "var(--text-primary)",
                            }}
                            className="p-3 rounded-lg shadow-lg"
                          >
                            <p className="font-semibold">
                              {d.term} {d.year}
                            </p>
                            <p style={{ color: "var(--primary)", fontSize: "0.875rem" }}>Enrolled: {d.enrolled}</p>
                            <p style={{ color: "var(--text-subtle)", fontSize: "0.875rem" }}>Capacity: {d.capacity}</p>
                            <p style={{ color: "var(--text-primary)" }} className={labelStyles.md}>
                              Load: {d.loadPercent.toFixed(1)}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="enrolled"
                    name="Enrolled"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="capacity"
                    name="Capacity"
                    stroke="var(--text-subtle)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {!loadingChart && !error && chartData.length === 0 && selectedCourseId && (
        <TaskEmptyState
          icon={BarChart2}
          title="No enrollment data available"
          description="No enrollment data was found for this course in the selected time range."
        />
      )}

      {!selectedCourseId && (
        <TaskEmptyState
          icon={Users}
          title="Choose a course to compare enrollment"
          description="Select a department and course above to compare enrollment with capacity over time."
        />
      )}
    </PageContainer>
  );
}

export default function EnrollmentVsCapacityPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EnrollmentVsCapacityPageContent />
    </Suspense>
  );
}
