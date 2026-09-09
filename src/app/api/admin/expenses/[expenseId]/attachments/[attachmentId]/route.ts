import { NextResponse } from "next/server";
import { checkAdminAuthorization } from "@/lib/admin-authorization";
import { EXPENSE_EVIDENCE_BUCKET } from "@/lib/expense-attachment";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SIGNED_URL_TTL_SECONDS = 5 * 60;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ expenseId: string; attachmentId: string }> },
) {
  const supabase = await createAuthenticatedServerClient();
  const authorization = await checkAdminAuthorization(supabase);
  if (!authorization.user) {
    return json({ success: false, error: authorization.error }, authorization.status);
  }

  const { expenseId, attachmentId } = await params;
  if (!UUID_PATTERN.test(expenseId) || !UUID_PATTERN.test(attachmentId)) {
    return json({ success: false, error: "Invalid attachment ID" }, 400);
  }

  const { data: attachment, error } = await supabase
    .from("erp_expense_attachments")
    .select("id, expense_id, storage_path, original_filename, mime_type, size_bytes")
    .eq("id", attachmentId)
    .eq("expense_id", expenseId)
    .maybeSingle();
  if (error) return json({ success: false, error: "Evidence lookup failed" }, 503);
  if (!attachment) return json({ success: false, error: "Evidence not found" }, 404);

  const expectedPrefix = `expenses/${expenseId}/${attachmentId}.`;
  if (!attachment.storage_path.startsWith(expectedPrefix)) {
    return json({ success: false, error: "Invalid evidence metadata" }, 409);
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(EXPENSE_EVIDENCE_BUCKET)
    .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS);
  if (signedError || !signed?.signedUrl) {
    return json({ success: false, error: "Evidence link could not be created" }, 503);
  }

  return json({
    success: true,
    url: signed.signedUrl,
    expiresIn: SIGNED_URL_TTL_SECONDS,
    filename: attachment.original_filename,
  });
}
