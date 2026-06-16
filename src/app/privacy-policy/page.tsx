import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | Display Works Media",
  description: "นโยบายการเก็บ ใช้ และคุ้มครองข้อมูลส่วนบุคคลของ Display Works Media",
  alternates: { canonical: "https://displayworksmedia.com/privacy-policy" },
};

const sections = [
  {
    title: "ข้อมูลที่เราเก็บ",
    body: "เราเก็บข้อมูลที่คุณส่งให้โดยตรง เช่น ชื่อ เบอร์โทร LINE ID รายละเอียดงาน ไฟล์ประกอบ และข้อมูลที่จำเป็นสำหรับออกเอกสารหรือจัดส่งสินค้า",
  },
  {
    title: "วัตถุประสงค์การใช้งาน",
    body: "ข้อมูลใช้สำหรับติดต่อกลับ ประเมินราคา ผลิตงาน ออกเอกสาร จัดส่ง ให้บริการหลังการขาย และปรับปรุงประสบการณ์บนเว็บไซต์",
  },
  {
    title: "คุกกี้และการวิเคราะห์",
    body: "คุกกี้ที่จำเป็นใช้เพื่อให้เว็บไซต์ทำงาน ส่วน Google Analytics, Google Tag Manager และ Facebook Pixel จะเริ่มทำงานเมื่อคุณกดยอมรับทั้งหมดเท่านั้น",
  },
  {
    title: "การเปิดเผยข้อมูล",
    body: "เราไม่ขายข้อมูลส่วนบุคคล ข้อมูลอาจถูกส่งให้ผู้ให้บริการที่จำเป็น เช่น ระบบอีเมล ระบบฐานข้อมูล หรือบริษัทขนส่ง เฉพาะเท่าที่จำเป็นต่อการให้บริการ",
  },
  {
    title: "ระยะเวลาการเก็บข้อมูล",
    body: "เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการ การบัญชี และข้อกำหนดทางกฎหมาย จากนั้นจะลบหรือทำให้ไม่สามารถระบุตัวบุคคลได้",
  },
  {
    title: "สิทธิของเจ้าของข้อมูล",
    body: "คุณสามารถขอเข้าถึง แก้ไข ลบ จำกัดการใช้ หรือถอนความยินยอมได้ โดยติดต่อ info.displayworksmedia@gmail.com หรือโทร 065-916-1539",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="brand-interior min-h-screen bg-[#050806] text-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-20 pt-28 sm:px-6">
        <div className="section-label">PRIVACY POLICY</div>
        <h1 className="mt-5 font-kanit text-4xl font-extrabold sm:text-5xl">นโยบายความเป็นส่วนตัว</h1>
        <p className="mt-5 leading-8 text-[#A7B0C0]">ปรับปรุงล่าสุด: 15 มิถุนายน 2569</p>
        <div className="mt-10 space-y-5">
          {sections.map((section) => (
            <section key={section.title} className="brand-card border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-kanit text-xl font-bold">{section.title}</h2>
              <p className="mt-3 leading-8 text-[#A7B0C0]">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
