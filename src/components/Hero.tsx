"use client";

import { motion } from "framer-motion";
import { ArrowRight, Phone, MessageCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";

const trustPoints = [
  "ออกแบบ ผลิต ติดตั้ง ครบจบในที่เดียว",
  "บริการหลังการขายครบวงจร",
  "จัดส่งทั่วประเทศ พร้อมแจ้งเลขพัสดุ",
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "#0B0F19" }}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/hero-bg.jpg" alt="Display Works Media" fill className="object-cover" priority />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(11,15,25,0.95) 40%, rgba(11,15,25,0.7) 70%, rgba(11,15,25,0.5) 100%)" }} />
      </div>

      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.07) 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8"
        style={{ paddingTop: "100px", paddingBottom: "80px" }}>
        <div className="max-w-3xl">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6 sm:mb-8">
            <div className="px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-[2px] sm:tracking-[3px] uppercase border"
              style={{ background: "rgba(255,107,0,0.1)", borderColor: "rgba(255,107,0,0.3)", color: "#FF6B00" }}>
              DISPLAY WORKS MEDIA
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="font-kanit font-extrabold leading-[1.1] mb-5 sm:mb-6 text-white"
            style={{ fontSize: "clamp(32px, 7vw, 72px)" }}>
            ผลิตสื่อโฆษณา
            <br />
            <span style={{ color: "#FF6B00" }}>ครบวงจร</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="leading-relaxed mb-6 sm:mb-8"
            style={{ fontSize: "clamp(13px, 2.5vw, 17px)", maxWidth: "480px", color: "#A8B0C0" }}>
            ออกแบบ ผลิต ติดตั้ง งานป้าย ร้านค้า และสื่อโฆษณาทุกประเภท
            พร้อมทีมงานมืออาชีพดูแลตลอดกระบวนการ
          </motion.p>

          {/* Trust points */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col gap-2 mb-8 sm:mb-10">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-center gap-3">
                <CheckCircle2 size={15} style={{ color: "#FF6B00", flexShrink: 0 }} />
                <span style={{ fontSize: "clamp(12px, 2vw, 14px)", color: "#C8D0DC" }}>{point}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
            <a href="#quote"
              className="group inline-flex items-center justify-center gap-2 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto"
              style={{ background: "#FF6B00", boxShadow: "0 4px 24px rgba(255,107,0,0.3)", fontSize: "15px" }}>
              ขอใบเสนอราคา
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a href="#portfolio"
              className="inline-flex items-center justify-center gap-2 text-white font-medium px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border transition-all duration-200 hover:bg-white/5 w-full sm:w-auto"
              style={{ borderColor: "rgba(255,255,255,0.2)", fontSize: "15px" }}>
              ดูผลงานของเรา
            </a>
          </motion.div>

          {/* Quick contact */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center gap-4 sm:gap-5"
            style={{ color: "#A8B0C0", fontSize: "13px" }}>
            <a href="tel:0659161539" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone size={14} style={{ color: "#FF6B00" }} /> 065-916-1539
            </a>
            <a href="https://lin.ee/O0nPl03" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-white transition-colors">
              <MessageCircle size={14} style={{ color: "#06C755" }} /> ปรึกษาฟรีผ่าน LINE
            </a>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator — ซ่อนบน mobile */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 z-10">
        <div className="text-xs tracking-widest uppercase" style={{ color: "#A8B0C0" }}>scroll</div>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center pt-1">
          <div className="w-1 h-2 rounded-full" style={{ background: "#FF6B00" }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
