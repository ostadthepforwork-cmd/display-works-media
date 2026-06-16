import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="brand-interior min-h-screen bg-[#050806] text-white">
      <Navbar />
      <main className="flex min-h-[70vh] items-center justify-center px-5 pb-20 pt-28 text-center">
        <div className="max-w-2xl">
          <div className="section-label">404 NOT FOUND</div>
          <h1 className="mt-6 font-kanit text-5xl font-extrabold sm:text-7xl">ไม่พบหน้าที่คุณต้องการ</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#A7B0C0]">
            ลิงก์อาจถูกเปลี่ยนหรือหน้านี้ไม่มีอยู่แล้ว คุณสามารถกลับหน้าแรกหรือสอบถามทีมงานได้ทันที
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="brand-button brand-button-primary"><ArrowLeft size={17} /> กลับหน้าแรก</Link>
            <a href="https://lin.ee/O0nPl03" className="brand-button brand-button-line"><MessageCircle size={17} /> LINE</a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
