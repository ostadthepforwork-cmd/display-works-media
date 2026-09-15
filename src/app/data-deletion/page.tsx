import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "คำแนะนำการลบข้อมูล | Display Works Media",
  description: "ช่องทางและขั้นตอนขอลบข้อมูลส่วนบุคคลที่เชื่อมโยงกับ Display Works Media",
  alternates: { canonical: "https://displayworksmedia.com/data-deletion" },
};

const steps = [
  ["ส่งคำขอ", "อีเมลมาที่ info.displayworksmedia@gmail.com โดยใช้หัวข้อ ‘คำขอลบข้อมูล’ พร้อมแจ้งชื่อ ช่องทางติดต่อ และบริการที่เคยติดต่อเรา"],
  ["ยืนยันตัวตน", "ทีมงานอาจขอข้อมูลเพิ่มเติมเท่าที่จำเป็นเพื่อยืนยันว่าคำขอมาจากเจ้าของข้อมูล โดยจะไม่ขอรหัสผ่านของบัญชี Facebook หรือบัญชีอื่น"],
  ["ดำเนินการ", "เมื่อตรวจสอบคำขอแล้ว เราจะลบหรือทำให้ข้อมูลไม่สามารถระบุตัวบุคคลได้ และแจ้งผลกลับภายใน 30 วัน"],
];

export default function DataDeletionPage() {
  return (
    <div className="brand-interior min-h-screen bg-[#050806] text-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-20 pt-28 sm:px-6">
        <div className="section-label">DATA DELETION</div>
        <h1 className="mt-5 font-kanit text-4xl font-extrabold sm:text-5xl">คำแนะนำการลบข้อมูล</h1>
        <p className="mt-5 leading-8 text-[#A7B0C0]">
          คุณสามารถขอให้ Display Works Media ลบข้อมูลส่วนบุคคลที่ได้รับผ่านเว็บไซต์ Facebook Messenger
          หรือบริการที่เชื่อมต่อกับเราได้ตามขั้นตอนด้านล่าง
        </p>

        <div className="mt-10 space-y-5">
          {steps.map(([title, body], index) => (
            <section key={title} className="brand-card border border-white/10 bg-white/[0.03] p-6">
              <div className="section-label">STEP {index + 1}</div>
              <h2 className="mt-3 font-kanit text-xl font-bold">{title}</h2>
              <p className="mt-3 leading-8 text-[#A7B0C0]">{body}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 border-t border-white/10 pt-8">
          <h2 className="font-kanit text-xl font-bold">ข้อมูลที่อาจต้องเก็บไว้</h2>
          <p className="mt-3 leading-8 text-[#A7B0C0]">
            ข้อมูลบางส่วนอาจต้องเก็บไว้ตามระยะเวลาที่กฎหมายกำหนด เช่น เอกสารบัญชี ภาษี หรือหลักฐานการทำธุรกรรม
            เราจะจำกัดการใช้งานข้อมูลดังกล่าวให้เหลือเฉพาะวัตถุประสงค์ตามกฎหมาย
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
