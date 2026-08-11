"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Calculator,
  CheckCircle2,
  Cog,
  PackageCheck,
} from "lucide-react";

const steps = [
  {
    num: 1,
    icon: FileText,
    title: "à¸ªà¹ˆà¸‡à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸‡à¸²à¸™",
    desc: "à¹à¸ˆà¹‰à¸‡à¸‚à¸™à¸²à¸” à¸ˆà¸³à¸™à¸§à¸™ à¹à¸¥à¸°à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸‡à¸²à¸™à¸œà¹ˆà¸²à¸™ LINE à¸«à¸£à¸·à¸­à¹à¸šà¸šà¸Ÿà¸­à¸£à¹Œà¸¡à¸­à¸­à¸™à¹„à¸¥à¸™à¹Œ à¸‡à¹ˆà¸²à¸¢ à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¹€à¸”à¸´à¸™à¸—à¸²à¸‡",
    time: "à¸ à¸²à¸¢à¹ƒà¸™ 5 à¸™à¸²à¸—à¸µ",
  },
  {
    num: 2,
    icon: Calculator,
    title: "à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²",
    desc: "à¸—à¸µà¸¡à¸‡à¸²à¸™à¸›à¸£à¸°à¹€à¸¡à¸´à¸™à¸£à¸²à¸„à¸²à¹à¸¥à¸°à¸ªà¹ˆà¸‡à¹ƒà¸šà¹€à¸ªà¸™à¸­à¸£à¸²à¸„à¸²à¹ƒà¸«à¹‰à¸žà¸£à¹‰à¸­à¸¡à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸„à¸£à¸šà¸–à¹‰à¸§à¸™ à¸ à¸²à¸¢à¹ƒà¸™ 24 à¸Šà¸±à¹ˆà¸§à¹‚à¸¡à¸‡",
    time: "à¸ à¸²à¸¢à¹ƒà¸™ 24 à¸Šà¸±à¹ˆà¸§à¹‚à¸¡à¸‡",
  },
  {
    num: 3,
    icon: CheckCircle2,
    title: "à¸¢à¸·à¸™à¸¢à¸±à¸™à¹à¸šà¸šà¹à¸¥à¸°à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™",
    desc: "à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¹à¸¥à¸°à¸¢à¸·à¸™à¸¢à¸±à¸™à¹à¸šà¸šà¸£à¹ˆà¸§à¸¡à¸à¸±à¸™à¸à¹ˆà¸­à¸™à¸œà¸¥à¸´à¸•à¸ˆà¸£à¸´à¸‡à¸—à¸¸à¸à¸„à¸£à¸±à¹‰à¸‡ à¸Šà¸³à¸£à¸°à¸œà¹ˆà¸²à¸™à¹‚à¸­à¸™/à¸žà¸£à¹‰à¸­à¸¡à¹€à¸žà¸¢à¹Œ à¸ªà¸°à¸”à¸§à¸à¸£à¸§à¸”à¹€à¸£à¹‡à¸§",
    time: "à¸‚à¸±à¹‰à¸™à¸•à¸­à¸™à¸‡à¹ˆà¸²à¸¢",
  },
  {
    num: 4,
    icon: Cog,
    title: "à¸œà¸¥à¸´à¸•à¸‡à¸²à¸™",
    desc: "à¸”à¸³à¹€à¸™à¸´à¸™à¸à¸²à¸£à¸œà¸¥à¸´à¸•à¹‚à¸”à¸¢à¸žà¸²à¸£à¹Œà¸—à¹€à¸™à¸­à¸£à¹Œà¸„à¸¸à¸“à¸ à¸²à¸žà¸ªà¸¹à¸‡ à¸¡à¸±à¹ˆà¸™à¹ƒà¸ˆà¹ƒà¸™à¸¡à¸²à¸•à¸£à¸à¸²à¸™ à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸„à¸¸à¸“à¸ à¸²à¸žà¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡à¸—à¸¸à¸à¸„à¸£à¸±à¹‰à¸‡",
    time: "1â€“3 à¸§à¸±à¸™à¸—à¸³à¸à¸²à¸£",
  },
  {
    num: 5,
    icon: PackageCheck,
    title: "à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨",
    desc: "à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸–à¸¶à¸‡à¸¡à¸·à¸­à¸„à¸¸à¸“à¸—à¸¸à¸à¸ˆà¸±à¸‡à¸«à¸§à¸±à¸” à¸žà¸£à¹‰à¸­à¸¡à¹à¸ˆà¹‰à¸‡à¹€à¸¥à¸‚à¸žà¸±à¸ªà¸”à¸¸à¹ƒà¸«à¹‰à¸•à¸´à¸”à¸•à¸²à¸¡à¹„à¸”à¹‰à¸•à¸¥à¸­à¸”à¹€à¸§à¸¥à¸²",
    time: "à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨",
  },
];

