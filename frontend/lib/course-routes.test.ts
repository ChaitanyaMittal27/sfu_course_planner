import { describe, expect, it } from "vitest";
import {
  courseHref,
  graphCourseHref,
  normalizeCourseIdentity,
  offeringHref,
  parseComparedCourses,
  parseLegacyCourseRoute,
  parsePositiveRouteInteger,
  sectionCode,
  sectionComparisonHref,
  serializeComparedCourses,
} from "@/lib/course-routes";

describe("course route helpers", () => {
  it("normalizes valid course identities and rejects invalid segments", () => {
    expect(normalizeCourseIdentity(" CMPT ", " 225A ")).toEqual({ deptCode: "cmpt", courseNumber: "225a" });
    expect(normalizeCourseIdentity("CMPT1", "225")).toBeNull();
    expect(normalizeCourseIdentity("CMPT", "2")).toBeNull();
  });

  it("creates canonical browse, offering, and analytics paths", () => {
    expect(courseHref("CMPT", "225")).toBe("/browse/cmpt/225");
    expect(offeringHref("CMPT", "225", 1267)).toBe("/browse/cmpt/225/1267");
    expect(offeringHref("CMPT", "225", 0)).toBe("/browse/cmpt/225");
    expect(graphCourseHref("enrollment", "CMPT", "225", { range: "3yr" })).toBe("/graph/enrollment/cmpt/225?range=3yr");
    expect(graphCourseHref("grades", "invalid", "225")).toBe("/graph/grades");
  });

  it("keeps comparison URLs readable and stable", () => {
    expect(sectionComparisonHref("CMPT", "225", 1267, ["D100", "D200"])).toBe(
      "/compare/sections/cmpt/225/1267?sections=D100%2CD200",
    );
    expect(sectionComparisonHref("CMPT", "225", -1)).toBe("/compare/sections");
    expect(sectionCode("CMPT 225 d100")).toBe("D100");
    expect(sectionCode("  D200  ")).toBe("D200");
  });

  it("parses compatible legacy IDs without accepting malformed values", () => {
    expect(parsePositiveRouteInteger("14")).toBe(14);
    expect(parsePositiveRouteInteger(["14"])).toBeNull();
    expect(parsePositiveRouteInteger("0")).toBeNull();
    expect(parseLegacyCourseRoute(null, null)).toEqual({ status: "none" });
    expect(parseLegacyCourseRoute("14", "3998")).toEqual({ status: "valid", deptId: 14, courseId: 3998 });
    expect(parseLegacyCourseRoute("14", "course")).toEqual({ status: "invalid" });
  });

  it("serializes and parses valid compared-course selections only", () => {
    const serialized = serializeComparedCourses([
      { deptCode: "CMPT", courseNumber: "225" },
      { deptCode: "bad!", courseNumber: "999" },
    ]);

    expect(serialized).toBe("cmpt-225");
    expect(parseComparedCourses("CMPT-225,invalid,math-150a")).toEqual([
      { deptCode: "cmpt", courseNumber: "225" },
      { deptCode: "math", courseNumber: "150a" },
    ]);
  });
});
