import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import SchemaOrg from "@/components/SchemaOrg";

export const metadata: Metadata = {
  title: "ติดต่อเรา | Display Works Media",
  description:
    "ติดต่อ Display Works Media ผ่าน LINE, Facebook หรือกรอกฟอร์มขอใบเสนอราคา บริการสั่งพิมพ์ป้ายออนไลน์ครบวงจร ตอบภายใน 30 นาที",
  alternates: { canonical: "https://displayworksmedia.com/contact" },
  openGraph: {
    title: "ติดต่อเรา | Display Works Media",
    description: "ติดต่อขอใบเสนอราคางานพิมพ์ป้าย แบ็คดรอป Roll Up สติ๊กเกอร์ — ตอบไว ราคาชัดเจน",
    url: "https://displayworksmedia.com/contact",
  },
};

const channels = [
  {
    icon: "💬",
    channel: "LINE Official",
    value: "@displayworksmedia",
    href: "https://lin.ee/O0nPl03",
    desc: "ตอบเร็วที่สุด เหมาะสำหรับส่งไฟล์และขอใบเสนอราคา",
    color: "#06C755",
    cta: "แชทผ่าน LINE",
  },
  {
    icon: "📘",
    channel: "Facebook",
    value: "Display Works Media",
    href: "https://www.facebook.com/profile.php?id=61581015452518",
    desc: "ติดตามผลงานและโปรโมชัน ส่งข้อความได้เลย",
    color: "#1877F2",
    cta: "ส่งข้อความ",
  },
  {
    icon: "📞",
    channel: "โทรศัพท์",
    value: "065-916-1539",
    href: "tel:0659161539",
    desc: "จันทร์–เสาร์ 9:00–18:00 น.",
    color: "#FF7A00",
    cta: "โทรหาเรา",
  },
];

const info = [
  { label: "ชื่อธุรกิจ", value: "Display Works Media" },
  { label: "ประเภทธุรกิจ", value: "บริการพิมพ์ป้ายและสื่อสิ่งพิมพ์ออนไลน์" },
  { label: "พื้นที่บริการ", value: "ทั่วประเทศไทย (จัดส่งทุกจังหวัด)" },
  { label: "เวลาทำการ", value: "จันทร์–เสาร์ 9:00–18:00 น." },
  { label: "อีเมล", value: "info.displayworksmedia@gmail.com" },
];

const faqs = [
  {
    q: "ติดต่อช่องทางไหนเร็วที่สุด?",
    a: "LINE Official ตอบเร็วที่สุด ปกติภายใน 30 นาทีในเวลาทำการ",
  },
  {
    q: "ส่งไฟล์งานผ่านช่องทางไหนได้บ้าง?",
    a: "ส่งผ่าน LINE หรือ Facebook Messenger รองรับไฟล์ AI, PDF, PSD",
  },
  {
    q: "มีหน้าร้านให้เดินมาดูตัวอย่างได้ไหม?",
    a: "เราเป็น online-first business ไม่มีหน้าร้าน แต่สามารถขอดูตัวอย่างงานผ่านออนไลน์ได้เลย",
  },
];

export default function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": "https://displayworksmedia.com/contact#webpage",
    url: "https://displayworksmedia.com/contact",
    name: "ติดต่อเรา | Display Works Media",
    description: "ติดต่อ Display Works Media ผ่าน LINE, Facebook หรือกรอกฟอร์มขอใบเสนอราคา บริการสั่งพิมพ์ป้ายออนไลน์ครบวงจร ตอบภายใน 30 นาที",
    isPartOf: { "@id": "https://displayworksmedia.com/#website" },
    about: { "@id": "https://displayworksmedia.com/#business" },
  };

  return (
    <>
      <SchemaOrg extra={contactSchema} />
    <div className="min-h-screen font-['Prompt',sans-serif] text-white bg-[#050816]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-16 px-5 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #FF7A00 0%, transparent 70%)" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-[#FF7A00]/30 text-[#FF7A00]">
            ติดต่อเรา
          </div>
          <h1 className="font-['Kanit'] font-extrabold text-4xl sm:text-5xl text-white leading-tight mb-4">
            พร้อมช่วย<span style={{ color: "#FF7A00" }}>ทุกโปรเจ็กต์</span><br />
            งานพิมพ์ของคุณ
          </h1>
          <p className="text-[#A7B0C0] text-base leading-relaxed">
            ติดต่อได้หลายช่องทาง ทีมงานตอบเร็ว ให้คำปรึกษาฟรี
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="px-5 pb-16">
        <div className="max-w-4xl mx-auto space-y-4">
          {channels.map(({ icon, channel, value, href, desc, color, cta }) => (
            <div key={channel} className="rounded-2xl border border-white/5 overflow-hidden"
              style={{ background: "#0B1220" }}>
              <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    {icon}
                  </div>
                  <div>
                    <div className="text-xs text-[#A7B0C0] mb-0.5">{channel}</div>
                    <div className="font-['Kanit'] font-bold text-white text-base">{value}</div>
                    <div className="text-[#A7B0C0] text-xs mt-0.5">{desc}</div>
                  </div>
                </div>
                <Link href={href} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:-translate-y-0.5 active:scale-95"
                  style={{ background: color, boxShadow: `0 4px 16px ${color}30` }}>
                  {cta} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ข้อมูลธุรกิจ */}
      <section className="px-5 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-[#FF7A00]/30 text-[#FF7A00]">
            ข้อมูลธุรกิจ
          </div>
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "#0B1220" }}>
            {info.map(({ label, value }, i) => (
              <div key={label}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-6 py-4"
                style={{ borderBottom: i < info.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div className="text-[#A7B0C0] text-xs sm:text-sm sm:w-40 flex-shrink-0">{label}</div>
                <div className="text-white text-sm font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-[#FF7A00]/30 text-[#FF7A00]">
            คำถามที่พบบ่อย
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-white/5 p-5 sm:p-6"
                style={{ background: "#0B1220" }}>
                <div className="font-['Kanit'] font-bold text-white text-sm sm:text-base mb-2">{q}</div>
                <div className="text-[#A7B0C0] text-sm leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-8 sm:p-10 text-center border border-[#FF7A00]/20 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0B1220 0%, #1a0f05 100%)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, rgba(255,122,0,0.08) 0%, transparent 70%)" }} />
            <h2 className="relative font-['Kanit'] font-bold text-2xl sm:text-3xl text-white mb-2">
              พร้อมสั่งพิมพ์แล้วใช่ไหม?
            </h2>
            <p className="relative text-[#A7B0C0] text-sm mb-7">
              กรอกฟอร์มขอใบเสนอราคา หรือติดต่อ LINE ได้เลย ตอบไวภายใน 30 นาที
            </p>
            <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="https://lin.ee/O0nPl03" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:-translate-y-0.5 active:scale-95"
                style={{ background: "#06C755", boxShadow: "0 4px 20px rgba(6,199,85,0.25)" }}>
                💬 LINE Official
              </Link>
              <Link href="/#quote"
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:-translate-y-0.5 active:scale-95"
                style={{ background: "#FF7A00", boxShadow: "0 4px 20px rgba(255,122,0,0.25)" }}>
                ขอใบเสนอราคา →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </div>
    </>
  );
}
