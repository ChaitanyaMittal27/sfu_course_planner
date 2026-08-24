import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn(), auth: { user: null as Record<string, unknown> | null, isAuthenticated: false, isLoading: false }, getDepartments: vi.fn(), getBookmarks: vi.fn(), getBookmarkOfferings: vi.fn(), getUserPreferences: vi.fn(), getCourses: vi.fn(), deleteBookmark: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/hooks/useScrollReveal", () => ({ useScrollReveal: () => vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ supabase: { auth: { updateUser: vi.fn() } } }));
vi.mock("@/lib/api", () => ({ api: mocks }));

import DashboardPage from "@/app/dashboard/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth = { user: null, isAuthenticated: false, isLoading: false };
  mocks.getDepartments.mockResolvedValue([{ deptId: 14, deptCode: "CMPT", name: "Computing Science" }]);
  mocks.getBookmarks.mockResolvedValue([]);
  mocks.getBookmarkOfferings.mockResolvedValue([]);
  mocks.getUserPreferences.mockResolvedValue({ emailNotificationsEnabled: false, userEmail: null });
  mocks.getCourses.mockResolvedValue([]);
  mocks.deleteBookmark.mockResolvedValue(undefined);
});

describe("dashboard flow", () => {
  it("keeps unauthenticated users out of protected dashboard data", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Your session could not be restored in this tab.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/login?redirectTo=%2Fdashboard");
    expect(mocks.getBookmarks).not.toHaveBeenCalled();
  });

  it("shows the authenticated empty watchlist and routes its call to action to Browse", async () => {
    const user = userEvent.setup();
    mocks.auth = { user: { id: "user-1", email: "student@example.com", user_metadata: {} }, isAuthenticated: true, isLoading: false };
    render(<DashboardPage />);
    expect(await screen.findByText("No watchers yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Browse Courses" }));
    expect(mocks.push).toHaveBeenCalledWith("/browse");
  });

  it("uses canonical offering URLs for resolved bookmarked rows", async () => {
    const user = userEvent.setup();
    mocks.auth = { user: { id: "user-1", email: "student@example.com", user_metadata: {} }, isAuthenticated: true, isLoading: false };
    mocks.getBookmarks.mockResolvedValue([{ bookmarkId: 1, deptId: 14, courseId: 3998, semesterCode: 1267, section: "D100", createdAt: "2026-01-01" }]);
    mocks.getBookmarkOfferings.mockResolvedValue([{ bookmarkId: 1, deptId: 14, courseId: 3998, semesterCode: 1267, section: "D100", term: "summer", year: 2026, infoUrl: "", isEnrolling: true, location: "Burnaby", instructors: "Ada", enrolled: "40", capacity: "45", loadPercent: 89 }]);
    mocks.getCourses.mockResolvedValue([{ courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures" }]);
    render(<DashboardPage />);
    expect(await screen.findByText("Data Structures")).toBeInTheDocument();
    await user.click(screen.getByText("Data Structures"));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/browse/cmpt/225/1267"));
  });
});
