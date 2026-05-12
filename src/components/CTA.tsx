"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section
      className="py-28 px-6 lg:px-8 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,107,0,0.08) 0%, #0B0F19 50%, rgba(255,107,0,0.04) 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Glow blobs */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,107,0,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="inline-block px-5 py-1.5 rounded-full text-xs font-semibold tracking-[3px] uppercase border mb-8"
            style={{
              background: "rgba(255,107,0,0.1)",
              borderColor: "rgba(255,107,0,0.25)",
              color: "#FF6B00",
            }}
          >
            เริ่มต้นง่ายกว่าที่คิด
          </div>

          <h2
  className="font-kanit font-extrabold leading-tight mb-5"
  style={{ fontSize: "clamp(28px, 3.5vw, 48px)" }}
          >
            งานเสร็จไว มั่นใจในคุณภาพ 
            <br />
            ให้เราช่วยดูแล
          </h2>

          <p className="text-muted text-base mb-10 max-w-md mx-auto">
            ส่งรายละเอียดงานมา เดี๋ยวเราช่วยประเมินให้ฟรี
            <br />
            ไม่มีค่าใช้จ่ายในการขอใบเสนอราคา
          </p>

          <a
            href="#quote"
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-xl font-semibold text-lg text-white transition-all duration-200 hover:-translate-y-1"
            style={{
              background: "#FF6B00",
              boxShadow: "0 8px 40px rgba(255,107,0,0.3)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#FF8C33";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 12px 50px rgba(255,107,0,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#FF6B00";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 8px 40px rgba(255,107,0,0.3)";
            }}
          >
            ขอใบเสนอราคา
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
