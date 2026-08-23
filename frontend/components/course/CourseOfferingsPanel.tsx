"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import OfferingsTable from "@/components/course/OfferingsTable";
import { Card } from "@/components/ui/card";
import { bodyStyles, headerStyles } from "@/app/fonts";
import { api } from "@/lib/api";
import { offeringHref, type CourseRouteReference } from "@/lib/course-routes";
import { useRetryableRequest } from "@/hooks/useRetryableRequest";
import type { Course, CourseOffering, Department, TermInfo } from "@/lib/types";

interface CourseOfferingsPanelProps {
  reference: CourseRouteReference;
  department: Department;
  course: Course;
}

export default function CourseOfferingsPanel({ reference, department, course }: CourseOfferingsPanelProps) {
  const router = useRouter();
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [enrollingTerm, setEnrollingTerm] = useState<TermInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { requestVersion, retry } = useRetryableRequest();

  useEffect(() => {
    let isActive = true;

    async function loadOfferings() {
      setError(null);
      setIsLoading(true);

      try {
        const [offeringData, term] = await Promise.all([api.getOfferings(reference.deptId, reference.courseId), api.getEnrollingTerm()]);
        if (!isActive) return;
        setOfferings([...offeringData].sort((a, b) => b.semesterCode - a.semesterCode));
        setEnrollingTerm(term);
      } catch {
        if (isActive) setError("Failed to load course offerings.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadOfferings();
    return () => {
      isActive = false;
    };
  }, [reference.courseId, reference.deptId, requestVersion]);

  return (
    <Card className="p-5 sm:p-6 rounded-2xl min-h-64">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className={`${headerStyles.lg} text-text-primary`}>
            {department.name} {course.courseNumber} : {course.title}
          </div>
          <div className={`${bodyStyles.md} text-text-muted`}>Click a term row to open full details.</div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={retry} />}
      {isLoading && <LoadingSpinner />}
      {!isLoading && !error && offerings.length === 0 && <div className={`${bodyStyles.md} text-text-muted`}>No offerings found.</div>}
      {!isLoading && !error && (
        <OfferingsTable
          offerings={offerings}
          enrollingTerm={enrollingTerm}
          onRowClick={(offering) => router.push(offeringHref(reference.deptCode, reference.courseNumber, offering.semesterCode))}
        />
      )}
    </Card>
  );
}
