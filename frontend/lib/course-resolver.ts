import { api } from "@/lib/api";
import type { Course, Department } from "@/lib/types";
import { normalizeCourseIdentity, type CourseRouteIdentity, type CourseRouteReference } from "@/lib/course-routes";

export interface ResolvedCourseRoute extends CourseRouteReference {
  department: Department;
  course: Course;
}

const departmentsPromise = new Map<string, Promise<Department[]>>();
const coursesPromise = new Map<number, Promise<Course[]>>();

function getCachedRequest<Key, Value>(
  cache: Map<Key, Promise<Value>>,
  key: Key,
  createRequest: () => Promise<Value>,
) {
  const existing = cache.get(key);
  if (existing) return existing;

  const request = createRequest();
  const cachedRequest = request.catch((error: unknown) => {
    if (cache.get(key) === cachedRequest) cache.delete(key);
    throw error;
  });

  cache.set(key, cachedRequest);
  return cachedRequest;
}

function loadDepartments() {
  return getCachedRequest(departmentsPromise, "all", api.getDepartments);
}

function loadCourses(deptId: number) {
  return getCachedRequest(coursesPromise, deptId, () => api.getCourses(deptId));
}

export async function resolveCourseIdentity(identity: CourseRouteIdentity): Promise<ResolvedCourseRoute | null> {
  const normalized = normalizeCourseIdentity(identity.deptCode, identity.courseNumber);
  if (!normalized) return null;

  const departments = await loadDepartments();
  const department = departments.find((item) => item.deptCode.toLowerCase() === normalized.deptCode);
  if (!department) return null;

  const courses = await loadCourses(department.deptId);
  const course = courses.find((item) => item.courseNumber.toLowerCase() === normalized.courseNumber);
  if (!course) return null;

  return {
    deptId: department.deptId,
    courseId: course.courseId,
    deptCode: department.deptCode.toLowerCase(),
    courseNumber: course.courseNumber.toLowerCase(),
    department,
    course,
  };
}

export async function resolveCourseIds(deptId: number, courseId: number): Promise<ResolvedCourseRoute | null> {
  if (!Number.isSafeInteger(deptId) || !Number.isSafeInteger(courseId) || deptId <= 0 || courseId <= 0) return null;

  const departments = await loadDepartments();
  const department = departments.find((item) => item.deptId === deptId);
  if (!department) return null;

  const courses = await loadCourses(deptId);
  const course = courses.find((item) => item.courseId === courseId);
  if (!course) return null;

  return {
    deptId,
    courseId,
    deptCode: department.deptCode.toLowerCase(),
    courseNumber: course.courseNumber.toLowerCase(),
    department,
    course,
  };
}
