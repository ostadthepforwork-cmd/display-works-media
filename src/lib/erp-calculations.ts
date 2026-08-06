export type PriceBasis = "piece" | "sqm";

export type ErpLineItemLike = {
  qty?: number | string;
  pieces?: number | string;
  widthM?: number | string;
  heightM?: number | string;
  unit?: string;
  price?: number | string;
  costSnapshot?: number | string;
  priceUnit?: PriceBasis | string;
  costUnit?: PriceBasis | string;
};

export type ErpDocumentLike = {
  vatRate?: number | string;
  vat_rate?: number | string;
};

export const PRICE_BASIS_OPTIONS = [
  { value: "piece", label: "ต่อชิ้น" },
  { value: "sqm", label: "ต่อตารางเมตร" },
] as const;

export const priceBasisLabel = (value?: string) =>
  PRICE_BASIS_OPTIONS.find((option) => option.value === value)?.label || "ต่อชิ้น";

export const isSqmBasis = (value?: string) => value === "sqm";

export const lineQty = (item: ErpLineItemLike) => Number(item.qty || 0);

export const hasAreaDimensions = (item: ErpLineItemLike) =>
  Number(item.widthM || 0) > 0 || Number(item.heightM || 0) > 0 || Number(item.pieces || 0) > 0;

export const itemBillingBasis = (item: ErpLineItemLike): PriceBasis =>
  isSqmBasis(item.priceUnit) || isSqmBasis(item.costUnit) || String(item.unit || "").includes("ตร.ม")
    ? "sqm"
    : "piece";

export const lineQtyForBasis = (item: ErpLineItemLike, basis?: string) => {
  if (isSqmBasis(basis)) return lineQty(item);
  const pieces = Number(item.pieces || 0);
  return itemBillingBasis(item) === "sqm" && hasAreaDimensions(item) ? (pieces > 0 ? pieces : 1) : lineQty(item);
};

export const lineAmount = (item: ErpLineItemLike) =>
  lineQtyForBasis(item, item.priceUnit || "piece") * Number(item.price || 0);

export const lineCost = (item: ErpLineItemLike, unitCost = Number(item.costSnapshot || 0)) =>
  lineQtyForBasis(item, item.costUnit || "piece") * Number(unitCost || 0);

export const docVatRate = (doc: ErpDocumentLike) => Number(doc.vatRate ?? doc.vat_rate ?? 7);
