"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const services = [
  {
    image: "/images/services/vinyl.jpg",
    name: "ป้ายไวนิล",
    desc: "พิมพ์ไวนิลคุณภาพสูง สีสดใส ทนแดด ทนฝน เหมาะสำหรับป้ายร้าน ป้ายโฆษณา รองรับทุกขนาดตามต้องการ",
    href: "/services/vinyl-banner",
  },
  {
    image: "/images/services/sticker.jpg",
    name: "Sticker Indoor / Outdoor",
    desc: "สติ๊กเกอร์คุณภาพดี ติดได้ทุกพื้นผิว รองรับทั้ง Indoor และ Outdoor ไดคัทได้ตามรูปแบบที่ต้องการ",
    href: "/services/sticker",
  },
  {
    image: "/images/services/ppboard.jpg",
    name: "PP Board/ Standee",
    desc: "ป้าย PP Board น้ำหนักเบา ประกอบง่าย เหมาะสำหรับงาน Event ป้ายชั่วคราว และห้องนิทรรศการ",
    href: "/services/pp-board",
  },
  {
    image: "/images/services/rollup-xstand.jpg",
    name: "Roll Up / X-stand",
    desc: "พกพาสะดวก ติดตั้งง่าย เหมาะสำหรับงาน Booth สัมมนา และ Presentation ระดับมืออาชีพ",
    href: "/services/roll-up",
  },
  {
    image: "/images/services/product-label-hero.jpg",
    name: "ฉลากสินค้า",
    desc: "ฉลากสินค้า สีสวยสดชัด ติดทนทาน กันน้ำ 100% เนื้อวัสดุเหนียวพิเศษ ไม่ฉีกขาดง่าย",
    href: "/services/label-sticker",
  },
  {
    image: "/images/services/backdrop.jpg",
    name: "Backdrop",
    desc: "Backdrop ขนาดใหญ่สำหรับงานแถลงข่าวและ Event สำคัญ พร้อม Standee ผลิตเสร็จส่งตรงถึงมือ",
    href: "/services/backdrop",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-16 sm:py-24 px-5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="reveal-section">
          <div className="section-label">PRINTING SERVICES</div>
          <h2 className="section-title">บริการของเรา</h2>
          <p className="section-sub">
            ตอบโจทย์ทุกความต้องการด้านงานพิมพ์ ป้ายโฆษณา และสื่อส่งเสริมการขายสำหรับธุรกิจ
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => {
            const cardContent = (
              <>
                <div className="relative w-full h-52 overflow-hidden bg-bg-card2">
                  <Image
                    src={s.image}
                    alt={s.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to bottom, transparent 40%, #141A24 100%)" }}
                  />
                  <div
                    className="absolute top-3 right-3 px-3 py-1 rounded-full text-white text-xs font-semibold backdrop-blur-sm"
                    style={{ background: "rgba(255,107,0,0.85)" }}
                  >
                    {s.name}
                  </div>
                </div>
                <div className="p-6 relative">
                  <div
                    className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "#FF6B00" }}
                  />
                  <h3 className="font-kanit font-bold text-lg text-white mb-2">{s.name}</h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "#A8B0C0" }}>
                    {s.desc}
                  </p>
                  {s.href && (
                    <div
                      className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-200"
                      style={{ color: "#FF6B00" }}
                    >
                      ดูรายละเอียด
                      <ArrowRight size={13} />
                    </div>
                  )}
                </div>
              </>
            );

            const sharedClass =
              "group relative rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 hover:-translate-y-1";
            const sharedStyle = { background: "#141A24", borderColor: "rgba(255,255,255,0.08)" as string };
            const hoverHandlers = {
              onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,0,0.35)";
              },
              onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              },
            };

            return s.href ? (
              <Link key={s.name} href={s.href} className={sharedClass} style={sharedStyle} {...hoverHandlers}>
                {cardContent}
              </Link>
            ) : (
              <div key={s.name} className={sharedClass} style={sharedStyle} {...hoverHandlers}>
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
