import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const AI_BOT_PATTERNS = [
  { name: "GPTBot", pattern: /GPTBot/i },
  { name: "ChatGPT-User", pattern: /ChatGPT-User/i },
  { name: "OAI-SearchBot", pattern: /OAI-SearchBot/i },
  { name: "ClaudeBot", pattern: /ClaudeBot/i },
  { name: "Claude-Web", pattern: /Claude-Web/i },
  { name: "PerplexityBot", pattern: /PerplexityBot/i },
  { name: "anthropic-ai", pattern: /anthropic-ai/i },
  { name: "Google-Extended", pattern: /Google-Extended/i },
  { name: "Googlebot", pattern: /Googlebot/i },
  { name: "GoogleOther", pattern: /GoogleOther/i },
  { name: "Google-InspectionTool", pattern: /Google-InspectionTool/i },
  { name: "Google-CloudVertexBot", pattern: /Google-CloudVertexBot/i },
  { name: "Bingbot", pattern: /bingbot/i },
  { name: "FacebookBot", pattern: /FacebookBot|facebookexternalhit/i },
];

const PUBLIC_FILE = /\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|ico|woff|woff2|ttf|map)$/i;
const PRIVATE_PATH = /^\/(admin|api|auth|doc)(\/|$)/i;

function detectAiBot(userAgent: string) {
  return AI_BOT_PATTERNS.find((bot) => bot.pattern.test(userAgent))?.name || "";
}

function shouldLogCrawler(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (!pathname || PRIVATE_PATH.test(pathname) || PUBLIC_FILE.test(pathname)) return false;
  if (pathname.startsWith("/_next/")) return false;
  return Boolean(detectAiBot(req.headers.get("user-agent") || ""));
}

async function logAiCrawlerVisit(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 500);
  const botName = detectAiBot(userAgent);
  if (!supabaseUrl || !anonKey || !botName) return;

  await fetch(`${supabaseUrl}/rest/v1/ai_crawler_visits`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      bot_name: botName,
      path: req.nextUrl.pathname.slice(0, 300),
      user_agent: userAgent,
      referrer: (req.headers.get("referer") || "").slice(0, 300) || null,
      country: req.headers.get("x-vercel-ip-country") || null,
    }),
  }).catch(() => undefined);
}

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  if (shouldLogCrawler(req)) {
    event.waitUntil(logAiCrawlerVisit(req));
  }

  let res = NextResponse.next({ request: req });
  const pathname = req.nextUrl.pathname;

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
