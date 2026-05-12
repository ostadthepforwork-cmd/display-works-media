"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, MessageCircle } from "lucide-react";

const faqs = [
  {
    q: "สั่งขั้นต่ำเท่าไหร่?",
    a: "ไม่มีขั้นต่ำในหลายรายการ สามารถสั่ง 1 ชิ้นได้เลย บางรายการอาจมีขั้นต่ำตามเงื่อนไขการผลิต ทีมงานจะแจ้งรายละเอียดเมื่อรับงาน",
  },
  {
    q: "ใช้เวลาผลิตนานเท่าไหร่?",
    a: "ขึ้นอยู่กับประเภทงานและจำนวน โดยปกติ 1-3 วันทำการ งานด่วนสามารถแจ้งได้เพื่อดำเนินการเร่งด่วน อาจมีค่าบริการเพิ่มเติม",
  },
  {
    q: "ต้องส่งไฟล์งานอะไรบ้าง?",
    a: "รองรับไฟล์ AI, PDF, PSD ความละเอียด 150-300 dpi ขึ้นไป หากยังไม่มีไฟล์ ทีมงานสามารถช่วยออกแบบได้ (มีค่าบริการเพิ่มเติม)",
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
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="py-24 px-6 lg:px-8"
      style={{ background: "#141A24" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-label">FAQ</div>
            <h2 className="section-title">คำถามที่พบบ่อย</h2>
            <p className="section-sub mb-8">
              หากมีคำถามเพิ่มเติม ติดต่อเราได้ตลอดผ่าน LINE Official
              ทีมงานพร้อมช่วยเหลือ
            </p>
            <a
              href="https://lin.ee/O0nPl03"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "#06C755",
                boxShadow: "0 4px 20px rgba(6,199,85,0.25)",
              }}
            >
              <MessageCircle size={16} />
              ติดต่อ LINE
            </a>
          </motion.div>

          {/* Right - FAQs */}
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-xl border overflow-hidden"
                style={{
                  background: "#0B0F19",
                  borderColor:
                    open === i
                      ? "rgba(255,107,0,0.3)"
                      : "rgba(255,255,255,0.08)",
                  transition: "border-color 0.3s",
                }}
              >
                <button
                  className="w-full flex justify-between items-center px-6 py-5 text-left transition-colors duration-200"
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{ color: open === i ? "#FF6B00" : "#ffffff" }}
                >
                  <span className="font-medium text-sm pr-4">{faq.q}</span>
                  {open === i ? (
                    <Minus
                      size={18}
                      style={{ color: "#FF6B00", flexShrink: 0 }}
                    />
                  ) : (
                    <Plus
                      size={18}
                      style={{ color: "#FF6B00", flexShrink: 0 }}
                    />
                  )}
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-6 pb-5 text-muted text-sm leading-relaxed border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <div className="pt-4">{faq.a}</div>
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
