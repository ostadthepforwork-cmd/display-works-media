import { NextResponse } from "next/server";
import { checkAdminAuthorization } from "@/lib/admin-authorization";
import {
  EXPENSE_EVIDENCE_BUCKET,
  MAX_EXPENSE_EVIDENCE_BYTES,
  validateExpenseAttachment,
} from "@/lib/expense-attachment";
import { createPrivilegedServerClient } from "@/lib/supabase-privileged-server";
import { createAuthenticatedServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ expenseId: string }> },
) {
  const supabase = await createAuthenticatedServerClient();
  const authorization = await checkAdminAuthorization(supabase);
  if (!authorization.user) {
    return json({ success: false, error: authorization.error }, authorization.status);
  }

  const { expenseId } = await params;
  if (!UUID_PATTERN.test(expenseId)) return json({ success: false, error: "Invalid expense ID" }, 400);

  const { data: expense, error: expenseError } = await supabase
    .from("erp_expenses")
    .select("id, voided_at")
    .eq("id", expenseId)
    .maybeSingle();
  if (expenseError) return json({ success: false, error: "Expense lookup failed" }, 503);
  if (!expense) return json({ success: false, error: "Expense not found" }, 404);
  if (expense.voided_at) return json({ success: false, error: "Cannot add evidence to a voided expense" }, 409);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ success: false, error: "Invalid multipart request" }, 400);
  }
  const value = formData.get("file");
  if (!value || typeof value === "string") return json({ success: false, error: "Evidence file is required" }, 400);

  const file = value as File;
  if (file.size <= 0) return json({ success: false, error: "EMPTY_FILE" }, 400);
  if (file.size > MAX_EXPENSE_EVIDENCE_BYTES) return json({ success: false, error: "FILE_TOO_LARGE" }, 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateExpenseAttachment({
    name: file.name,
    type: file.type,
    size: file.size,
    bytes,
  });
  if (!validation.ok) return json({ success: false, error: validation.code }, 400);

  const attachmentId = crypto.randomUUID();
  const storagePath = `expenses/${expenseId}/${attachmentId}.${validation.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(EXPENSE_EVIDENCE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: validation.mimeType,
      upsert: false,
      cacheControl: "0",
    });
  if (uploadError) return json({ success: false, error: "Evidence upload failed" }, 503);

  const { data: attachment, error: metadataError } = await supabase.rpc(
    "register_erp_expense_attachment_v1",
    {
      p_expense_id: expenseId,
      p_attachment_id: attachmentId,
      p_storage_path: storagePath,
      p_original_filename: validation.safeFilename,
      p_mime_type: validation.mimeType,
      p_size_bytes: file.size,
    },
  );

  if (metadataError) {
    let cleanupError: unknown = null;
    try {
      const privileged = createPrivilegedServerClient();
      const cleanup = await privileged.storage.from(EXPENSE_EVIDENCE_BUCKET).remove([storagePath]);
      cleanupError = cleanup.error;
    } catch (error) {
      cleanupError = error;
    }
    if (cleanupError) {
      console.error("expense evidence orphan cleanup required", {
        expenseId,
        attachmentId,
        storagePath,
        actorId: authorization.user.id,
        metadataError: metadataError.message,
        cleanupError: String((cleanupError as { message?: unknown })?.message || cleanupError),
      });
    }
    return json({
      success: false,
      error: "Evidence metadata save failed",
      cleanupRequired: Boolean(cleanupError),
    }, 503);
  }

  return json({ success: true, attachment }, 201);
}
