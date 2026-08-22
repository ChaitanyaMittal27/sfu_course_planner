"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import OfferingDetailScreen from "@/components/OfferingDetailScreen";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { api } from "@/lib/api";
import type { OfferingDetail } from "@/lib/types";

function parsePositiveInteger(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function OfferingDetailPage() {
  const params = useParams<{ deptId: string; courseId: string; semesterCode: string }>();
  const deptId = parsePositiveInteger(params.deptId);
  const courseId = parsePositiveInteger(params.courseId);
  const semesterCode = parsePositiveInteger(params.semesterCode);
  const [detail, setDetail] = useState<OfferingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const canLoad = deptId !== null && courseId !== null && semesterCode !== null;

  const loadDetail = useCallback(async () => {
    if (!canLoad || deptId === null || courseId === null || semesterCode === null) {
      setError("This offering link is invalid.");
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const data = await api.getOfferingDetail(deptId, courseId, semesterCode);
      setDetail(data);
    } catch {
      setError("Failed to load offering details.");
    } finally {
      setIsLoading(false);
    }
  }, [canLoad, courseId, deptId, semesterCode]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail, retryCount]);

  const backHref = canLoad ? `/browse?dept=${deptId}&course=${courseId}` : "/browse";

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !detail) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ErrorMessage message={error ?? "Offering details are unavailable."} onRetry={() => setRetryCount((count) => count + 1)} />
      </main>
    );
  }

  return <OfferingDetailScreen detail={detail} backHref={backHref} />;
}
