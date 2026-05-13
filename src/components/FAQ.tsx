"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, MessageCircle, Phone } from "lucide-react";

const faqs = [
  {
    q: "สั่งขั้นต่ำเท่าไหร่?",
    a: "ไม่มีขั้นต่ำในหลายรายการ สามารถสั่ง 1 ชิ้นได้เลย บางรายการอาจมีขั้นต่ำตามเงื่อนไขการผลิต ทีมงานจะแจ้งรายละเอียดเมื่อรับงาน",
  },
  {
    q: "ใช้เวลาผลิตนานเท่าไหร่?",
    a: "ขึ้นอยู่กับประเภทงานและจำนวน โดยปกติ 1–3 วันทำการ งานด่วนสามารถแจ้งได้เพื่อดำเนินการเร่งด่วน อาจมีค่าบริการเพิ่มเติม",
  },
  {
    q: "ต้องส่งไฟล์งานอะไรบ้าง?",
    a: "รองรับไฟล์ AI, PDF, PSD ความละเอียด 150–300 dpi ขึ้นไป หากยังไม่มีไฟล์ ทีมงานสามารถช่วยออกแบบได้ (มีค่าบริการเพิ่มเติม)",
  },
  {
    q: "ชำระเงินอย่างไร?",
    a: "โอนเงินผ่านธนาคาร, พร้อมเพย์ หรือ QR Code ชำระเต็มจำนวนก่อนผลิต หรืออาจมีเงื่อนไขพิเศษตามการตกลง",
  },
  {
    q: "จัดส่งทั่วประเทศได้จริงไหม?",
    a: "ใช่ครับ เราจัดส่งทุกจังหวัดในประเทศไทย ผ่านขนส่งเอกชนที่เชื่อถือได้ พร้อมแจ้งเลขพัสดุทุกออเดอร์",
  },
  {
    q: "ถ้างานออกมาไม่ตรงแบบ ทำอย่างไร?",
    a: "เราตรวจสอบคุณภาพก่อนส่งทุกครั้ง หากงานไม่ตรงตามที่ตกลงไว้ ยินดีผลิตใหม่ให้โดยไม่มีค่าใช้จ่ายเพิ่มเติม",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="py-24 lg:py-32 px-6 lg:px-8"
      style={{ background: "#141A24" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">

          {/* ── Left: sticky header ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 lg:sticky lg:top-28"
          >
            <div className="section-label">FAQ</div>
            <h2 className="section-title mb-5">คำถามที่<br />พบบ่อย</h2>
            <p className="section-sub mb-8">
              หากมีคำถามเพิ่มเติม ติดต่อเราได้โดยตรง
              ทีมงานพร้อมช่วยเหลือทุกวัน
            </p>

            {/* Contact options */}
            <div className="flex flex-col gap-3">
              <a
                href="https://lin.ee/O0nPl03"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "#06C755",
                  boxShadow: "0 4px 16px rgba(6,199,85,0.25)",
                }}
              >
                <MessageCircle size={18} />
                ติดต่อผ่าน LINE
              </a>
              <a
                href="tel:0659161539"
                className="flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-white/5 border"
                style={{
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "#C8D0DC",
                }}
              >
                <Phone size={18} style={{ color: "#FF6B00" }} />
                065-916-1539
              </a>
            </div>
          </motion.div>

          {/* ── Right: accordion ── */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="overflow-hidden rounded-2xl border transition-all duration-300"
                style={{
                  background: open === i ? "#1A2233" : "#0B0F19",
                  borderColor:
                    open === i
                      ? "rgba(255,107,0,0.3)"
                      : "rgba(255,255,255,0.07)",
                }}
              >
                {/* Question */}
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span
                    className="font-semibold text-base leading-snug"
                    style={{ color: open === i ? "#fff" : "#C8D0DC" }}
                  >
                    {faq.q}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{
                      background:
                        open === i
                          ? "#FF6B00"
                          : "rgba(255,255,255,0.06)",
                    }}
                  >
                    {open === i ? (
                      <Minus size={14} className="text-white" />
                    ) : (
                      <Plus size={14} style={{ color: "#A8B0C0" }} />
                    )}
                  </div>
                </button>

                {/* Answer */}
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div
                        className="px-6 pb-5 text-sm leading-relaxed border-t"
                        style={{
                          color: "#A8B0C0",
                          borderColor: "rgba(255,107,0,0.1)",
                          paddingTop: "16px",
                        }}
                      >
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
