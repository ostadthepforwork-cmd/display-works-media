import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CmsText } from "@/components/CmsSettingsProvider";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "บริการงานป้ายและงานพิมพ์ | Display Works Media",
  description:
    "บริการงานป้ายและงานพิมพ์สำหรับธุรกิจ ป้ายไวนิล Sticker Indoor/Outdoor PP Board Roll Up ฉลากสินค้า และ Backdrop",
  alternates: { canonical: "https://displayworksmedia.com/services" },
};

const services = [
  {
    title: "ป้ายไวนิล",
    label: "",
    desc: "พิมพ์ไวนิลคุณภาพสูง สีสดใส ทนแดด ทนฝน เหมาะสำหรับป้ายร้าน ป้ายโฆษณา รองรับทุกขนาดตามต้องการ",
    image: "/images/services/vinyl.jpg",
    href: "/services/vinyl-banner",
  },
  {
    title: "Sticker Indoor / Outdoor",
    label: "Sticker Indoor / Outdoor",
    desc: "สติ๊กเกอร์คุณภาพดี ติดได้ทุกพื้นผิว รองรับทั้ง Indoor และ Outdoor ไดคัทได้ตามรูปแบบที่ต้องการ",
    image: "/images/services/sticker.jpg",
    href: "/services/sticker",
  },
  {
    title: "PP Board / Standee",
    label: "PP Board / Standee",
    desc: "ป้าย PP Board น้ำหนักเบา ประกอบง่าย เหมาะสำหรับงาน Event ป้ายชั่วคราว และห้องนิทรรศการ",
    image: "/images/services/ppboard.jpg",
    href: "/services/pp-board",
  },
  {
    title: "Roll Up / X-stand",
    label: "Roll Up / X-stand",
    desc: "พกพาสะดวก ติดตั้งง่าย เหมาะสำหรับงาน Booth สัมมนา และ Presentation ระดับมืออาชีพ",
    image: "/images/services/rollup-xstand.jpg",
    href: "/services/roll-up",
  },
  {
    title: "ฉลากสินค้า",
    label: "ฉลากสินค้า",
    desc: "ฉลากสินค้า สีสวยสดชัด ติดทนนาน กันน้ำ 100% เนื้อวัสดุเหนียวพิเศษ ไม่มีตกง่าย",
    image: "/images/services/product-label-hero.jpg",
    href: "/services/label-sticker",
  },
  {
    title: "Backdrop",
    label: "Backdrop",
    desc: "Backdrop ขนาดใหญ่สำหรับงานแถลงข่าวและ Event สำคัญ พร้อม Standee ผลิตเสร็จตรงถึงมือ",
    image: "/images/services/backdrop.jpg",
    href: "/services/backdrop",
  },
];

export default function ServicesHubPage() {
  return (
    <main className="brand-interior min-h-screen bg-[#070A0F] text-white" style={{ fontFamily: "'Prompt','Sarabun',sans-serif" }}>
      <Navbar />

      <section className="brand-section px-5 pb-12 pt-[132px] sm:px-6 lg:px-8 lg:pb-16">
        <div className="mx-auto max-w-[1380px]">
          <CmsText path="services.eyebrow" fallback="OUR SERVICES" as="div" className="section-label w-fit" />
          <CmsText
            path="services.title"
            fallback="บริการงานป้ายและงานพิมพ์สำหรับธุรกิจ"
            as="h1"
            className="mt-5 max-w-4xl font-kanit text-4xl font-extrabold leading-tight text-white lg:text-6xl"
          />
          <CmsText
            path="services.subtitle"
            fallback="เลือกประเภทงานที่ต้องการ ทีม Display Works Media ช่วยแนะนำวัสดุ ตรวจไฟล์ ประเมินราคา และดูแลการผลิตให้เหมาะกับการใช้งานจริง"
            as="p"
            className="mt-5 max-w-3xl text-base leading-relaxed text-[#A7B0C0] lg:text-lg"
          />
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1380px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className="group overflow-hidden rounded-lg border border-white/10 bg-[#10151D] transition-all hover:-translate-y-1 hover:border-[#FF6500]/40"
            >
              <div className="relative h-56 overflow-hidden bg-[#141A24]">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10151D] via-[#10151D]/25 to-transparent" />
                {service.label && (
                  <span className="absolute right-4 top-4 rounded-sm bg-[#FF6500] px-3 py-1 text-xs font-bold text-white">
                    {service.label}
                  </span>
                )}
              </div>
              <div className="p-6">
                <h2 className="font-kanit text-xl font-bold text-white transition-colors group-hover:text-[#FF6500]">
                  {service.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#A7B0C0]">{service.desc}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#FF6500]">
                  ดูรายละเอียด <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
