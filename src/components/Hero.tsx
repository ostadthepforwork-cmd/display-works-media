"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

const stats = [
  { num: "500+", label: "งานที่ส่งมอบแล้ว" },
  { num: "100%", label: "ออนไลน์ทุกขั้นตอน" },
  { num: "24hr", label: "ตอบกลับภายใน" },
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ paddingTop: "70px" }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to right, rgba(5,8,15,0.97) 30%, rgba(5,8,15,0.75) 55%, rgba(5,8,15,0.3) 100%), url('/images/hero-bg.jpg') center/cover no-repeat",
        }}
      />

      {/* Orange glow */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full z-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full py-20">
        <div className="max-w-2xl">

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-8"
          >
            <div
              className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-[3px] uppercase border"
              style={{
                background: "rgba(255,107,0,0.1)",
                borderColor: "rgba(255,107,0,0.3)",
                color: "#FF6B00",
              }}
            >
              DISPLAY WORKS MEDIA
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-kanit font-extrabold leading-[1.05] mb-6"
            style={{ fontSize: "clamp(42px, 6vw, 84px)" }}
          >
            เสริมภาพลักษณ์
            <br />
            ธุรกิจคุณ
            <br />
            <span style={{ color: "#FF6B00" }}>เริ่มต้นได้</span>ในที่เดียว
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="leading-relaxed mb-10 font-light"
            style={{
              fontSize: "clamp(14px, 1.5vw, 17px)",
              maxWidth: "500px",
              color: "#A8B0C0",
            }}
          >
            Display Works Media คือโซลูชันงานพิมพ์สำหรับธุรกิจยุคใหม่
            <br />
            ที่เน้นความง่าย ความเร็ว และคุณภาพระดับมืออาชีพ
            <br />
            <br />
            ดูแลงานพิมพ์ทุกสเกล พร้อมให้คำแนะนำก่อนผลิตจริง
            <br />
            งานไว คุณภาพ มั่นใจได้ทุกขั้นตอน
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="#quote"
              className="group inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "#FF6B00",
                boxShadow: "0 4px 20px rgba(255,107,0,0.25)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#FF8C33";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(255,107,0,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#FF6B00";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(255,107,0,0.25)";
              }}
            >
              ขอใบเสนอราคา
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#portfolio"
              className="inline-flex items-center gap-2 text-white font-medium px-8 py-4 rounded-lg border transition-all duration-200 hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.25)" }}
            >
              <Play size={16} />
              ดูผลงานของเรา
            </a>
          </motion.div>

          {/* Stats — ใหญ่ขึ้น */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="flex flex-wrap gap-12 mt-14 pt-10 border-t"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            {stats.map((s) => (
              <div key={s.label}>
                <div
                  className="font-kanit font-bold text-5xl"
                  style={{ color: "#FF6B00" }}
                >
                  {s.num}
                </div>
                <div className="text-sm mt-1" style={{ color: "#A8B0C0" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <div className="text-xs tracking-widest uppercase" style={{ color: "#A8B0C0" }}>
          scroll
        </div>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center pt-1"
        >
          <div className="w-1 h-2 rounded-full" style={{ background: "#FF6B00" }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
