"use client";

import { motion } from "framer-motion";
import Image from "next/image";

// เพิ่มรูปได้เรื่อยๆ ครับ
const portfolioImages = [
  "/images/portfolio/work-01.webp",
  "/images/portfolio/work-02.webp",
  "/images/portfolio/work-03.webp",
  "/images/portfolio/work-04.webp",
  "/images/portfolio/work-05.webp",
  "/images/portfolio/work-06.webp",
  "/images/portfolio/work-07.webp",
  "/images/portfolio/work-08.webp",
  "/images/portfolio/work-09.webp",
];

export default function Portfolio() {
  return (
    <section
      id="portfolio"
      className="py-24 px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #0B0F19 0%, #0d1220 100%)" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <div className="section-label">ผลงานของเรา</div>
          <h2 className="section-title">
            งานจริงจากลูกค้า
            <br />
            ที่ไว้วางใจเรา
          </h2>
          <p className="section-sub">
            รวมผลงานจริงจากลูกค้าที่เราดูแลมาอย่างต่อเนื่อง
          </p>
        </motion.div>

        {/* Square Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {portfolioImages.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-xl"
              style={{ aspectRatio: "1 / 1" }}
            >
              <Image
                src={src}
                alt={`ผลงาน ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Hover overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center"
                style={{ background: "rgba(255,107,0,0.15)", backdropFilter: "blur(2px)" }}
              >
                <div
                  className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ background: "rgba(255,107,0,0.8)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                </div>
              </div>

              {/* Subtle bottom gradient */}
              <div
                className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }}
              />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <a
            href="#quote"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: "#FF6B00",
              boxShadow: "0 4px 24px rgba(255,107,0,0.25)",
            }}
          >
            สนใจงานแบบนี้? ขอใบเสนอราคาเลย
          </a>
        </motion.div>

      </div>
    </section>
  );
}
