import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAnonKey, supabaseAuthCookieName, supabasePublicUrl } from "@/lib/supabase/config";

/**
 * Creates the Supabase client used exclusively by Next's proxy layer.
 *
 * Token refreshes must be written to the response returned from the proxy;
 * server-component cookie helpers cannot do that job.
 */
export function createProxyClient(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.SUPABASE_INTERNAL_URL ?? supabasePublicUrl;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: { name: supabaseAuthCookieName },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  return {
    supabase,
    getResponse: () => response,
  };
}
