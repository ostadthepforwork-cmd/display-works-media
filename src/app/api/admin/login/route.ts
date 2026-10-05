import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkAdminAuthorization } from "@/lib/admin-authorization";
import { authCookieOptions, REMEMBER_SESSION_COOKIE } from "@/lib/auth-cookie-options";

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
  const { email, password, access_token, refresh_token, remember } = body as Record<string, unknown>;
  if (remember !== undefined && typeof remember !== "boolean") {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
  if ([email, password, access_token, refresh_token].some((value) => value !== undefined && typeof value !== "string")) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  if ((!email || !password) && (!access_token || !refresh_token)) {
    return NextResponse.json(
      { success: false, error: "กรุณากรอกอีเมลและรหัสผ่าน" },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ success: true });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = req.headers.get("cookie") || "";
          return cookieHeader
            .split(";")
            .map((cookie) => cookie.trim())
            .filter(Boolean)
            .map((cookie) => {
              const [name, ...value] = cookie.split("=");
              return { name, value: value.join("=") };
            });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, authCookieOptions(options, remember === true ? "1" : "0", value));
          });
        },
      },
    },
  );

  const { error } =
    access_token && refresh_token
      ? await supabase.auth.setSession({
          access_token: String(access_token),
          refresh_token: String(refresh_token),
        })
      : await supabase.auth.signInWithPassword({
          email: String(email).trim(),
          password: String(password),
        });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message?.toLowerCase().includes("invalid login")
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : error.message,
      },
      { status: 401 },
    );
  }

  const authorization = await checkAdminAuthorization(
    supabase,
    ["owner", "admin", "sales", "marketing"],
  );
  if (!authorization.user) {
    return NextResponse.json(
      { success: false, error: authorization.error },
      { status: authorization.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(REMEMBER_SESSION_COOKIE, remember === true ? "1" : "0", {
    path: "/", sameSite: "lax", secure: new URL(req.url).protocol === "https:",
    ...(remember === true ? { maxAge: 30 * 24 * 60 * 60 } : {}),
  });
  return response;
}
