import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "ข้อกำหนดการใช้งาน | Display Works Media",
  description: "ข้อกำหนดการใช้งานเว็บไซต์และเงื่อนไขเบื้องต้นในการสั่งผลิตกับ Display Works Media",
  alternates: { canonical: "https://displayworksmedia.com/terms" },
};

const terms = [
  ["การประเมินราคา", "ราคาเบื้องต้นอาจเปลี่ยนแปลงตามขนาด วัสดุ จำนวน การตกแต่งไฟล์ ค่าจัดส่ง และรายละเอียดที่ยืนยันก่อนผลิต"],
  ["การยืนยันแบบ", "ลูกค้าต้องตรวจสอบข้อความ ขนาด สี และรายละเอียดในแบบก่อนยืนยันผลิต การแก้ไขหลังเริ่มผลิตอาจมีค่าใช้จ่ายเพิ่มเติม"],
  ["สีของงานพิมพ์", "สีบนหน้าจอและงานพิมพ์จริงอาจแตกต่างกันตามระบบสี วัสดุ เครื่องพิมพ์ และสภาพแสง"],
  ["ระยะเวลาผลิต", "ระยะเวลานับหลังยืนยันแบบและชำระเงิน โดยอาจเปลี่ยนแปลงตามประเภทงาน ปริมาณงาน และวันหยุด"],
  ["การจัดส่ง", "ความล่าช้าจากบริษัทขนส่งหรือเหตุสุดวิสัยอยู่นอกเหนือการควบคุม แต่ทีมงานจะช่วยติดตามสถานะให้"],
  ["ทรัพย์สินทางปัญญา", "ผู้ส่งไฟล์ต้องมีสิทธิใช้งานข้อความ รูปภาพ โลโก้ และงานออกแบบที่ส่งมาผลิต"],
];

export default function TermsPage() {
  return (
    <div className="brand-interior min-h-screen bg-[#050806] text-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-20 pt-28 sm:px-6">
        <div className="section-label">TERMS & CONDITIONS</div>
        <h1 className="mt-5 font-kanit text-4xl font-extrabold sm:text-5xl">ข้อกำหนดการใช้งาน</h1>
        <p className="mt-5 leading-8 text-[#A7B0C0]">ปรับปรุงล่าสุด: 15 มิถุนายน 2569</p>
        <div className="mt-10 space-y-5">
          {terms.map(([title, body]) => (
            <section key={title} className="brand-card border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-kanit text-xl font-bold">{title}</h2>
              <p className="mt-3 leading-8 text-[#A7B0C0]">{body}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
