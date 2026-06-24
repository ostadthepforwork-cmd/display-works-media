import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";

export const metadata: Metadata = {
  title: "ผลงานป้ายและสื่อโฆษณา | Display Works Media",
  description:
    "ตัวอย่างผลงานจริงของ Display Works Media ทั้งป้ายไวนิล สติ๊กเกอร์ PP Board Roll Up Backdrop ฉลากสินค้า และสื่อสำหรับธุรกิจ",
  alternates: { canonical: "https://displayworksmedia.com/portfolio" },
};

const portfolioItems = [
  {
    title: "ป้ายไวนิลหน้าร้านอาหาร",
    category: "ป้ายไวนิล",
    image: "/images/portfolio/work-01.webp",
    desc: "ช่วยให้เมนู โปรโมชัน และตัวตนร้านอ่านชัดจากหน้าร้าน เหมาะกับร้านอาหารและธุรกิจที่ต้องการดึงสายตา",
    href: "/services/vinyl-banner",
  },
  {
    title: "สื่อแสดงสินค้าและบูธ",
    category: "Event Media",
    image: "/images/portfolio/work-02.webp",
    desc: "รวมสื่อหลายรูปแบบให้พื้นที่อีเวนต์ดูพร้อมและน่าเชื่อถือ ตั้งแต่บูธ จุดขาย ไปจนถึงงานเปิดตัว",
    href: "/services/printing-media",
  },
  {
    title: "Backdrop งานอีเวนต์",
    category: "Backdrop",
    image: "/images/portfolio/work-03.webp",
    desc: "สร้างจุดถ่ายภาพ เวที และพื้นที่แบรนด์สำหรับงานสำคัญ ให้สื่อสารภาพลักษณ์ได้ชัดขึ้น",
    href: "/services/backdrop",
  },
  {
    title: "สติ๊กเกอร์สำหรับหน้าร้าน",
    category: "Sticker",
    image: "/images/portfolio/sticker-1.jpg",
    desc: "ตกแต่งกระจกหรือพื้นที่ขายให้สื่อสารแบรนด์ชัดขึ้น เหมาะกับหน้าร้าน คาเฟ่ และพื้นที่บริการ",
    href: "/services/sticker",
  },
  {
    title: "PP Board / Standee",
    category: "PP Board",
    image: "/images/portfolio/ppboard-1.png",
    desc: "เหมาะกับสื่อโปรโมชัน จุดขาย และป้ายตั้งพื้นที่เคลื่อนย้ายง่าย ใช้งานได้ทั้งร้านและอีเวนต์",
    href: "/services/pp-board",
  },
  {
    title: "ฉลากสินค้าและแพ็กเกจ",
    category: "Label Sticker",
    image: "/images/portfolio/work-06.webp",
    desc: "เพิ่มความน่าเชื่อถือให้สินค้าและช่วยให้แพ็กเกจดูเป็นแบรนด์มากขึ้น เหมาะกับสินค้า SME",
    href: "/services/label-sticker",
  },
];

export default function PortfolioPage() {
  return (
    <main className="brand-interior min-h-screen bg-[#050806] text-white" style={{ fontFamily: "'Prompt','Sarabun',sans-serif" }}>
      <Navbar />

      <section className="brand-section px-5 pb-12 pt-[132px] sm:px-6 lg:px-8 lg:pb-16">
        <div className="mx-auto max-w-[1380px] text-center">
          <div className="section-label mx-auto w-fit">OUR WORK</div>
          <h1 className="mx-auto mt-5 max-w-4xl font-kanit text-4xl font-extrabold leading-tight text-white lg:text-6xl">
            ผลงานจริงที่ช่วยให้ธุรกิจมองเห็นชัดขึ้น
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#A7B0C0] lg:text-lg">
            รวมตัวอย่างงานป้าย งานพิมพ์ และสื่อโฆษณาที่ใช้กับธุรกิจจริง เพื่อให้เห็นภาพขนาด วัสดุ และบริบทการใช้งานก่อนเริ่มสั่งผลิต
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="https://lin.ee/O0nPl03" target="_blank" rel="noopener noreferrer" className="home-btn home-btn-line fx-button h-12 px-6">
              ปรึกษาทาง LINE <MessageCircle size={16} />
            </a>
            <Link href="/services" className="home-btn home-btn-orange fx-button h-12 px-6">
              ดูบริการทั้งหมด <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-6 lg:px-8">
        <div className="portfolio-proof-grid mx-auto max-w-[1380px]">
          {portfolioItems.map((item) => (
            <article key={item.title} className="portfolio-proof-card group">
              <Link href={item.href} className="portfolio-proof-link">
                <div className="portfolio-proof-media">
                  <Image
                    src={item.image}
                    alt={`${item.title} Display Works Media`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span>{item.category}</span>
                </div>
                <div className="portfolio-proof-copy">
                  <h2>{item.title}</h2>
                  <p>{item.desc}</p>
                  <b>ดูบริการที่เกี่ยวข้อง →</b>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </main>
  );
}
