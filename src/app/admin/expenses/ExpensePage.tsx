"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  Download,
  FileText,
  FolderCog,
  History,
  LoaderCircle,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Upload,
  X,
} from "lucide-react";
import {
  ExpenseDraft,
  ExpenseValidationError,
  addExpenseMoney,
  buildErpExpenseSaveArguments,
  expenseSaveErrorCode,
  expenseBangkokDate,
  saveErpExpense,
} from "@/lib/erp-expense";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { expenseTotal, formatExpenseTotal, isCompleteResult } from "@/lib/expense-inspection";
import ExpenseHistory from "./ExpenseHistory";

type ExpensePageProps = {
  customers: Array<Record<string, any>>;
  suppliers: Array<Record<string, any>>;
  documents: Array<Record<string, any>>;
  showToast: (message: string, type?: string) => void;
};

type ExpenseRow = Record<string, any>;
type CategoryRow = Record<string, any>;
type AttachmentRow = Record<string, any>;

const initialFilters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  categoryId: "all",
  expenseClass: "all",
  paymentStatus: "all",
  state: "active",
};

function today() {
  return expenseBangkokDate(new Date());
}

function newDraft(): ExpenseDraft {
  return {
    clientRequestId: crypto.randomUUID(),
    expenseDate: today(),
    categoryId: "",
    expenseClass: "operating",
    description: "",
    amount: "0.00",
    vatAmount: "0.00",
    withholdingAmount: "0.00",
    paymentStatus: "unpaid",
    paidAt: null,
    supplierId: null,
    customerId: null,
    sourceDocumentId: null,
    reference: "",
    notes: "",
    revision: 0,
    archived: false,
    voidReason: null,
  };
}

function rowToDraft(row: ExpenseRow): ExpenseDraft {
  return {
    id: row.id,
    clientRequestId: crypto.randomUUID(),
    expenseDate: row.expense_date,
    categoryId: row.category_id,
    expenseClass: row.expense_class,
    description: row.description,
    amount: String(row.amount ?? "0.00"),
    vatAmount: String(row.vat_amount ?? "0.00"),
    withholdingAmount: String(row.withholding_amount ?? "0.00"),
    paymentStatus: row.payment_status,
    paidAt: row.paid_at ? expenseBangkokDate(String(row.paid_at)) : null,
    supplierId: row.supplier_id,
    customerId: row.customer_id,
    sourceDocumentId: row.source_document_id,
    reference: row.reference || "",
    notes: row.notes || "",
    revision: row.revision,
    archived: Boolean(row.archived_at),
    voidReason: row.void_reason,
  };
}

function money(value: unknown) {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Number(value || 0));
}

function compactDate(value: unknown) {
  const date = String(value || "").slice(0, 10);
  if (!date) return "-";
  return new Intl.DateTimeFormat("th-TH", { year: "numeric", month: "short", day: "numeric" })
    .format(new Date(`${date}T00:00:00+07:00`));
}

function errorMessage(error: unknown) {
  if (error instanceof ExpenseValidationError) {
    const messages: Record<string, string> = {
      CATEGORY_REQUIRED: "กรุณาเลือกหมวดค่าใช้จ่าย",
      DESCRIPTION_REQUIRED: "กรุณาระบุรายละเอียดค่าใช้จ่าย",
      PAID_AT_REQUIRED: "กรุณาระบุวันที่ชำระเงิน",
      WITHHOLDING_EXCEEDS_TOTAL: "ยอดหัก ณ ที่จ่ายต้องไม่เกินยอดรวม",
    };
    return messages[error.code] || "ข้อมูลค่าใช้จ่ายไม่ถูกต้อง";
  }
  const code = expenseSaveErrorCode(error);
  if (code === "REVISION_CONFLICT") return "รายการนี้ถูกแก้ไขจากที่อื่น กรุณาปิดหน้าต่างและโหลดข้อมูลใหม่";
  if (code === "IDEMPOTENCY_CONFLICT") return "คำขอบันทึกนี้มีข้อมูลไม่ตรงกัน กรุณาลองใหม่";
  if (code === "CATEGORY_ARCHIVED") return "หมวดนี้ถูกเก็บถาวรแล้ว กรุณาเลือกหมวดอื่น";
  if (code === "EXPENSE_ALREADY_VOIDED") return "รายการที่ยกเลิกแล้วไม่สามารถแก้ไขได้";
  return String((error as { message?: unknown })?.message || "บันทึกข้อมูลไม่สำเร็จ");
}

