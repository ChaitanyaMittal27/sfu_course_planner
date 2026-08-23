"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { offeringHref } from "@/lib/course-routes";
import { resolveCourseIds } from "@/lib/course-resolver";

function parsePositiveInteger(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function OfferingDetailPage() {
  const router = useRouter();
  const params = useParams<{ deptId: string; courseId: string; semesterCode: string }>();
  const deptId = parsePositiveInteger(params.deptId);
  const courseId = parsePositiveInteger(params.courseId);
  const semesterCode = parsePositiveInteger(params.semesterCode);
  const [error, setError] = useState<string | null>(null);
  const canResolve = deptId !== null && courseId !== null && semesterCode !== null;

  useEffect(() => {
    if (!canResolve || deptId === null || courseId === null || semesterCode === null) {
      return;
    }

    void resolveCourseIds(deptId, courseId)
      .then((course) => {
        if (!course) setError("This offering could not be found.");
        else router.replace(offeringHref(course.deptCode, course.courseNumber, semesterCode));
      })
      .catch(() => setError("Failed to resolve this offering link."));
  }, [canResolve, courseId, deptId, router, semesterCode]);

  if (!canResolve) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ErrorMessage message="This offering link is invalid." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ErrorMessage message={error} />
      </main>
    );
  }

  return <LoadingSpinner />;
}
