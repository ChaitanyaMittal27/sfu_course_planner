import { describe, expect, it } from "vitest";
import {
  buildAuthCallbackUrl,
  buildLoginPath,
  DEFAULT_AUTH_REDIRECT,
  resolveAuthRedirect,
} from "@/lib/auth/redirect";

describe("auth redirects", () => {
  it("keeps valid internal paths, queries, and hashes", () => {
    expect(resolveAuthRedirect("/browse/cmpt/225?term=1267#sections")).toBe("/browse/cmpt/225?term=1267#sections");
  });

  it("falls back for missing, malformed, and external destinations", () => {
    expect(resolveAuthRedirect(null)).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveAuthRedirect("https://example.com")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveAuthRedirect("//example.com")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveAuthRedirect("browse/cmpt/225")).toBe(DEFAULT_AUTH_REDIRECT);
    expect(resolveAuthRedirect("/browse", "/")).toBe("/browse");
  });

  it("builds encoded login and callback destinations from validated paths", () => {
    expect(buildLoginPath("/browse/cmpt/225?term=1267")).toBe("/login?redirectTo=%2Fbrowse%2Fcmpt%2F225%3Fterm%3D1267");
    expect(buildLoginPath("https://example.com")).toBe("/login?redirectTo=%2Fdashboard");
    expect(buildAuthCallbackUrl("https://sfucourseplanner.com", "/dashboard?tab=profile")).toBe(
      "https://sfucourseplanner.com/auth/callback?redirectTo=%2Fdashboard%3Ftab%3Dprofile",
    );
  });
});
