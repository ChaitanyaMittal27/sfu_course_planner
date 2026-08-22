"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import OfferingDetailScreen from "@/components/OfferingDetailScreen";
import { api } from "@/lib/api";
import { courseHref, normalizeCourseIdentity } from "@/lib/course-routes";
import { resolveCourseIdentity, type ResolvedCourseRoute } from "@/lib/course-resolver";
import type { OfferingDetail } from "@/lib/types";

function parseSemesterCode(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function CanonicalOfferingDetailPage() {
  const params = useParams<{ deptCode: string; courseNumber: string; semesterCode: string }>();
  const identity = useMemo(
    () => normalizeCourseIdentity(params.deptCode, params.courseNumber),
    [params.courseNumber, params.deptCode],
  );
  const semesterCode = parseSemesterCode(params.semesterCode);
  const [course, setCourse] = useState<ResolvedCourseRoute | null>(null);
  const [detail, setDetail] = useState<OfferingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const routeIdentity = identity;
    const routeSemesterCode = semesterCode;
    if (!routeIdentity || routeSemesterCode === null) return;

    async function loadOffering() {
      try {
        const resolvedCourse = await resolveCourseIdentity(routeIdentity!);
        if (!resolvedCourse) throw new Error("not-found");
        const offering = await api.getOfferingDetail(resolvedCourse.deptId, resolvedCourse.courseId, routeSemesterCode!);
        if (!isActive) return;
        setCourse(resolvedCourse);
        setDetail(offering);
      } catch (cause) {
        if (!isActive) return;
        setError(cause instanceof Error && cause.message === "not-found" ? "This offering could not be found." : "Failed to load offering details.");
      }
    }

    void loadOffering();
    return () => {
      isActive = false;
    };
  }, [identity, semesterCode]);

  if (error) return <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><ErrorMessage message={error} /></main>;
  if (!identity || semesterCode === null) {
    return <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><ErrorMessage message="This offering link is invalid." /></main>;
  }
  if (!course || !detail) return <LoadingSpinner />;

  return <OfferingDetailScreen detail={detail} backHref={courseHref(course.deptCode, course.courseNumber)} />;
}
