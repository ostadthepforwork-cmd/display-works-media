import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type CitationLog = {
  id: string;
  timestamp: string;
  platform: string;
  prompt_text: string;
  is_cited: boolean;
  cited_urls: unknown;
  competitor_urls: unknown;
  brand_mentions: unknown;
  raw_response: string | null;
  source: string | null;
};

type AiReferral = {
  id: string;
  platform: string;
  landing_page: string;
  referrer: string | null;
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

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeUrlList(value: unknown) {
  return asArray(value)
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "url" in item) return String((item as { url?: unknown }).url || "");
      return "";
    })
    .filter(Boolean);
}

function hostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0] || "unknown";
  }
}

function countBy<T>(rows: T[], keyFn: (row: T) => string) {
  return Object.entries(rows.reduce<Record<string, number>>((acc, row) => {
    const key = keyFn(row) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function countUrls(rows: CitationLog[], key: "cited_urls" | "competitor_urls") {
  const counts: Record<string, number> = {};
  rows.forEach((row) => {
    normalizeUrlList(row[key]).forEach((url) => {
      const label = key === "competitor_urls" ? hostname(url) : url;
      counts[label] = (counts[label] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count);
}

function countDaily(citations: CitationLog[], referrals: AiReferral[]) {
  const grouped: Record<string, { date: string; citations: number; referrals: number }> = {};
  citations.forEach((row) => {
    const date = row.timestamp.slice(0, 10);
    grouped[date] = grouped[date] || { date, citations: 0, referrals: 0 };
    if (row.is_cited) grouped[date].citations += 1;
  });
  referrals.forEach((row) => {
    const date = row.created_at.slice(0, 10);
    grouped[date] = grouped[date] || { date, citations: 0, referrals: 0 };
    grouped[date].referrals += 1;
  });
  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

async function makeSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export async function GET(request: Request) {
  const supabase = await makeSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json(
      { success: false, connected: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { startIso, endIso } = dateRangeFromRequest(request);
  const [citationResult, referralResult] = await Promise.all([
    supabase
      .from("ai_citation_logs")
      .select("id, timestamp, platform, prompt_text, is_cited, cited_urls, competitor_urls, brand_mentions, raw_response, source")
      .gte("timestamp", startIso)
      .lte("timestamp", endIso)
      .order("timestamp", { ascending: false })
      .limit(1000),
    supabase
      .from("ai_referral_visits")
      .select("id, platform, landing_page, referrer, created_at")
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const missingTableError = citationResult.error || referralResult.error;
  if (missingTableError) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: missingTableError.message,
        hint: "กรุณารัน supabase/ai-citation-monitoring.sql ใน Supabase Production ก่อนใช้งาน",
        totals: {},
        byPlatform: [],
        byCitedPage: [],
        competitors: [],
        referralsByPlatform: [],
        daily: [],
        recent: [],
        recentReferrals: [],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const citations = (citationResult.data || []) as CitationLog[];
  const referrals = (referralResult.data || []) as AiReferral[];
  const citedRows = citations.filter((row) => row.is_cited);
  const citedPages = countUrls(citedRows, "cited_urls");
  const competitors = countUrls(citations, "competitor_urls");

  return NextResponse.json(
    {
      success: true,
      connected: true,
      totals: {
        promptsChecked: citations.length,
        cited: citedRows.length,
        citationRate: citations.length ? (citedRows.length / citations.length) * 100 : 0,
        platforms: new Set(citations.map((row) => row.platform)).size,
        referralVisits: referrals.length,
        topCitedPages: citedPages.length,
        competitorDomains: competitors.length,
      },
      byPlatform: countBy(citations, (row) => row.platform),
      byCitedPage: citedPages.slice(0, 10),
      competitors: competitors.slice(0, 10),
      referralsByPlatform: countBy(referrals, (row) => row.platform),
      daily: countDaily(citations, referrals),
      recent: citations.slice(0, 20).map((row) => ({
        ...row,
        cited_urls: normalizeUrlList(row.cited_urls),
        competitor_urls: normalizeUrlList(row.competitor_urls),
        brand_mentions: asArray(row.brand_mentions),
      })),
      recentReferrals: referrals.slice(0, 20),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
