export interface CourseRouteIdentity {
  deptCode: string;
  courseNumber: string;
}

export interface CourseRouteReference extends CourseRouteIdentity {
  deptId: number;
  courseId: number;
}

function normalizeSegment(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeCourseIdentity(deptCode: string, courseNumber: string): CourseRouteIdentity | null {
  const normalizedDeptCode = normalizeSegment(deptCode);
  const normalizedCourseNumber = normalizeSegment(courseNumber);

  if (!/^[a-z]{2,5}$/.test(normalizedDeptCode) || !/^\d{2,4}[a-z]?$/.test(normalizedCourseNumber)) {
    return null;
  }

  return { deptCode: normalizedDeptCode, courseNumber: normalizedCourseNumber };
}

export function courseHref(deptCode: string, courseNumber: string) {
  const identity = normalizeCourseIdentity(deptCode, courseNumber);
  return identity ? `/browse/${identity.deptCode}/${identity.courseNumber}` : "/browse";
}

export function offeringHref(deptCode: string, courseNumber: string, semesterCode: number) {
  const coursePath = courseHref(deptCode, courseNumber);
  return Number.isSafeInteger(semesterCode) && semesterCode > 0 ? `${coursePath}/${semesterCode}` : coursePath;
}

export function graphCourseHref(
  graph: "grades" | "enrollment" | "load",
  deptCode: string,
  courseNumber: string,
  options?: { range?: string },
) {
  const identity = normalizeCourseIdentity(deptCode, courseNumber);
  const basePath = identity ? `/graph/${graph}/${identity.deptCode}/${identity.courseNumber}` : `/graph/${graph}`;
  return options?.range ? `${basePath}?range=${encodeURIComponent(options.range)}` : basePath;
}

export function sectionComparisonHref(
  deptCode: string,
  courseNumber: string,
  semesterCode: number,
  sections?: string[],
) {
  const identity = normalizeCourseIdentity(deptCode, courseNumber);
  if (!identity || !Number.isSafeInteger(semesterCode) || semesterCode <= 0) return "/compare/sections";

  const basePath = `/compare/sections/${identity.deptCode}/${identity.courseNumber}/${semesterCode}`;
  const selectedSections = sections?.filter(Boolean) ?? [];
  return selectedSections.length > 0 ? `${basePath}?sections=${encodeURIComponent(selectedSections.join(","))}` : basePath;
}

export function serializeComparedCourses(courses: CourseRouteIdentity[]) {
  return courses
    .map((course) => normalizeCourseIdentity(course.deptCode, course.courseNumber))
    .filter((course): course is CourseRouteIdentity => course !== null)
    .map((course) => `${course.deptCode}-${course.courseNumber}`)
    .join(",");
}

export function parseComparedCourses(value: string | null) {
  if (!value) return [];

  return value.split(",").flatMap((entry) => {
    const match = /^([a-z]{2,5})-(\d{2,4}[a-z]?)$/i.exec(entry.trim());
    if (!match) return [];

    const identity = normalizeCourseIdentity(match[1], match[2]);
    return identity ? [identity] : [];
  });
}
