"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import OfferingDetailScreen from "@/components/OfferingDetailScreen";
import { api } from "@/lib/api";
import { courseHref, parsePositiveRouteInteger } from "@/lib/course-routes";
import { useCourseRouteResolution } from "@/hooks/useCourseRouteResolution";
import type { OfferingDetail } from "@/lib/types";

export default function CanonicalOfferingDetailPage() {
  const params = useParams<{ deptCode: string; courseNumber: string; semesterCode: string }>();
  const route = useCourseRouteResolution(params.deptCode, params.courseNumber);
  const semesterCode = useMemo(() => parsePositiveRouteInteger(params.semesterCode), [params.semesterCode]);
  const [detail, setDetail] = useState<{ routeKey: string; offering: OfferingDetail } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resolvedCourse = route.status === "resolved" ? route.course : null;
  const routeKey = resolvedCourse && semesterCode !== null
    ? `${resolvedCourse.deptId}/${resolvedCourse.courseId}/${semesterCode}`
    : null;

  useEffect(() => {
    let isActive = true;
    if (!resolvedCourse || semesterCode === null || routeKey === null) return;
    const courseToLoad = resolvedCourse;
    const semesterToLoad = semesterCode;
    const detailRouteKey = routeKey;

    async function loadOffering() {
      try {
        const offering = await api.getOfferingDetail(courseToLoad.deptId, courseToLoad.courseId, semesterToLoad);
        if (!isActive) return;
        setDetail({ routeKey: detailRouteKey, offering });
      } catch {
        if (!isActive) return;
        setError("Failed to load offering details.");
      }
    }

    void loadOffering();
    return () => {
      isActive = false;
    };
  }, [resolvedCourse, routeKey, semesterCode]);

  if (route.status === "invalid" || semesterCode === null) {
    return <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><ErrorMessage message="This offering link is invalid." /></main>;
  }
  if (route.status === "notFound") {
    return <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><ErrorMessage message="This offering could not be found." /></main>;
  }
  if (route.status === "error" || error) {
    return <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><ErrorMessage message={error ?? "Failed to resolve this offering link."} /></main>;
  }
  if (route.status !== "resolved" || !detail || detail.routeKey !== routeKey) return <LoadingSpinner />;

  return <OfferingDetailScreen detail={detail.offering} backHref={courseHref(route.course.deptCode, route.course.courseNumber)} />;
}
