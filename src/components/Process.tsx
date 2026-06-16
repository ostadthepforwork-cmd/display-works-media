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
    title: "ส่งรายละเอียดงาน",
    desc: "แจ้งขนาด จำนวน และรายละเอียดงานผ่าน LINE หรือแบบฟอร์มออนไลน์ ง่าย ไม่ต้องเดินทาง",
    time: "ภายใน 5 นาที",
  },
  {
    num: 2,
    icon: Calculator,
    title: "ประเมินราคา",
    desc: "ทีมงานประเมินราคาและส่งใบเสนอราคาให้พร้อมรายละเอียดครบถ้วน ภายใน 24 ชั่วโมง",
    time: "ภายใน 24 ชั่วโมง",
  },
  {
    num: 3,
    icon: CheckCircle2,
    title: "ยืนยันแบบและชำระเงิน",
    desc: "ตรวจสอบและยืนยันแบบร่วมกันก่อนผลิตจริงทุกครั้ง ชำระผ่านโอน/พร้อมเพย์ สะดวกรวดเร็ว",
    time: "ขั้นตอนง่าย",
  },
  {
    num: 4,
    icon: Cog,
    title: "ผลิตงาน",
    desc: "ดำเนินการผลิตโดยพาร์ทเนอร์คุณภาพสูง มั่นใจในมาตรฐาน ตรวจสอบคุณภาพก่อนส่งทุกครั้ง",
    time: "1–3 วันทำการ",
  },
  {
    num: 5,
    icon: PackageCheck,
    title: "จัดส่งทั่วประเทศ",
    desc: "จัดส่งถึงมือคุณทุกจังหวัด พร้อมแจ้งเลขพัสดุให้ติดตามได้ตลอดเวลา",
    time: "ทั่วประเทศ",
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
          <h2 className="section-title">ขั้นตอนการทำงาน</h2>
          <p className="section-sub mx-auto text-center">
            ขั้นตอนที่ออกแบบมาเพื่อความสะดวกของคุณ ไม่ต้องเดินทาง
            ไม่ต้องนัดหมาย
          </p>
        </motion.div>

        {/* ── Desktop timeline ── */}
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

        {/* ── Mobile vertical timeline ── */}
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
              background: "#FF6500",
              boxShadow: "0 4px 24px rgba(255,101,0,0.25)",
            }}
          >
            เริ่มต้นสั่งงานเลย
          </a>
        </motion.div>
      </div>
    </section>
  );
}
