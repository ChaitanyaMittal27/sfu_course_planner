"use client";

import { useState, useEffect, Suspense } from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { graphCourseHref } from "@/lib/course-routes";
import { BarChart2, Info, AlertCircle, ClipboardList } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import GradeHistogram from "@/components/analytics/GradeHistogram";
import AnalyticsCourseSelector from "@/components/analytics/AnalyticsCourseSelector";
import TaskEmptyState from "@/components/feedback/TaskEmptyState";
import { api, Department, Course, GradeDistribution } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { displayStyles, headerStyles, bodyStyles } from "@/app/fonts";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";

function GradeDistributionPageContent() {
  const router = useRouter();
  const [selectedDeptId, setSelectedDeptId] = useQueryState("deptId");
  const [selectedCourseId, setSelectedCourseId] = useQueryState("courseId");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [gradeData, setGradeData] = useState<GradeDistribution | null>(null);

  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestVersion, retry } = useRetryableRequest();

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
  }, [requestVersion]);

  useEffect(() => {
    if (!selectedDeptId) {
      setCourses([]);
      setSelectedCourseId(null);
      setGradeData(null);
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
  }, [requestVersion, selectedDeptId, setSelectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setGradeData(null);
      return;
    }
    const fetchGrades = async () => {
      setLoadingGrades(true);
      setError(null);
      try {
        const data = await api.getGradeDistribution(parseInt(selectedCourseId));
        setGradeData(data);
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("404")) {
          setError("Grade distribution not available for this course");
        } else {
          setError("Failed to load grade distribution");
        }
        setGradeData(null);
      } finally {
        setLoadingGrades(false);
      }
    };
    fetchGrades();
  }, [requestVersion, selectedCourseId]);

  const selectedDept = departments.find((d) => d.deptId === parseInt(selectedDeptId || "0"));
  const selectedCourse = courses.find((c) => c.courseId === parseInt(selectedCourseId || "0"));

  useEffect(() => {
    if (selectedDept && selectedCourse) router.replace(graphCourseHref("grades", selectedDept.deptCode, selectedCourse.courseNumber));
  }, [router, selectedCourse, selectedDept]);

  if (loadingDepts) {
    return (
      <PageContainer title="Grade Distribution">
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary`}>Grade Distribution</h1>
        <p className={`${bodyStyles.md} text-text-muted mt-1`}>View historical grade breakdowns from CourseDiggers.</p>
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
      />

      {error && (
        <ErrorMessage
          message={error}
          onRetry={retry}
        />
      )}

      {loadingGrades && (
        <Card className="p-8">
          <LoadingSpinner />
        </Card>
      )}

      {!loadingGrades && !error && gradeData && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <CardContent className="p-0 flex items-center space-x-3">
                <div className="w-12 h-12 bg-surface-raised rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-text-muted" />
                </div>
                <div>
                  <div className={`${bodyStyles.md} text-text-muted`}>Median Grade</div>
                  <div className={`${displayStyles.sm} text-text-primary`}>{gradeData.medianGrade || "N/A"}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0 flex items-center space-x-3">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <div className={`${bodyStyles.md} text-text-muted`}>Fail Rate</div>
                  <div className={`${displayStyles.sm} text-text-primary`}>
                    {gradeData.failRate != null ? `${gradeData.failRate.toFixed(2)}%` : "N/A"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="p-6">
            <CardContent className="p-0">
              <h3 className={`${headerStyles.md} text-text-primary mb-4`}>Grade Breakdown</h3>
              {gradeData.distribution && Object.keys(gradeData.distribution).length > 0 ? (
                <GradeHistogram distribution={gradeData.distribution} />
              ) : (
                <div className={`text-center py-8 ${bodyStyles.md} text-text-subtle`}>
                  No grade distribution data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardContent className="p-0 flex items-start space-x-2">
              <Info className="w-5 h-5 text-text-subtle shrink-0 mt-0.5" />
              <p className={`${bodyStyles.md} text-text-muted`}>
                Grade data sourced from CourseDiggers. This represents course-level historical averages and is not
                specific to individual semesters or instructors.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!loadingGrades && !error && !gradeData && selectedCourseId && (
        <TaskEmptyState
          icon={BarChart2}
          title="No grade data available"
          description="Grade distribution data is not available for this course."
        />
      )}

      {!selectedCourseId && (
        <TaskEmptyState
          icon={BarChart2}
          title="Choose a course to view grade data"
          description="Select a department and course above to view its historical grade distribution."
        />
      )}
    </PageContainer>
  );
}

export default function GradeDistributionPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GradeDistributionPageContent />
    </Suspense>
  );
}
