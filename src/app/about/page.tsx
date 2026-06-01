import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import SchemaOrg from "@/components/SchemaOrg";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา | Display Works Media",
  description:
    "Display Works Media คือบริการสั่งพิมพ์ป้ายและสื่อสิ่งพิมพ์ออนไลน์ครบวงจร รับทำแบ็คดรอปผ้า ป้ายไวนิล Roll Up Stand สติ๊กเกอร์ PP Board และฉลากสินค้า ส่งทั่วประเทศ",
  alternates: { canonical: "https://displayworksmedia.com/about" },
  openGraph: {
    title: "เกี่ยวกับเรา | Display Works Media",
    description: "รู้จัก Display Works Media — ผู้ให้บริการงานพิมพ์ป้ายออนไลน์ครบวงจรในประเทศไทย",
    url: "https://displayworksmedia.com/about",
  },
};

const stats = [
  { num: "1,000+", label: "ลูกค้าทั่วประเทศ" },
  { num: "6", label: "บริการครบวงจร" },
  { num: "1–3", label: "วันทำการผลิต" },
  { num: "4.9★", label: "คะแนนความพึงพอใจ" },
];

const values = [
  {
    icon: "🎯",
    title: "คุณภาพงานพิมพ์",
    desc: "เครื่องพิมพ์ระดับมืออาชีพ ความละเอียดสูง สีสดคมชัด ตรงตามแบบที่ลูกค้าต้องการทุกชิ้น",
  },
  {
    icon: "⚡",
    title: "ส่งตรงเวลา",
    desc: "ผลิต 1–3 วันทำการ จัดส่งทุกจังหวัดทั่วประเทศไทย แจ้งเลขพัสดุทุกออเดอร์",
  },
  {
    icon: "💼",
    title: "บริการครบจบ",
    desc: "รับไฟล์งาน ออกแบบกราฟิก ผลิต และจัดส่ง ครบในที่เดียว ไม่ต้องวิ่งหลายเจ้า",
  },
  {
    icon: "💰",
    title: "ราคาเป็นธรรม",
    desc: "ไม่มีค่าธรรมเนียมแอบแฝง ราคาชัดเจน สั่งขั้นต่ำ 1 ชิ้นได้ไม่มีข้อจำกัด",
  },
];

