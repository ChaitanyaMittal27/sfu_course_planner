import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  getSession: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: { getSession: mocks.getSession, updateUser: mocks.updateUser } },
}));

import ResetPasswordPage from "@/app/auth/reset-password/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } }, error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
});

describe("reset password page", () => {
  it("shows a recovery failure when Supabase has no valid session", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    render(<ResetPasswordPage />);

    expect(await screen.findByRole("heading", { name: "Invalid Reset Link" })).toBeInTheDocument();
  });

  it("validates passwords locally before calling Supabase", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);
    await screen.findByRole("heading", { name: "Reset Your Password" });
    await user.type(screen.getByPlaceholderText("At least 6 characters"), "password123");
    await user.type(screen.getByPlaceholderText("Re-enter your password"), "different-password");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("updates a valid recovery session password and shows confirmation", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);
    await screen.findByRole("heading", { name: "Reset Your Password" });
    await user.type(screen.getByPlaceholderText("At least 6 characters"), "password123");
    await user.type(screen.getByPlaceholderText("Re-enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: "password123" }));
    expect(await screen.findByRole("heading", { name: "Password Reset Successful!" })).toBeInTheDocument();
  });

  it("keeps Supabase password update errors visible", async () => {
    const user = userEvent.setup();
    mocks.updateUser.mockResolvedValue({ error: new Error("Recovery session expired") });
    render(<ResetPasswordPage />);
    await screen.findByRole("heading", { name: "Reset Your Password" });
    await user.type(screen.getByPlaceholderText("At least 6 characters"), "password123");
    await user.type(screen.getByPlaceholderText("Re-enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    expect(await screen.findByText("Recovery session expired")).toBeInTheDocument();
  });
});
