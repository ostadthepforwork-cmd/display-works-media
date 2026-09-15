import { NextResponse } from "next/server";
import { checkAdminAuthorization } from "@/lib/admin-authorization";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
const roles = ["owner", "admin", "sales", "marketing"] as const;

export async function GET() {
  const supabase = await createAuthenticatedServerClient();
  const authorization = await checkAdminAuthorization(supabase, roles);
  if (!authorization.user) return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  const { data, error } = await supabase.from("marketing_campaign_budgets").select("campaign_id,daily_budget,lifetime_budget,start_date,end_date,currency,updated_at").order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Campaign budgets unavailable" }, { status: error.code === "42P01" ? 503 : 400 });
  return NextResponse.json({ budgets: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createAuthenticatedServerClient();
  const authorization = await checkAdminAuthorization(supabase, ["owner", "admin", "marketing"]);
  if (!authorization.user) return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  const body = await request.json().catch(() => ({}));
  const campaignId = String(body.campaign_id || "").trim();
  const dailyBudget = body.daily_budget === "" || body.daily_budget === null ? null : Number(body.daily_budget);
  const lifetimeBudget = body.lifetime_budget === "" || body.lifetime_budget === null || body.lifetime_budget === undefined ? null : Number(body.lifetime_budget);
  if (!campaignId || (dailyBudget === null && lifetimeBudget === null)) return NextResponse.json({ error: "Campaign and budget are required" }, { status: 400 });
  if ((dailyBudget !== null && (!Number.isFinite(dailyBudget) || dailyBudget < 0)) || (lifetimeBudget !== null && (!Number.isFinite(lifetimeBudget) || lifetimeBudget < 0))) return NextResponse.json({ error: "Invalid budget amount" }, { status: 400 });
  const campaign = await supabase.from("marketing_meta_entities").select("entity_id").eq("entity_type", "campaign").eq("entity_id", campaignId).maybeSingle();
  if (!campaign.data) return NextResponse.json({ error: "Campaign ID is not present in the latest Meta sync" }, { status: 409 });
  const { data, error } = await supabase.from("marketing_campaign_budgets").upsert({
    campaign_id: campaignId, daily_budget: dailyBudget, lifetime_budget: lifetimeBudget,
    start_date: body.start_date || null, end_date: body.end_date || null,
    currency: String(body.currency || "THB").toUpperCase(), updated_by: authorization.user.id,
  }, { onConflict: "campaign_id" }).select("campaign_id,daily_budget,lifetime_budget,start_date,end_date,currency,updated_at").single();
  if (error) return NextResponse.json({ error: "Unable to save campaign budget" }, { status: 400 });
  return NextResponse.json({ budget: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
