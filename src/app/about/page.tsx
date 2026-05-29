import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา | Display Works Media — บริการสั่งพิมพ์ป้ายออนไลน์",
  description:
    "Display Works Media คือบริการสั่งพิมพ์ป้าย สติ๊กเกอร์ แบ็คดรอป Roll Up ออนไลน์ครบวงจร ส่งทั่วประเทศไทย คุณภาพสูง ราคาเป็นธรรม",
  alternates: { canonical: "https://displayworksmedia.com/about" },
  openGraph: {
    title: "เกี่ยวกับเรา | Display Works Media",
    description: "รู้จัก Display Works Media — ผู้ให้บริการงานพิมพ์ป้ายออนไลน์ครบวงจรในประเทศไทย",
    url: "https://displayworksmedia.com/about",
  },
};

const services = [
  { name: "แบ็คดรอปผ้า / Pop-up / โครงทรัส", href: "/services/backdrop" },
  { name: "ป้ายไวนิล ทุกชนิด", href: "/services/vinyl" },
  { name: "Roll Up Stand / X-Stand", href: "/services/rollup" },
  { name: "สติ๊กเกอร์ ตัดขอบ Die-cut", href: "/services/sticker" },
  { name: "PP Board / Standee ตัดรูปทรง", href: "/services/ppboard" },
  { name: "ฉลากสินค้า / Product Label", href: "/services/label" },
];

const values = [
  {
    title: "คุณภาพงานพิมพ์",
    desc: "เครื่องพิมพ์ระดับมืออาชีพ ความละเอียดสูง สีสดคมชัด ตรงตามแบบที่ลูกค้าต้องการ",
  },
  {
    title: "ส่งตรงเวลา",
    desc: "ผลิต 1–3 วันทำการ จัดส่งทุกจังหวัดทั่วประเทศไทย แจ้งเลขพัสดุทุกออเดอร์",
  },
  {
    title: "บริการครบจบ",
    desc: "รับไฟล์งาน ออกแบบกราฟิก ผลิต และจัดส่ง ครบในที่เดียว ไม่ต้องวิ่งหลายเจ้า",
  },
  {
    title: "ราคาเป็นธรรม",
    desc: "ไม่มีค่าธรรมเนียมแอบแฝง ราคาชัดเจน สั่งขั้นต่ำ 1 ชิ้นได้ไม่มีข้อจำกัด",
  },
];

export default function AboutPage() {
  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section
        style={{ background: "#0A0F1A", paddingTop: "7rem", paddingBottom: "4rem" }}
        className="px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <p style={{ color: "#4ADE80", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>
            เกี่ยวกับเรา
          </p>
          <h1 style={{ color: "#fff", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: "1.5rem" }}>
            Display Works Media
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: "1.125rem", lineHeight: 1.8, maxWidth: "36rem", margin: "0 auto" }}>
            โซลูชันงานพิมพ์ป้ายและสื่อสิ่งพิมพ์ออนไลน์ครบวงจร สำหรับธุรกิจยุคใหม่ในประเทศไทย
          </p>
        </div>
      </section>

      {/* ว่าเราคือใคร */}
      <section style={{ background: "#111827" }} className="py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 style={{ color: "#fff", fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>
                เราคือใคร
              </h2>
              <p style={{ color: "#D1D5DB", lineHeight: 1.9, marginBottom: "1rem" }}>
                <strong style={{ color: "#fff" }}>Display Works Media</strong> คือผู้ให้บริการงานพิมพ์ป้ายและสื่อสิ่งพิมพ์ออนไลน์ครบวงจร
                เราเชี่ยวชาญด้านการผลิตป้ายไวนิล แบ็คดรอปผ้า Roll Up Stand สติ๊กเกอร์ PP Board
                และฉลากสินค้าสำหรับธุรกิจทุกขนาดในประเทศไทย
              </p>
              <p style={{ color: "#D1D5DB", lineHeight: 1.9, marginBottom: "1.5rem" }}>
                ด้วยระบบสั่งผลิตออนไลน์ที่ง่ายและรวดเร็ว ลูกค้าสามารถส่งไฟล์งาน เลือกขนาด และรับงานส่งตรงถึงหน้าประตูได้ทุกจังหวัดทั่วประเทศ
                โดยไม่ต้องเดินทางมาหาเราเลย
              </p>
              <Link
                href="/contact"
                style={{
                  display: "inline-block",
                  background: "#16A34A",
                  color: "#fff",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                ติดต่อเรา →
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "1,000+", label: "ลูกค้าทั่วประเทศ" },
                { num: "6", label: "บริการครบวงจร" },
                { num: "1–3", label: "วันทำการผลิต" },
                { num: "4.9★", label: "คะแนนความพึงพอใจ" },
              ].map(({ num, label }) => (
                <div
                  key={label}
                  style={{
                    background: "#1F2937",
                    borderRadius: "0.75rem",
                    padding: "1.5rem",
                    textAlign: "center",
                  }}
                >
                  <div style={{ color: "#4ADE80", fontSize: "1.75rem", fontWeight: 700 }}>{num}</div>
                  <div style={{ color: "#9CA3AF", fontSize: "0.875rem", marginTop: "0.25rem" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ค่านิยม */}
      <section style={{ background: "#0A0F1A" }} className="py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 style={{ color: "#fff", fontSize: "1.75rem", fontWeight: 700, marginBottom: "3rem", textAlign: "center" }}>
            ทำไมต้องเลือก Display Works Media
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map(({ title, desc }) => (
              <div
                key={title}
                style={{ background: "#111827", borderRadius: "0.75rem", padding: "1.5rem", borderLeft: "3px solid #16A34A" }}
              >
                <h3 style={{ color: "#fff", fontWeight: 600, marginBottom: "0.5rem" }}>{title}</h3>
                <p style={{ color: "#9CA3AF", lineHeight: 1.7, fontSize: "0.95rem" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* บริการ */}
      <section style={{ background: "#111827" }} className="py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 style={{ color: "#fff", fontSize: "1.75rem", fontWeight: 700, marginBottom: "2rem", textAlign: "center" }}>
            บริการของเรา
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(({ name, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "block",
                  background: "#1F2937",
                  borderRadius: "0.5rem",
                  padding: "1rem 1.25rem",
                  color: "#D1D5DB",
                  textDecoration: "none",
                  fontSize: "0.95rem",
                  transition: "background 0.15s",
                }}
              >
                → {name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </main>
  );
}
