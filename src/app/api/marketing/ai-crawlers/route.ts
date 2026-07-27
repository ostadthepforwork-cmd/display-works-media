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
      byPath: countBy(rows, (row) => row.path).slice(0, 10),
      recent: rows.slice(0, 20),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
