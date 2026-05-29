import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";

export const metadata: Metadata = {
  title: "ติดต่อเรา | Display Works Media — สั่งพิมพ์ป้ายออนไลน์",
  description:
    "ติดต่อ Display Works Media ผ่าน LINE, Facebook หรือกรอกฟอร์มขอใบเสนอราคา บริการสั่งพิมพ์ป้ายออนไลน์ครบวงจร ตอบภายใน 30 นาที",
  alternates: { canonical: "https://displayworksmedia.com/contact" },
  openGraph: {
    title: "ติดต่อเรา | Display Works Media",
    description: "ติดต่อขอใบเสนอราคางานพิมพ์ป้าย แบ็คดรอป Roll Up สติ๊กเกอร์ — ตอบไว ราคาชัดเจน",
    url: "https://displayworksmedia.com/contact",
  },
};

const contacts = [
  {
    channel: "LINE Official",
    value: "@displayworksmedia",
    href: "https://lin.ee/O0nPl03",
    desc: "ตอบเร็วที่สุด — เหมาะสำหรับส่งไฟล์และขอใบเสนอราคา",
    color: "#06C755",
  },
  {
    channel: "Facebook",
    value: "Display Works Media",
    href: "https://www.facebook.com/profile.php?id=61581015452518",
    desc: "ติดตามผลงานและโปรโมชัน — ส่งข้อความได้เลย",
    color: "#1877F2",
  },
  {
    channel: "เว็บไซต์",
    value: "displayworksmedia.com",
    href: "https://displayworksmedia.com",
    desc: "กรอกฟอร์มขอใบเสนอราคาได้ที่หน้าแรก",
    color: "#16A34A",
  },
];

const faqs = [
  {
    q: "ติดต่อช่องทางไหนเร็วที่สุด?",
    a: "LINE Official ตอบเร็วที่สุด ปกติภายใน 30 นาทีในเวลาทำการ (จันทร์–เสาร์ 9:00–18:00)",
  },
  {
    q: "สามารถส่งไฟล์งานผ่านช่องทางไหน?",
    a: "ส่งผ่าน LINE, Facebook Messenger หรืออีเมล รองรับไฟล์ AI, PDF, PSD ขนาดไม่จำกัด",
  },
  {
    q: "มีหน้าร้านให้เดินมาดูตัวอย่างงานได้ไหม?",
    a: "เราเป็น online-first business ไม่มีหน้าร้านให้เข้ามา แต่สามารถขอดูตัวอย่างงานผ่านช่องทางออนไลน์ได้",
  },
];

export default function ContactPage() {
  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section
        style={{ background: "#0A0F1A", paddingTop: "7rem", paddingBottom: "4rem" }}
        className="px-6 lg:px-8"
      >
        <div className="max-w-3xl mx-auto text-center">
          <p style={{ color: "#4ADE80", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>
            ติดต่อเรา
          </p>
          <h1 style={{ color: "#fff", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.3, marginBottom: "1rem" }}>
            พร้อมช่วยทุกโปรเจ็กต์งานพิมพ์ของคุณ
          </h1>
          <p style={{ color: "#9CA3AF", lineHeight: 1.8 }}>
            ติดต่อ Display Works Media ได้หลายช่องทาง — ทีมงานตอบเร็ว ให้คำปรึกษาฟรี
          </p>
        </div>
      </section>

      {/* Channels */}
      <section style={{ background: "#111827" }} className="py-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem" }}>
            ช่องทางการติดต่อ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {contacts.map(({ channel, value, href, desc, color }) => (
              <Link
                key={channel}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  background: "#1F2937",
                  borderRadius: "0.75rem",
                  padding: "1.5rem",
                  textDecoration: "none",
                  borderTop: `3px solid ${color}`,
                }}
              >
                <div style={{ color: "#fff", fontWeight: 600, marginBottom: "0.35rem" }}>{channel}</div>
                <div style={{ color, fontWeight: 500, fontSize: "0.95rem", marginBottom: "0.5rem" }}>{value}</div>
                <div style={{ color: "#9CA3AF", fontSize: "0.875rem", lineHeight: 1.6 }}>{desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Business info — สำคัญมากสำหรับ GEO Entity */}
      <section style={{ background: "#0A0F1A" }} className="py-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem" }}>
            ข้อมูลธุรกิจ
          </h2>
          <div
            style={{
              background: "#111827",
              borderRadius: "0.75rem",
              padding: "1.5rem 2rem",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  { label: "ชื่อธุรกิจ", value: "Display Works Media" },
                  { label: "ประเภทธุรกิจ", value: "บริการพิมพ์ป้ายและสื่อสิ่งพิมพ์ออนไลน์" },
                  { label: "พื้นที่บริการ", value: "ทั่วประเทศไทย (จัดส่งทุกจังหวัด)" },
                  { label: "วันและเวลาทำการ", value: "จันทร์ – เสาร์ 9:00 – 18:00 น." },
                  { label: "ภาษา", value: "ภาษาไทย / English" },
                  { label: "เว็บไซต์", value: "https://displayworksmedia.com" },
                ].map(({ label, value }) => (
                  <tr
                    key={label}
                    style={{ borderBottom: "0.5px solid #374151" }}
                  >
                    <td style={{ color: "#6B7280", padding: "0.75rem 0", paddingRight: "2rem", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                      {label}
                    </td>
                    <td style={{ color: "#D1D5DB", padding: "0.75rem 0", fontSize: "0.95rem" }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "#111827" }} className="py-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem" }}>
            คำถามเกี่ยวกับการติดต่อ
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {faqs.map(({ q, a }) => (
              <div
                key={q}
                style={{ background: "#1F2937", borderRadius: "0.5rem", padding: "1.25rem 1.5rem" }}
              >
                <div style={{ color: "#fff", fontWeight: 600, marginBottom: "0.5rem" }}>{q}</div>
                <div style={{ color: "#9CA3AF", lineHeight: 1.7, fontSize: "0.95rem" }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#0A0F1A" }} className="py-16 px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
            พร้อมสั่งพิมพ์แล้วใช่ไหม?
          </h2>
          <p style={{ color: "#9CA3AF", marginBottom: "1.5rem" }}>
            กลับไปหน้าแรกเพื่อกรอกฟอร์มขอใบเสนอราคา หรือติดต่อ LINE ได้เลย
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/"
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
              กลับหน้าแรก
            </Link>
            <Link
              href="https://lin.ee/O0nPl03"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                background: "#06C755",
                color: "#fff",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              LINE Official →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </main>
  );
}