export default function Process() {
  return (
    <section
      id="process"
      className="brand-section py-20 px-5 sm:px-6 lg:px-8 lg:py-28"
      style={{ background: "#070A0F" }}
    >
      <div className="max-w-[1380px] mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="section-label" style={{ textAlign: "center" }}>
            WORKFLOW
          </div>
          <h2 className="section-title">à¸‚à¸±à¹‰à¸™à¸•à¸­à¸™à¸à¸²à¸£à¸—à¸³à¸‡à¸²à¸™</h2>
          <p className="section-sub mx-auto text-center">
            à¸‚à¸±à¹‰à¸™à¸•à¸­à¸™à¸—à¸µà¹ˆà¸­à¸­à¸à¹à¸šà¸šà¸¡à¸²à¹€à¸žà¸·à¹ˆà¸­à¸„à¸§à¸²à¸¡à¸ªà¸°à¸”à¸§à¸à¸‚à¸­à¸‡à¸„à¸¸à¸“ à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¹€à¸”à¸´à¸™à¸—à¸²à¸‡
            à¹„à¸¡à¹ˆà¸•à¹‰à¸­à¸‡à¸™à¸±à¸”à¸«à¸¡à¸²à¸¢
          </p>
        </motion.div>

        {/* â”€â”€ Desktop timeline â”€â”€ */}
        <div className="hidden lg:block relative">
          {/* Progress line */}
          <div
            className="absolute top-[52px] left-[10%] right-[10%] h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(255,107,0,0.5) 15%, rgba(255,107,0,0.5) 85%, transparent)",
            }}
          />
          {/* Animated fill line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="absolute top-[52px] left-[10%] right-[10%] h-px origin-left"
            style={{ background: "rgba(255,107,0,0.3)" }}
          />

          <div className="grid grid-cols-5 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="group flex flex-col items-center text-center"
                >
                  {/* Circle icon */}
                  <div
                    className="relative z-10 w-[104px] h-[104px] rounded-full flex flex-col items-center justify-center mb-6 cursor-default transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #1A2233, #141A24)",
                      border: "2px solid rgba(255,107,0,0.45)",
                      boxShadow:
                        "0 0 0 6px rgba(255,107,0,0.06), 0 8px 24px rgba(0,0,0,0.3)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "linear-gradient(135deg, #FF6B00, #CC5500)";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#FF6B00";
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        "0 0 0 8px rgba(255,107,0,0.12), 0 12px 32px rgba(255,107,0,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "linear-gradient(135deg, #1A2233, #141A24)";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(255,107,0,0.45)";
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        "0 0 0 6px rgba(255,107,0,0.06), 0 8px 24px rgba(0,0,0,0.3)";
                    }}
                  >
                    <span
                      className="font-kanit font-bold text-xs mb-1 tracking-widest"
                      style={{ color: "rgba(255,107,0,0.7)" }}
                    >
                      {String(step.num).padStart(2, "0")}
                    </span>
                    <Icon
                      size={28}
                      strokeWidth={1.5}
                      style={{ color: "#FF6B00" }}
                    />
                  </div>

                  {/* Time badge */}
                  <div
                    className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
                    style={{
                      background: "rgba(255,107,0,0.08)",
                      color: "#FF6B00",
                      border: "1px solid rgba(255,107,0,0.15)",
                    }}
                  >
                    {step.time}
                  </div>

                  <h3 className="font-kanit font-bold text-white text-sm mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs leading-6" style={{ color: "#A8B0C0" }}>
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* â”€â”€ Mobile vertical timeline â”€â”€ */}
        <div className="lg:hidden flex flex-col gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex gap-5 items-start"
              >
                {/* Left: icon + connector */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center border-2"
                    style={{
                      background: "linear-gradient(135deg, #1A2233, #141A24)",
                      borderColor: "rgba(255,107,0,0.5)",
                    }}
                  >
                    <Icon size={22} strokeWidth={1.5} style={{ color: "#FF6B00" }} />
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="w-px mt-2"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(255,107,0,0.4), transparent)",
                        minHeight: "48px",
                      }}
                    />
                  )}
                </div>

                {/* Right: content */}
                <div className="pb-8 pt-1 flex-1">
                  <div
                    className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2"
                    style={{
                      background: "rgba(255,107,0,0.08)",
                      color: "#FF6B00",
                      border: "1px solid rgba(255,107,0,0.15)",
                    }}
                  >
                    {step.time}
                  </div>
                  <h3 className="font-kanit font-bold text-white text-base mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#A8B0C0" }}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-10"
        >
          <a
            href="#quote"
            className="btn-primary"
            style={{
              background: "#C2410C",
              boxShadow: "0 4px 24px rgba(255,101,0,0.25)",
            }}
          >
            à¹€à¸£à¸´à¹ˆà¸¡à¸•à¹‰à¸™à¸ªà¸±à¹ˆà¸‡à¸‡à¸²à¸™à¹€à¸¥à¸¢
          </a>
        </motion.div>
      </div>
    </section>
  );
}
