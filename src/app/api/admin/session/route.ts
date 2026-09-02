import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkAdminAuthorization } from "@/lib/admin-authorization";

function parseRequestCookies(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const [name, ...value] = cookie.split("=");
      return { name, value: value.join("=") };
    });
}

export async function GET(req: Request) {
  const response = NextResponse.json({ authenticated: false });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseRequestCookies(req);
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const authorization = await checkAdminAuthorization(supabase);
  const result = NextResponse.json({
    authenticated: authorization.authenticated,
    authorized: Boolean(authorization.user),
    userId: authorization.user ? `${authorization.user.id.slice(0, 8)}...` : null,
    error: authorization.error,
  }, { status: authorization.status, headers: { "Cache-Control": "no-store" } });
  response.cookies.getAll().forEach((cookie) => result.cookies.set(cookie));
  return result;
}
