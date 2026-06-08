import Link from "next/link";

type ServiceOption = {
  label: string;
  detail: string;
};

type ServiceFaq = {
  q: string;
  a: string;
};

type SEOServicePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  heroImage: string;
  highlights: string[];
  useCases: ServiceOption[];
  specs: ServiceOption[];
  faqs: ServiceFaq[];
  relatedLinks?: Array<{ label: string; href: string }>;
};

export default function SEOServicePage({
  eyebrow,
  title,
  description,
  heroImage,
  highlights,
  useCases,
  specs,
  faqs,
  relatedLinks = [],
}: SEOServicePageProps) {
  return (
    <main style={{ background: "#050816", color: "#fff", fontFamily: "'Prompt','Sarabun',sans-serif" }}>
      <section
        style={{
          minHeight: "82vh",
          display: "grid",
          alignItems: "end",
          padding: "120px 20px 56px",
          background: `linear-gradient(90deg, rgba(5,8,22,0.92), rgba(5,8,22,0.72), rgba(5,8,22,0.28)), url(${heroImage}) center/cover`,
        }}
      >
        <div style={{ width: "min(1120px, 100%)", margin: "0 auto" }}>
          <div style={{ color: "#ff7a00", fontSize: 13, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 14 }}>
            {eyebrow}
          </div>
          <h1 style={{ margin: 0, maxWidth: 760, fontSize: "clamp(34px, 6vw, 72px)", lineHeight: 1.06, fontWeight: 900 }}>
            {title}
          </h1>
          <p style={{ maxWidth: 680, margin: "20px 0 0", color: "#d7deea", fontSize: 18, lineHeight: 1.8 }}>
            {description}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
            <Link href="/contact" style={primaryBtn}>ขอใบเสนอราคา</Link>
            <a href="https://lin.ee/O0nPl03" style={secondaryBtn}>แอดไลน์สอบถาม</a>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={grid3}>
          {highlights.map((item) => (
            <div key={item} style={panelStyle}>
              <div style={accentLine} />
              <p style={{ margin: 0, color: "#e6edf7", fontSize: 15, lineHeight: 1.8 }}>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader title="เหมาะกับงานแบบไหน" text="เลือกประเภทงานให้ตรงกับพื้นที่ใช้งาน งบประมาณ และระยะเวลาที่ต้องการผลิต" />
        <div style={grid2}>
          {useCases.map((item) => <InfoCard key={item.label} item={item} />)}
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader title="วัสดุ ขนาด และตัวเลือกการผลิต" text="ทีมงานช่วยตรวจไฟล์ แนะนำวัสดุ และประเมินราคาตามรายละเอียดจริงของงาน" />
        <div style={grid2}>
          {specs.map((item) => <InfoCard key={item.label} item={item} />)}
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader title="ขั้นตอนการสั่งงาน" text="ส่งรายละเอียดงานให้ทีม Display Works Media แล้วรอรับใบเสนอราคาได้เลย" />
        <div style={grid5}>
          {["ส่งแบบหรือไอเดีย", "ตรวจไฟล์และขนาด", "เสนอราคา", "ผลิตงาน", "จัดส่งหรือติดตั้ง"].map((step, index) => (
            <div key={step} style={stepStyle}>
              <strong style={{ color: "#ff7a00", fontSize: 22 }}>{String(index + 1).padStart(2, "0")}</strong>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader title="คำถามที่พบบ่อย" text="รวมคำตอบที่ลูกค้ามักถามก่อนสั่งผลิต" />
        <div style={{ display: "grid", gap: 12 }}>
          {faqs.map((faq) => (
            <details key={faq.q} style={faqStyle}>
              <summary style={{ cursor: "pointer", fontWeight: 800 }}>{faq.q}</summary>
              <p style={{ margin: "10px 0 0", color: "#aeb8c8", lineHeight: 1.8 }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {relatedLinks.length > 0 && (
        <section style={sectionStyle}>
          <SectionHeader title="บริการที่เกี่ยวข้อง" text="เชื่อมโยงบริการและบทความเพื่อให้ลูกค้าเลือกงานที่เหมาะที่สุด" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {relatedLinks.map((link) => <Link key={link.href} href={link.href} style={tagStyle}>{link.label}</Link>)}
          </div>
        </section>
      )}

      <section style={{ ...sectionStyle, paddingBottom: 96 }}>
        <div style={{ ...panelStyle, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 28 }}>พร้อมเริ่มผลิตงานป้ายของคุณ</h2>
            <p style={{ margin: "8px 0 0", color: "#aeb8c8" }}>ส่งขนาด จำนวน วัสดุ และไฟล์ Artwork ให้ทีมช่วยประเมินได้ทันที</p>
          </div>
          <Link href="/contact" style={primaryBtn}>ขอใบเสนอราคา</Link>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 42px)", lineHeight: 1.2 }}>{title}</h2>
      <p style={{ margin: "10px 0 0", maxWidth: 720, color: "#aeb8c8", lineHeight: 1.8 }}>{text}</p>
    </div>
  );
}

function InfoCard({ item }: { item: ServiceOption }) {
  return (
    <div style={panelStyle}>
      <h3 style={{ margin: 0, fontSize: 19 }}>{item.label}</h3>
      <p style={{ margin: "10px 0 0", color: "#aeb8c8", lineHeight: 1.8 }}>{item.detail}</p>
    </div>
  );
}

const sectionStyle = {
  width: "min(1120px, calc(100% - 40px))",
  margin: "0 auto",
  padding: "64px 0 0",
} as const;

const panelStyle = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 12,
  background: "rgba(11,18,32,0.86)",
  padding: 22,
} as const;

const primaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "0 20px",
  borderRadius: 8,
  background: "#ff7a00",
  color: "#fff",
  fontWeight: 800,
  textDecoration: "none",
} as const;

const secondaryBtn = {
  ...primaryBtn,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
} as const;

const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 } as const;
const grid3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 } as const;
const grid5 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 } as const;
const accentLine = { width: 44, height: 3, borderRadius: 99, background: "#ff7a00", marginBottom: 14 } as const;
const stepStyle = { ...panelStyle, display: "grid", gap: 8, minHeight: 118 } as const;
const faqStyle = { ...panelStyle, padding: "18px 20px" } as const;
const tagStyle = { ...secondaryBtn, minHeight: 42, fontSize: 14 } as const;
