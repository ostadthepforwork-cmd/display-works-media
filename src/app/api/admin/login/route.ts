import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  const { email, password, access_token, refresh_token } = await req
    .json()
    .catch(() => ({ email: "", password: "", access_token: "", refresh_token: "" }));

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
            response.cookies.set(name, value, options);
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

  return response;
}
