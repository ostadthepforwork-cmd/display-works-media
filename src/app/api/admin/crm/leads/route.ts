import { NextResponse } from "next/server";
import { authorizeCrm, crmError, numberOrNull, textOrNull } from "@/lib/crm-api";
import { LEAD_STATUSES, LOST_REASONS, resolveAttribution } from "@/lib/marketing-attribution";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const columns = [
  "lead_id", "created_at", "customer_id", "source", "source_detail", "campaign_id", "campaign_name",
  "adset_id", "adset_name", "ad_id", "ad_name", "creative_id", "conversation_id", "referral_id", "fbclid",
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "product", "size_or_area", "quantity",
  "deadline_or_use_date", "artwork_status", "use_case", "installation_required", "location", "customer_type",
  "lead_status", "qualified_status", "qualification_method", "suggested_qualified", "qualified_at", "lost_reason",
  "estimated_value", "owner_id", "next_follow_up_at", "attribution_method", "updated_at",
].join(",");

const marketingColumns = [
  "lead_id", "created_at", "source", "campaign_id", "campaign_name", "adset_id", "adset_name",
  "ad_id", "ad_name", "creative_id", "referral_id", "fbclid", "utm_source", "utm_medium",
  "utm_campaign", "utm_content", "product", "size_or_area", "quantity", "deadline_or_use_date",
  "artwork_status", "use_case", "installation_required", "customer_type", "lead_status",
  "qualified_status", "qualification_method", "suggested_qualified", "qualified_at", "lost_reason",
  "estimated_value", "next_follow_up_at", "attribution_method", "updated_at",
].join(",");

export async function GET(request: Request) {
  const supabase = await createAuthenticatedServerClient();
  const authorization = await authorizeCrm(supabase);
  if (!authorization.user) return NextResponse.json({ error: authorization.error }, { status: authorization.status });

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const readableColumns = authorization.role === "marketing" ? marketingColumns : columns;
  let query = supabase.from("crm_leads").select(readableColumns).order("created_at", { ascending: false }).limit(1000);
  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);
  const { data, error } = await query;
  if (error) {
    const result = crmError(error, "Unable to load CRM leads");
    return NextResponse.json({ error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ leads: data ?? [], role: authorization.role }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createAuthenticatedServerClient();
  const authorization = await authorizeCrm(supabase, true);
  if (!authorization.user) return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  const body = await request.json().catch(() => ({}));
  const leadStatus = String(body.lead_status || "new");
  const qualifiedStatus = String(body.qualified_status || "unreviewed");
  const lostReason = textOrNull(body.lost_reason, 40);
  if (!LEAD_STATUSES.includes(leadStatus as never)) return NextResponse.json({ error: "Invalid lead status" }, { status: 400 });
  if (!["unreviewed", "qualified", "not_qualified"].includes(qualifiedStatus)) return NextResponse.json({ error: "Invalid qualified status" }, { status: 400 });
  if (lostReason && !LOST_REASONS.includes(lostReason as never)) return NextResponse.json({ error: "Invalid lost reason" }, { status: 400 });
  if (leadStatus === "closed_lost" && !lostReason) return NextResponse.json({ error: "Closed Lost requires a lost reason" }, { status: 400 });
  if (leadStatus === "closed_won") return NextResponse.json({ error: "Map a real receipt before marking this lead Won" }, { status: 400 });

  const attribution = resolveAttribution({
    adId: textOrNull(body.ad_id, 200), referralId: textOrNull(body.referral_id, 300),
    campaignId: textOrNull(body.campaign_id, 200), adsetId: textOrNull(body.adset_id, 200),
    fbclid: textOrNull(body.fbclid, 500), utmSource: textOrNull(body.utm_source, 200),
    utmMedium: textOrNull(body.utm_medium, 200), utmCampaign: textOrNull(body.utm_campaign, 300),
    utmContent: textOrNull(body.utm_content, 300), manualSelectionConfirmed: body.manual_selection_confirmed === true,
    forceUnattributed: body.force_unattributed === true,
  });
  const row = {
    customer_id: textOrNull(body.customer_id, 40), source: textOrNull(body.source, 80) || "unattributed",
    source_detail: textOrNull(body.source_detail), campaign_id: textOrNull(body.campaign_id, 200),
    campaign_name: textOrNull(body.campaign_name), adset_id: textOrNull(body.adset_id, 200),
    adset_name: textOrNull(body.adset_name), ad_id: textOrNull(body.ad_id, 200), ad_name: textOrNull(body.ad_name),
    creative_id: textOrNull(body.creative_id, 200), conversation_id: textOrNull(body.conversation_id, 300),
    referral_id: textOrNull(body.referral_id, 300), fbclid: textOrNull(body.fbclid, 500),
    utm_source: textOrNull(body.utm_source, 200), utm_medium: textOrNull(body.utm_medium, 200),
    utm_campaign: textOrNull(body.utm_campaign, 300), utm_content: textOrNull(body.utm_content, 300),
    product: textOrNull(body.product), size_or_area: textOrNull(body.size_or_area), quantity: numberOrNull(body.quantity),
    deadline_or_use_date: textOrNull(body.deadline_or_use_date, 10), artwork_status: textOrNull(body.artwork_status, 100),
    use_case: textOrNull(body.use_case), installation_required: typeof body.installation_required === "boolean" ? body.installation_required : null,
    location: textOrNull(body.location), customer_type: textOrNull(body.customer_type, 100), lead_status: leadStatus,
    qualified_status: qualifiedStatus, qualification_method: qualifiedStatus === "unreviewed" ? null : "manual",
    lost_reason: leadStatus === "closed_lost" ? lostReason : null, estimated_value: numberOrNull(body.estimated_value),
    owner_id: textOrNull(body.owner_id, 40) || authorization.user.id, next_follow_up_at: textOrNull(body.next_follow_up_at, 40),
    attribution_method: attribution.method,
    attribution_confirmed_at: attribution.method === "manual" ? new Date().toISOString() : null,
    attribution_confirmed_by: attribution.method === "manual" ? authorization.user.id : null,
  };
  const { data, error } = await supabase.from("crm_leads").insert(row).select(columns).single();
  if (error) {
    const result = crmError(error, "Unable to create CRM lead");
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ lead: data, attributionEvidence: attribution.evidence }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
