"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, MessageCircle, Phone } from "lucide-react";

const faqs = [
  {
    q: "à¸ªà¸±à¹ˆà¸‡à¸‚à¸±à¹‰à¸™à¸•à¹ˆà¸³à¹€à¸—à¹ˆà¸²à¹„à¸«à¸£à¹ˆ?",
    a: "à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¸±à¹‰à¸™à¸•à¹ˆà¸³à¹ƒà¸™à¸«à¸¥à¸²à¸¢à¸£à¸²à¸¢à¸à¸²à¸£ à¸ªà¸²à¸¡à¸²à¸£à¸–à¸ªà¸±à¹ˆà¸‡ 1 à¸Šà¸´à¹‰à¸™à¹„à¸”à¹‰à¹€à¸¥à¸¢ à¸šà¸²à¸‡à¸£à¸²à¸¢à¸à¸²à¸£à¸­à¸²à¸ˆà¸¡à¸µà¸‚à¸±à¹‰à¸™à¸•à¹ˆà¸³à¸•à¸²à¸¡à¹€à¸‡à¸·à¹ˆà¸­à¸™à¹„à¸‚à¸à¸²à¸£à¸œà¸¥à¸´à¸• à¸—à¸µà¸¡à¸‡à¸²à¸™à¸ˆà¸°à¹à¸ˆà¹‰à¸‡à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¹€à¸¡à¸·à¹ˆà¸­à¸£à¸±à¸šà¸‡à¸²à¸™",
  },
  {
    q: "à¹ƒà¸Šà¹‰à¹€à¸§à¸¥à¸²à¸œà¸¥à¸´à¸•à¸™à¸²à¸™à¹€à¸—à¹ˆà¸²à¹„à¸«à¸£à¹ˆ?",
    a: "à¸‚à¸¶à¹‰à¸™à¸­à¸¢à¸¹à¹ˆà¸à¸±à¸šà¸›à¸£à¸°à¹€à¸ à¸—à¸‡à¸²à¸™à¹à¸¥à¸°à¸ˆà¸³à¸™à¸§à¸™ à¹‚à¸”à¸¢à¸›à¸à¸•à¸´ 1â€“3 à¸§à¸±à¸™à¸—à¸³à¸à¸²à¸£ à¸‡à¸²à¸™à¸”à¹ˆà¸§à¸™à¸ªà¸²à¸¡à¸²à¸£à¸–à¹à¸ˆà¹‰à¸‡à¹„à¸”à¹‰à¹€à¸žà¸·à¹ˆà¸­à¸”à¸³à¹€à¸™à¸´à¸™à¸à¸²à¸£à¹€à¸£à¹ˆà¸‡à¸”à¹ˆà¸§à¸™ à¸­à¸²à¸ˆà¸¡à¸µà¸„à¹ˆà¸²à¸šà¸£à¸´à¸à¸²à¸£à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡",
  },
  {
    q: "à¸•à¹‰à¸­à¸‡à¸ªà¹ˆà¸‡à¹„à¸Ÿà¸¥à¹Œà¸‡à¸²à¸™à¸­à¸°à¹„à¸£à¸šà¹‰à¸²à¸‡?",
    a: "à¸£à¸­à¸‡à¸£à¸±à¸šà¹„à¸Ÿà¸¥à¹Œ AI, PDF, PSD à¸„à¸§à¸²à¸¡à¸¥à¸°à¹€à¸­à¸µà¸¢à¸” 150â€“300 dpi à¸‚à¸¶à¹‰à¸™à¹„à¸› à¸«à¸²à¸à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¹„à¸Ÿà¸¥à¹Œ à¸—à¸µà¸¡à¸‡à¸²à¸™à¸ªà¸²à¸¡à¸²à¸£à¸–à¸Šà¹ˆà¸§à¸¢à¸­à¸­à¸à¹à¸šà¸šà¹„à¸”à¹‰ (à¸¡à¸µà¸„à¹ˆà¸²à¸šà¸£à¸´à¸à¸²à¸£à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡)",
  },
  {
    q: "à¸Šà¸³à¸£à¸°à¹€à¸‡à¸´à¸™à¸­à¸¢à¹ˆà¸²à¸‡à¹„à¸£?",
    a: "à¹‚à¸­à¸™à¹€à¸‡à¸´à¸™à¸œà¹ˆà¸²à¸™à¸˜à¸™à¸²à¸„à¸²à¸£, à¸žà¸£à¹‰à¸­à¸¡à¹€à¸žà¸¢à¹Œ à¸«à¸£à¸·à¸­ QR Code à¸Šà¸³à¸£à¸°à¹€à¸•à¹‡à¸¡à¸ˆà¸³à¸™à¸§à¸™à¸à¹ˆà¸­à¸™à¸œà¸¥à¸´à¸• à¸«à¸£à¸·à¸­à¸­à¸²à¸ˆà¸¡à¸µà¹€à¸‡à¸·à¹ˆà¸­à¸™à¹„à¸‚à¸žà¸´à¹€à¸¨à¸©à¸•à¸²à¸¡à¸à¸²à¸£à¸•à¸à¸¥à¸‡",
  },
  {
    q: "à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸—à¸±à¹ˆà¸§à¸›à¸£à¸°à¹€à¸—à¸¨à¹„à¸”à¹‰à¸ˆà¸£à¸´à¸‡à¹„à¸«à¸¡?",
    a: "à¹ƒà¸Šà¹ˆà¸„à¸£à¸±à¸š à¹€à¸£à¸²à¸ˆà¸±à¸”à¸ªà¹ˆà¸‡à¸—à¸¸à¸à¸ˆà¸±à¸‡à¸«à¸§à¸±à¸”à¹ƒà¸™à¸›à¸£à¸°à¹€à¸—à¸¨à¹„à¸—à¸¢ à¸œà¹ˆà¸²à¸™à¸‚à¸™à¸ªà¹ˆà¸‡à¹€à¸­à¸à¸Šà¸™à¸—à¸µà¹ˆà¹€à¸Šà¸·à¹ˆà¸­à¸–à¸·à¸­à¹„à¸”à¹‰ à¸žà¸£à¹‰à¸­à¸¡à¹à¸ˆà¹‰à¸‡à¹€à¸¥à¸‚à¸žà¸±à¸ªà¸”à¸¸à¸—à¸¸à¸à¸­à¸­à¹€à¸”à¸­à¸£à¹Œ",
  },
  {
    q: "à¸–à¹‰à¸²à¸‡à¸²à¸™à¸­à¸­à¸à¸¡à¸²à¹„à¸¡à¹ˆà¸•à¸£à¸‡à¹à¸šà¸š à¸—à¸³à¸­à¸¢à¹ˆà¸²à¸‡à¹„à¸£?",
    a: "à¹€à¸£à¸²à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸„à¸¸à¸“à¸ à¸²à¸žà¸à¹ˆà¸­à¸™à¸ªà¹ˆà¸‡à¸—à¸¸à¸à¸„à¸£à¸±à¹‰à¸‡ à¸«à¸²à¸à¸‡à¸²à¸™à¹„à¸¡à¹ˆà¸•à¸£à¸‡à¸•à¸²à¸¡à¸—à¸µà¹ˆà¸•à¸à¸¥à¸‡à¹„à¸§à¹‰ à¸¢à¸´à¸™à¸”à¸µà¸œà¸¥à¸´à¸•à¹ƒà¸«à¸¡à¹ˆà¹ƒà¸«à¹‰à¹‚à¸”à¸¢à¹„à¸¡à¹ˆà¸¡à¸µà¸„à¹ˆà¸²à¹ƒà¸Šà¹‰à¸ˆà¹ˆà¸²à¸¢à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="brand-section py-20 lg:py-24 px-6 lg:px-8"
      style={{ background: "#070a08" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">

          {/* â”€â”€ Left: sticky header â”€â”€ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 lg:sticky lg:top-28"
          >
            <div className="section-label">HELP CENTER</div>
            <h2 className="section-title mb-5">FAQ</h2>
            <p className="section-sub mb-8">
              à¸«à¸²à¸à¸¡à¸µà¸„à¸³à¸–à¸²à¸¡à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡ à¸•à¸´à¸”à¸•à¹ˆà¸­à¹€à¸£à¸²à¹„à¸”à¹‰à¹‚à¸”à¸¢à¸•à¸£à¸‡
              à¸—à¸µà¸¡à¸‡à¸²à¸™à¸žà¸£à¹‰à¸­à¸¡à¸Šà¹ˆà¸§à¸¢à¹€à¸«à¸¥à¸·à¸­à¸—à¸¸à¸à¸§à¸±à¸™
            </p>

            {/* Contact options */}
            <div className="flex flex-col gap-3">
              <a
                href="https://lin.ee/O0nPl03"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "#047857",
                  boxShadow: "0 4px 16px rgba(4,120,87,0.28)",
                }}
              >
                <MessageCircle size={18} />
                à¸•à¸´à¸”à¸•à¹ˆà¸­à¸œà¹ˆà¸²à¸™ LINE
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

          {/* â”€â”€ Right: accordion â”€â”€ */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="marketing-proof-card overflow-hidden rounded-2xl border transition-all duration-300"
                style={{
                  background: open === i ? "rgba(255,101,0,0.045)" : "#0E1310",
                  borderColor:
                    open === i
                      ? "rgba(255,107,0,0.3)"
                      : "rgba(255,255,255,0.07)",
                }}
              >
                {/* Question */}
                <button
                  type="button"
                  aria-expanded={open === i}
                  aria-controls={`faq-answer-${i}`}
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
                      id={`faq-answer-${i}`}
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
