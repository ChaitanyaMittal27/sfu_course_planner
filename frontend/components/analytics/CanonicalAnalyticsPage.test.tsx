import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ params: { deptCode: "cmpt", courseNumber: "225" }, push: vi.fn(), resolveCourseIdentity: vi.fn(), getDepartments: vi.fn(), getCourses: vi.fn(), getGradeDistribution: vi.fn(), getEnrollmentHistory: vi.fn() }));
vi.mock("next/navigation", () => ({ useParams: () => mocks.params, useRouter: () => ({ push: mocks.push }) }));
vi.mock("nuqs", () => ({ useQueryState: () => ["5yr", vi.fn()] }));
vi.mock("@/lib/course-resolver", () => ({ resolveCourseIdentity: mocks.resolveCourseIdentity }));
vi.mock("@/lib/api", () => ({ api: mocks }));
vi.mock("recharts", () => ({ CartesianGrid: () => null, Line: () => null, LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, Tooltip: () => null, XAxis: () => null, YAxis: () => null }));
vi.mock("@/components/analytics/GradeHistogram", () => ({ default: () => <div>Grade histogram</div> }));

import CanonicalAnalyticsPage from "@/components/analytics/CanonicalAnalyticsPage";

const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const course = { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };
const resolved = { deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225", department, course };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.params = { deptCode: "cmpt", courseNumber: "225" };
  mocks.resolveCourseIdentity.mockResolvedValue(resolved);
  mocks.getDepartments.mockResolvedValue([department]);
  mocks.getCourses.mockResolvedValue([course]);
  mocks.getGradeDistribution.mockResolvedValue({ medianGrade: "A-", failRate: 2.5, distribution: { A: 10 } });
  mocks.getEnrollmentHistory.mockResolvedValue([{ semesterCode: 1267, enrolled: 40, capacity: 45, loadPercent: 89 }]);
});

describe("canonical analytics pages", () => {
  it("resolves readable grade routes internally and loads grade data", async () => {
    render(<CanonicalAnalyticsPage kind="grades" />);
    await waitFor(() => expect(mocks.resolveCourseIdentity).toHaveBeenCalledWith({ deptCode: "cmpt", courseNumber: "225" }));
    await waitFor(() => expect(mocks.getGradeDistribution).toHaveBeenCalledWith(3998));
    expect(await screen.findByText("Grade histogram")).toBeInTheDocument();
  });

  it("uses the enrollment history endpoint for load/enrollment and reports bad routes", async () => {
    render(<CanonicalAnalyticsPage kind="load" />);
    await waitFor(() => expect(mocks.getEnrollmentHistory).toHaveBeenCalledWith(14, 3998, "5yr"));

    mocks.params = { deptCode: "?", courseNumber: "1" };
    render(<CanonicalAnalyticsPage kind="grades" />);
    expect(screen.getAllByRole("alert").at(-1)).toHaveTextContent("This analytics link is invalid.");
  });
});
