import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Globe2, Mail, MessageCircle, Phone } from "lucide-react";
import { Facebook } from "@/components/BrandIcons";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SharedWorkflow } from "@/components/SharedMarketingSections";
import { CmsText } from "@/components/CmsSettingsProvider";
import SchemaOrg from "@/components/SchemaOrg";

export const metadata: Metadata = {
  title: "ติดต่อเรา | Display Works Media",
  description:
    "ติดต่อ Display Works Media เพื่อสอบถามงานป้าย งานพิมพ์ และสื่อโฆษณา ปรึกษาและประเมินราคาเบื้องต้นฟรี พร้อมจัดส่งทั่วประเทศไทย",
  alternates: { canonical: "https://displayworksmedia.com/contact" },
  openGraph: {
    title: "ติดต่อเรา | Display Works Media",
    description:
      "สอบถามราคา ส่งไฟล์งาน หรือขอคำแนะนำจากทีมงาน Display Works Media ได้ฟรี",
    url: "https://displayworksmedia.com/contact",
  },
};

const channels = [
  {
    icon: MessageCircle,
    channel: "LINE Official",
    value: "@displayworksmedia",
    href: "https://lin.ee/O0nPl03",
    desc: "ช่องทางที่แนะนำสำหรับสอบถามราคา ส่งไฟล์งาน และรับคำปรึกษาจากทีมงาน",
    color: "#047857",
    cta: "แชทผ่าน LINE",
  },
  {
    icon: Facebook,
    channel: "Facebook",
    value: "Display Works Media",
    href: "https://www.facebook.com/profile.php?id=61581015452518",
    desc: "ดูผลงานล่าสุด สอบถามข้อมูล และพูดคุยกับทีมงานผ่าน Messenger",
    color: "#1877F2",
    cta: "ส่งข้อความ",
  },
  {
    icon: Phone,
    channel: "โทรศัพท์",
    value: "065-916-1539",
    href: "tel:0659161539",
    desc: "สอบถามข้อมูลและติดตามสถานะงานได้ในเวลาทำการ",
    color: "#FF7A00",
    cta: "โทรหาเรา",
  },
];

const info = [
  { icon: Globe2, label: "ชื่อธุรกิจ", value: "Display Works Media" },
  { icon: CheckCircle2, label: "ประเภทธุรกิจ", value: "บริการพิมพ์ป้ายและสื่อโฆษณาออนไลน์ครบวงจร" },
  { icon: Globe2, label: "พื้นที่บริการ", value: "ทั่วประเทศไทย พร้อมจัดส่งทุกจังหวัด" },
  { icon: Globe2, label: "ช่องทางให้บริการ", value: "ออนไลน์ 100% พร้อมจัดส่งงานทั่วประเทศไทย" },
  { icon: Clock, label: "เวลาทำการ", value: "จันทร์-เสาร์ 9:00-18:00 น." },
  { icon: Mail, label: "อีเมล", value: "info.displayworksmedia@gmail.com" },
];

const faqs = [
  {
    q: "ติดต่อช่องทางไหนได้เร็วที่สุด?",
    a: "LINE Official ตอบกลับรวดเร็วที่สุด โดยปกติภายในเวลาทำการ",
  },
  {
    q: "ส่งไฟล์งานผ่านช่องทางไหนได้บ้าง?",
    a: "สามารถส่งไฟล์ผ่าน LINE Official หรือ Facebook Messenger ได้ รองรับไฟล์ AI, PDF, PSD และไฟล์ภาพทั่วไป",
  },
  {
    q: "มีหน้าร้านให้เข้าชมหรือไม่?",
    a: "ปัจจุบันเราให้บริการผ่านช่องทางออนไลน์เป็นหลัก ลูกค้าสามารถสอบถาม ขอราคา ส่งไฟล์ และสั่งผลิตได้สะดวก พร้อมจัดส่งงานทั่วประเทศ",
  },
  {
    q: "ใช้เวลาผลิตกี่วัน?",
    a: "ระยะเวลาผลิตขึ้นอยู่กับประเภทงานและจำนวน โดยส่วนใหญ่ใช้เวลาประมาณ 1-3 วันทำการ หลังยืนยันแบบและชำระเงินเรียบร้อย",
  },
  {
    q: "ยังไม่มีแบบ สามารถสั่งผลิตได้หรือไม่?",
    a: "ได้ ทีมงานสามารถให้คำแนะนำเกี่ยวกับขนาด วัสดุ และรูปแบบงานที่เหมาะสม พร้อมช่วยเตรียมไฟล์สำหรับการผลิต",
  },
  {
    q: "จัดส่งต่างจังหวัดได้หรือไม่?",
    a: "ได้ เราให้บริการจัดส่งทั่วประเทศไทย พร้อมแจ้งเลขพัสดุสำหรับติดตามสถานะการจัดส่ง",
  },
];

