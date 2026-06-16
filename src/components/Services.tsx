"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const defaultServices = [
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

const imageByHref: Record<string, string> = {
  "/services/vinyl-banner": "/images/services/vinyl.jpg",
  "/services/sticker": "/images/services/sticker.jpg",
  "/services/label-sticker": "/images/services/product-label-hero.jpg",
  "/services/pp-board": "/images/services/ppboard.jpg",
  "/services/standee": "/images/services/ppboard.jpg",
  "/services/roll-up": "/images/services/rollup-xstand.jpg",
  "/services/x-stand": "/images/services/rollup-xstand.jpg",
  "/services/backdrop": "/images/services/backdrop.jpg",
};

type ServiceItem = {
  id?: string;
  image?: string;
  img?: string;
  name?: string;
  desc?: string;
  url?: string;
  href?: string;
};

function normalizeServices(items?: ServiceItem[]) {
  if (!Array.isArray(items) || items.length === 0) return defaultServices;

  return items
    .filter((item) => item?.name)
    .map((item) => {
      const href = item.href || item.url || "";
      return {
        image: item.image || item.img || imageByHref[href] || "/images/services/vinyl.jpg",
        name: item.name || "",
        desc: item.desc || "",
        href,
      };
    });
}

export default function Services({ items }: { items?: ServiceItem[] }) {
  const services = normalizeServices(items);

  return (
    <section id="services" className="brand-section py-20 sm:py-28 px-5 sm:px-6 lg:px-8 bg-[#070A0F]">
      <div className="max-w-[1380px] mx-auto">
        <div className="reveal-section">
          <div className="section-label">OUR SERVICES</div>
          <h2 className="section-title">บริการของเรา</h2>
          <p className="section-sub">
            ตอบโจทย์ทุกความต้องการด้านงานพิมพ์ ป้ายโฆษณา และสื่อส่งเสริมการขายสำหรับธุรกิจ
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => {
            const cardContent = (
              <>
                <div className="relative w-full aspect-[8/5] overflow-hidden bg-bg-card2">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to bottom, transparent 40%, #141A24 100%)" }}
                  />
                  <div
                    className="absolute top-3 right-3 px-3 py-1 rounded-sm text-white text-xs font-semibold backdrop-blur-sm"
                    style={{ background: "rgba(255,101,0,0.9)" }}
                  >
                    {service.name}
                  </div>
                </div>
                <div className="p-6 lg:p-7 relative">
                  <div
                    className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "#FF6500" }}
                  />
                  <h3 className="font-kanit font-bold text-lg text-white mb-2">{service.name}</h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "#A8B0C0" }}>
                    {service.desc}
                  </p>
                  {service.href && (
                    <div
                      className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-200"
                      style={{ color: "#FF6500" }}
                    >
                      ดูรายละเอียด
                      <ArrowRight size={13} />
                    </div>
                  )}
                </div>
              </>
            );

            const sharedClass =
              "group relative rounded-lg overflow-hidden cursor-pointer border transition-all duration-300 hover:-translate-y-1";
            const sharedStyle = { background: "#10151D", borderColor: "rgba(255,255,255,0.09)" as string };
            const hoverHandlers = {
              onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,101,0,0.42)";
              },
              onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              },
            };

            return service.href ? (
              <Link key={`${service.name}-${service.href}`} href={service.href} className={sharedClass} style={sharedStyle} {...hoverHandlers}>
                {cardContent}
              </Link>
            ) : (
              <div key={service.name} className={sharedClass} style={sharedStyle} {...hoverHandlers}>
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
