"use client";

import {
  BadgeCheck,
  Zap,
  Truck,
  MessageSquare,
  Layers,
  Gift,
} from "lucide-react";

const reasons = [
  {
    icon: BadgeCheck,
    num: "01",
    title: "ประสบการณ์จริง ไม่ใช่แค่คำพูด",
    desc: "ทีมงานที่ผ่านงานพิมพ์หลายร้อยโปรเจกต์ รู้จักปัญหา รู้วิธีแก้ไข และให้คำแนะนำก่อนผลิตจริงทุกครั้ง",
    highlight: "500+ โปรเจกต์ที่ผ่านมา",
  },
  {
    icon: Zap,
    num: "02",
    title: "ตอบไวภายใน 24 ชั่วโมง",
    desc: "เราเข้าใจว่าธุรกิจไม่รอ ทีมงานพร้อมตอบคำถาม ประเมินราคา และให้คำแนะนำภายใน 24 ชั่วโมง",
    highlight: "ตอบทุกวัน ไม่มีวันหยุด",
  },
  {
    icon: Truck,
    num: "03",
    title: "จัดส่งทั่วประเทศ มีระบบติดตาม",
    desc: "ส่งถึงมือคุณทุกจังหวัดในประเทศไทย มีบริการแจ้งเลขพัสดุ ติดตามสินค้าได้ตลอดเวลา",
    highlight: "77 จังหวัด ส่งได้ทั้งหมด",
  },
  {
    icon: Layers,
    num: "04",
    title: "คุณภาพระดับมืออาชีพ",
    desc: "พาร์ทเนอร์การผลิตที่เราคัดสรรมาคุณภาพสูง มาตรฐานสม่ำเสมอทุกชิ้นงาน ทุกออเดอร์",
    highlight: "วัสดุเกรด A ทุกชิ้น",
  },
  {
    icon: MessageSquare,
    num: "05",
    title: "สั่งออนไลน์ ง่ายทุกขั้นตอน",
    desc: "ระบบการสั่งงานที่ออกแบบมาให้ง่ายที่สุด ไม่ต้องเดินทาง ไม่ต้องนัดหมาย ทำได้ทุกที่ทุกเวลา",
    highlight: "ผ่าน LINE ได้เลย",
  },
  {
    icon: Gift,
    num: "06",
    title: "ให้คำแนะนำฟรีก่อนตัดสินใจ",
    desc: "ไม่แน่ใจว่าเลือกวัสดุแบบไหน ขนาดเท่าไหร่ดี ทีมงานยินดีให้คำปรึกษาฟรีก่อนทุกครั้ง",
    highlight: "ฟรี ไม่มีค่าใช้จ่าย",
  },
];

export default function WhyUs() {
  return (
    <section id="about" className="py-24 lg:py-32 px-6 lg:px-8" style={{ background: "#141A24" }}>
      <div className="max-w-7xl mx-auto">

        <div className="reveal-section flex flex-col lg:flex-row lg:items-end gap-6 mb-16">
          <div className="flex-1">
            <div className="section-label">ทำไมต้องเรา</div>
            <h2 className="section-title">
              เหตุผลที่ลูกค้าเลือก
              <br />
              Display Works Media
            </h2>
          </div>
          <p className="section-sub lg:max-w-xs lg:text-right">
            มากกว่า 120 ธุรกิจไว้วางใจให้เราดูแลงานพิมพ์ ด้วยเหตุผลเหล่านี้
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reasons.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.num}
                className="reveal-item group relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{ background: "#0B0F19", borderColor: "rgba(255,255,255,0.07)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,0,0.3)";
                  (e.currentTarget as HTMLElement).style.background = "#0f1520";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.background = "#0B0F19";
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at top left, rgba(255,107,0,0.06) 0%, transparent 60%)" }}
                />
                <div
                  className="absolute top-4 right-6 font-kanit font-extrabold leading-none select-none pointer-events-none"
                  style={{ fontSize: "64px", color: "rgba(255,107,0,0.06)" }}
                >
                  {r.num}
                </div>
                <div
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-105"
                  style={{ background: "rgba(255,107,0,0.1)" }}
                >
                  <Icon size={26} style={{ color: "#FF6B00" }} strokeWidth={1.5} />
                </div>
                <div className="relative">
                  <h3 className="font-kanit font-bold text-white text-lg mb-3 leading-snug">{r.title}</h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "#A8B0C0" }}>{r.desc}</p>
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(255,107,0,0.08)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.15)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B00" }} />
                    {r.highlight}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
