import { NextResponse } from "next/server";
import { authorizeCrm, crmError, numberOrNull, textOrNull } from "@/lib/crm-api";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createAuthenticatedServerClient();
  const authorization = await authorizeCrm(supabase);
  if (!authorization.user) return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  const { data, error } = await supabase.from("crm_lead_document_mappings")
    .select("mapping_id,lead_id,quote_id,receipt_id,mapping_method,mapping_confidence,mapped_at,updated_at")
    .order("mapped_at", { ascending: false }).limit(2000);
  if (error) {
    const result = crmError(error, "Unable to load CRM mappings");
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ mappings: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createAuthenticatedServerClient();
  const authorization = await authorizeCrm(supabase, true);
  if (!authorization.user) return NextResponse.json({ error: authorization.error }, { status: authorization.status });
  const body = await request.json().catch(() => ({}));
  const method = String(body.mapping_method || "manual");
  if (!["automatic", "manual", "imported", "unattributed"].includes(method)) {
    return NextResponse.json({ error: "Invalid mapping method" }, { status: 400 });
  }
  if (method === "unattributed") return NextResponse.json({ error: "Unattributed ERP documents do not require a lead mapping" }, { status: 400 });
  const leadId = textOrNull(body.lead_id, 40);
  const quoteId = textOrNull(body.quote_id, 40);
  const receiptId = textOrNull(body.receipt_id, 40);
  if (!leadId || (!quoteId && !receiptId)) return NextResponse.json({ error: "lead_id and a quote or receipt are required" }, { status: 400 });
  const { data, error } = await supabase.rpc("save_crm_document_mapping_v1", {
    p_lead_id: leadId, p_quote_id: quoteId, p_receipt_id: receiptId,
    p_mapping_method: method, p_mapping_confidence: numberOrNull(body.mapping_confidence),
    p_mapping_evidence: typeof body.mapping_evidence === "object" && body.mapping_evidence ? body.mapping_evidence : {},
    p_mark_won: body.mark_won === true,
  });
  if (error) {
    const result = crmError(error, "Unable to save CRM mapping");
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ mapping: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
