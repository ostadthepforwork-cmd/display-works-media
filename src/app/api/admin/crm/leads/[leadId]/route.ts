import { NextResponse } from "next/server";
import { authorizeCrm, crmError, numberOrNull, textOrNull } from "@/lib/crm-api";
import { assertLeadTransition, LEAD_STATUSES, LOST_REASONS, resolveAttribution } from "@/lib/marketing-attribution";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ leadId: string }> }) {
  const supabase = await createAuthenticatedServerClient();
  const authorization = await authorizeCrm(supabase, true);
  if (!authorization.user) return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  const { leadId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const currentResult = await supabase.from("crm_leads").select("*").eq("lead_id", leadId).maybeSingle();
  if (currentResult.error || !currentResult.data) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const current = currentResult.data;
  const leadStatus = String(body.lead_status ?? current.lead_status);
  const qualifiedStatus = String(body.qualified_status ?? current.qualified_status);
  const lostReason = body.lost_reason === undefined ? current.lost_reason : textOrNull(body.lost_reason, 40);
  if (!LEAD_STATUSES.includes(leadStatus as never)) return NextResponse.json({ error: "Invalid lead status" }, { status: 400 });
  if (!["unreviewed", "qualified", "not_qualified"].includes(qualifiedStatus)) return NextResponse.json({ error: "Invalid qualified status" }, { status: 400 });
  if (lostReason && !LOST_REASONS.includes(lostReason as never)) return NextResponse.json({ error: "Invalid lost reason" }, { status: 400 });
  const receipt = await supabase.from("crm_lead_document_mappings").select("receipt_id")
    .eq("lead_id", leadId).not("receipt_id", "is", null).limit(1).maybeSingle();
  try {
    assertLeadTransition({
      leadStatus: leadStatus as never,
      qualifiedStatus: qualifiedStatus as never,
      qualificationMethod: qualifiedStatus === "unreviewed" ? null : "manual",
      lostReason: (leadStatus === "closed_lost" ? lostReason : null) as never,
      hasReceiptMapping: Boolean(receipt.data?.receipt_id),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid lead transition" }, { status: 400 });
  }

  const hasAttributionFields = ["campaign_id", "adset_id", "ad_id", "referral_id", "fbclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "force_unattributed", "manual_selection_confirmed"]
    .some((key) => Object.hasOwn(body, key));
  const merged = { ...current, ...body };
  const attribution = hasAttributionFields ? resolveAttribution({
    adId: textOrNull(merged.ad_id, 200), referralId: textOrNull(merged.referral_id, 300),
    campaignId: textOrNull(merged.campaign_id, 200), adsetId: textOrNull(merged.adset_id, 200),
    fbclid: textOrNull(merged.fbclid, 500), utmSource: textOrNull(merged.utm_source, 200),
    utmMedium: textOrNull(merged.utm_medium, 200), utmCampaign: textOrNull(merged.utm_campaign, 300),
    utmContent: textOrNull(merged.utm_content, 300), manualSelectionConfirmed: body.manual_selection_confirmed === true,
    forceUnattributed: body.force_unattributed === true,
  }) : null;
  const row: Record<string, unknown> = {
    lead_status: leadStatus,
    qualified_status: qualifiedStatus,
    qualification_method: qualifiedStatus === "unreviewed" ? null : "manual",
    lost_reason: leadStatus === "closed_lost" ? lostReason : null,
  };
  for (const [key, max] of Object.entries({
    source: 80, source_detail: 500, campaign_id: 200, campaign_name: 500, adset_id: 200, adset_name: 500,
    ad_id: 200, ad_name: 500, creative_id: 200, referral_id: 300, fbclid: 500, utm_source: 200,
    utm_medium: 200, utm_campaign: 300, utm_content: 300, product: 500, size_or_area: 500,
    deadline_or_use_date: 10, artwork_status: 100, use_case: 500, location: 500, customer_type: 100,
    next_follow_up_at: 40,
  })) if (Object.hasOwn(body, key)) row[key] = textOrNull(body[key], max);
  if (Object.hasOwn(body, "quantity")) row.quantity = numberOrNull(body.quantity);
  if (Object.hasOwn(body, "estimated_value")) row.estimated_value = numberOrNull(body.estimated_value);
  if (Object.hasOwn(body, "installation_required")) row.installation_required = typeof body.installation_required === "boolean" ? body.installation_required : null;
  if (attribution) {
    row.attribution_method = attribution.method;
    row.attribution_confirmed_at = attribution.method === "manual" ? new Date().toISOString() : null;
    row.attribution_confirmed_by = attribution.method === "manual" ? authorization.user.id : null;
  }
  const { data, error } = await supabase.from("crm_leads").update(row).eq("lead_id", leadId).select("*").single();
  if (error) {
    const result = crmError(error, "Unable to update CRM lead");
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ lead: data, attributionEvidence: attribution?.evidence ?? null }, { headers: { "Cache-Control": "no-store" } });
}
