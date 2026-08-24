import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
  authCallback: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: { auth: authMocks },
}));

import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function AuthProbe() {
  const { status, userId, isAuthenticated, signOut } = useAuth();
  return <><p>{status}:{userId ?? "none"}:{String(isAuthenticated)}</p><button onClick={() => void signOut()}>Sign out</button></>;
}

beforeEach(() => {
  vi.clearAllMocks();
  authMocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  authMocks.onAuthStateChange.mockImplementation((callback) => {
    authMocks.authCallback = callback;
    return { data: { subscription: { unsubscribe: authMocks.unsubscribe } } };
  });
  authMocks.signOut.mockResolvedValue({ error: null });
});

describe("AuthProvider", () => {
  it("reflects the browser session after initialization and cleans up its subscription", async () => {
    authMocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } }, error: null });
    const view = render(<AuthProvider><AuthProbe /></AuthProvider>);

    expect(screen.getByText("loading:none:false")).toBeInTheDocument();
    expect(await screen.findByText("authenticated:user-1:true")).toBeInTheDocument();

    view.unmount();
    expect(authMocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it("keeps a newer auth event instead of overwriting it with the initial session read", async () => {
    let resolveSession!: (value: unknown) => void;
    authMocks.getSession.mockReturnValue(new Promise((resolve) => { resolveSession = resolve; }));
    render(<AuthProvider><AuthProbe /></AuthProvider>);

    authMocks.authCallback("SIGNED_IN", { user: { id: "event-user" } });
    resolveSession({ data: { session: null }, error: null });

    expect(await screen.findByText("authenticated:event-user:true")).toBeInTheDocument();
  });

  it("clears browser UI session state when signing out", async () => {
    const user = userEvent.setup();
    authMocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } }, error: null });
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await screen.findByText("authenticated:user-1:true");

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(authMocks.signOut).toHaveBeenCalledOnce());
    expect(await screen.findByText("unauthenticated:none:false")).toBeInTheDocument();
  });

  it("still clears browser UI session state when Supabase rejects sign-out", async () => {
    const user = userEvent.setup();
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    authMocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } }, error: null });
    authMocks.signOut.mockResolvedValue({ error: new Error("sign-out failed") });
    render(<AuthProvider><AuthProbe /></AuthProvider>);
    await screen.findByText("authenticated:user-1:true");

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByText("unauthenticated:none:false")).toBeInTheDocument();
    errorLog.mockRestore();
  });

  it("rejects useAuth outside its provider", () => {
    expect(() => render(<AuthProbe />)).toThrow("useAuth must be used within an AuthProvider");
  });
});