const services = [
  { name: "แบ็คดรอปผ้า / Pop-up / โครงทรัส", href: "/services/backdrop", icon: "🖼" },
  { name: "ป้ายไวนิล ทุกชนิด", href: "/services/vinyl", icon: "📋" },
  { name: "Roll Up Stand / X-Stand", href: "/services/rollup", icon: "🗓" },
  { name: "สติ๊กเกอร์ ตัดขอบ Die-cut", href: "/services/sticker", icon: "✂️" },
  { name: "PP Board / Standee ตัดรูปทรง", href: "/services/ppboard", icon: "📌" },
  { name: "ฉลากสินค้า / Product Label", href: "/services/label", icon: "🏷" },
];

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": "https://displayworksmedia.com/about#webpage",
    url: "https://displayworksmedia.com/about",
    name: "เกี่ยวกับเรา | Display Works Media",
    description: "Display Works Media คือบริการสั่งพิมพ์ป้ายและสื่อสิ่งพิมพ์ออนไลน์ครบวงจร รับทำแบ็คดรอปผ้า ป้ายไวนิล Roll Up Stand สติ๊กเกอร์ PP Board และฉลากสินค้า ส่งทั่วประเทศ",
    isPartOf: { "@id": "https://displayworksmedia.com/#website" },
    about: { "@id": "https://displayworksmedia.com/#business" },
  };

  return (
    <>
      <SchemaOrg extra={aboutSchema} />
    <div className="min-h-screen font-['Prompt',sans-serif] text-white bg-[#050816]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-5 overflow-hidden">
        {/* bg glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #FF7A00 0%, transparent 70%)" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-[#FF7A00]/30 text-[#FF7A00]">
            เกี่ยวกับเรา
          </div>
          <h1 className="font-['Kanit'] font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-4">
            Display Works<br />
            <span style={{ color: "#FF7A00" }}>Media</span>
          </h1>
          <p className="text-[#A7B0C0] text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            โซลูชันงานพิมพ์ป้ายและสื่อสิ่งพิมพ์ออนไลน์ครบวงจร<br className="hidden sm:block" />
            สำหรับธุรกิจยุคใหม่ในประเทศไทย
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ num, label }) => (
            <div key={label} className="rounded-2xl p-5 text-center border border-white/5"
              style={{ background: "#0B1220" }}>
              <div className="font-['Kanit'] font-extrabold text-2xl sm:text-3xl text-[#FF7A00]">{num}</div>
              <div className="text-[#A7B0C0] text-xs mt-1 leading-snug">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* เราคือใคร */}
      <section className="px-5 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "#0B1220" }}>
            <div className="p-6 sm:p-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5 border border-[#FF7A00]/30 text-[#FF7A00]">
                เราคือใคร
              </div>
              <h2 className="font-['Kanit'] font-bold text-2xl sm:text-3xl text-white mb-5">
                ผู้เชี่ยวชาญงานพิมพ์ป้ายออนไลน์
              </h2>
              <div className="space-y-4 text-[#A7B0C0] leading-relaxed text-sm sm:text-base">
                <p>
                  <strong className="text-white">Display Works Media</strong> คือผู้ให้บริการงานพิมพ์ป้ายและสื่อสิ่งพิมพ์ออนไลน์ครบวงจร
                  เราเชี่ยวชาญด้านการผลิตป้ายไวนิล แบ็คดรอปผ้า Roll Up Stand สติ๊กเกอร์ PP Board
                  และฉลากสินค้าสำหรับธุรกิจทุกขนาดในประเทศไทย
                </p>
                <p>
                  ด้วยระบบสั่งผลิตออนไลน์ที่ง่ายและรวดเร็ว ลูกค้าสามารถส่งไฟล์งาน เลือกขนาด
                  และรับงานส่งตรงถึงหน้าประตูได้ทุกจังหวัดทั่วประเทศ โดยไม่ต้องเดินทางเลย
                </p>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/contact"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:-translate-y-0.5"
                  style={{ background: "#FF7A00", boxShadow: "0 4px 20px rgba(255,122,0,0.25)" }}>
                  ติดต่อเรา →
                </Link>
                <Link href="/#quote"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-white/10 text-[#A7B0C0] hover:text-white hover:border-white/30 transition-all">
                  ขอใบเสนอราคา
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ค่านิยม */}
      <section className="px-5 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-[#FF7A00]/30 text-[#FF7A00]">
              ทำไมต้องเลือกเรา
            </div>
            <h2 className="font-['Kanit'] font-bold text-2xl sm:text-3xl text-white">
              สิ่งที่ทำให้เราแตกต่าง
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 border border-white/5 hover:border-[#FF7A00]/30 transition-all"
                style={{ background: "#0B1220" }}>
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-['Kanit'] font-bold text-white text-base mb-2">{title}</h3>
                <p className="text-[#A7B0C0] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* บริการ */}
      <section className="px-5 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-[#FF7A00]/30 text-[#FF7A00]">
              บริการของเรา
            </div>
            <h2 className="font-['Kanit'] font-bold text-2xl sm:text-3xl text-white">
              ครบทุกงานพิมพ์ในที่เดียว
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map(({ name, href, icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 rounded-xl p-4 border border-white/5 hover:border-[#FF7A00]/40 hover:bg-[#FF7A00]/5 transition-all group"
                style={{ background: "#0B1220" }}>
                <span className="text-xl">{icon}</span>
                <span className="text-[#A7B0C0] group-hover:text-white text-sm transition-colors">{name}</span>
                <span className="ml-auto text-[#FF7A00] opacity-0 group-hover:opacity-100 transition-opacity text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </div>
    </>
  );
}
