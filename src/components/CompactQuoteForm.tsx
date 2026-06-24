"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, MessageCircle, Paperclip, Send } from "lucide-react";

const serviceOptions = [
  "ป้ายไวนิล",
  "Sticker Indoor / Outdoor",
  "PP Board / Standee",
  "Roll Up / X-Stand",
  "ฉลากสินค้า",
  "Backdrop",
  "อื่นๆ",
];

export default function CompactQuoteForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatus("loading");

    const form = new FormData(event.currentTarget);
    const artwork = form.get("artwork");
    if (artwork instanceof File && artwork.size > 20 * 1024 * 1024) {
      setErrorMessage("ไฟล์แนบต้องมีขนาดไม่เกิน 20 MB");
      setStatus("error");
      return;
    }

    const response = await fetch("/api/quote", {
      method: "POST",
      body: form,
    }).catch(() => null);

    if (!response?.ok) {
      const result = await response?.json().catch(() => null);
      setErrorMessage(result?.error || "");
      setStatus("error");
      return;
    }

    event.currentTarget.reset();
    setStatus("success");
  }

  return (
    <form className="home-compact-form" onSubmit={handleSubmit}>
      <div className="home-form-line-help">
        <div>
          <b>ยังไม่พร้อมกรอกฟอร์ม?</b>
          <span>ทัก LINE เพื่อให้ทีมช่วยดูขนาด วัสดุ และไฟล์งานก่อนได้</span>
        </div>
        <a href="https://lin.ee/O0nPl03" target="_blank" rel="noopener noreferrer">
          <MessageCircle size={15} /> LINE
        </a>
      </div>
      <label aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <span>Website</span>
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label>
        <span>ชื่อ-นามสกุล *</span>
        <input name="name" required autoComplete="name" placeholder="ชื่อของคุณ" />
      </label>
      <label>
        <span>เบอร์โทรศัพท์ *</span>
        <input name="phone" required type="tel" autoComplete="tel" placeholder="08X-XXX-XXXX" />
      </label>
      <label>
        <span>LINE ID</span>
        <input name="lineId" placeholder="@yourline" />
      </label>
      <label>
        <span>ประเภทสินค้า *</span>
        <select name="serviceType" required defaultValue="">
          <option value="" disabled>เลือกประเภท</option>
          {serviceOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label>
        <span>ขนาดกว้าง (CM)</span>
        <input name="width" inputMode="decimal" placeholder="เช่น 100" />
      </label>
      <label>
        <span>ขนาดสูง (CM)</span>
        <input name="height" inputMode="decimal" placeholder="เช่น 200" />
      </label>
      <label>
        <span>จำนวน (ชิ้น)</span>
        <input name="quantity" type="number" min="1" defaultValue="1" />
      </label>
      <label>
        <span>วันที่ต้องการรับงาน</span>
        <input name="needDate" type="date" />
      </label>
      <label className="home-compact-form-details">
        <span>รายละเอียดเพิ่มเติม</span>
        <textarea name="details" rows={3} placeholder="รายละเอียดงาน วัสดุ ความต้องการพิเศษ หรือสิ่งที่อยากให้เราทราบ" />
      </label>
      <label className="home-file-field">
        <span>แนบไฟล์ (ถ้ามี)</span>
        <span className="home-file-control">
          <Paperclip size={15} />
          <span>เลือกไฟล์ Artwork หรือภาพตัวอย่าง</span>
          <input name="artwork" type="file" accept=".ai,.pdf,.psd,.jpg,.jpeg,.png" />
        </span>
      </label>
      <button className="home-form-submit fx-button" type="submit" disabled={status === "loading"}>
        <Send size={15} />
        {status === "loading" ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลให้ทีมประเมิน"}
      </button>
      <div className="home-form-status" aria-live="polite">
        {status === "success" && <span className="text-[#35d07f]"><CheckCircle2 size={14} /> ส่งข้อมูลสำเร็จ ทีมงานจะติดต่อกลับโดยเร็ว</span>}
        {status === "error" && <span className="text-[#ff6b6b]">{errorMessage || "ส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้งหรือติดต่อผ่าน LINE"}</span>}
      </div>
    </form>
  );
}
