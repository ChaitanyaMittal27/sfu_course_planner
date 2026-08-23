"use client";

import { useState, useEffect, Suspense } from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { graphCourseHref } from "@/lib/course-routes";
import { TrendingUp, BarChart2 } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import AnalyticsCourseSelector from "@/components/analytics/AnalyticsCourseSelector";
import TaskEmptyState from "@/components/TaskEmptyState";
import { api, Department, Course, EnrollmentDataPoint } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { displayStyles, headerStyles, bodyStyles, labelStyles } from "@/app/fonts";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

function LoadOverTimePageContent() {
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
    if (selectedDept && selectedCourse) router.replace(graphCourseHref("load", selectedDept.deptCode, selectedCourse.courseNumber, { range }));
  }, [range, router, selectedCourse, selectedDept]);

  const formatSemester = (semesterCode: number) => {
    const year = Math.floor(semesterCode / 10) - 100;
    const termCode = semesterCode % 10;
    const term = termCode === 1 ? "Sp" : termCode === 4 ? "Su" : "Fa";
    return `${term} ${year}`;
  };

  const getLoadColor = (load: number) => {
    if (load < 80) return "var(--success)";
    if (load < 95) return "var(--warning)";
    return "var(--destructive)";
  };

  const CustomDot = (props: { cx?: number; cy?: number; payload?: EnrollmentDataPoint }) => {
    const { cx, cy, payload } = props;
    if (typeof cx !== "number" || typeof cy !== "number" || !payload) return null;
    return (
      <circle cx={cx} cy={cy} r={5} fill={getLoadColor(payload.loadPercent)} stroke="var(--background)" strokeWidth={2} />
    );
  };

  if (loadingDepts) {
    return (
      <PageContainer title="Load Over Time">
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary`}>Load Over Time</h1>
        <p className={`${bodyStyles.md} text-text-muted mt-1`}>Track enrollment percentage across semesters. Select Department and Course to load.</p>
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
            <div className="flex items-center justify-between mb-6">
              <h3 className={`${headerStyles.md} text-text-primary`}>Enrollment Load (%)</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className={`${bodyStyles.md} text-text-muted`}>&lt; 80%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className={`${bodyStyles.md} text-text-muted`}>80-95%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className={`${bodyStyles.md} text-text-muted`}>&gt; 95%</span>
                </div>
              </div>
            </div>

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
                    domain={[0, 100]}
                    label={{ value: "Load %", angle: -90, position: "insideLeft", fill: "var(--text-muted)" }}
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
                            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                              Enrolled: {d.enrolled} / {d.capacity}
                            </p>
                            <p style={{ color: getLoadColor(d.loadPercent) }} className={labelStyles.md}>
                              Load: {d.loadPercent.toFixed(1)}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={80} stroke="var(--warning)" strokeDasharray="3 3" opacity={0.5} />
                  <ReferenceLine y={95} stroke="var(--destructive)" strokeDasharray="3 3" opacity={0.5} />
                  <Line
                    type="monotone"
                    dataKey="loadPercent"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={<CustomDot />}
                    activeDot={{ r: 8 }}
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
          title="No load data available"
          description="No enrollment data was found for this course in the selected time range."
        />
      )}

      {!selectedCourseId && (
        <TaskEmptyState
          icon={TrendingUp}
          title="Choose a course to view load"
          description="Select a department and course above to view its enrollment load over time."
        />
      )}
    </PageContainer>
  );
}

export default function LoadOverTimePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoadOverTimePageContent />
    </Suspense>
  );
}
