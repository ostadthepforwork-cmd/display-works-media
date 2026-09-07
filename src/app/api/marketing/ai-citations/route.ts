import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkAdminAuthorization } from "@/lib/admin-authorization";
import { aiDateRange, bangkokDay, citationEvidence, detectAiReferrer, ownCitationUrls, safeUrlList } from "@/lib/ai-evidence";

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
    const urls = key === "cited_urls" ? ownCitationUrls(row[key]) : safeUrlList(row[key]);
    urls.forEach((url) => {
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
    const date = bangkokDay(row.timestamp);
    grouped[date] = grouped[date] || { date, citations: 0, referrals: 0 };
    if (citationEvidence(row) === "recorded") grouped[date].citations += 1;
  });
  referrals.forEach((row) => {
    const date = bangkokDay(row.created_at);
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
  const authorization = await checkAdminAuthorization(supabase);
  if (!authorization.user) {
    return NextResponse.json(
      { success: false, connected: false, error: authorization.error },
      { status: authorization.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const range = aiDateRange(request);
  if (!range) return NextResponse.json({ success: false, connected: false, error: "Invalid date range" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  const { startIso, endIso } = range;
  const [citationResult, referralResult] = await Promise.all([
    supabase
      .from("ai_citation_logs")
      .select("id, timestamp, platform, prompt_text, is_cited, cited_urls, competitor_urls, brand_mentions, source", { count: "exact" })
      .gte("timestamp", startIso)
      .lte("timestamp", endIso)
      .order("timestamp", { ascending: false })
      .limit(1000),
    supabase
      .from("ai_referral_visits")
      .select("id, platform, landing_page, referrer, created_at", { count: "exact" })
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const missingTableError = citationResult.error || referralResult.error;
  if (citationResult.error && referralResult.error) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: "AI monitoring data unavailable",
        hint: "ตรวจสอบการเชื่อมต่อและสิทธิ์ตารางก่อน ห้ามรัน SQL production โดยไม่ผ่าน review",
        totals: {},
        byPlatform: [],
        byCitedPage: [],
        competitors: [],
        referralsByPlatform: [],
        daily: [],
        recent: [],
        recentReferrals: [],
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const citations = (citationResult.data || []) as CitationLog[];
  const referralRows = (referralResult.data || []) as AiReferral[];
  const referrals = referralRows.filter(row => detectAiReferrer(row.referrer || "")?.platform === row.platform);
  const citedRows = citations.filter((row) => citationEvidence(row) === "recorded");
  const citedPages = countUrls(citedRows, "cited_urls");
  const competitors = countUrls(citations, "competitor_urls");

  return NextResponse.json(
    {
      success: true,
      connected: true,
      sources: { citations: !citationResult.error, referrals: !referralResult.error },
      warning: missingTableError ? "บางแหล่งข้อมูลไม่พร้อม: ตรวจสอบ schema และสิทธิ์ก่อนเปิดใช้งาน ไม่ได้หมายความว่าไม่มี AI เข้าเว็บ" : null,
      range,
      evidence: {
        type: "recorded_logs_not_independently_verified",
        inconsistent: citations.filter(row => citationEvidence(row) === "inconsistent").length,
        excludedReferrals: referralRows.length - referrals.length,
        truncated: (citationResult.count ?? citations.length) > citations.length || (referralResult.count ?? referralRows.length) > referralRows.length,
        limitPerSource: 1000,
        totalCitationRows: citationResult.count,
        totalReferralRows: referralResult.count,
      },
      totals: {
        promptsChecked: citationResult.error ? null : citations.length,
        cited: citedRows.length,
        citationRate: citations.length ? (citedRows.length / citations.length) * 100 : null,
        platforms: new Set(citations.map((row) => row.platform)).size,
        referralVisits: referralResult.error ? null : referrals.length,
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
        evidence_status: citationEvidence(row),
        cited_urls: ownCitationUrls(row.cited_urls),
        competitor_urls: safeUrlList(row.competitor_urls),
        brand_mentions: asArray(row.brand_mentions),
      })),
      recentReferrals: referrals.slice(0, 20),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
