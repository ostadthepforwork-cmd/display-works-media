import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectAiReferrer, publicReferralPath } from "@/lib/ai-evidence";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { success: false, error: "Supabase env is missing" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = (await request.json().catch(() => null)) || {};
  const platform = String(body.platform || "").toLowerCase();
  const landingPage = publicReferralPath(body.landing_page);
  const referrer = typeof body.referrer === "string" ? body.referrer : "";

  if (!landingPage || referrer.length > 500 || detectAiReferrer(referrer)?.platform !== platform) {
    return NextResponse.json(
      { success: false, error: "Invalid AI referral payload" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const userAgent = (request.headers.get("user-agent") || "").slice(0, 500);
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("ai_referral_visits").insert({
    platform,
    landing_page: landingPage,
    referrer: new URL(referrer).origin,
    user_agent: userAgent,
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: "AI referral storage unavailable",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
