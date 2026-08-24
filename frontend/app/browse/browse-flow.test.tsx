import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), params: { deptCode: "cmpt", courseNumber: "225", semesterCode: "1267", deptId: "14", courseId: "3998" }, getDepartments: vi.fn(), getCourses: vi.fn(), getOfferingDetail: vi.fn(), resolveCourseIds: vi.fn(), route: { status: "resolved" as string, course: null as Record<string, unknown> | null } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, replace: mocks.replace }), useParams: () => mocks.params }));
vi.mock("nuqs", async () => { const React = await import("react"); return { useQueryState: () => React.useState<string | null>(null) }; });
vi.mock("@/lib/api", () => ({ api: { getDepartments: mocks.getDepartments, getCourses: mocks.getCourses, getOfferingDetail: mocks.getOfferingDetail } }));
vi.mock("@/lib/course-resolver", () => ({ resolveCourseIds: mocks.resolveCourseIds }));
vi.mock("@/hooks/useCourseRouteResolution", () => ({ useCourseRouteResolution: () => mocks.route }));
vi.mock("@/hooks/useScrollReveal", () => ({ useScrollReveal: () => vi.fn() }));
vi.mock("@/components/course/CourseOfferingsPanel", () => ({ default: ({ reference }: { reference: { courseId: number } }) => <div>Offerings for {reference.courseId}</div> }));
vi.mock("@/components/course/OfferingDetailScreen", () => ({ default: ({ backHref }: { backHref: string }) => <div>Detail back to {backHref}</div> }));

import BrowsePage from "@/app/browse/page";
import BrowseCoursePage from "@/app/browse/[deptCode]/[courseNumber]/page";
import CanonicalOfferingDetailPage from "@/app/browse/[deptCode]/[courseNumber]/[semesterCode]/page";
import LegacyOfferingPage from "@/app/browse/departments/[deptId]/courses/[courseId]/offerings/[semesterCode]/page";

const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const course = { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };
const resolved = { deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225", department, course };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.params = { deptCode: "cmpt", courseNumber: "225", semesterCode: "1267", deptId: "14", courseId: "3998" };
  mocks.route = { status: "resolved", course: resolved };
  mocks.getDepartments.mockResolvedValue([department]);
  mocks.getCourses.mockResolvedValue([course]);
  mocks.getOfferingDetail.mockResolvedValue({ title: "Data Structures" });
  mocks.resolveCourseIds.mockResolvedValue(resolved);
});

describe("Browse routes", () => {
  it("loads a department then sends course selection to a readable course URL", async () => {
    const user = userEvent.setup();
    render(<BrowsePage />);
    await user.selectOptions(await screen.findByLabelText("Department"), "14");
    await waitFor(() => expect(mocks.getCourses).toHaveBeenCalledWith(14));
    await user.selectOptions(screen.getByLabelText("Course"), "3998");
    expect(mocks.push).toHaveBeenCalledWith("/browse/cmpt/225");
  });

  it("keeps readable course route outcomes explicit", () => {
    const view = render(<BrowseCoursePage />);
    expect(screen.getByText("Offerings for 3998")).toBeInTheDocument();
    view.unmount();

    mocks.route = { status: "notFound", course: null };
    render(<BrowseCoursePage />);
    expect(screen.getByRole("alert")).toHaveTextContent("This course could not be found.");
  });

  it("loads a canonical offering internally by IDs and preserves its readable parent route", async () => {
    render(<CanonicalOfferingDetailPage />);
    await waitFor(() => expect(mocks.getOfferingDetail).toHaveBeenCalledWith(14, 3998, 1267));
    expect(await screen.findByText("Detail back to /browse/cmpt/225")).toBeInTheDocument();
  });

  it("rewrites valid legacy offering URLs once and rejects malformed legacy inputs", async () => {
    render(<LegacyOfferingPage />);
    await waitFor(() => expect(mocks.resolveCourseIds).toHaveBeenCalledWith(14, 3998));
    expect(mocks.replace).toHaveBeenCalledWith("/browse/cmpt/225/1267");

    mocks.params = { ...mocks.params, deptId: "bad" };
    render(<LegacyOfferingPage />);
    expect(screen.getAllByRole("alert").at(-1)).toHaveTextContent("This offering link is invalid.");
  });
});
