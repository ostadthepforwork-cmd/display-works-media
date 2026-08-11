"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";

const points = [
  "à¹„à¸¡à¹ˆà¸¡à¸µà¸„à¹ˆà¸²à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢à¹ƒà¸™à¸à¸²à¸£à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²",
  "à¸•à¸­à¸šà¸à¸¥à¸±à¸šà¸ à¸²à¸¢à¹ƒà¸™ 24 à¸Šà¸±à¹ˆà¸§à¹‚à¸¡à¸‡",
  "à¹ƒà¸«à¹‰à¸„à¸³à¸›à¸£à¸¶à¸à¸©à¸²à¸à¹ˆà¸­à¸™à¸•à¸±à¸”à¸ªà¸´à¸™à¹ƒà¸ˆ",
  "à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¹à¸šà¸šà¸à¹‡à¸ªà¸­à¸šà¸–à¸²à¸¡à¹„à¸”à¹‰",
];

export default function CTA() {
  return (
    <section
      className="brand-section py-20 lg:py-28 px-5 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        background: "#10151D",
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
            <div className="section-label">
              FREE CONSULTATION
            </div>

            <h2
              className="font-kanit font-extrabold leading-tight mb-5 text-white"
              style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
            >
              à¹€à¸£à¸´à¹ˆà¸¡à¸•à¹‰à¸™à¸‡à¹ˆà¸²à¸¢à¸à¸§à¹ˆà¸²à¸—à¸µà¹ˆà¸„à¸´à¸”
            </h2>

            <p className="text-base leading-relaxed mb-8" style={{ color: "#A8B0C0" }}>
              à¸à¸³à¸¥à¸±à¸‡à¸¡à¸­à¸‡à¸«à¸²à¸‡à¸²à¸™à¸›à¹‰à¸²à¸¢à¸«à¸£à¸·à¸­à¸ªà¸·à¹ˆà¸­à¹‚à¸†à¸©à¸“à¸²?
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
                background: "#070A0F",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
              }}
            >
              <h3 className="font-kanit font-bold text-white text-2xl mb-2">
                à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸£à¸²à¹„à¸”à¹‰à¹€à¸¥à¸¢
              </h3>
              <p className="text-sm mb-8" style={{ color: "#A8B0C0" }}>
                à¸›à¸£à¸¶à¸à¸©à¸²à¸‡à¸²à¸™à¹à¸¥à¸°à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²à¹€à¸šà¸·à¹‰à¸­à¸‡à¸•à¹‰à¸™à¸Ÿà¸£à¸µ à¸•à¸´à¸”à¸•à¹ˆà¸­à¸à¸¥à¸±à¸šà¸ à¸²à¸¢à¹ƒà¸™ 30 à¸™à¸²à¸—à¸µ
              </p>

              {/* Primary CTA */}
              <a
                href="#quote"
                className="group flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-white text-base mb-4 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "#C2410C",
                  boxShadow: "0 8px 32px rgba(194,65,12,0.34)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#9A3412";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 12px 40px rgba(194,65,12,0.42)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#C2410C";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 8px 32px rgba(194,65,12,0.34)";
                }}
              >
                à¸•à¸´à¸”à¸•à¹ˆà¸­à¸ªà¸­à¸šà¸–à¸²à¸¡à¸­à¸­à¸™à¹„à¸¥à¸™à¹Œ
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
                  à¸«à¸£à¸·à¸­à¸•à¸´à¸”à¸•à¹ˆà¸­à¹‚à¸”à¸¢à¸•à¸£à¸‡
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
                    background: "#047857",
                    boxShadow: "0 4px 16px rgba(4,120,87,0.28)",
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
                  <Phone size={16} style={{ color: "#FF6500" }} />
                  065-916-1539
                </a>
              </div>

              {/* Trust note */}
              <p
                className="text-center text-xs mt-6"
                style={{ color: "#A8B0C0" }}
              >
                à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸‚à¸­à¸‡à¸„à¸¸à¸“à¹ƒà¸Šà¹‰à¹€à¸žà¸·à¹ˆà¸­à¸à¸²à¸£à¸•à¸´à¸”à¸•à¹ˆà¸­à¹à¸¥à¸°à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²à¹€à¸—à¹ˆà¸²à¸™à¸±à¹‰à¸™
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
