import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import FAQ from "@/components/FAQ";
import SchemaOrg from "@/components/SchemaOrg";

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
      <SchemaOrg />
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
