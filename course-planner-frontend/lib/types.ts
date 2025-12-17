// API Response Types (matching Spring Boot DTOs)

export interface Department {
  deptId: number;
  name: string;
}

export interface Course {
  courseId: number;
  catalogNumber: string;
}

export interface CourseOffering {
  courseOfferingId: number;
  location: string;
  instructors: string;
  term: string;
  semesterCode: number;
  year: number;
}

export interface OfferingSection {
  type: string;
  enrollmentCap: number;
  enrollmentTotal: number;
}

export interface AboutInfo {
  appName: string;
  authorName: string;
}

export interface Watcher {
  id: number;
  department: Department;
  course: Course;
  events: string[];
}

export interface GraphDataPoint {
  semesterCode: number;
  totalCoursesTaken: number;
}

export interface CourseLoadData {
  semester: number;
  enrolled: number;
  capacity: number;
  load: number;
  location: string;
  instructors: string;
}
