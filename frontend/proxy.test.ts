import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getResponse: vi.fn(),
  createProxyClient: vi.fn(),
}));

class TestResponse {
  static next = vi.fn(() => new TestResponse());
  static redirect = vi.fn((url: URL) => {
    const response = new TestResponse();
    response.redirectUrl = url.toString();
    return response;
  });

  redirectUrl?: string;
  cookies = {
    values: [] as Array<{ name: string; value: string }>,
    getAll: () => this.cookies.values,
    set: (name: string | { name: string; value: string }, value?: string) => {
      const cookie = typeof name === "string" ? { name, value: value ?? "" } : name;
      this.cookies.values.push(cookie);
    },
  };
}

vi.mock("next/server", () => ({ NextResponse: TestResponse }));
vi.mock("@/lib/supabase/proxy", () => ({ createProxyClient: proxyMocks.createProxyClient }));

function request(pathname: string) {
  const url = new URL(`https://planner.test${pathname}`);
  return {
    url: url.toString(),
    nextUrl: {
      pathname: url.pathname,
      search: url.search,
      searchParams: url.searchParams,
    },
  };
}

function asTestResponse(response: unknown) {
  return response as TestResponse;
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  const sessionResponse = new TestResponse();
  sessionResponse.cookies.values.push({ name: "sb-session", value: "refreshed" });

  proxyMocks.getUser.mockResolvedValue({ data: { user: null } });
  proxyMocks.getResponse.mockReturnValue(sessionResponse);
  proxyMocks.createProxyClient.mockReturnValue({
    supabase: { auth: { getUser: proxyMocks.getUser } },
    getResponse: proxyMocks.getResponse,
  });
});

describe("route protection proxy", () => {
  it("sends anonymous protected requests to login with their safe destination and refreshed cookies", async () => {
    const { proxy } = await import("@/proxy");

    const response = asTestResponse(await proxy(request("/dashboard?term=1267") as never));

    expect(response.redirectUrl).toBe("https://planner.test/login?redirectTo=%2Fdashboard%3Fterm%3D1267");
    expect(response.cookies.values).toContainEqual({ name: "sb-session", value: "refreshed" });
  });

  it("redirects anonymous admin requests and non-admin users without creating an unauthorized loop", async () => {
    const { proxy } = await import("@/proxy");

    const anonymousResponse = asTestResponse(await proxy(request("/admin/users") as never));
    expect(anonymousResponse.redirectUrl).toContain("/login?redirectTo=%2Fadmin%2Fusers");

    proxyMocks.getUser.mockResolvedValue({ data: { user: { app_metadata: { role: "student" } } } });
    const deniedResponse = asTestResponse(await proxy(request("/admin/users") as never));
    expect(deniedResponse.redirectUrl).toBe("https://planner.test/admin/unauthorized");

    const unauthorizedResponse = asTestResponse(await proxy(request("/admin/unauthorized") as never));
    expect(unauthorizedResponse).toBe(proxyMocks.getResponse.mock.results.at(-1)?.value);
  });

  it("allows admins and sends signed-in visitors away from login only to safe destinations", async () => {
    const { proxy } = await import("@/proxy");
    proxyMocks.getUser.mockResolvedValue({ data: { user: { app_metadata: { role: "admin" } } } });

    const adminResponse = await proxy(request("/admin/terms") as never);
    expect(adminResponse).toBe(proxyMocks.getResponse.mock.results.at(-1)?.value);

    const loginResponse = asTestResponse(await proxy(request("/login?redirectTo=https://attacker.test") as never));
    expect(loginResponse.redirectUrl).toBe("https://planner.test/dashboard");
  });
});
