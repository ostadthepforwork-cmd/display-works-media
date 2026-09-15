export const LOST_REASONS = [
  "ghost",
  "price",
  "deadline",
  "competitor",
  "budget",
  "scope_mismatch",
  "artwork_not_ready",
  "cancelled",
  "cannot_produce",
  "no_response",
  "unknown",
] as const;

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "waiting_detail",
  "detail_completed",
  "quotation_sent",
  "follow_up",
  "waiting_payment",
  "closed_won",
  "closed_lost",
  "not_qualified",
] as const;

export type LostReason = (typeof LOST_REASONS)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type QualifiedStatus = "unreviewed" | "qualified" | "not_qualified";
export type AttributionMethod = "automatic" | "manual" | "unattributed";

export type AttributionInput = {
  adId?: string | null;
  referralId?: string | null;
  campaignId?: string | null;
  adsetId?: string | null;
  fbclid?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  manualSelectionConfirmed?: boolean;
  forceUnattributed?: boolean;
};

export type QualificationInput = {
  product?: string | null;
  sizeOrArea?: string | null;
  quantity?: number | null;
  deadlineOrUseDate?: string | null;
  artworkStatus?: string | null;
  useCase?: string | null;
};

export type FunnelCounts = {
  totalLeads: number;
  qualifiedLeads: number;
  quotes: number;
  won: number;
  lost: number;
  spend: number;
  attributedRevenue: number;
  grossProfit: number | null;
};

const present = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;

export function suggestQualified(input: QualificationInput) {
  return present(input.product) && [
    input.sizeOrArea,
    input.quantity,
    input.deadlineOrUseDate,
    input.artworkStatus,
    input.useCase,
  ].some(present);
}

export function resolveAttribution(input: AttributionInput): {
  method: AttributionMethod;
  evidence: "ad_id" | "referral_id" | "utm" | "fbclid" | "manual_selection" | "none";
} {
  if (input.forceUnattributed) return { method: "unattributed", evidence: "none" };
  if (present(input.adId)) return { method: "automatic", evidence: "ad_id" };
  if (present(input.referralId)) return { method: "automatic", evidence: "referral_id" };
  if ([input.utmSource, input.utmMedium, input.utmCampaign, input.utmContent].some(present)) {
    return { method: "automatic", evidence: "utm" };
  }
  if (present(input.fbclid)) return { method: "automatic", evidence: "fbclid" };
  if (input.manualSelectionConfirmed && [input.campaignId, input.adsetId, input.adId].some(present)) {
    return { method: "manual", evidence: "manual_selection" };
  }
  return { method: "unattributed", evidence: "none" };
}

export function safeDivide(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

export function calculateFunnelMetrics(counts: FunnelCounts) {
  return {
    qualifiedRate: safeDivide(counts.qualifiedLeads, counts.totalLeads),
    quoteRate: safeDivide(counts.quotes, counts.qualifiedLeads),
    closeRate: safeDivide(counts.won, counts.quotes),
    costPerQualified: safeDivide(counts.spend, counts.qualifiedLeads),
    costPerQuote: safeDivide(counts.spend, counts.quotes),
    cac: safeDivide(counts.spend, counts.won),
    roas: safeDivide(counts.attributedRevenue, counts.spend),
    revenue: counts.attributedRevenue,
    grossProfit: counts.grossProfit,
    lost: counts.lost,
  };
}

export function creativeRecommendation(input: {
  spend: number;
  qualifiedLeads: number;
  quotes: number;
  won: number;
  attributedRevenue: number;
}) {
  if (input.attributedRevenue > 0 || input.won > 0) return "ควรทำซ้ำ: มี Won หรือรายได้ ERP ที่เชื่อมแล้ว";
  if (input.quotes > 0) return "มีใบเสนอราคา: ติดตามผลก่อนเพิ่มงบ";
  if (input.qualifiedLeads > 0) return "มี Qualified lead: เก็บ Quote/Won เพิ่มก่อนสรุป";
  if (input.spend > 0) return "ยังไม่มีหลักฐาน Qualified, Quote หรือ Won";
  return "ยังไม่มีข้อมูลเพียงพอ";
}

export function assertLeadTransition(input: {
  leadStatus: LeadStatus;
  qualifiedStatus: QualifiedStatus;
  qualificationMethod?: "manual" | null;
  lostReason?: LostReason | null;
  hasReceiptMapping?: boolean;
}) {
  if (input.leadStatus === "closed_lost" && !input.lostReason) {
    throw new Error("Closed Lost requires a lost reason");
  }
  if (input.leadStatus !== "closed_lost" && input.lostReason) {
    throw new Error("Lost reason is only valid for Closed Lost");
  }
  if (input.leadStatus === "closed_won" && !input.hasReceiptMapping) {
    throw new Error("Closed Won requires a receipt mapping");
  }
  if (input.qualifiedStatus !== "unreviewed" && input.qualificationMethod !== "manual") {
    throw new Error("Qualification decisions must be marked as manual");
  }
}
