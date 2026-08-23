"use client";

import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { bodyStyles, displayStyles } from "@/app/fonts";
import BackButton from "@/components/layout/BackButton";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import PageContainer from "@/components/layout/PageContainer";
import SectionComparisonResults from "@/components/course/SectionComparisonResults";
import { parsePositiveRouteInteger, sectionComparisonHref } from "@/lib/course-routes";
import { useCourseRouteResolution } from "@/hooks/useCourseRouteResolution";

export default function CanonicalSectionComparisonPage() {
  const params = useParams<{ deptCode: string; courseNumber: string; semesterCode: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const route = useCourseRouteResolution(params.deptCode, params.courseNumber);
  const semesterCode = useMemo(() => parsePositiveRouteInteger(params.semesterCode), [params.semesterCode]);
  const requestedSections = useMemo(
    () => (searchParams.get("sections") ?? "").split(",").filter(Boolean),
    [searchParams],
  );

  if (route.status === "invalid" || semesterCode === null) {
    return <PageContainer><ErrorMessage message="This section comparison link is invalid." /></PageContainer>;
  }
  if (route.status === "notFound") return <PageContainer><ErrorMessage message="This course could not be found." /></PageContainer>;
  if (route.status === "error") return <PageContainer><ErrorMessage message="Failed to resolve this course link." /></PageContainer>;
  if (route.status === "loading") return <LoadingSpinner />;

  const { course } = route;

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
