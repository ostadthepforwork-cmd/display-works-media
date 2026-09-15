import { NextResponse } from "next/server";
import { createPrivilegedServerClient } from "@/lib/supabase-privileged-server";
import { extractMessengerReferrals, verifyMetaSignature } from "@/lib/meta-messenger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const appSecret = process.env.META_APP_SECRET || "";
  const rawBody = await request.text();
  if (!verifyMetaSignature(rawBody, request.headers.get("x-hub-signature-256"), appSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const referrals = extractMessengerReferrals(payload, appSecret);
  if (!referrals.length) return NextResponse.json({ accepted: true, referrals: 0 }, { headers: { "Cache-Control": "no-store" } });

  const supabase = createPrivilegedServerClient();
  let accepted = 0;
  for (const referral of referrals) {
    let { data: lead } = await supabase.from("crm_leads")
      .select("lead_id").eq("conversation_id", referral.conversationId).maybeSingle();
    if (!lead) {
      const inserted = await supabase.from("crm_leads").insert({
        conversation_id: referral.conversationId,
        source: "meta_messenger",
        source_detail: "messenger_referral",
        campaign_id: referral.campaignId,
        adset_id: referral.adsetId,
        ad_id: referral.adId,
        referral_id: referral.referralId,
        attribution_method: referral.adId || referral.referralId ? "automatic" : "unattributed",
        lead_status: "new",
      }).select("lead_id").single();
      if (inserted.error?.code === "23505") {
        const existing = await supabase.from("crm_leads").select("lead_id")
          .eq("conversation_id", referral.conversationId).single();
        lead = existing.data;
      } else if (inserted.error) {
        console.error("Meta Messenger lead ingestion failed", { code: inserted.error.code });
        return NextResponse.json({ error: "CRM ingestion unavailable" }, { status: 503 });
      } else {
        lead = inserted.data;
      }
    }
    const event = await supabase.from("marketing_messenger_referrals").upsert({
      event_reference: referral.eventReference,
      conversation_id: referral.conversationId,
      referral_id: referral.referralId,
      campaign_id: referral.campaignId,
      adset_id: referral.adsetId,
      ad_id: referral.adId,
      occurred_at: referral.occurredAt,
      lead_id: lead!.lead_id,
      raw_metadata: referral.metadata,
    }, { onConflict: "event_reference", ignoreDuplicates: true });
    if (event.error) {
      console.error("Meta Messenger referral ingestion failed", { code: event.error.code });
      return NextResponse.json({ error: "Referral ingestion unavailable" }, { status: 503 });
    }
    accepted += 1;
  }
  return NextResponse.json({ accepted: true, referrals: accepted }, { headers: { "Cache-Control": "no-store" } });
}
