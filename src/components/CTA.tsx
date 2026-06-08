"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";

const points = [
  "ไม่มีค่าใช้จ่ายในการประเมินราคา",
  "ตอบกลับภายใน 24 ชั่วโมง",
  "ให้คำปรึกษาก่อนตัดสินใจ",
  "ยังไม่มีแบบก็สอบถามได้",
];

export default function CTA() {
  return (
    <section
      className="py-20 lg:py-24 px-6 lg:px-8 relative overflow-hidden"
      style={{
        background: "#141A24",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,107,0,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-[3px] uppercase border mb-8"
              style={{
                background: "rgba(255,107,0,0.1)",
                borderColor: "rgba(255,107,0,0.25)",
                color: "#FF6B00",
              }}
            >
              FREE CONSULTATION
            </div>

            <h2
              className="font-kanit font-extrabold leading-tight mb-5 text-white"
              style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
            >
              เริ่มต้นง่ายกว่าที่คิด
            </h2>

            <p className="text-base leading-relaxed mb-8" style={{ color: "#A8B0C0" }}>
              กำลังมองหางานป้ายหรือสื่อโฆษณา?
            </p>

            {/* Checklist */}
            <div className="flex flex-col gap-3 mb-10">
              {points.map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,107,0,0.15)" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="#FF6B00"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-sm" style={{ color: "#C8D0DC" }}>
                    {p}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: CTA card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div
              className="rounded-3xl p-8 lg:p-10"
              style={{
                background: "#0B0F19",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3 className="font-kanit font-bold text-white text-2xl mb-2">
                ติดต่อเราได้เลย
              </h3>
              <p className="text-sm mb-8" style={{ color: "#A8B0C0" }}>
                ปรึกษางานและประเมินราคาเบื้องต้นฟรี ติดต่อกลับภายใน 30 นาที
              </p>

              {/* Primary CTA */}
              <a
                href="#quote"
                className="group flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-white text-base mb-4 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "#FF6B00",
                  boxShadow: "0 8px 32px rgba(255,107,0,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#FF8C33";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 12px 40px rgba(255,107,0,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#FF6B00";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 8px 32px rgba(255,107,0,0.3)";
                }}
              >
                ติดต่อสอบถามออนไลน์
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
                <span className="text-xs" style={{ color: "#A8B0C0" }}>
                  หรือติดต่อโดยตรง
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
              </div>

              {/* Secondary CTAs */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://lin.ee/O0nPl03"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "#06C755",
                    boxShadow: "0 4px 16px rgba(6,199,85,0.25)",
                  }}
                >
                  <MessageCircle size={16} />
                  LINE
                </a>
                <a
                  href="tel:0659161539"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm border transition-all duration-200 hover:bg-white/5"
                  style={{ borderColor: "rgba(255,255,255,0.15)" }}
                >
                  <Phone size={16} style={{ color: "#FF6B00" }} />
                  065-916-1539
                </a>
              </div>

              {/* Trust note */}
              <p
                className="text-center text-xs mt-6"
                style={{ color: "#A8B0C0" }}
              >
                🔒 ข้อมูลของคุณปลอดภัย ไม่มีการขายข้อมูลให้บุคคลที่สาม
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
