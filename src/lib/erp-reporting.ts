export type ErpDocumentReportLike = {
  id?: string;
  orderId?: string;
  reference?: string;
  type?: string;
  deleted?: boolean;
  status?: string;
};

export const isReportDoc = (doc: ErpDocumentReportLike) =>
  doc?.type === "receipt" && !doc?.deleted && doc?.status !== "cancelled";

export const reportRootId = (
  doc: ErpDocumentReportLike,
  byId: Map<string, ErpDocumentReportLike>
) => {
  let current = doc;
  const seen = new Set<string>();

  while (current?.orderId && byId.has(current.orderId) && !seen.has(String(current.id))) {
    if (current.id) seen.add(String(current.id));
    current = byId.get(current.orderId) || current;
  }

  return current?.id || doc?.orderId || doc?.reference || doc?.id;
};

export const reportingDocuments = (documents: ErpDocumentReportLike[]) =>
  (documents || []).filter(isReportDoc);
