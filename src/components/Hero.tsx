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
      {/* Background image + overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Display Works Media"
          fill
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(11,15,25,0.92) 35%, rgba(11,15,25,0.7) 65%, rgba(11,15,25,0.5) 100%)",
          }}
        />
      </div>

      {/* Orange ambient glow bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(255,107,0,0.07) 0%, transparent 70%)",
        }}
      />
      {/* Orange ambient glow top-right */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(255,107,0,0.04) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full"
        style={{ paddingTop: "100px", paddingBottom: "80px" }}
      >
        <div className="max-w-3xl">

          {/* ───── Content ───── */}
          <div>
            {/* Eyebrow badge */}
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
              className="font-kanit font-extrabold leading-[1.05] mb-6 text-white"
              style={{ fontSize: "clamp(38px, 5vw, 72px)" }}
            >
              ผลิตสื่อโฆษณา
              <br />
              <span style={{ color: "#FF6B00" }}>ครบวงจร</span>
              <br />
              
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="leading-relaxed mb-8"
              style={{
                fontSize: "clamp(14px, 1.4vw, 17px)",
                maxWidth: "480px",
                color: "#A8B0C0",
              }}
            >
              ออกแบบ ผลิต ติดตั้ง งานป้าย ร้านค้า และสื่อโฆษณาทุกประเภท
              พร้อมทีมงานมืออาชีพดูแลตลอดกระบวนการ
            </motion.p>

            {/* Trust points */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col gap-2.5 mb-10"
            >
              {trustPoints.map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <CheckCircle2
                    size={16}
                    style={{ color: "#FF6B00", flexShrink: 0 }}
                  />
                  <span className="text-sm" style={{ color: "#C8D0DC" }}>
                    {point}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-wrap gap-4 mb-8"
            >
              <a
                href="#quote"
                className="group inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "#FF6B00",
                  boxShadow: "0 4px 24px rgba(255,107,0,0.3)",
                  fontSize: "15px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#FF8C33";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(255,107,0,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#FF6B00";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(255,107,0,0.3)";
                }}
              >
                ขอใบเสนอราคา
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#portfolio"
                className="inline-flex items-center gap-2 text-white font-medium px-8 py-4 rounded-xl border transition-all duration-200 hover:bg-white/5"
                style={{
                  borderColor: "rgba(255,255,255,0.2)",
                  fontSize: "15px",
                }}
              >
                ดูผลงานของเรา
              </a>
            </motion.div>

            {/* Quick contact */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-5"
              style={{ color: "#A8B0C0", fontSize: "13px" }}
            >
              <a
                href="tel:0659161539"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Phone size={14} style={{ color: "#FF6B00" }} />
                065-916-1539
              </a>
              <a
                href="https://lin.ee/O0nPl03"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <MessageCircle size={14} style={{ color: "#06C755" }} />
                ปรึกษาฟรีผ่าน LINE
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <div
          className="text-xs tracking-widest uppercase"
          style={{ color: "#A8B0C0" }}
        >
          scroll
        </div>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center pt-1"
        >
          <div
            className="w-1 h-2 rounded-full"
            style={{ background: "#FF6B00" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
