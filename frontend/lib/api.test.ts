import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: supabaseMocks.getSession,
    },
  },
}));

const fetchMock = vi.fn();

function response(body: unknown, status = 200, statusText = "OK") {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
  vi.stubGlobal("fetch", fetchMock);
  supabaseMocks.getSession.mockResolvedValue({ data: { session: { access_token: "access-token" } } });
});

describe("API client", () => {
  it("uses the configured base URL for public calls", async () => {
    fetchMock.mockResolvedValueOnce(response([{ deptId: 14 }]));
    const { api } = await import("@/lib/api");

    await expect(api.getDepartments()).resolves.toEqual([{ deptId: 14 }]);
    expect(fetchMock).toHaveBeenCalledWith("https://api.test/api/departments");
  });

  it("attaches the Supabase access token and request body for mutations", async () => {
    fetchMock.mockResolvedValueOnce(response({ bookmarkId: 42 }));
    const { api } = await import("@/lib/api");

    await api.createBookmark(14, 3998, 1267, "D100");

    expect(fetchMock).toHaveBeenCalledWith("https://api.test/api/bookmarks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer access-token",
      },
      body: JSON.stringify({ deptId: 14, courseId: 3998, semesterCode: 1267, section: "D100" }),
    });
  });

  it("rejects protected calls before fetching when there is no session", async () => {
    supabaseMocks.getSession.mockResolvedValueOnce({ data: { session: null } });
    const { api } = await import("@/lib/api");

    await expect(api.getBookmarks()).rejects.toThrow("Not authenticated - please log in");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns undefined for successful no-content deletes", async () => {
    fetchMock.mockResolvedValueOnce(response(null, 204, "No Content"));
    const { api } = await import("@/lib/api");

    await expect(api.deleteBookmark(42)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("https://api.test/api/bookmarks/42", expect.objectContaining({ method: "DELETE" }));
  });

  it("reports expired sessions and public API failures", async () => {
    fetchMock.mockResolvedValueOnce(response({}, 401, "Unauthorized"));
    const { api } = await import("@/lib/api");

    await expect(api.getBookmarks()).rejects.toThrow("Session expired - please log in again");

    fetchMock.mockResolvedValueOnce(response({}, 500, "Server Error"));
    await expect(api.getDepartments()).rejects.toThrow("API Error: 500 Server Error");
  });
});
