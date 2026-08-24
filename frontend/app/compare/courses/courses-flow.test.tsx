import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ setCoursesParam: vi.fn(), getDepartments: vi.fn(), getCourses: vi.fn(), getEnrollingTerm: vi.fn(), getOfferingDetail: vi.fn(), resolveCourseIdentity: vi.fn(), resolveCourseIds: vi.fn() }));
vi.mock("nuqs", () => ({ useQueryState: () => [null, mocks.setCoursesParam] }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock("@/lib/api", () => ({ api: { getDepartments: mocks.getDepartments, getCourses: mocks.getCourses, getEnrollingTerm: mocks.getEnrollingTerm, getOfferingDetail: mocks.getOfferingDetail } }));
vi.mock("@/lib/course-resolver", () => ({ resolveCourseIdentity: mocks.resolveCourseIdentity, resolveCourseIds: mocks.resolveCourseIds }));
vi.mock("@/components/analytics/GradeHistogram", () => ({ default: () => <div>Grade chart</div> }));

import CourseComparisonPage from "@/app/compare/courses/page";

const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const courses = [
  { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null },
  { courseId: 4000, deptId: 14, courseNumber: "226", title: "Algorithms", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDepartments.mockResolvedValue([department]);
  mocks.getCourses.mockResolvedValue(courses);
  mocks.getEnrollingTerm.mockResolvedValue({ semesterCode: 1267 });
  mocks.getOfferingDetail.mockResolvedValue({ courseNumber: "225", title: "Data Structures", gradeDistribution: null, sections: [] });
});

describe("course comparison discovery", () => {
  it("serializes selected courses as readable URL identities and prevents duplicates", async () => {
    const user = userEvent.setup();
    render(<CourseComparisonPage />);
    await user.selectOptions(await screen.findByLabelText("Department"), "14");
    await waitFor(() => expect(mocks.getCourses).toHaveBeenCalledWith(14));
    await user.selectOptions(screen.getByLabelText("Course"), "3998");
    await user.click(screen.getByRole("button", { name: "Add to Comparison" }));
    expect(mocks.setCoursesParam).toHaveBeenCalledWith("cmpt-225");
    expect(screen.getByText("CMPT 225")).toBeInTheDocument();
  });
});
