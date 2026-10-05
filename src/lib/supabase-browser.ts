"use client";

import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { authCookieOptions, REMEMBER_SESSION_COOKIE } from "./auth-cookie-options";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => typeof document === "undefined" ? [] : parseCookieHeader(document.cookie),
          setAll: (cookies) => {
            const preference = parseCookieHeader(document.cookie).find(cookie => cookie.name === REMEMBER_SESSION_COOKIE)?.value;
            cookies.forEach(({ name, value, options }) => {
              document.cookie = serializeCookieHeader(name, value, authCookieOptions(options, preference, value));
            });
          },
        },
      },
    );
  }

  return browserClient;
}
