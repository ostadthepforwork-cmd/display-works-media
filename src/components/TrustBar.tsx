"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Zap, UserCheck, Truck } from "lucide-react";

const trustFeatures = [
  {
    icon: ShoppingCart,
    main: "สั่งออนไลน์ 100%",
    sub: "ไม่ต้องเดินทาง สะดวกทุกที่",
  },
  {
    icon: Zap,
    main: "งานไว ตรงเวลา",
    sub: "ตามที่ตกลงไว้ทุกครั้ง",
  },
  {
    icon: UserCheck,
    main: "ดูแลเคสส่วนตัว",
    sub: "มี Project Manager ดูแลตลอด",
  },
  {
    icon: Truck,
    main: "จัดส่งทั่วประเทศ",
    sub: "พร้อมแจ้งเลขพัสดุทุกออเดอร์",
  },
];

const bigStats = [
  { num: "500+", label: "งานที่ส่งมอบแล้ว" },
  { num: "120+", label: "ลูกค้าที่ไว้วางใจ" },
  { num: "5+", label: "ปีประสบการณ์" },
  { num: "100%", label: "พึงพอใจในคุณภาพ" },
];

export default function TrustBar() {
  return (
    <section
      style={{
        background: "#141A24",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Big Stats Row */}
      <div
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        className="py-10"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
            {bigStats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="text-center lg:py-2 relative"
              >
                {/* Divider between items (desktop) */}
                {i > 0 && (
                  <div
                    className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-10"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  />
                )}
                <div
                  className="font-kanit font-extrabold"
                  style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#FF6B00" }}
                >
                  {s.num}
                </div>
                <div
                  className="text-sm mt-1"
                  style={{ color: "#A8B0C0" }}
                >
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Features Row */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-center gap-6 lg:gap-12">
            {trustFeatures.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex items-center gap-4"
                >
                  {i > 0 && (
                    <div
                      className="hidden lg:block w-px h-10 self-center"
                      style={{ background: "rgba(255,255,255,0.07)" }}
                    />
                  )}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,107,0,0.1)" }}
                    >
                      <Icon size={22} style={{ color: "#FF6B00" }} />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-white leading-tight">
                        {item.main}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "#A8B0C0" }}
                      >
                        {item.sub}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
