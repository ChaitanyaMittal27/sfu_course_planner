/**
 * Redirect destinations supplied through query parameters must remain inside
 * this application. Authentication screens and the proxy share these helpers
 * so a user cannot turn a post-login redirect into an external navigation.
 */

const INTERNAL_ORIGIN = "https://sfucourseplanner.internal";

export const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function resolveAuthRedirect(
  candidate: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT,
): string {
  if (!candidate) return fallback;

  try {
    const url = new URL(candidate, INTERNAL_ORIGIN);

    if (url.origin !== INTERNAL_ORIGIN || !candidate.startsWith("/") || candidate.startsWith("//")) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function buildLoginPath(redirectTo: string): string {
  const destination = resolveAuthRedirect(redirectTo);
  return `/login?redirectTo=${encodeURIComponent(destination)}`;
}

export function buildAuthCallbackUrl(origin: string, redirectTo: string | null | undefined): string {
  const destination = resolveAuthRedirect(redirectTo);
  return `${origin}/auth/callback?redirectTo=${encodeURIComponent(destination)}`;
}
