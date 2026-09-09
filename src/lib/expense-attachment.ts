export const EXPENSE_EVIDENCE_BUCKET = "erp-expense-evidence";
export const MAX_EXPENSE_EVIDENCE_BYTES = 10 * 1024 * 1024;

const TYPES = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
} as const;

export type ExpenseEvidenceExtension = keyof typeof TYPES;

export type ExpenseAttachmentValidation =
  | { ok: true; extension: ExpenseEvidenceExtension; mimeType: string; safeFilename: string }
  | { ok: false; code: string };

function extensionFromName(name: string) {
  return name.split(".").pop()?.toLowerCase() as ExpenseEvidenceExtension | undefined;
}

function hasSignature(extension: ExpenseEvidenceExtension, bytes: Uint8Array) {
  if (extension === "pdf") {
    return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  }
  if (extension === "png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export function safeExpenseEvidenceFilename(name: string) {
  const normalized = name.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return normalized.slice(0, 180) || "evidence";
}

export function validateExpenseAttachment(input: {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
}): ExpenseAttachmentValidation {
  if (!Number.isInteger(input.size) || input.size <= 0) return { ok: false, code: "EMPTY_FILE" };
  if (input.size > MAX_EXPENSE_EVIDENCE_BYTES) return { ok: false, code: "FILE_TOO_LARGE" };
  const extension = extensionFromName(input.name);
  if (!extension || !(extension in TYPES)) return { ok: false, code: "FILE_TYPE_NOT_ALLOWED" };
  const expectedType = TYPES[extension];
  if (input.type.toLowerCase() !== expectedType) return { ok: false, code: "MIME_MISMATCH" };
  if (!hasSignature(extension, input.bytes)) return { ok: false, code: "INVALID_FILE_SIGNATURE" };
  return {
    ok: true,
    extension,
    mimeType: expectedType,
    safeFilename: safeExpenseEvidenceFilename(input.name),
  };
}
