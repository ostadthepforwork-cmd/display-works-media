"use client";

import { motion } from "framer-motion";
import { FileText, Calculator, CheckCircle2, Cog, PackageCheck } from "lucide-react";

const steps = [
  {
    num: 1,
    icon: FileText,
    title: "ส่งรายละเอียดงาน",
    desc: "แจ้งขนาด จำนวน และรายละเอียดงานที่ต้องการ ผ่าน LINE หรือแบบฟอร์มออนไลน์",
  },
  {
    num: 2,
    icon: Calculator,
    title: "ประเมินราคา",
    desc: "ทีมงานประเมินราคา และส่งใบเสนอราคา ภายใน 24 ชั่วโมง",
  },
  {
    num: 3,
    icon: CheckCircle2,
    title: "ยืนยันแบบ",
    desc: "ตรวจสอบและยืนยันแบบร่วมกัน ก่อนส่งผลิตจริงทุกครั้ง",
  },
  {
    num: 4,
    icon: Cog,
    title: "ผลิตงาน",
    desc: "ดำเนินการผลิตโดยพาร์ทเนอร์คุณภาพ มั่นใจในมาตรฐาน",
  },
  {
    num: 5,
    icon: PackageCheck,
    title: "จัดส่งทั่วประเทศ",
    desc: "จัดส่งถึงมือคุณทุกจังหวัด พร้อมแจ้งเลขพัสดุติดตามได้",
  },
];

export default function Process() {
  return (
    <section id="process" className="py-24 px-6 lg:px-8" style={{ background: "#141A24" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="section-label" style={{ textAlign: "center" }}>ขั้นตอนการทำงาน</div>
          <h2 className="section-title">ง่าย ครบ จบใน 5 ขั้นตอน</h2>
          <p className="section-sub mx-auto text-center">
            ขั้นตอนการสั่งพิมพ์ที่ออกแบบมาเพื่อความสะดวกของคุณ
          </p>
        </motion.div>

        {/* Desktop */}
        <div className="hidden lg:block relative">

          {/* Connector line */}
          <div className="absolute top-[52px] left-[9%] right-[9%] h-px"
            style={{ background: "linear-gradient(to right, transparent, rgba(255,107,0,0.4), rgba(255,107,0,0.4), transparent)" }}
          />

          {/* Dashed dots on line */}
          <div className="absolute top-[48px] left-[9%] right-[9%] flex justify-between px-[10%]">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: "rgba(255,107,0,0.3)" }} />
            ))}
          </div>

          <div className="grid grid-cols-5 gap-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group flex flex-col items-center text-center"
                >
                  {/* Circle */}
                  <div
                    className="relative z-10 w-[104px] h-[104px] rounded-full flex flex-col items-center justify-center mb-6 transition-all duration-300 group-hover:scale-105 cursor-default"
                    style={{
                      background: "linear-gradient(135deg, #1A2233, #141A24)",
                      border: "2px solid rgba(255,107,0,0.5)",
                      boxShadow: "0 0 0 6px rgba(255,107,0,0.06), 0 8px 24px rgba(0,0,0,0.3)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #FF6B00, #CC5500)";
                      (e.currentTarget as HTMLElement).style.borderColor = "#FF6B00";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 8px rgba(255,107,0,0.12), 0 12px 32px rgba(255,107,0,0.25)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #1A2233, #141A24)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,0,0.5)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 6px rgba(255,107,0,0.06), 0 8px 24px rgba(0,0,0,0.3)";
                    }}
                  >
                    {/* Step number */}
                    <span
                      className="font-kanit font-bold text-xs mb-1 tracking-widest"
                      style={{ color: "rgba(255,107,0,0.7)" }}
                    >
                      {String(step.num).padStart(2, "0")}
                    </span>
                    {/* Icon */}
                    <Icon
                      size={28}
                      strokeWidth={1.5}
                      style={{ color: "#FF6B00" }}
                      className="transition-colors duration-300"
                    />
                  </div>

                  <h3 className="font-kanit font-bold text-white text-sm mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#A8B0C0" }}>
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical */}
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
                <div className="flex flex-col items-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                    style={{
                      background: "linear-gradient(135deg, #1A2233, #141A24)",
                      borderColor: "rgba(255,107,0,0.5)",
                    }}
                  >
                    <Icon size={22} strokeWidth={1.5} style={{ color: "#FF6B00" }} />
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="w-px flex-1 mt-2"
                      style={{
                        background: "linear-gradient(to bottom, rgba(255,107,0,0.4), transparent)",
                        minHeight: "40px",
                      }}
                    />
                  )}
                </div>
                <div className="pb-8 pt-1">
                  <div className="text-xs font-bold mb-1 tracking-widest" style={{ color: "rgba(255,107,0,0.7)" }}>
                    {String(step.num).padStart(2, "0")}
                  </div>
                  <h3 className="font-kanit font-bold text-white text-base mb-1">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#A8B0C0" }}>{step.desc}</p>
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
          className="text-center mt-16"
        >
          <a
            href="#quote"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "#FF6B00", boxShadow: "0 4px 24px rgba(255,107,0,0.25)" }}
          >
            เริ่มต้นสั่งงานเลย
          </a>
        </motion.div>

      </div>
    </section>
  );
}