export default function ExpensePage({ customers, suppliers, documents, showToast }: ExpensePageProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [editor, setEditor] = useState<ExpenseDraft | null>(null);
  const [evidenceQueue, setEvidenceQueue] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [dataComplete, setDataComplete] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const loadVersion = useRef(0);
  const [categoryPanel, setCategoryPanel] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ code: "", name: "", defaultClass: "operating" });
  const saveInFlight = useRef(false);
  const modalRef = useRef<HTMLElement>(null);
  const categoryRef = useRef<HTMLElement>(null);
  const editorOpen = Boolean(editor);
  useEffect(() => {
    const modal = editorOpen ? modalRef.current : categoryPanel ? categoryRef.current : null;
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const selector = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';
    modal.querySelector<HTMLElement>(selector)?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        event.preventDefault();
        setEditor(null);
        setCategoryPanel(false);
      }
      if (event.key === "Tab") {
        const nodes = Array.from(modal.querySelectorAll<HTMLElement>(selector)).filter((node) => node.getClientRects().length);
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    modal.addEventListener("keydown", handleKey);
    return () => { modal.removeEventListener("keydown", handleKey); previous?.focus(); };
  }, [editorOpen, categoryPanel, saving]);

  const loadData = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setDataComplete(false);
    setLoadError("");
    try {
    const [expenseResult, categoryResult] = await Promise.all([
      supabase.from("erp_expenses").select("*", { count: "exact" }).order("expense_date", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("erp_expense_categories").select("*", { count: "exact" }).order("sort_order").order("name"),
    ]);
    if (version !== loadVersion.current) return;
    const error = expenseResult.error || categoryResult.error;
    if (error) {
      setLoadError(error.message);
    } else {
      setExpenses(expenseResult.data || []);
      setCategories(categoryResult.data || []);
      setDataComplete(isCompleteResult((expenseResult.data || []).length, expenseResult.count) && isCompleteResult((categoryResult.data || []).length, categoryResult.count));
      setLoadedAt(new Date().toLocaleString("th-TH"));
    }
    } catch {
      if (version === loadVersion.current) setLoadError("เชื่อมต่อข้อมูลไม่สำเร็จ");
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void loadData(); }, [loadData]);

  const loadAttachments = useCallback(async (expenseId: string) => {
    const { data, error } = await supabase
      .from("erp_expense_attachments")
      .select("id, expense_id, original_filename, mime_type, size_bytes, created_at")
      .eq("expense_id", expenseId)
      .order("created_at", { ascending: false });
    if (error) showToast("โหลดหลักฐานไม่สำเร็จ", "error");
    setAttachments(data || []);
  }, [showToast, supabase]);

  const openEditor = (row?: ExpenseRow) => {
    const draft = row ? rowToDraft(row) : newDraft();
    setEditor(draft);
    setEvidenceQueue([]);
    setAttachments([]);
    if (row?.id) void loadAttachments(row.id);
  };

  const categoryById = useMemo(() => new Map(categories.map((row) => [row.id, row])), [categories]);
  const customerById = useMemo(() => new Map(customers.map((row) => [row.id, row])), [customers]);
  const supplierById = useMemo(() => new Map(suppliers.map((row) => [row.id, row])), [suppliers]);
  const documentById = useMemo(() => new Map(documents.map((row) => [row.id, row])), [documents]);

  const filtered = useMemo(() => expenses.filter((row) => {
    const haystack = `${row.expense_no} ${row.description} ${row.reference || ""}`.toLowerCase();
    if (filters.search && !haystack.includes(filters.search.toLowerCase())) return false;
    if (filters.dateFrom && row.expense_date < filters.dateFrom) return false;
    if (filters.dateTo && row.expense_date > filters.dateTo) return false;
    if (filters.categoryId !== "all" && row.category_id !== filters.categoryId) return false;
    if (filters.expenseClass !== "all" && row.expense_class !== filters.expenseClass) return false;
    if (filters.paymentStatus !== "all" && row.payment_status !== filters.paymentStatus) return false;
    if (filters.state === "active" && (row.archived_at || row.voided_at)) return false;
    if (filters.state === "archived" && !row.archived_at) return false;
    if (filters.state === "voided" && !row.voided_at) return false;
    return true;
  }), [expenses, filters]);
  const filteredTotal = useMemo(() => expenseTotal(filtered), [filtered]);
  const invalidRange = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);
  const totalReady = dataComplete && !invalidRange && filteredTotal !== null;

  const saveDraft = async (draft: ExpenseDraft, files = evidenceQueue) => {
    if (saveInFlight.current) return null;
    saveInFlight.current = true;
    setSaving(true);
    try {
      const result = await saveErpExpense(supabase, buildErpExpenseSaveArguments(draft));
      const saved = result.expense as ExpenseRow;
      setHistoryId(null);
      setExpenses((current) => current.some((row) => row.id === saved.id)
        ? current.map((row) => row.id === saved.id ? saved : row)
        : [saved, ...current]);

      const failedUploads: string[] = [];
      for (const file of files) {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch(`/api/admin/expenses/${saved.id}/attachments`, { method: "POST", body });
        if (!response.ok) failedUploads.push(file.name);
      }
      if (files.length) await loadAttachments(saved.id);
      if (failedUploads.length) {
        showToast(`บันทึกค่าใช้จ่ายแล้ว แต่แนบหลักฐานไม่สำเร็จ: ${failedUploads.join(", ")}`, "error");
      } else {
        showToast(result.idempotent_replay ? "คำขอเดิมถูกบันทึกไว้แล้ว" : "บันทึกค่าใช้จ่ายแล้ว");
      }
      setEditor(null);
      setEvidenceQueue([]);
      return saved;
    } catch (error) {
      showToast(errorMessage(error), "error");
      return null;
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  const transitionExpense = async (row: ExpenseRow, action: "archive" | "restore" | "void") => {
    if (action === "void") {
      const reason = window.prompt("ระบุเหตุผลการยกเลิกรายการ");
      if (!reason?.trim()) return;
      if (!window.confirm("ยืนยันยกเลิกรายการนี้ หลักฐานและประวัติจะยังถูกเก็บไว้")) return;
      await saveDraft({ ...rowToDraft(row), clientRequestId: crypto.randomUUID(), voidReason: reason.trim() }, []);
      return;
    }
    const archived = action === "archive";
    if (!window.confirm(archived ? "ยืนยันเก็บรายการนี้ถาวร" : "ยืนยันนำรายการนี้กลับมาใช้งาน")) return;
    await saveDraft({ ...rowToDraft(row), clientRequestId: crypto.randomUUID(), archived }, []);
  };

  const createCategory = async () => {
    const code = categoryForm.code.trim().toUpperCase();
    const name = categoryForm.name.trim();
    if (!code || !name) return showToast("กรุณาระบุรหัสและชื่อหมวด", "error");
    const { data, error } = await supabase.from("erp_expense_categories").insert({
      code,
      name,
      default_expense_class: categoryForm.defaultClass,
      active: true,
    }).select("*").single();
    if (error) return showToast("สร้างหมวดไม่สำเร็จ: " + error.message, "error");
    setCategories((current) => [...current, data].sort((a, b) => String(a.name).localeCompare(String(b.name), "th")));
    setCategoryForm({ code: "", name: "", defaultClass: "operating" });
    showToast("สร้างหมวดค่าใช้จ่ายแล้ว");
  };

  const renameCategory = async (row: CategoryRow) => {
    const name = window.prompt("ชื่อหมวดใหม่", row.name)?.trim();
    if (!name || name === row.name) return;
    const { data, error } = await supabase.from("erp_expense_categories").update({ name }).eq("id", row.id).select("*").single();
    if (error) return showToast("เปลี่ยนชื่อหมวดไม่สำเร็จ", "error");
    setCategories((current) => current.map((item) => item.id === row.id ? data : item));
  };

  const toggleCategory = async (row: CategoryRow) => {
    const action = row.active ? "เก็บถาวร" : "นำกลับมาใช้";
    if (!window.confirm(`ยืนยัน${action}หมวด ${row.name}`)) return;
    const { data, error } = await supabase.from("erp_expense_categories").update({ active: !row.active }).eq("id", row.id).select("*").single();
    if (error) return showToast(`${action}หมวดไม่สำเร็จ`, "error");
    setCategories((current) => current.map((item) => item.id === row.id ? data : item));
  };

  const setCategoryDefaultClass = async (row: CategoryRow, defaultExpenseClass: string) => {
    const { data, error } = await supabase
      .from("erp_expense_categories")
      .update({ default_expense_class: defaultExpenseClass })
      .eq("id", row.id)
      .select("*")
      .single();
    if (error) return showToast("เปลี่ยนประเภทเริ่มต้นไม่สำเร็จ", "error");
    setCategories((current) => current.map((item) => item.id === row.id ? data : item));
  };

  const openEvidence = async (attachment: AttachmentRow) => {
    if (!editor?.id) return;
    const response = await fetch(`/api/admin/expenses/${editor.id}/attachments/${attachment.id}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.url) return showToast("เปิดหลักฐานไม่สำเร็จ", "error");
    window.open(data.url, "_blank", "noopener,noreferrer");
  };

  const field = (key: keyof ExpenseDraft, value: unknown) => {
    setEditor((current) => current ? { ...current, [key]: value } : current);
  };

  const totalPreview = editor ? (() => {
    try { return addExpenseMoney(editor.amount, editor.vatAmount); } catch { return "-"; }
  })() : "0.00";

  return (
    <div className="expense-page">
      {loading ? <div className="expense-state" role="status"><LoaderCircle className="expense-spin" size={22} /> กำลังโหลดค่าใช้จ่าย</div>
        : loadError ? <div className="expense-state expense-error" role="alert">
          <strong>โหลดค่าใช้จ่ายไม่สำเร็จ</strong><span>ยังไม่สามารถยืนยันยอดค่าใช้จ่ายได้</span>
          <button type="button" onClick={() => void loadData()}><RefreshCw size={16} /> ลองใหม่</button>
        </div> : <>
      <header className="expense-header">
        <div>
          <span className="expense-kicker">ERP / ACTUAL EXPENSE</span>
          <h2>ค่าใช้จ่ายจริง</h2>
        </div>
        <div className="expense-actions">
          <button type="button" title="โหลดข้อมูลใหม่" aria-label="โหลดข้อมูลใหม่" onClick={() => void loadData()}><RefreshCw size={17} /></button>
          <button type="button" className="secondary" onClick={() => setCategoryPanel(true)}><FolderCog size={17} /> หมวดค่าใช้จ่าย</button>
          <button type="button" className="primary" onClick={() => openEditor()}><Plus size={17} /> เพิ่มค่าใช้จ่าย</button>
        </div>
      </header>

      <div className="expense-filterbar">
        <label className="expense-search"><Search size={16} /><input aria-label="ค้นหาค่าใช้จ่าย" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="ค้นหาเลขที่ รายละเอียด อ้างอิง" /></label>
        <label className="date-filter">ตั้งแต่วันที่<input aria-label="วันที่เริ่มต้น" aria-invalid={invalidRange} type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} /></label>
        <label className="date-filter">ถึงวันที่<input aria-label="วันที่สิ้นสุด" aria-invalid={invalidRange} type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} /></label>
        <select aria-label="กรองหมวด" value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
          <option value="all">ทุกหมวด</option>{categories.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
        <select aria-label="กรองประเภท" value={filters.expenseClass} onChange={(event) => setFilters({ ...filters, expenseClass: event.target.value })}>
          <option value="all">ทุกประเภท</option><option value="direct">Direct</option><option value="operating">Operating</option>
        </select>
        <select aria-label="กรองสถานะชำระ" value={filters.paymentStatus} onChange={(event) => setFilters({ ...filters, paymentStatus: event.target.value })}>
          <option value="all">ทุกสถานะชำระ</option><option value="unpaid">ยังไม่ชำระ</option><option value="paid">ชำระแล้ว</option>
        </select>
        <select aria-label="กรองสถานะรายการ" value={filters.state} onChange={(event) => setFilters({ ...filters, state: event.target.value })}>
          <option value="all">ทั้งหมด</option><option value="active">ใช้งาน</option><option value="archived">เก็บถาวร</option><option value="voided">ยกเลิก</option>
        </select>
      </div>

      {invalidRange && <p role="alert" className="expense-warning">วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด</p>}
      <div className={`expense-data-state ${dataComplete ? "" : "expense-warning"}`} role="status">
        {dataComplete ? `โหลดรายการที่เข้าถึงได้ครบ ${expenses.length} รายการ` : "ข้อมูลไม่ครบหรือยืนยันจำนวนไม่ได้: ไม่แสดงยอดรวม"}
        {loadedAt && <span> · โหลดเมื่อ {loadedAt}</span>}
      </div>
      <div className="expense-summary">
        <div><span>ยอดตามตัวกรอง · รวม VAT</span><strong>{totalReady ? `฿${formatExpenseTotal(filteredTotal!)}` : "ไม่พร้อมแสดงยอด"}</strong><small>{filtered.length} รายการ · {filters.state === "active" ? "ไม่รวมรายการเก็บถาวรและยกเลิก" : "รวมเฉพาะสถานะที่เลือก"}</small></div>
        <div className="summary-actions"><button type="button" title="ดูรายการที่มาของยอด" aria-label="ดูรายการที่มาของยอด" disabled={!totalReady}
        onClick={() => { tableRef.current?.focus(); tableRef.current?.scrollIntoView({ block: "nearest" }); }}>
        <ArrowDown size={18} />
      </button><button type="button" title="ล้างตัวกรอง" aria-label="ล้างตัวกรอง" onClick={() => setFilters(initialFilters)}><RotateCcw size={18} /></button></div></div>
      <div className="expense-table-wrap" ref={tableRef} tabIndex={-1} aria-label="รายการที่มาของยอดตามตัวกรอง">
        <table className="expense-table">
          <thead><tr><th>เลขที่ / วันที่</th><th>รายละเอียด</th><th>หมวด / ประเภท</th><th>การเชื่อมโยง</th><th className="number">ยอดรวม</th><th>สถานะ</th><th aria-label="การทำงาน" /></tr></thead>
          <tbody>
            {filtered.map((row) => {
              const document = documentById.get(row.source_document_id);
              const customer = customerById.get(row.customer_id);
              const supplier = supplierById.get(row.supplier_id);
              return (
                <tr key={row.id} className={row.voided_at ? "is-voided" : row.archived_at ? "is-archived" : ""}>
                  <td><strong>{row.expense_no}</strong><span>{compactDate(row.expense_date)}</span></td>
                  <td><strong>{row.description}</strong>{row.reference && <span>อ้างอิง: {row.reference}</span>}</td>
                  <td><span>{categoryById.get(row.category_id)?.name || "ไม่พบหมวด"}</span><b className={`class-${row.expense_class}`}>{row.expense_class === "direct" ? "Direct" : "Operating"}</b></td>
                  <td><span>{document?.docNo || document?.doc_no || customer?.name || supplier?.name || "-"}</span></td>
                  <td className="number"><strong>฿{money(row.total_amount)}</strong><span>VAT ฿{money(row.vat_amount)}</span></td>
                  <td><b className={`status-${row.payment_status}`}>{row.payment_status === "paid" ? "ชำระแล้ว" : "ยังไม่ชำระ"}</b>{row.voided_at ? <span className="flag void">ยกเลิก</span> : row.archived_at ? <span className="flag">เก็บถาวร</span> : null}</td>
                  <td className="row-actions">
                    <button type="button" title="ประวัติการแก้ไข" aria-expanded={historyId === row.id} onClick={() => setHistoryId(historyId === row.id ? null : row.id)}><History size={16} /></button>
                    <button type="button" title="แก้ไข" onClick={() => openEditor(row)}><Pencil size={16} /></button>
                    {!row.voided_at && <button type="button" title={row.archived_at ? "นำกลับมาใช้" : "เก็บถาวร"} onClick={() => void transitionExpense(row, row.archived_at ? "restore" : "archive")}>{row.archived_at ? <ArchiveRestore size={16} /> : <Archive size={16} />}</button>}
                    {!row.voided_at && <button type="button" title="ยกเลิกรายการ" className="danger" onClick={() => void transitionExpense(row, "void")}><X size={16} /></button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="expense-empty"><ReceiptText size={28} />ไม่พบรายการค่าใช้จ่าย</div>}
      </div>

      {historyId && <ExpenseHistory key={historyId} expenseId={historyId} expenseNo={expenses.find((row) => row.id === historyId)?.expense_no || historyId} onClose={() => setHistoryId(null)} />}
      {editor && (
        <div className="expense-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setEditor(null); }}>
          <section ref={modalRef} className="expense-modal" role="dialog" aria-modal="true" aria-label={editor.id ? "แก้ไขค่าใช้จ่าย" : "เพิ่มค่าใช้จ่าย"}>
            <header><div><span>{editor.id ? "EDIT ACTUAL EXPENSE" : "NEW ACTUAL EXPENSE"}</span><h3>{editor.id ? "แก้ไขค่าใช้จ่าย" : "เพิ่มค่าใช้จ่าย"}</h3></div><button type="button" title="ปิด" onClick={() => setEditor(null)} disabled={saving}><X size={20} /></button></header>
            {editor.voidReason && <div className="void-banner">รายการนี้ถูกยกเลิก: {editor.voidReason}</div>}
            <div className="expense-form">
              <label>วันที่<input type="date" value={editor.expenseDate} onChange={(event) => field("expenseDate", event.target.value)} disabled={Boolean(editor.voidReason)} /></label>
              <label>หมวด<select value={editor.categoryId} onChange={(event) => field("categoryId", event.target.value)} disabled={Boolean(editor.voidReason)}><option value="">เลือกหมวด</option>{categories.filter((row) => row.active || row.id === editor.categoryId).map((row) => <option key={row.id} value={row.id}>{row.name}{row.active ? "" : " (เก็บถาวร)"}</option>)}</select></label>
              <label>ประเภท<select value={editor.expenseClass} onChange={(event) => field("expenseClass", event.target.value)} disabled={Boolean(editor.voidReason)}><option value="direct">Direct</option><option value="operating">Operating</option></select></label>
              <label className="wide">รายละเอียด<input value={editor.description} onChange={(event) => field("description", event.target.value)} maxLength={500} disabled={Boolean(editor.voidReason)} /></label>
              <label>ยอดก่อน VAT<input inputMode="decimal" value={editor.amount} onChange={(event) => field("amount", event.target.value)} disabled={Boolean(editor.voidReason)} /></label>
              <label>VAT<input inputMode="decimal" value={editor.vatAmount} onChange={(event) => field("vatAmount", event.target.value)} disabled={Boolean(editor.voidReason)} /></label>
              <label>หัก ณ ที่จ่าย<input inputMode="decimal" value={editor.withholdingAmount} onChange={(event) => field("withholdingAmount", event.target.value)} disabled={Boolean(editor.voidReason)} /></label>
              <div className="expense-total"><span>ยอดค่าใช้จ่ายรวม</span><strong>{totalPreview === "-" ? "-" : `฿${money(totalPreview)}`}</strong></div>
              <label>สถานะชำระ<select value={editor.paymentStatus} onChange={(event) => field("paymentStatus", event.target.value)} disabled={Boolean(editor.voidReason)}><option value="unpaid">ยังไม่ชำระ</option><option value="paid">ชำระแล้ว</option></select></label>
              {editor.paymentStatus === "paid" && <label>วันที่ชำระ<input type="date" value={editor.paidAt || ""} onChange={(event) => field("paidAt", event.target.value)} disabled={Boolean(editor.voidReason)} /></label>}
              <label>Supplier<select value={editor.supplierId || ""} onChange={(event) => field("supplierId", event.target.value || null)} disabled={Boolean(editor.voidReason)}><option value="">ไม่เชื่อมโยง</option>{suppliers.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
              <label>ลูกค้า<select value={editor.customerId || ""} onChange={(event) => field("customerId", event.target.value || null)} disabled={Boolean(editor.voidReason)}><option value="">ไม่เชื่อมโยง</option>{customers.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
              <label className="wide">เอกสาร<select value={editor.sourceDocumentId || ""} onChange={(event) => field("sourceDocumentId", event.target.value || null)} disabled={Boolean(editor.voidReason)}><option value="">ไม่เชื่อมโยง</option>{documents.filter((row) => !row.deleted).map((row) => <option key={row.id} value={row.id}>{row.docNo || row.doc_no} · {row.customerName || row.customer_name || ""}</option>)}</select></label>
              <label>เลขอ้างอิง<input value={editor.reference || ""} onChange={(event) => field("reference", event.target.value)} maxLength={200} disabled={Boolean(editor.voidReason)} /></label>
              <label className="wide">หมายเหตุ<textarea value={editor.notes || ""} onChange={(event) => field("notes", event.target.value)} maxLength={2000} rows={3} disabled={Boolean(editor.voidReason)} /></label>
            </div>

            <div className="evidence-section">
              <div className="evidence-head"><div><FileText size={18} /><strong>หลักฐาน</strong></div>{!editor.voidReason && <label className="evidence-picker"><Upload size={16} /> เลือกไฟล์<input type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={(event) => setEvidenceQueue(Array.from(event.target.files || []))} /></label>}</div>
              {evidenceQueue.map((file) => <div className="evidence-row queued" key={`${file.name}-${file.lastModified}`}><span>{file.name}</span><b>รออัปโหลด</b></div>)}
              {attachments.map((row) => <div className="evidence-row" key={row.id}><span>{row.original_filename}</span><button type="button" title="เปิดหลักฐาน" onClick={() => void openEvidence(row)}><Download size={15} /></button></div>)}
              {!evidenceQueue.length && !attachments.length && <div className="evidence-empty">ยังไม่มีหลักฐานแนบ</div>}
            </div>

            <footer><button type="button" className="secondary" onClick={() => setEditor(null)} disabled={saving}>ยกเลิก</button><button type="button" className="primary" onClick={() => void saveDraft(editor)} disabled={saving || Boolean(editor.voidReason)}>{saving ? <LoaderCircle className="expense-spin" size={17} /> : <Save size={17} />} บันทึก</button></footer>
          </section>
        </div>
      )}

      {categoryPanel && (
        <div className="expense-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCategoryPanel(false); }}>
          <section ref={categoryRef} className="category-modal" role="dialog" aria-modal="true" aria-label="จัดการหมวดค่าใช้จ่าย">
            <header><div><span>EXPENSE CATEGORIES</span><h3>หมวดค่าใช้จ่าย</h3></div><button type="button" title="ปิด" onClick={() => setCategoryPanel(false)}><X size={20} /></button></header>
            <div className="category-create"><input aria-label="รหัสหมวด" placeholder="CODE" value={categoryForm.code} onChange={(event) => setCategoryForm({ ...categoryForm, code: event.target.value })} /><input aria-label="ชื่อหมวด" placeholder="ชื่อหมวด" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} /><select aria-label="ประเภทเริ่มต้น" value={categoryForm.defaultClass} onChange={(event) => setCategoryForm({ ...categoryForm, defaultClass: event.target.value })}><option value="direct">Direct</option><option value="operating">Operating</option></select><button type="button" className="primary" onClick={() => void createCategory()}><Plus size={16} /> เพิ่ม</button></div>
            <div className="category-list">{categories.map((row) => <div className={!row.active ? "archived" : ""} key={row.id}><span><strong>{row.name}</strong><small>{row.code}</small></span><select aria-label={`ประเภทเริ่มต้น ${row.name}`} value={row.default_expense_class} onChange={(event) => void setCategoryDefaultClass(row, event.target.value)} disabled={!row.active}><option value="direct">Direct</option><option value="operating">Operating</option></select><button type="button" title="เปลี่ยนชื่อ" onClick={() => void renameCategory(row)}><Pencil size={15} /></button><button type="button" title={row.active ? "เก็บถาวร" : "นำกลับมาใช้"} onClick={() => void toggleCategory(row)}>{row.active ? <Archive size={15} /> : <ArchiveRestore size={15} />}</button></div>)}</div>
          </section>
        </div>
      )}
      </>}
      <style jsx>{`
        .expense-page{display:flex;flex-direction:column;gap:14px;color:#e5e7eb;min-width:0}.expense-header{display:flex;align-items:center;justify-content:space-between;gap:16px}.expense-kicker,.expense-modal header span,.category-modal header span{color:#ef4444;font-size:10px;font-weight:800;letter-spacing:0}.expense-header h2,.expense-modal h3,.category-modal h3{margin:4px 0 0;font-size:22px;letter-spacing:0}.expense-actions{display:flex;gap:8px}.expense-page button,.expense-modal button,.category-modal button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:38px;border:1px solid rgba(255,255,255,.12);border-radius:7px;background:#161d29;color:#e5e7eb;font:inherit;font-weight:700;cursor:pointer}.expense-page button:disabled,.expense-modal button:disabled{opacity:.5;cursor:not-allowed}.expense-page .primary,.expense-modal .primary,.category-modal .primary{background:#dc2626;border-color:#dc2626;color:white;padding:0 14px}.secondary{padding:0 12px}.expense-filterbar{display:grid;grid-template-columns:minmax(210px,1.6fr) repeat(6,minmax(118px,1fr));gap:8px}.expense-filterbar input,.expense-filterbar select,.expense-form input,.expense-form select,.expense-form textarea,.category-create input,.category-create select{width:100%;min-height:40px;border:1px solid rgba(255,255,255,.12);border-radius:6px;background:#0d131d;color:#e5e7eb;padding:8px 10px;font:inherit;box-sizing:border-box}.expense-search{display:flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.12);border-radius:6px;background:#0d131d;padding-left:10px}.expense-search input{border:0;background:transparent;padding-left:0}.expense-table-wrap{border:1px solid rgba(255,255,255,.09);border-radius:8px;overflow:auto;background:#101620}.expense-table{width:100%;min-width:980px;border-collapse:collapse;font-size:12px}.expense-table th{text-align:left;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:0;padding:11px 12px;background:#0b1018;border-bottom:1px solid rgba(255,255,255,.09)}.expense-table td{padding:12px;border-bottom:1px solid rgba(255,255,255,.06);vertical-align:middle}.expense-table td>span,.expense-table td>strong{display:block}.expense-table td>span{color:#94a3b8;margin-top:3px}.expense-table tr.is-archived{opacity:.64}.expense-table tr.is-voided{text-decoration:line-through;opacity:.52}.number{text-align:right!important}.class-direct,.class-operating,.status-paid,.status-unpaid,.flag{display:inline-block;margin-top:5px;padding:3px 7px;border-radius:999px;font-size:10px;text-decoration:none}.class-direct{background:rgba(59,130,246,.14);color:#93c5fd}.class-operating{background:rgba(245,158,11,.14);color:#fcd34d}.status-paid{background:rgba(16,185,129,.14);color:#6ee7b7}.status-unpaid{background:rgba(239,68,68,.14);color:#fca5a5}.flag{background:rgba(148,163,184,.14);color:#cbd5e1}.flag.void{background:rgba(239,68,68,.16);color:#fca5a5}.row-actions{display:flex;gap:5px}.row-actions button{width:34px;min-height:34px}.row-actions .danger{color:#fca5a5}.expense-empty,.expense-state{min-height:180px;display:flex;align-items:center;justify-content:center;gap:9px;color:#94a3b8}.expense-state{flex-direction:column}.expense-error{color:#fca5a5}.expense-error button{padding:0 14px}.expense-modal-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:20px}.expense-modal,.category-modal{width:min(900px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#111823;border:1px solid rgba(255,255,255,.12);border-radius:8px;box-shadow:0 24px 80px rgba(0,0,0,.5)}.category-modal{width:min(720px,100%)}.expense-modal>header,.category-modal>header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:#111823;border-bottom:1px solid rgba(255,255,255,.08)}.expense-modal>header button,.category-modal>header button{width:38px}.expense-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:18px}.expense-form label{display:flex;flex-direction:column;gap:6px;color:#a8b0c0;font-size:11px;font-weight:700}.expense-form .wide{grid-column:span 2}.expense-total{display:flex;flex-direction:column;justify-content:center;border-left:3px solid #ef4444;background:rgba(239,68,68,.08);border-radius:5px;padding:8px 12px}.expense-total span{font-size:10px;color:#94a3b8}.expense-total strong{font-size:19px;color:#fca5a5}.evidence-section{margin:0 18px 18px;border:1px solid rgba(255,255,255,.09);border-radius:7px;padding:12px}.evidence-head,.evidence-head>div,.evidence-row{display:flex;align-items:center;justify-content:space-between;gap:8px}.evidence-head>div{justify-content:flex-start}.evidence-picker{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 10px;border:1px solid rgba(255,255,255,.12);border-radius:6px;cursor:pointer;font-size:11px}.evidence-picker input{display:none}.evidence-row{min-height:38px;margin-top:8px;padding:0 9px;background:#0d131d;border-radius:5px;font-size:11px}.evidence-row.queued b{color:#fbbf24}.evidence-row button{width:32px;min-height:30px}.evidence-empty{padding:18px 0 6px;text-align:center;color:#64748b;font-size:11px}.void-banner{margin:14px 18px 0;padding:10px 12px;border:1px solid rgba(239,68,68,.3);border-radius:6px;background:rgba(239,68,68,.09);color:#fca5a5}.expense-modal>footer{position:sticky;bottom:0;display:flex;justify-content:flex-end;gap:8px;padding:13px 18px;background:#111823;border-top:1px solid rgba(255,255,255,.08)}.category-create{display:grid;grid-template-columns:120px 1fr 140px auto;gap:8px;padding:16px}.category-list{padding:0 16px 16px}.category-list>div{display:grid;grid-template-columns:1fr 130px 36px 36px;align-items:center;gap:7px;min-height:52px;border-top:1px solid rgba(255,255,255,.07)}.category-list>div.archived{opacity:.55}.category-list span{display:flex;flex-direction:column}.category-list small{color:#94a3b8;margin-top:3px}.category-list select{min-height:34px;border:1px solid rgba(255,255,255,.12);border-radius:6px;background:#0d131d;color:#e5e7eb;padding:5px 7px}.category-list button{width:34px;min-height:34px}.expense-spin{animation:expense-spin 1s linear infinite}@keyframes expense-spin{to{transform:rotate(360deg)}}
        .expense-page{--expense-text:#e5e7eb;--expense-muted:#b8c2d1;--expense-focus:#fbbf24;--expense-line:#3d495b;--expense-surface:#101620;--expense-warning:#fcd34d;background:var(--expense-surface);padding:16px;box-sizing:border-box;max-width:100%;border-radius:0}
        .expense-page button{min-width:44px;min-height:44px;white-space:nowrap}.expense-page button:hover:not(:disabled){border-color:var(--expense-muted)}.expense-page button:active:not(:disabled){transform:translateY(1px)}.expense-page button:focus-visible,.expense-page input:focus-visible,.expense-page select:focus-visible,.expense-page textarea:focus-visible,.expense-table-wrap:focus{outline:2px solid var(--expense-focus);outline-offset:2px}.expense-page svg{flex-shrink:0}.expense-header>div{min-width:0}.expense-actions{flex-wrap:wrap}.expense-filterbar{align-items:end}.date-filter{font-size:12px;color:var(--expense-muted);display:grid;gap:6px;min-width:0}.expense-filterbar input,.expense-filterbar select,.expense-form input,.expense-form select{min-width:0;min-height:44px}.expense-data-state{font-size:12px;color:var(--expense-muted);overflow-wrap:anywhere}.expense-warning{color:var(--expense-warning);font-size:13px}.expense-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;border-block:1px solid var(--expense-line)}.expense-summary>div{min-width:0}.expense-summary span,.expense-summary small{display:block;color:var(--expense-muted);font-size:12px}.expense-summary strong{display:block;font-size:23px;margin:5px 0;overflow-wrap:anywhere}.summary-actions{display:flex;gap:8px;flex-shrink:0}.expense-table-wrap{max-width:100%;min-width:0}.expense-table td{max-width:280px;overflow-wrap:anywhere}.row-actions button{min-width:44px}.expense-table td>span,.expense-table th,.expense-form label,.evidence-empty,.category-list small{color:var(--expense-muted)}.expense-table tr.is-archived,.expense-table tr.is-voided{opacity:1}.expense-state{padding:24px;min-height:240px;text-align:center;color:var(--expense-muted)}.expense-state.expense-error{color:var(--expense-warning)}.expense-modal,.category-modal{box-sizing:border-box}.category-list>div{grid-template-columns:minmax(0,1fr) 130px 44px 44px}.category-list span{min-width:0;overflow-wrap:anywhere}.evidence-row span{min-width:0;overflow-wrap:anywhere}.evidence-picker:focus-within{outline:2px solid var(--expense-focus)}.evidence-picker{position:relative}.evidence-picker input{display:block;position:absolute;width:1px;height:1px;opacity:0}
        @media(prefers-reduced-motion:reduce){.expense-spin{animation:none}.expense-page button:active:not(:disabled){transform:none}}
        @media(max-width:1100px){.expense-filterbar{grid-template-columns:repeat(3,minmax(0,1fr))}.expense-search{grid-column:span 3}}
        @media(max-width:700px){.expense-header{align-items:flex-start;flex-direction:column}.expense-actions{width:100%}.expense-actions button{flex:1}.expense-filterbar{grid-template-columns:1fr 1fr}.expense-search{grid-column:span 2}.expense-form{grid-template-columns:1fr 1fr;padding:14px}.expense-form .wide{grid-column:span 2}.category-create{grid-template-columns:1fr 1fr}.expense-modal-backdrop{padding:0;align-items:flex-end}.expense-modal,.category-modal{max-height:94dvh;border-radius:8px 8px 0 0}.expense-table-wrap{border-radius:6px}}
        @media(max-width:414px){.expense-page{padding:12px}.expense-actions button:first-child{flex:0 0 44px}.expense-actions button{font-size:12px;padding:0 8px}.expense-form{grid-template-columns:minmax(0,1fr)}.expense-form .wide{grid-column:auto}.category-create{grid-template-columns:minmax(0,1fr)}.category-list>div{grid-template-columns:minmax(0,1fr) 44px 44px;padding:10px 0}.category-list>div>span{grid-column:1/-1}.expense-summary{align-items:flex-start}.expense-summary strong{font-size:20px}}
      `}</style>
    </div>
  );
}
