import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions, REMEMBER_SESSION_COOKIE } from "@/lib/auth-cookie-options";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") === "/reset-password" ? "/reset-password" : "/admin";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: any[]) { // <-- เติม : any[] ตรงนี้ครับ
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, authCookieOptions(options, cookieStore.get(REMEMBER_SESSION_COOKIE)?.value, value))
            );
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?recovery=invalid`);
}
