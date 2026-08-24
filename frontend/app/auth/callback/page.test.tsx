import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  search: new URLSearchParams(),
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
  initializePreferencesOnSignup: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.search,
}));
vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: { exchangeCodeForSession: mocks.exchangeCodeForSession, getSession: mocks.getSession } },
}));
vi.mock("@/lib/api", () => ({ api: { initializePreferencesOnSignup: mocks.initializePreferencesOnSignup } }));

import AuthCallbackPage from "@/app/auth/callback/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.search = new URLSearchParams();
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  mocks.getSession.mockResolvedValue({ data: { session: { user: { email: "student@example.com" } } } });
  mocks.initializePreferencesOnSignup.mockResolvedValue(undefined);
});

describe("auth callback page", () => {
  it("returns home when a callback has no exchange code", async () => {
    render(<AuthCallbackPage />);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/"));
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("exchanges the code, initializes preferences opportunistically, and uses a safe redirect", async () => {
    mocks.search = new URLSearchParams("code=one-time-code&redirectTo=/browse/cmpt/225");
    render(<AuthCallbackPage />);

    await waitFor(() => expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("one-time-code"));
    expect(mocks.initializePreferencesOnSignup).toHaveBeenCalledWith("student@example.com");
    expect(mocks.replace).toHaveBeenCalledWith("/browse/cmpt/225");
  });

  it("does not let a preference initialization failure block a completed sign-in", async () => {
    mocks.search = new URLSearchParams("code=one-time-code&redirectTo=https://attacker.test");
    mocks.initializePreferencesOnSignup.mockRejectedValue(new Error("preferences unavailable"));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<AuthCallbackPage />);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/dashboard"));
    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
  });

  it("keeps an exchange failure visible instead of redirecting as authenticated", async () => {
    mocks.search = new URLSearchParams("code=invalid-code");
    mocks.exchangeCodeForSession.mockResolvedValue({ error: new Error("Invalid authorization code") });
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<AuthCallbackPage />);

    expect(await screen.findByRole("heading", { name: "Sign In Failed" })).toBeInTheDocument();
    expect(screen.getByText("Invalid authorization code")).toBeInTheDocument();
    expect(mocks.initializePreferencesOnSignup).not.toHaveBeenCalled();
    errorLog.mockRestore();
  });
});
