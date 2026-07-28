import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CrawlerVisit = {
  id: string;
  bot_name: string;
  path: string;
  user_agent: string;
  referrer: string | null;
  country: string | null;
  created_at: string;
};

function dateRangeFromRequest(request: Request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  if (startDate && endDate) {
    return {
      startIso: new Date(`${startDate}T00:00:00.000Z`).toISOString(),
      endIso: new Date(`${endDate}T23:59:59.999Z`).toISOString(),
    };
  }

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function countBy<T extends string>(rows: CrawlerVisit[], keyFn: (row: CrawlerVisit) => T) {
  return Object.entries(
    rows.reduce<Record<string, number>>((acc, row) => {
      const key = keyFn(row) || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function countPaths(rows: CrawlerVisit[]) {
  return countBy(rows, (row) => row.path)
    .map((row) => ({ path: row.name, count: row.count }))
    .slice(0, 10);
}

function safeUrl(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value, "https://displayworksmedia.com");
  } catch {
    return null;
  }
}

function referrerLabel(referrer: string | null) {
  const url = safeUrl(referrer);
  return url ? url.hostname.replace(/^www\./, "") : "Direct / hidden";
}

function searchHintFromUrl(value: string | null) {
  const url = safeUrl(value);
  if (!url) return "";
  const keys = ["q", "query", "search", "keyword", "utm_term", "utm_campaign", "utm_source"];
  for (const key of keys) {
    const found = url.searchParams.get(key);
    if (found) return `${key}: ${found}`.slice(0, 80);
  }
  return "";
}

function inferIntent(path: string, referrer: string | null) {
  const target = path.toLowerCase();
  const searchHint = searchHintFromUrl(path) || searchHintFromUrl(referrer);
  if (target.includes("robots.txt")) return { intent: "Crawler access rules", detail: "Bot checked robots.txt before reading the site" };
  if (target.includes("sitemap.xml")) return { intent: "Site discovery", detail: "Bot explored URLs from sitemap.xml" };
  if (target.includes("llms.txt")) return { intent: "AI summary source", detail: "Bot checked llms.txt for AI-readable site context" };
  if (target.startsWith("/services/")) return { intent: "Service research", detail: searchHint || path };
  if (target.startsWith("/blog/")) return { intent: "Knowledge / answer research", detail: searchHint || path };
  if (target.startsWith("/portfolio")) return { intent: "Trust proof / portfolio research", detail: searchHint || path };
  if (target.startsWith("/faq")) return { intent: "FAQ / objection research", detail: searchHint || path };
  if (target.startsWith("/contact")) return { intent: "Contact / conversion research", detail: searchHint || path };
  if (target === "/" || target.startsWith("/?")) return { intent: "Brand / homepage overview", detail: searchHint || "Homepage" };
  return { intent: "General crawl", detail: searchHint || path };
}

function countIntents(rows: CrawlerVisit[]) {
  const grouped = rows.reduce<Record<string, { intent: string; count: number; examples: string[] }>>((acc, row) => {
    const inferred = inferIntent(row.path, row.referrer);
    const group = acc[inferred.intent] || { intent: inferred.intent, count: 0, examples: [] };
    group.count += 1;
    if (group.examples.length < 3 && !group.examples.includes(inferred.detail)) group.examples.push(inferred.detail);
    acc[inferred.intent] = group;
    return acc;
  }, {});
  return Object.values(grouped).sort((a, b) => b.count - a.count);
}

function countReferrers(rows: CrawlerVisit[]) {
  return Object.entries(
    rows.reduce<Record<string, number>>((acc, row) => {
      const label = referrerLabel(row.referrer);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json(
      { success: false, connected: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { startIso, endIso } = dateRangeFromRequest(request);
  const { data, error } = await supabase
    .from("ai_crawler_visits")
    .select("id, bot_name, path, user_agent, referrer, country, created_at")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error.message,
        hint: "กรุณารัน supabase/ai-crawler-visits.sql ใน Supabase Production ก่อนใช้งาน",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const rows = (data || []) as CrawlerVisit[];
  return NextResponse.json(
    {
      success: true,
      connected: true,
      totals: {
        visits: rows.length,
        bots: new Set(rows.map((row) => row.bot_name)).size,
        pages: new Set(rows.map((row) => row.path)).size,
      },
      byBot: countBy(rows, (row) => row.bot_name),
      byPath: countPaths(rows),
      byIntent: countIntents(rows),
      byReferrer: countReferrers(rows),
      recent: rows.slice(0, 20).map((row) => ({
        ...row,
        referrer_label: referrerLabel(row.referrer),
        search_hint: searchHintFromUrl(row.path) || searchHintFromUrl(row.referrer),
        inferred_intent: inferIntent(row.path, row.referrer),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
