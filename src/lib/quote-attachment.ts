export const MAX_QUOTE_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const MIME_TYPES = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  psd: "application/octet-stream",
  ai: "application/postscript",
} as const;

export function validateQuoteAttachment(input: { name: string; size: number; bytes: Uint8Array }):
  { ok: true; mimeType: string } | { ok: false } {
  if (!Number.isInteger(input.size) || input.size <= 0 || input.size > MAX_QUOTE_ATTACHMENT_BYTES) return { ok: false };
  const extension = input.name.split(".").pop()?.toLowerCase();
  if (!extension || !Object.hasOwn(MIME_TYPES, extension)) return { ok: false };
  const bytes = input.bytes;
  const startsWith = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  const header = new TextDecoder("ascii").decode(bytes.slice(0, 1024));
  const isPdf = header.startsWith("%PDF-");
  let valid = false;
  let mimeType: string = MIME_TYPES[extension as keyof typeof MIME_TYPES];
  if (extension === "pdf") valid = isPdf;
  if (extension === "png") valid = startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (extension === "jpg" || extension === "jpeg") valid = startsWith([0xff, 0xd8, 0xff]);
  if (extension === "psd") valid = startsWith([0x38, 0x42, 0x50, 0x53, 0x00, 0x01, 0, 0, 0, 0, 0, 0]);
  // Illustrator supports PDF-compatible files and legacy Adobe PostScript artwork.
  if (extension === "ai") {
    valid = isPdf || (header.startsWith("%!PS-Adobe-") && /Adobe Illustrator|%%AI\d|%AI\d/.test(header));
    if (isPdf) mimeType = MIME_TYPES.pdf;
  }
  return valid ? { ok: true, mimeType } : { ok: false };
}
