import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn(), getOfferings: vi.fn(), getEnrollingTerm: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/api", () => ({ api: { getOfferings: mocks.getOfferings, getEnrollingTerm: mocks.getEnrollingTerm } }));

import CourseOfferingsPanel from "@/components/course/CourseOfferingsPanel";

const reference = { deptCode: "cmpt", courseNumber: "225", deptId: 14, courseId: 3998 };
const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const course = { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };
const olderOffering = { section: "D100", infoUrl: "", term: "spring", year: 2026, semesterCode: 1264, isEnrolling: false, location: "Burnaby", instructors: "Ada", enrolled: "40", capacity: "45", loadPercent: 89 };
const newerOffering = { ...olderOffering, section: "D200", term: "summer", semesterCode: 1267 };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOfferings.mockResolvedValue([olderOffering, newerOffering]);
  mocks.getEnrollingTerm.mockResolvedValue({ term: "summer", year: 2026, semesterCode: 1267 });
});

describe("CourseOfferingsPanel", () => {
  it("loads, orders, and navigates offerings using their canonical readable route", async () => {
    const user = userEvent.setup();
    render(<CourseOfferingsPanel reference={reference} department={department} course={course} />);

    expect(await screen.findByText("Summer 2026")).toBeInTheDocument();
    expect(screen.getByText("Enrolling")).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Summer 2026");
    expect(mocks.getOfferings).toHaveBeenCalledWith(14, 3998);

    await user.click(rows[1]);
    expect(mocks.push).toHaveBeenCalledWith("/browse/cmpt/225/1267");
  });

  it("renders a clean empty state when there are no offerings", async () => {
    mocks.getOfferings.mockResolvedValue([]);
    render(<CourseOfferingsPanel reference={reference} department={department} course={course} />);
    expect(await screen.findByText("No offerings found.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("retries a failed request without changing the course route", async () => {
    const user = userEvent.setup();
    mocks.getOfferings.mockRejectedValueOnce(new Error("offline"));
    render(<CourseOfferingsPanel reference={reference} department={department} course={course} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load course offerings.");

    await user.click(screen.getByRole("button", { name: "Try Again" }));
    await waitFor(() => expect(mocks.getOfferings).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Summer 2026")).toBeInTheDocument();
  });
});
