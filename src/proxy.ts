import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { detectAiBot } from "./lib/ai-bots";
import { isSensitiveProbePath } from "./lib/sensitive-paths";
import { checkAdminAuthorization } from "./lib/admin-authorization";

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

async function logAiCrawlerVisit(req: NextRequest, status = 200, responseSize: number | null = null) {
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
      http_status: status,
      response_size: responseSize,
    }),
  }).catch(() => undefined);
}

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const pathname = req.nextUrl.pathname;

  if (shouldLogCrawler(req)) {
    event.waitUntil(logAiCrawlerVisit(req, isSensitiveProbePath(pathname) ? 404 : 200, 0));
  }

  if (isSensitiveProbePath(pathname)) {
    return new NextResponse("Not found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }

  let res = NextResponse.next({ request: req });

  if (!pathname.startsWith("/admin") && pathname !== "/login") {
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

  const authorization = await checkAdminAuthorization(supabase);
  let response = res;
  if (pathname.startsWith("/admin") && !authorization.user) {
    response = authorization.status === 401
      ? NextResponse.redirect(new URL("/login", req.url))
      : new NextResponse(authorization.error, { status: authorization.status });
  } else if (pathname === "/login" && authorization.user) {
    response = NextResponse.redirect(new URL("/admin", req.url));
  }

  // Redirect/denial responses must retain any refreshed session cookies.
  res.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
