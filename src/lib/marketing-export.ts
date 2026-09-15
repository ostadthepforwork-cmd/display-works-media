type AdMetric = {
  id: string;
  name?: string;
  campaignId?: string;
  campaignName?: string;
  adSetId?: string;
  adSetName?: string;
  spend?: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
  leads?: number;
};

type ExportLead = {
  id: string;
  adId?: string;
  qualifiedStatus?: string;
  status: string;
  creativeId?: string;
};

type ExportMapping = { lead_id: string | null; quote_id: string | null; receipt_id: string | null };
type ExportReceipt = { id: string; revenue: number; actualCost: number | null };

const safeNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const csvValue = (value: unknown) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
const csv = (rows: unknown[][]) => `\uFEFF${rows.map((row) => row.map(csvValue).join(",")).join("\r\n")}`;

export function buildMarketingExportFiles(input: {
  rangeLabel: string;
  ads: AdMetric[];
  leads: ExportLead[];
  mappings: ExportMapping[];
  receipts: ExportReceipt[];
}) {
  const receiptById = new Map(input.receipts.map((receipt) => [String(receipt.id), receipt]));
  const mappingsByLead = new Map<string, ExportMapping[]>();
  for (const mapping of input.mappings) {
    if (!mapping.lead_id) continue;
    mappingsByLead.set(mapping.lead_id, [...(mappingsByLead.get(mapping.lead_id) || []), mapping]);
  }
  const adRows = input.ads.map((ad) => {
    const leads = input.leads.filter((lead) => lead.adId === ad.id);
    const mappings = leads.flatMap((lead) => mappingsByLead.get(lead.id) || []);
    const quoteIds = new Set(mappings.map((mapping) => mapping.quote_id).filter(Boolean));
    const receiptIds = new Set(mappings.map((mapping) => mapping.receipt_id).filter(Boolean));
    const receipts = [...receiptIds].map((id) => receiptById.get(String(id))).filter(Boolean) as ExportReceipt[];
    const revenue = receipts.reduce((sum, receipt) => sum + safeNumber(receipt.revenue), 0);
    const hasCompleteActualCost = receipts.length > 0 && receipts.every((receipt) => receipt.actualCost !== null);
    const grossProfit = hasCompleteActualCost
      ? revenue - receipts.reduce((sum, receipt) => sum + safeNumber(receipt.actualCost), 0)
      : null;
    return {
      ...ad,
      crmLeads: leads.length,
      qualified: leads.filter((lead) => lead.qualifiedStatus === "qualified").length,
      quotes: quoteIds.size,
      won: receiptIds.size,
      lost: leads.filter((lead) => lead.status === "closed_lost").length,
      revenue,
      grossProfit,
    };
  });
  const attributedLeadIds = new Set(input.leads.filter((lead) => lead.adId).map((lead) => lead.id));
  const unattributedLeads = input.leads.filter((lead) => !lead.adId);
  const mappedReceiptIds = new Set(input.mappings.map((mapping) => mapping.receipt_id).filter(Boolean).map(String));
  const unattributedReceipts = input.receipts.filter((receipt) => !mappedReceiptIds.has(String(receipt.id)));

  const performance = csv([
    ["date_range", "campaign_id", "campaign_name", "adset_id", "adset_name", "ad_id", "ad_name", "spend", "impressions", "reach", "clicks", "meta_leads"],
    ...adRows.map((row) => [input.rangeLabel, row.campaignId, row.campaignName, row.adSetId, row.adSetName, row.id, row.name, safeNumber(row.spend), safeNumber(row.impressions), safeNumber(row.reach), safeNumber(row.clicks), safeNumber(row.leads)]),
  ]);
  const funnel = csv([
    ["date_range", "ad_id", "ad_name", "crm_leads", "qualified_leads", "quotes", "won", "lost", "erp_attributed_revenue", "gross_profit"],
    ...adRows.map((row) => [input.rangeLabel, row.id, row.name, row.crmLeads, row.qualified, row.quotes, row.won, row.lost, row.revenue, row.grossProfit]),
    [input.rangeLabel, "unattributed", "Unattributed", unattributedLeads.length, unattributedLeads.filter((lead) => lead.qualifiedStatus === "qualified").length, "", "", unattributedLeads.filter((lead) => lead.status === "closed_lost").length, unattributedReceipts.reduce((sum, receipt) => sum + receipt.revenue, 0), ""],
  ]);
  const creative = csv([
    ["date_range", "creative_id", "ad_id", "ad_name", "qualified_leads", "quotes", "won", "erp_attributed_revenue", "evidence_status"],
    ...adRows.map((row) => [input.rangeLabel, input.leads.find((lead) => lead.adId === row.id)?.creativeId || "", row.id, row.name, row.qualified, row.quotes, row.won, row.revenue, row.revenue > 0 || row.won > 0 ? "won_or_revenue" : row.quotes > 0 ? "quote" : row.qualified > 0 ? "qualified" : "insufficient_evidence"]),
  ]);
  const notes = `# Data notes\n\n- Date range: ${input.rangeLabel}\n- Grain: one aggregate row per Meta Ad for the selected range.\n- Meta-reported metrics and ERP revenue are separate columns and are never added together.\n- ERP revenue comes only from mapped receipt documents. Estimated Lead and Quote values are excluded.\n- Gross profit is blank unless every mapped receipt has an explicit actual job cost.\n- Unattributed leads and receipts remain in the unattributed row and receive no Ad credit.\n- Excluded: events, impressions as individual records, chat bodies, customer names, phone numbers, addresses, and other PII.\n- Leads with an Ad ID: ${attributedLeadIds.size}; unattributed leads: ${unattributedLeads.length}; unattributed receipts: ${unattributedReceipts.length}.\n`;
  return {
    "01_ads_performance.csv": performance,
    "02_ads_sales_funnel.csv": funnel,
    "03_creative_insights.csv": creative,
    "00_data_notes.md": notes,
  };
}
