import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const AI_HOSTS: Record<string, string[]> = {
  chatgpt: ["chatgpt.com", "chat.openai.com"],
  openai: ["openai.com"],
  perplexity: ["perplexity.ai"],
  claude: ["claude.ai"],
  copilot: ["copilot.microsoft.com", "bing.com"],
  gemini: ["gemini.google.com", "bard.google.com"],
  poe: ["poe.com"],
  you: ["you.com"],
  phind: ["phind.com"],
};

function isPublicLandingPage(path: string) {
  return (
    path &&
    path.length <= 300 &&
    !/^\/(admin|api|auth|doc|login)(\/|$)/i.test(path) &&
    !/\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|ico|woff|woff2|ttf|map)$/i.test(path)
  );
}

function referrerMatchesPlatform(platform: string, referrer: string) {
  const hosts = AI_HOSTS[platform] || [];
  if (!hosts.length) return false;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    return hosts.some((knownHost) => host === knownHost || host.endsWith(`.${knownHost}`));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { success: false, error: "Supabase env is missing" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = await request.json().catch(() => ({}));
  const platform = String(body.platform || "").toLowerCase();
  const landingPage = String(body.landing_page || "").slice(0, 300);
  const referrer = String(body.referrer || "").slice(0, 500);

  if (!AI_HOSTS[platform] || !isPublicLandingPage(landingPage) || !referrerMatchesPlatform(platform, referrer)) {
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
    referrer,
    user_agent: userAgent,
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        hint: "กรุณารัน supabase/ai-citation-monitoring.sql ใน Supabase Production",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
