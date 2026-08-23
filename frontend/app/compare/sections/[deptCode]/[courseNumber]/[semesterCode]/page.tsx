"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { bodyStyles, displayStyles } from "@/app/fonts";
import BackButton from "@/components/BackButton";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageContainer from "@/components/PageContainer";
import SectionComparisonResults from "@/components/SectionComparisonResults";
import { normalizeCourseIdentity, sectionComparisonHref } from "@/lib/course-routes";
import { resolveCourseIdentity, type ResolvedCourseRoute } from "@/lib/course-resolver";

export default function CanonicalSectionComparisonPage() {
  const params = useParams<{ deptCode: string; courseNumber: string; semesterCode: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const identity = useMemo(
    () => normalizeCourseIdentity(params.deptCode, params.courseNumber),
    [params.courseNumber, params.deptCode],
  );
  const semesterCode = Number(params.semesterCode);
  const [course, setCourse] = useState<ResolvedCourseRoute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestedSections = useMemo(
    () => (searchParams.get("sections") ?? "").split(",").filter(Boolean),
    [searchParams],
  );

  useEffect(() => {
    if (!identity) return;
    let active = true;

    void resolveCourseIdentity(identity)
      .then((resolvedCourse) => {
        if (!active) return;
        if (!resolvedCourse) setError("This course could not be found.");
        else setCourse(resolvedCourse);
      })
      .catch(() => active && setError("Failed to resolve this course link."));

    return () => {
      active = false;
    };
  }, [identity]);

  if (!identity || !Number.isSafeInteger(semesterCode) || semesterCode <= 0) {
    return <PageContainer><ErrorMessage message="This section comparison link is invalid." /></PageContainer>;
  }
  if (error) return <PageContainer><ErrorMessage message={error} /></PageContainer>;
  if (!course) return <LoadingSpinner />;

  const updateSelectedSections = (sections: string[]) => {
    router.replace(sectionComparisonHref(course.deptCode, course.courseNumber, semesterCode, sections));
  };

  return (
    <PageContainer>
      <BackButton className="mb-5" label="Choose another course" onClick={() => router.push("/compare/sections")} />
      <div className="mb-6">
        <h1 className={`${displayStyles.mdResponsive} mb-2 text-text-primary`}>Compare Sections</h1>
        <p className={`${bodyStyles.md} text-text-muted`}>
          {course.department.deptCode} {course.course.courseNumber} — choose two or three sections to compare.
        </p>
      </div>
      <SectionComparisonResults
        key={`${course.courseId}-${semesterCode}`}
        course={course}
        semesterCode={semesterCode}
        requestedSections={requestedSections}
        onSectionsChange={updateSelectedSections}
      />
    </PageContainer>
  );
}
