"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import CourseOfferingsPanel from "@/components/CourseOfferingsPanel";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { bodyStyles, displayStyles } from "@/app/fonts";
import { normalizeCourseIdentity } from "@/lib/course-routes";
import { resolveCourseIdentity, type ResolvedCourseRoute } from "@/lib/course-resolver";

export default function BrowseCoursePage() {
  const params = useParams<{ deptCode: string; courseNumber: string }>();
  const router = useRouter();
  const identity = useMemo(
    () => normalizeCourseIdentity(params.deptCode, params.courseNumber),
    [params.courseNumber, params.deptCode],
  );
  const [resolvedCourse, setResolvedCourse] = useState<ResolvedCourseRoute | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    if (!identity) return;

    void resolveCourseIdentity(identity)
      .then((course) => {
        if (!isActive) return;
        if (!course) setError("This course could not be found.");
        else setResolvedCourse(course);
      })
      .catch(() => {
        if (isActive) setError("Failed to resolve this course link.");
      });

    return () => {
      isActive = false;
    };
  }, [identity]);

  if (!identity) {
    return <main className="max-w-[1180px] mx-auto px-4 sm:px-7 py-8 sm:py-10"><ErrorMessage message="This course link is invalid." /></main>;
  }

  if (error) {
    return <main className="max-w-[1180px] mx-auto px-4 sm:px-7 py-8 sm:py-10"><ErrorMessage message={error} /></main>;
  }

  if (!resolvedCourse) return <LoadingSpinner />;

  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-7 py-8 sm:py-10">
      <BackButton onClick={() => router.push("/browse")} label="Back to Browse" className="mb-5" />
      <div className="mb-5 sm:mb-6">
        <h1 className={`${displayStyles.sm} text-text-primary`}>Browse Courses</h1>
        <p className={`${bodyStyles.lg} text-text-muted mt-1`}>Course offerings and enrollment details.</p>
      </div>
      <CourseOfferingsPanel reference={resolvedCourse} department={resolvedCourse.department} course={resolvedCourse.course} />
    </main>
  );
}
