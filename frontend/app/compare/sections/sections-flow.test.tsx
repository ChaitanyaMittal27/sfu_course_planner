import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), search: new URLSearchParams(), getDepartments: vi.fn(), getCourses: vi.fn(), getEnrollingTerm: vi.fn(), resolveCourseIds: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, replace: mocks.replace }), useSearchParams: () => mocks.search }));
vi.mock("@/lib/api", () => ({ api: { getDepartments: mocks.getDepartments, getCourses: mocks.getCourses, getEnrollingTerm: mocks.getEnrollingTerm } }));
vi.mock("@/lib/course-resolver", () => ({ resolveCourseIds: mocks.resolveCourseIds }));

import SectionComparisonPage from "@/app/compare/sections/page";

const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const course = { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };
const resolved = { deptId: 14, courseId: 3998, deptCode: "cmpt", courseNumber: "225", department, course };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.search = new URLSearchParams();
  mocks.getDepartments.mockResolvedValue([department]);
  mocks.getCourses.mockResolvedValue([course]);
  mocks.getEnrollingTerm.mockResolvedValue({ year: 2026, term: "summer", semesterCode: 1267 });
  mocks.resolveCourseIds.mockResolvedValue(resolved);
});

describe("section comparison discovery", () => {
  it("turns a department/course/term selection into the canonical comparison URL", async () => {
    const user = userEvent.setup();
    render(<SectionComparisonPage />);
    await user.selectOptions(await screen.findByLabelText("Department"), "14");
    await waitFor(() => expect(mocks.getCourses).toHaveBeenCalledWith(14));
    await user.selectOptions(screen.getByLabelText("Course"), "3998");
    await user.selectOptions(screen.getByLabelText("Term"), "1264");
    await user.click(screen.getByRole("button", { name: "Load Sections" }));
    expect(mocks.push).toHaveBeenCalledWith("/compare/sections/cmpt/225/1264");
  });

  it("rewrites a valid numeric legacy comparison link and displays invalid ones safely", async () => {
    mocks.search = new URLSearchParams("deptId=14&courseId=3998&semester=1267&sections=cmpt%20225%20d100");
    render(<SectionComparisonPage />);
    await waitFor(() => expect(mocks.resolveCourseIds).toHaveBeenCalledWith(14, 3998));
    expect(mocks.replace).toHaveBeenCalledWith("/compare/sections/cmpt/225/1267?sections=D100");

    mocks.search = new URLSearchParams("deptId=nope&courseId=3998&semester=1267");
    render(<SectionComparisonPage />);
    expect(screen.getAllByRole("alert").at(-1)).toHaveTextContent("This section comparison link is invalid.");
  });
});
