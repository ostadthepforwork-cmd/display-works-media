import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { detectAiBot } from "./lib/ai-bots";

const PUBLIC_FILE = /\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|ico|woff|woff2|ttf|map)$/i;
const PRIVATE_PATH = /^\/(admin|api|auth|doc)(\/|$)/i;

function shouldLogCrawler(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (!pathname || PRIVATE_PATH.test(pathname) || PUBLIC_FILE.test(pathname)) return false;
  if (pathname.startsWith("/_next/")) return false;
  return Boolean(detectAiBot(req.headers.get("user-agent") || ""));
}

function crawlerPublicPath(req: NextRequest) {
  const url = req.nextUrl.clone();
  const sensitiveParams = [
    "name",
    "email",
    "phone",
    "tel",
    "line",
    "message",
    "contact",
    "address",
    "customer",
  ];
  sensitiveParams.forEach((key) => url.searchParams.delete(key));
  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ""}`.slice(0, 300);
}

function isLocalAdminBypass(req: NextRequest) {
  const hostname = req.nextUrl.hostname;
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

async function logAiCrawlerVisit(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 500);
  const botName = detectAiBot(userAgent);
  if (!supabaseUrl || !serviceRoleKey || !botName) return;

  await fetch(`${supabaseUrl}/rest/v1/ai_crawler_visits`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      bot_name: botName,
      path: crawlerPublicPath(req),
      user_agent: userAgent,
      referrer: (req.headers.get("referer") || "").slice(0, 300) || null,
      country: req.headers.get("x-vercel-ip-country") || null,
    }),
  }).catch(() => undefined);
}

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  if (shouldLogCrawler(req)) {
    event.waitUntil(logAiCrawlerVisit(req));
  }

  let res = NextResponse.next({ request: req });
  const pathname = req.nextUrl.pathname;

  if (!pathname.startsWith("/admin") && pathname !== "/login") {
    return res;
  }

  if (isLocalAdminBypass(req)) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return res;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

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
    const cleanRes = pathname === "/login"
      ? res
      : NextResponse.redirect(new URL("/login", req.url));
    req.cookies
      .getAll()
      .filter((cookie) => cookie.name.startsWith("sb-"))
      .forEach((cookie) => cleanRes.cookies.delete(cookie.name));
    return cleanRes;
  }

  if (pathname.startsWith("/admin") && !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
