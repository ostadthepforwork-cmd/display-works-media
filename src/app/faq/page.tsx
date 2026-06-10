import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import FAQ from "@/components/FAQ";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "สั่งพิมพ์ขั้นต่ำเท่าไหร่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ไม่มีขั้นต่ำในหลายรายการ สามารถสั่ง 1 ชิ้นได้เลย บางรายการอาจมีขั้นต่ำตามเงื่อนไขการผลิต ทีมงานจะแจ้งรายละเอียดเมื่อรับงาน",
      },
    },
    {
      "@type": "Question",
      name: "ใช้เวลาผลิตนานเท่าไหร่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "โดยปกติ 1–3 วันทำการ งานด่วนสามารถแจ้งได้เพื่อดำเนินการเร่งด่วน อาจมีค่าบริการเพิ่มเติม",
      },
    },
    {
      "@type": "Question",
      name: "ต้องส่งไฟล์งานอะไรบ้าง?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "รองรับไฟล์ AI, PDF, PSD ความละเอียด 150–300 dpi ขึ้นไป หากยังไม่มีไฟล์ ทีมงานสามารถช่วยออกแบบได้ (มีค่าบริการเพิ่มเติม)",
      },
    },
    {
      "@type": "Question",
      name: "ชำระเงินอย่างไร?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "โอนเงินผ่านธนาคาร, พร้อมเพย์ หรือ QR Code ชำระเต็มจำนวนก่อนผลิต",
      },
    },
    {
      "@type": "Question",
      name: "Display Works Media จัดส่งทั่วประเทศได้จริงไหม?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ใช่ครับ Display Works Media จัดส่งทุกจังหวัดในประเทศไทย ผ่านขนส่งเอกชนที่เชื่อถือได้ พร้อมแจ้งเลขพัสดุทุกออเดอร์",
      },
    },
    {
      "@type": "Question",
      name: "ถ้างานออกมาไม่ตรงแบบ ทำอย่างไร?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "เราตรวจสอบคุณภาพก่อนส่งทุกครั้ง หากงานไม่ตรงตามที่ตกลงไว้ ยินดีผลิตใหม่ให้โดยไม่มีค่าใช้จ่ายเพิ่มเติม",
      },
    },
    {
      "@type": "Question",
      name: "รับออกแบบกราฟิกด้วยไหม?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "รับออกแบบครับ เรามีทีมกราฟิกช่วยออกแบบและจัดวางให้เหมาะสม มีค่าบริการออกแบบแยกต่างหาก",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "คำถามที่พบบ่อย งานป้ายและงานพิมพ์ | Display Works Media",
  description: "คำถามที่พบบ่อยเกี่ยวกับการสั่งทำป้าย งานพิมพ์ ไฟล์ Artwork ระยะเวลาผลิต การชำระเงิน และการจัดส่ง",
  alternates: { canonical: "https://displayworksmedia.com/faq" },
  openGraph: {
    title: "คำถามที่พบบ่อย | Display Works Media",
    description: "รวมคำตอบก่อนสั่งผลิตงานป้ายและงานพิมพ์กับ Display Works Media",
    url: "https://displayworksmedia.com/faq",
  },
};

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white" style={{ fontFamily: "'Prompt','Sarabun',sans-serif" }}>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD ปลอดภัย
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <section className="pt-[116px] pb-4 px-6 lg:px-8 bg-[#050816]">
        <div className="max-w-7xl mx-auto">
          <div className="text-[#FF7A00] text-xs font-bold tracking-[0.18em] uppercase mb-4">FAQ</div>
          <h1 className="font-kanit font-extrabold text-4xl lg:text-6xl max-w-3xl leading-tight">
            คำถามที่พบบ่อยก่อนสั่งผลิตงานป้าย
          </h1>
          <p className="mt-5 text-[#A7B0C0] max-w-2xl leading-relaxed">
            รวมคำตอบเรื่องขั้นต่ำ ระยะเวลาผลิต ไฟล์ Artwork การชำระเงิน และการจัดส่ง เพื่อช่วยให้เตรียมงานได้ง่ายขึ้น
          </p>
        </div>
      </section>
      <FAQ />
    </main>
  );
}
