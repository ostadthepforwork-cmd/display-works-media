"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Send, CheckCircle } from "lucide-react";

type FormData = {
  name: string;
  phone: string;
  lineId: string;
  serviceType: string;
  width: string;
  height: string;
  quantity: number;
  details: string;
  needDate: string;
};

const services = [
  "ป้ายไวนิล", "Sticker Indoor", "Sticker Outdoor",
  "PP Board", "Roll Up", "X-Stand", "Backdrop", "Standee", "อื่นๆ",
];

const inputStyle = {
  background: "#0d1220",
  border: "1px solid rgba(255,255,255,0.08)",
  fontFamily: "'Prompt', sans-serif",
};

const onFocusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "rgba(255,107,0,0.5)";
};
const onBlurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "rgba(255,255,255,0.08)";
};

export default function QuoteForm({ contact }: { contact?: any }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const phone = contact?.phone || "065-916-1539";
  const email = contact?.email || "info.displayworksmedia@gmail.com";
  const lineUrl = contact?.line || "https://lin.ee/O0nPl03";
  const tel = phone.replace(/[^\d+]/g, "");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) setSubmitted(true);
      else alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } catch {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="quote" className="py-16 sm:py-20 px-5 sm:px-6 lg:px-8" style={{ background: "#0B0F19" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16 items-start">

          {/* Left info — ลบ framer-motion ใช้ CSS reveal แทน */}
          <div className="lg:col-span-2 reveal-section">
            <div className="section-label">ติดต่อสอบถาม</div>
            <h2 className="section-title">ติดต่อสอบถาม และปรึกษาได้ฟรี</h2>
            <p className="section-sub mb-10">
              ไม่ว่าจะเป็นงานป้าย งานพิมพ์ หรือสื่อโฆษณา เราพร้อมให้คำแนะนำและประเมินราคาเบื้องต้นโดยไม่มีค่าใช้จ่าย
            </p>
            <div className="flex flex-col gap-4">
              {[
                "ไม่มีค่าใช้จ่ายในการประเมินราคา",
                "ตอบกลับภายใน 24 ชั่วโมง",
                "ให้คำปรึกษาก่อนตัดสินใจ",
                "ยังไม่มีแบบก็สอบถามได้",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle size={18} style={{ color: "#FF6B00", flexShrink: 0 }} aria-hidden="true" />
                  <span className="text-muted text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 p-6 rounded-xl border" style={{ background: "#141A24", borderColor: "rgba(255,107,0,0.2)" }}>
              <div className="text-sm font-semibold text-white mb-3">ติดต่อด่วน</div>
              <a href={lineUrl} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-2">
                💬 LINE: @displayworks
              </a>
              <a href={`tel:${tel}`} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-2">
                📞 {phone}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
                ✉️ {email}
              </a>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-3 reveal-section">
            <div className="p-8 sm:p-10 rounded-2xl border" style={{ background: "#141A24", borderColor: "rgba(255,255,255,0.08)" }}>
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
                  <CheckCircle size={56} style={{ color: "#FF6B00" }} aria-hidden="true" />
                  <h3 className="font-kanit font-bold text-2xl text-white">ส่งข้อมูลสำเร็จ!</h3>
                  <p className="text-muted text-sm max-w-xs">ทีมงานได้รับข้อมูลของคุณแล้ว จะติดต่อกลับภายใน 24 ชั่วโมง</p>
                  <button onClick={() => setSubmitted(false)} className="mt-4 text-sm underline" style={{ color: "#FF6B00" }}>
                    ส่งใบเสนอราคาอีกครั้ง
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* ชื่อ */}
                    <div>
                      <label htmlFor="quote-name" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        ชื่อ-นามสกุล *
                      </label>
                      <input
                        id="quote-name"
                        {...register("name", { required: true })}
                        placeholder="ชื่อของคุณ"
                        autoComplete="name"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{ ...inputStyle, border: `1px solid ${errors.name ? "#FF4444" : "rgba(255,255,255,0.08)"}` }}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                        aria-required="true"
                        aria-invalid={errors.name ? "true" : "false"}
                      />
                    </div>

                    {/* เบอร์โทร */}
                    <div>
                      <label htmlFor="quote-phone" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        เบอร์โทรศัพท์ *
                      </label>
                      <input
                        id="quote-phone"
                        {...register("phone", { required: true })}
                        placeholder="08X-XXX-XXXX"
                        type="tel"
                        autoComplete="tel"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{ ...inputStyle, border: `1px solid ${errors.phone ? "#FF4444" : "rgba(255,255,255,0.08)"}` }}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                        aria-required="true"
                        aria-invalid={errors.phone ? "true" : "false"}
                      />
                    </div>

                    {/* LINE ID */}
                    <div>
                      <label htmlFor="quote-line" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        LINE ID
                      </label>
                      <input
                        id="quote-line"
                        {...register("lineId")}
                        placeholder="@yourline"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={inputStyle}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                      />
                    </div>

                    {/* ประเภทสินค้า */}
                    <div>
                      <label htmlFor="quote-service" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        ประเภทสินค้า *
                      </label>
                      <select
                        id="quote-service"
                        {...register("serviceType", { required: true })}
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{ ...inputStyle, border: `1px solid ${errors.serviceType ? "#FF4444" : "rgba(255,255,255,0.08)"}` }}
                        aria-required="true"
                        aria-invalid={errors.serviceType ? "true" : "false"}
                      >
                        <option value="">เลือกประเภท</option>
                        {services.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* ขนาดกว้าง */}
                    <div>
                      <label htmlFor="quote-width" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        ขนาดกว้าง (cm)
                      </label>
                      <input
                        id="quote-width"
                        {...register("width")}
                        placeholder="เช่น 100"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={inputStyle}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                      />
                    </div>

                    {/* ขนาดสูง */}
                    <div>
                      <label htmlFor="quote-height" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        ขนาดสูง (cm)
                      </label>
                      <input
                        id="quote-height"
                        {...register("height")}
                        placeholder="เช่น 200"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={inputStyle}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                      />
                    </div>

                    {/* จำนวน */}
                    <div>
                      <label htmlFor="quote-qty" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        จำนวน (ชิ้น)
                      </label>
                      <input
                        id="quote-qty"
                        {...register("quantity")}
                        type="number"
                        min={1}
                        placeholder="1"
                        inputMode="numeric"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={inputStyle}
                        onFocus={onFocusBorder}
                        onBlur={onBlurBorder}
                      />
                    </div>

                    {/* วันที่ต้องการ */}
                    <div>
                      <label htmlFor="quote-date" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                        วันที่ต้องการรับงาน
                      </label>
                      <input
                        id="quote-date"
                        {...register("needDate")}
                        type="date"
                        className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                        style={{ ...inputStyle, colorScheme: "dark" as React.CSSProperties["colorScheme"] }}
                      />
                    </div>
                  </div>

                  {/* รายละเอียด */}
                  <div>
                    <label htmlFor="quote-details" className="block text-xs text-muted mb-2 font-medium tracking-wide uppercase">
                      รายละเอียดเพิ่มเติม
                    </label>
                    <textarea
                      id="quote-details"
                      {...register("details")}
                      rows={4}
                      placeholder="รายละเอียดงาน วัสดุ ความต้องการพิเศษ หรือสิ่งที่อยากให้เราทราบ..."
                      className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none resize-y"
                      style={inputStyle}
                      onFocus={onFocusBorder}
                      onBlur={onBlurBorder}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-white text-base transition-all duration-200 disabled:opacity-70"
                    style={{ background: loading ? "#CC5500" : "#FF6B00", boxShadow: "0 4px 20px rgba(255,107,0,0.25)" }}
                    onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#FF8C33"; }}
                    onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#FF6B00"; }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                        กำลังส่งข้อมูล...
                      </>
                    ) : (
                      <>
                        <Send size={18} aria-hidden="true" />
                        ส่งข้อมูลขอใบเสนอราคา
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs" style={{ color: "#A8B0C0" }}>
                    ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง • ไม่มีค่าใช้จ่ายในการขอใบเสนอราคา
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
