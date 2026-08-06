import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

function isLocalAdminBypass(req: Request) {
  const hostname = new URL(req.url).hostname;
  const localBypassValue = String(
    process.env.LOCAL_ADMIN_BYPASS ||
    process.env.NEXT_PUBLIC_LOCAL_ADMIN_BYPASS ||
    "",
  ).toLowerCase();
  const enabled =
    localBypassValue === "1" ||
    localBypassValue === "true" ||
    localBypassValue === "yes";
  return (
    process.env.NODE_ENV !== "production" &&
    enabled &&
    (hostname === "127.0.0.1" || hostname === "localhost")
  );
}

export async function GET(req: Request) {
  if (isLocalAdminBypass(req)) {
    return NextResponse.json({
      authenticated: true,
      userId: "local-dev-admin",
      error: null,
      bypass: "local-admin",
    });
  }

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

  const { data, error } = await supabase.auth.getUser();

  return NextResponse.json({
    authenticated: Boolean(data.user && !error),
    userId: data.user?.id ? `${data.user.id.slice(0, 8)}...` : null,
    error: error?.message || null,
  });
}
