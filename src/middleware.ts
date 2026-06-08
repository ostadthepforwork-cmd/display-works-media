import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          // ต้องเขียน cookie ลง request ก่อน แล้วค่อยสร้าง response ใหม่พร้อม cookie
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() จะ refresh session และ set cookie ผ่าน setAll ข้างบน
  let user: any = null;
  let authError: unknown = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    authError = result.error;
  } catch (error) {
    authError = error;
  }

  if (authError) {
    const cleanRes = req.nextUrl.pathname === "/login"
      ? res
      : NextResponse.redirect(new URL("/login", req.url));
    req.cookies.getAll()
      .filter((cookie) => cookie.name.startsWith("sb-"))
      .forEach((cookie) => cleanRes.cookies.delete(cookie.name));
    return cleanRes;
  }

  // ถ้าเข้า /admin โดยไม่ได้ login → redirect ไป /login
  if (req.nextUrl.pathname.startsWith("/admin") && !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ถ้า login แล้วเข้า /login → redirect ไป /admin
  if (req.nextUrl.pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
