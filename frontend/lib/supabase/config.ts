/**
 * Browser and server clients can use different network URLs in Docker, but
 * they must use one cookie name so they share a browser session.
 */
export const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const projectReference = new URL(supabasePublicUrl).hostname.split(".")[0];

// Matches Supabase's default public-URL-derived name and therefore preserves
// existing production sessions while stabilizing Docker's internal URL setup.
export const supabaseAuthCookieName = `sb-${projectReference}-auth-token`;
