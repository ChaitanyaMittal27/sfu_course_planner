"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeCourseIdentity } from "@/lib/course-routes";
import { resolveCourseIdentity, type ResolvedCourseRoute } from "@/lib/course-resolver";

export type CourseRouteResolution =
  | { status: "invalid" }
  | { status: "loading" }
  | { status: "notFound" }
  | { status: "error" }
  | { status: "resolved"; course: ResolvedCourseRoute };

type ResolutionResult = Exclude<CourseRouteResolution, { status: "invalid" } | { status: "loading" }> & {
  routeKey: string;
};

/**
 * Resolves a readable course URL exactly once per route identity.
 *
 * Pages should use this only for URL state. Their resource-specific data (for
 * example offerings or section results) remains local to the page.
 */
export function useCourseRouteResolution(
  deptCode: string | string[] | undefined,
  courseNumber: string | string[] | undefined,
): CourseRouteResolution {
  const identity = useMemo(() => {
    if (typeof deptCode !== "string" || typeof courseNumber !== "string") return null;
    return normalizeCourseIdentity(deptCode, courseNumber);
  }, [courseNumber, deptCode]);
  const routeKey = identity ? `${identity.deptCode}/${identity.courseNumber}` : null;
  const [result, setResult] = useState<ResolutionResult | null>(null);

  useEffect(() => {
    if (!identity || !routeKey) return;

    let active = true;
    void resolveCourseIdentity(identity)
      .then((course) => {
        if (!active) return;
        setResult(course ? { status: "resolved", course, routeKey } : { status: "notFound", routeKey });
      })
      .catch(() => active && setResult({ status: "error", routeKey }));

    return () => {
      active = false;
    };
  }, [identity, routeKey]);

  if (!identity || !routeKey) return { status: "invalid" };
  if (!result || result.routeKey !== routeKey) return { status: "loading" };
  if (result.status === "resolved") return { status: "resolved", course: result.course };
  return { status: result.status };
}
