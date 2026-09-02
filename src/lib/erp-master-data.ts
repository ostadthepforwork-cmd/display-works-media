export type MasterRecord = {
  id: string;
  name: string;
  taxId?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type DuplicateWarning = {
  confidence: "high" | "medium" | "low";
  message: string;
  recordIds: string[];
};

export type LegacySupplierPreview = {
  sourceKey: string;
  supplier: Record<string, unknown>;
  classification: "existing" | "conflict" | "new" | "invalid";
  matchedSupplierId?: string;
};

export function normalizeTaxId(value: unknown): string | null {
  const normalized = String(value ?? "").replace(/\D/g, "");
  return normalized || null;
}

export function normalizeProductCode(value: unknown): string | null {
  const normalized = String(value ?? "").trim().toUpperCase();
  return normalized || null;
}

export function normalizeIdentity(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function parseOptionalNonNegativeNumber(value: unknown, label: string): number | null {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }
  return parsed;
}

export function findCustomerDuplicateWarnings(
  candidate: Omit<MasterRecord, "id"> & { id?: string },
  customers: MasterRecord[],
): DuplicateWarning[] {
  const others = customers.filter((customer) => customer.id !== candidate.id);
  const taxId = normalizeTaxId(candidate.taxId);
  const candidateName = normalizeIdentity(candidate.name);
  const phone = normalizeIdentity(candidate.phone);
  const email = normalizeIdentity(candidate.email);
  const warnings: DuplicateWarning[] = [];

  const sameTaxId = taxId
    ? others.filter((customer) => normalizeTaxId(customer.taxId) === taxId)
    : [];
  if (sameTaxId.length) {
    warnings.push({
      confidence: "high",
      message: "พบเลขผู้เสียภาษีเดียวกัน โปรดตรวจสอบก่อนบันทึก",
      recordIds: sameTaxId.map((customer) => customer.id),
    });
  }

  const contactMatches = others.filter((customer) => {
    const samePhone = phone && normalizeIdentity(customer.phone) === phone;
    const sameEmail = email && normalizeIdentity(customer.email) === email;
    return Boolean(samePhone || sameEmail);
  });
  if (contactMatches.length) {
    warnings.push({
      confidence: "medium",
      message: "พบเบอร์โทรหรืออีเมลซ้ำ โปรดตรวจสอบตัวตนก่อนบันทึก",
      recordIds: contactMatches.map((customer) => customer.id),
    });
  }

  const nameMatches = candidateName
    ? others.filter((customer) => normalizeIdentity(customer.name) === candidateName)
    : [];
  if (nameMatches.length) {
    warnings.push({
      confidence: "low",
      message: "พบชื่อลูกค้าที่เหมือนกัน ระบบจะไม่รวมรายการให้อัตโนมัติ",
      recordIds: nameMatches.map((customer) => customer.id),
    });
  }
  return warnings;
}

export function previewLegacySuppliers(
  source: unknown,
  existing: MasterRecord[],
): LegacySupplierPreview[] {
  if (!Array.isArray(source)) return [];
  const existingNames = new Map(existing.map((supplier) => [normalizeIdentity(supplier.name), supplier]));
  const existingTaxes = new Map(
    existing
      .map((supplier) => [normalizeTaxId(supplier.taxId), supplier] as const)
      .filter((entry): entry is [string, MasterRecord] => entry[0] !== null),
  );

  return source.map((value, index) => {
    const supplier = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const name = String(supplier.name ?? "").trim();
    const taxId = normalizeTaxId(supplier.taxId ?? supplier.tax_id);
    const sourceKey = String(supplier.id ?? `legacy-${index}`);
    if (!name) return { sourceKey, supplier, classification: "invalid" };

    const exactTaxMatch = taxId ? existingTaxes.get(taxId) : undefined;
    if (exactTaxMatch) {
      return { sourceKey, supplier, classification: "existing", matchedSupplierId: exactTaxMatch.id };
    }
    const nameMatch = existingNames.get(normalizeIdentity(name));
    if (nameMatch) {
      return { sourceKey, supplier, classification: "conflict", matchedSupplierId: nameMatch.id };
    }
    return { sourceKey, supplier, classification: "new" };
  });
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function legacySupplierSourceFingerprint(source: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableJson(source));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
