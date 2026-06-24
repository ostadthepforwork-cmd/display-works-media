import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Images, PackageCheck, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CmsText } from "@/components/CmsSettingsProvider";
import FloatingButtons from "@/components/FloatingButtons";
import SchemaOrg from "@/components/SchemaOrg";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา | Display Works Media",
  description:
    "Display Works Media ผู้ช่วยด้านงานพิมพ์ ป้ายโฆษณา และสื่อส่งเสริมการขายครบวงจร ให้คำปรึกษา ตรวจไฟล์ แนะนำวัสดุ ประสานการผลิต และจัดส่งทั่วประเทศไทย",
  alternates: { canonical: "https://displayworksmedia.com/about" },
  openGraph: {
    title: "เกี่ยวกับเรา | Display Works Media",
    description:
      "Marketing Production Partner สำหรับงานป้าย งานพิมพ์ และสื่อโฆษณาของธุรกิจ",
    url: "https://displayworksmedia.com/about",
  },
};

const trustHighlights = [
  "ปรึกษาและประเมินราคาฟรี",
  "ประสานงานรวดเร็ว จัดส่งทั่วประเทศ",
  "ดูแลตั้งแต่ไอเดียจนถึงงานพร้อมใช้งาน",
];

const proofCards = [
  {
    icon: Images,
    title: "งานหลากหลายประเภท",
    desc: "ช่วยดูแลทั้งป้ายไวนิล สติ๊กเกอร์ ฉลากสินค้า PP Board Roll Up Backdrop และสื่อสำหรับงานอีเวนต์",
  },
  {
    icon: PackageCheck,
    title: "ตรวจความพร้อมก่อนส่งผลิต",
    desc: "ช่วยเช็กไฟล์ ขนาด วัสดุ และรายละเอียดสำคัญ เพื่อลดความเสี่ยงงานผิดขนาด ผิดวัสดุ หรือไฟล์ไม่พร้อม",
  },
  {
    icon: Truck,
    title: "ออนไลน์ 100%",
    desc: "สอบถาม ส่งไฟล์ ยืนยันแบบ และจัดส่งงานถึงลูกค้าทั่วประเทศไทยได้โดยไม่ต้องเดินทาง",
  },
];

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": "https://displayworksmedia.com/about#webpage",
    url: "https://displayworksmedia.com/about",
    name: "เกี่ยวกับเรา | Display Works Media",
    description:
      "Display Works Media คือ Marketing Production Partner ด้านงานพิมพ์ ป้ายโฆษณา และสื่อส่งเสริมการขาย สำหรับธุรกิจ ร้านค้า SME และองค์กร",
    isPartOf: { "@id": "https://displayworksmedia.com/#website" },
    about: { "@id": "https://displayworksmedia.com/#business" },
  };

  return (
    <>
      <SchemaOrg extra={aboutSchema} />
      <main className="brand-interior min-h-screen bg-[#050806] text-white font-['Prompt',sans-serif]">
        <Navbar />

        <section className="relative overflow-hidden px-5 pt-28 pb-20 lg:pt-32 lg:pb-24">
          <div
            className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(255,122,0,0.08), transparent)" }}
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.92fr]">
            <div>
              <CmsText path="about.eyebrow" fallback="เกี่ยวกับเรา" as="div" className="section-label" />
              <CmsText
                path="about.title"
                fallback="ผู้ช่วยเปลี่ยนไอเดียธุรกิจให้เป็นสื่อโฆษณาที่พร้อมใช้งานจริง"
                as="h1"
                className="font-['Kanit'] text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl"
              />
              <CmsText
                path="about.subtitle"
                fallback="ให้คำปรึกษา ตรวจไฟล์ แนะนำวัสดุ ประสานการผลิต และจัดส่งสื่อโฆษณา เพื่อช่วยให้ธุรกิจของคุณโดดเด่นและน่าจดจำมากยิ่งขึ้น"
                as="p"
                className="mt-6 max-w-2xl text-base leading-8 text-[#A7B0C0] sm:text-lg"
              />

              <div className="mt-8 space-y-4 text-sm leading-7 text-[#A7B0C0] sm:text-base">
                <p>
                  Display Works Media คือผู้ช่วยด้านงานพิมพ์ ป้ายโฆษณา และสื่อส่งเสริมการขายครบวงจร สำหรับธุรกิจ ร้านค้า SME และองค์กรที่ต้องการสื่อคุณภาพ พร้อมบริการที่สะดวก รวดเร็ว และดูแลโดยทีมงานมืออาชีพ
                </p>
                <p>
                  เราเชื่อว่าสื่อโฆษณาที่ดีไม่ใช่เพียงแค่สวยงาม แต่ต้องช่วยให้ธุรกิจสื่อสารได้ชัดเจน สร้างความน่าเชื่อถือ และเข้าถึงลูกค้าได้อย่างมีประสิทธิภาพ
                </p>
                <p>
                  ตั้งแต่งานป้ายไวนิล สติ๊กเกอร์ ฉลากสินค้า PP Board Roll Up ไปจนถึง Backdrop และสื่อสำหรับงานอีเวนต์ เราพร้อมช่วยดูแลตั้งแต่การรับบรีฟ การเตรียมไฟล์ การแนะนำวัสดุ การประสานการผลิต ไปจนถึงการจัดส่งทั่วประเทศ
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {trustHighlights.map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white">
                    <CheckCircle2 size={17} className="mt-0.5 flex-shrink-0 text-[#FF7A00]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF7A00] px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                >
                  ติดต่อเรา <ArrowRight size={18} />
                </Link>
                <Link
                  href="/portfolio"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-sm font-bold text-white transition hover:border-white/35 hover:bg-white/5"
                >
                  ดูผลงาน
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  "/images/portfolio/work-01.webp",
                  "/images/portfolio/sticker-1.jpg",
                  "/images/portfolio/ppboard-1.png",
                  "/images/portfolio/backdrop-1.png",
                ].map((src, index) => (
                  <div
                    key={src}
                    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1310] ${index === 1 ? "mt-8" : ""} ${index === 2 ? "-mt-8" : ""}`}
                    style={{ aspectRatio: "1 / 1" }}
                  >
                    <Image src={src} alt="ตัวอย่างผลงาน Display Works Media" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 md:grid-cols-3">
              {proofCards.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-[#0E1310] p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF7A00]/10 text-[#FF7A00]">
                    <Icon size={24} />
                  </div>
                  <h2 className="font-['Kanit'] text-xl font-bold text-white">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#A7B0C0]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
        <FloatingButtons />
      </main>
    </>
  );
}
