import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CmsText } from "@/components/CmsSettingsProvider";
import { ArrowRight, MessageCircle } from "lucide-react";

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
    desc: "สำหรับป้ายหน้าร้าน ป้ายโปรโมชัน และสื่อกลางแจ้งที่ต้องอ่านง่ายจากระยะไกล",
    fit: "เหมาะกับ: ร้านอาหาร คาเฟ่ โปรโมชันหน้าร้าน งานกลางแจ้ง",
    image: "/images/services/vinyl.jpg",
    href: "/services/vinyl-banner",
  },
  {
    title: "Sticker Indoor / Outdoor",
    label: "Sticker Indoor / Outdoor",
    desc: "สำหรับติดกระจก ฉลากสินค้า โลโก้แบรนด์ และงานตกแต่งพื้นผิวทั้งในและนอกอาคาร",
    fit: "เหมาะกับ: หน้าร้าน กระจก บรรจุภัณฑ์ สินค้าแบรนด์",
    image: "/images/services/sticker.jpg",
    href: "/services/sticker",
  },
  {
    title: "PP Board / Standee",
    label: "PP Board / Standee",
    desc: "ป้ายน้ำหนักเบา ใช้วางหน้าร้าน ทำป้ายตั้งพื้น หรือสื่อโปรโมชันชั่วคราว",
    fit: "เหมาะกับ: เมนูสินค้า งานเปิดตัว บูธ และจุดขาย",
    image: "/images/services/ppboard.jpg",
    href: "/services/pp-board",
  },
  {
    title: "Roll Up / X-stand",
    label: "Roll Up / X-stand",
    desc: "สื่อพกพาสำหรับออกบูธ งานสัมมนา และจุดประชาสัมพันธ์ที่ต้องติดตั้งเร็ว",
    fit: "เหมาะกับ: งานแสดงสินค้า อีเวนต์ จุดต้อนรับ และ Roadshow",
    image: "/images/services/rollup-xstand.jpg",
    href: "/services/roll-up",
  },
  {
    title: "ฉลากสินค้า",
    label: "ฉลากสินค้า",
    desc: "สำหรับทำฉลากสินค้า โลโก้แบรนด์ และสติ๊กเกอร์บรรจุภัณฑ์ให้ดูน่าเชื่อถือ",
    fit: "เหมาะกับ: อาหาร เครื่องดื่ม เครื่องสำอาง และสินค้า SME",
    image: "/images/services/product-label-hero.jpg",
    href: "/services/label-sticker",
  },
  {
    title: "Backdrop",
    label: "Backdrop",
    desc: "ฉากหลังสำหรับงานอีเวนต์ เปิดตัวสินค้า จุดถ่ายภาพ และพื้นที่แบรนด์",
    fit: "เหมาะกับ: งานแถลงข่าว บูธ เวที และ Photowall",
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
            fallback="เลือกประเภทงานที่ต้องการ ทีม Display Works Media ช่วยรับบรีฟ แนะนำวัสดุ ตรวจไฟล์ ประเมินราคา ประสานการผลิต และจัดส่งให้เหมาะกับการใช้งานจริง"
            as="p"
            className="mt-5 max-w-3xl text-base leading-relaxed text-[#A7B0C0] lg:text-lg"
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://lin.ee/O0nPl03"
              target="_blank"
              rel="noopener noreferrer"
              className="home-btn home-btn-line fx-button h-12 px-6"
            >
              ปรึกษาทาง LINE <MessageCircle size={16} />
            </a>
            <Link href="/#quote" className="home-btn home-btn-orange fx-button h-12 px-6">
              ส่งข้อมูลขอราคา <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1380px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className="service-choice-card marketing-proof-card group overflow-hidden"
            >
              <div className="service-choice-media relative h-56 overflow-hidden bg-[#141A24]">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10151D] via-[#10151D]/25 to-transparent" />
                {service.label && (
                  <span className="portfolio-card-category">
                    {service.label}
                  </span>
                )}
              </div>
              <div className="p-6">
                <h2 className="font-kanit text-xl font-bold text-white transition-colors group-hover:text-[#FF6500]">
                  {service.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#A7B0C0]">{service.desc}</p>
                <p className="mt-4 rounded-md border border-[#FF6500]/25 bg-[#FF6500]/5 px-3 py-2 text-xs leading-6 text-[#D5DBD8]">
                  {service.fit}
                </p>
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