export default function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": "https://displayworksmedia.com/contact#webpage",
    url: "https://displayworksmedia.com/contact",
    name: "ติดต่อเรา | Display Works Media",
    description:
      "ติดต่อสอบถามและปรึกษางานป้าย งานพิมพ์ และสื่อโฆษณากับ Display Works Media ได้ฟรี",
    isPartOf: { "@id": "https://displayworksmedia.com/#website" },
    about: { "@id": "https://displayworksmedia.com/#business" },
  };

  return (
    <>
      <SchemaOrg extra={contactSchema} />
      <main className="brand-interior min-h-screen bg-[#050806] text-white font-['Prompt',sans-serif]">
        <Navbar />

        <section className="relative overflow-hidden px-5 pt-28 pb-16 lg:pt-32 lg:pb-20">
          <div
            className="absolute inset-x-0 top-0 h-[380px] pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(255,122,0,0.08), transparent)" }}
          />
          <div className="relative mx-auto max-w-4xl text-center">
            <CmsText path="contact.eyebrow" fallback="ติดต่อเรา" as="div" className="section-label" />
            <CmsText
              path="contact.title"
              fallback="กำลังมองหางานป้ายหรือสื่อโฆษณา?"
              as="h1"
              className="contact-hero-title font-['Kanit'] text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl"
            />
            <CmsText
              path="contact.subtitle"
              fallback="ติดต่อสอบถามและปรึกษาได้ฟรี ทีมงานพร้อมให้คำแนะนำและประเมินราคาเบื้องต้นโดยไม่มีค่าใช้จ่าย"
              as="p"
              className="contact-hero-copy mx-auto mt-6 max-w-2xl text-base leading-8 text-[#A7B0C0] sm:text-lg"
            />
            <p className="contact-hero-copy mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#A7B0C0]">
              ไม่ว่าจะมีแบบพร้อมผลิต หรือมีเพียงไอเดีย เรายินดีช่วยแนะนำแนวทางที่เหมาะกับธุรกิจของคุณ
            </p>
          </div>
        </section>

        <section id="channels" className="px-5 pb-16">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
            {channels.map(({ icon: Icon, channel, value, href, desc, color, cta }) => (
              <Link
                key={channel}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="contact-channel-card min-w-0 rounded-2xl border border-white/10 bg-[#0E1310] p-6 transition hover:-translate-y-1 hover:border-[#FF7A00]/40"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${color}18`, color }}>
                  <Icon size={24} />
                </div>
                <div className="text-xs text-[#A7B0C0]">{channel}</div>
                <h2 className="mt-1 font-['Kanit'] text-xl font-bold text-white">{value}</h2>
                <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#A7B0C0]">{desc}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold" style={{ color }}>
                  {cta} <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="px-5 pb-16">
          <div className="mx-auto max-w-5xl">
            <div className="section-label">ข้อมูลธุรกิจ</div>
            <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#0E1310] md:grid-cols-2">
              {info.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4 border-b border-white/5 p-5 last:border-b-0 md:border-r md:last:border-r-0">
                  <Icon size={18} className="mt-1 flex-shrink-0 text-[#FF7A00]" />
                  <div>
                    <div className="text-xs text-[#A7B0C0]">{label}</div>
                    <div className="mt-1 text-sm font-semibold leading-6 text-white">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SharedWorkflow />

        <section className="px-5 pb-16">
          <div className="mx-auto max-w-5xl">
            <div className="section-label">คำถามที่พบบ่อย</div>
            <div className="grid gap-4 md:grid-cols-2">
              {faqs.map(({ q, a }) => (
                <div key={q} className="rounded-2xl border border-white/10 bg-[#0E1310] p-6">
                  <h2 className="font-['Kanit'] text-lg font-bold text-white">{q}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#A7B0C0]">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24">
          <div
            className="mx-auto max-w-5xl rounded-2xl border border-[#FF7A00]/25 p-8 text-center sm:p-10"
            style={{ background: "linear-gradient(135deg, #0E1310 0%, #1a0f05 100%)" }}
          >
            <h2 className="font-['Kanit'] text-3xl font-extrabold text-white sm:text-4xl">ปรึกษางานกับเราได้ฟรี</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#A7B0C0]">
              สอบถามราคา ส่งไฟล์งาน หรือขอคำแนะนำจากทีมงานได้เลย
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="https://lin.ee/O0nPl03"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#047857] px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
              >
                <MessageCircle size={18} /> LINE Official
              </Link>
              <Link
                href="#channels"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C2410C] px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
              >
                ติดต่อเรา <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
