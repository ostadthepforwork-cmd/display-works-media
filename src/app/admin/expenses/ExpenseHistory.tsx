"use client";

import { useEffect, useRef, useState } from "react";
import { History, LoaderCircle, RefreshCw, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { expenseChanges } from "@/lib/expense-inspection";

type Event = { id: number; event_type: string; actor_id: string; created_at: string; before_data: unknown; after_data: unknown };

const eventLabels: Record<string, string> = {
  created: "สร้างรายการ", updated: "แก้ไขรายการ", marked_paid: "บันทึกชำระแล้ว",
  marked_unpaid: "เปลี่ยนเป็นยังไม่ชำระ", archived: "เก็บถาวร", restored: "นำกลับมาใช้",
  voided: "ยกเลิกรายการ", attachment_added: "แนบหลักฐาน", category_changed: "เปลี่ยนหมวด", class_changed: "เปลี่ยนประเภท",
};

export default function ExpenseHistory({ expenseId, expenseNo, onClose }: { expenseId: string; expenseNo: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus("loading");
    setEvents([]);
    void (async () => {
      try {
        const { data, error, count } = await getSupabaseBrowserClient()
          .from("erp_expense_events")
          .select("id,event_type,actor_id,created_at,before_data,after_data", { count: "exact" })
          .eq("expense_id", expenseId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(100);
        if (!active) return;
        if (error) { setStatus("error"); return; }
        setEvents(data || []);
        setStatus(count === (data || []).length ? "ready" : "partial");
      } catch { if (active) setStatus("error"); }
    })();
    return () => { active = false; };
  }, [expenseId, retry]);
  return <dialog ref={dialog} aria-label={`ประวัติค่าใช้จ่าย ${expenseNo}`} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header><div><h3><History size={18} /> ประวัติการแก้ไข</h3><p>{expenseNo}</p></div><button type="button" title="ปิดประวัติ" aria-label="ปิดประวัติ" onClick={onClose}><X size={20} /></button></header>
    <div className="history-body" aria-busy={status === "loading"}>
      <p role="status" className={status === "error" || status === "partial" ? "warning" : "status"}>
        {status === "loading" && <LoaderCircle size={18} />}
        {status === "loading" ? "กำลังโหลดประวัติ" : status === "error" ? "โหลดประวัติไม่สำเร็จ" : status === "partial" ? "แสดงประวัติบางส่วน สูงสุด 100 รายการล่าสุด" : events.length ? `${events.length} เหตุการณ์ที่เข้าถึงได้` : "ไม่พบประวัติที่เข้าถึงได้"}
      </p>
      {status === "error" && <button type="button" onClick={() => setRetry((n) => n + 1)}><RefreshCw size={16} /> ลองใหม่</button>}
      {status !== "loading" && status !== "error" && events.map((event) => <details key={event.id}>
        <summary><strong>{eventLabels[event.event_type] || "เปลี่ยนแปลงรายการ"}</strong><time>{new Date(event.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</time></summary>
        <p className="actor">รหัสผู้ดำเนินการ: {event.actor_id}</p>
        {expenseChanges(event.before_data, event.after_data).map((change) => <div className="change" key={change.key}>
          <strong>{change.label}</strong><div><span>ก่อน</span><p>{change.before}</p></div><div><span>หลัง</span><p>{change.after}</p></div>
        </div>)}
        {!expenseChanges(event.before_data, event.after_data).length && <p>ไม่มีรายละเอียดการเปลี่ยนแปลงที่แสดงได้</p>}
      </details>)}
    </div>
    <style jsx>{`
      dialog{--surface:#111823;--text:#e5e7eb;--muted:#b8c2d1;--line:#3d495b;--focus:#fbbf24;--warning:#fcd34d;color:var(--text);background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:0;width:min(720px,calc(100% - 24px));max-height:90dvh;overflow:auto;overflow-wrap:anywhere}
      dialog::backdrop{background:rgba(0,0,0,.7)}header{position:sticky;top:0;background:var(--surface);display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px;border-bottom:1px solid var(--line)}h3{font-size:18px;margin:0;display:flex;align-items:center;gap:8px}header p{margin:6px 0 0;color:var(--muted)}button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:44px;min-height:44px;padding:8px;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--text);font:inherit;cursor:pointer;flex-shrink:0}button:hover,summary:hover{background:var(--line)}button:focus-visible,summary:focus-visible{outline:2px solid var(--focus);outline-offset:2px}.history-body{padding:16px}.status,.actor{color:var(--muted)}.status,.warning{display:flex;align-items:center;gap:8px}.warning{color:var(--warning)}details{border-top:1px solid var(--line);padding:14px 0}summary{cursor:pointer;min-height:44px}time{display:block;font-size:12px;color:var(--muted);margin-top:5px}.actor{font-size:12px}.change{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 0;border-top:1px solid var(--line)}.change>strong{grid-column:1/-1}.change span{font-size:12px;color:var(--muted)}.change p{margin:4px 0;white-space:pre-wrap}.change>div{min-width:0}@media(max-width:375px){.change{grid-template-columns:minmax(0,1fr)}}
    `}</style>
  </dialog>;
}
