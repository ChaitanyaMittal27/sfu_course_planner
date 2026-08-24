import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(), getBookmarks: vi.fn(), createBookmark: vi.fn(), auth: { user: null as { id: string } | null, isLoading: false },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/lib/api", () => ({ api: { getBookmarks: mocks.getBookmarks, createBookmark: mocks.createBookmark } }));

import BookmarkButton from "@/components/course/BookmarkButton";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.user = null;
  mocks.auth.isLoading = false;
  mocks.getBookmarks.mockResolvedValue([]);
  mocks.createBookmark.mockResolvedValue({ bookmarkId: 1 });
  window.history.replaceState({}, "", "/browse/cmpt/225/1267?tab=sections");
});

describe("BookmarkButton", () => {
  const props = { deptId: 14, courseId: 3998, semesterCode: 1267, section: "D100" };

  it("waits for auth, then sends anonymous users to the centralized login return path", async () => {
    const user = userEvent.setup();
    mocks.auth.isLoading = true;
    const { rerender } = render(<BookmarkButton {...props} />);
    expect(screen.getByRole("button")).toBeDisabled();

    mocks.auth.isLoading = false;
    rerender(<BookmarkButton {...props} />);
    await user.click(await screen.findByRole("button", { name: "Bookmark" }));
    expect(mocks.push).toHaveBeenCalledWith("/login?redirectTo=%2Fbrowse%2Fcmpt%2F225%2F1267%3Ftab%3Dsections");
  });

  it("shows an existing bookmark and creates a new bookmark with internal IDs", async () => {
    mocks.auth.user = { id: "user-1" };
    mocks.getBookmarks.mockResolvedValueOnce([{ bookmarkId: 4, ...props }]);
    const existing = render(<BookmarkButton {...props} />);
    expect(await screen.findByRole("button", { name: "Bookmarked" })).toBeDisabled();
    existing.unmount();

    mocks.getBookmarks.mockResolvedValueOnce([]);
    const changed = vi.fn();
    const user = userEvent.setup();
    render(<BookmarkButton {...props} onBookmarkChange={changed} />);
    await user.click(await screen.findByRole("button", { name: "Bookmark" }));
    await waitFor(() => expect(mocks.createBookmark).toHaveBeenCalledWith(14, 3998, 1267, "D100"));
    expect(await screen.findByRole("button", { name: "Bookmarked" })).toBeDisabled();
    expect(changed).toHaveBeenCalledOnce();
  });

  it("keeps the action available when bookmark creation fails", async () => {
    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    mocks.auth.user = { id: "user-1" };
    mocks.createBookmark.mockRejectedValue(new Error("network unavailable"));
    render(<BookmarkButton {...props} />);
    await user.click(await screen.findByRole("button", { name: "Bookmark" }));
    expect(await screen.findByRole("button", { name: "Bookmark" })).toBeEnabled();
    expect(alert).toHaveBeenCalledWith("Failed to add bookmark: network unavailable");
    alert.mockRestore();
  });
});
