import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_SESSION_COOKIE = "dwm-remember-session";

export function authCookieOptions(options: CookieOptions = {}, preference?: string, value = "session"): CookieOptions {
  if (preference !== "0" || !value || options.maxAge === 0) return options;
  // Session-only preference must survive token refresh, without changing deletions.
  return { ...options, maxAge: undefined, expires: undefined };
}
