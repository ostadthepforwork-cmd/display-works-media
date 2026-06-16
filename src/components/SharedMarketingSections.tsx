"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Lightbulb,
  PackageCheck,
  Palette,
  Printer,
  Settings,
  ShieldCheck,
} from "lucide-react";
import CompactQuoteForm from "@/components/CompactQuoteForm";
import { cmsValue, useCmsSettings } from "@/components/CmsSettingsProvider";

export type PortfolioItem = {
  title: string;
  image: string;
  meta: string;
};

type ServiceKey = "vinyl" | "sticker" | "ppboard" | "rollup" | "label" | "backdrop";

const workflow = [
  { icon: Lightbulb, num: "01", title: "Idea", text: "รับฟังและวิเคราะห์ความต้องการ" },
  { icon: Palette, num: "02", title: "Artwork", text: "ออกแบบและวางแผนงาน" },
  { icon: ShieldCheck, num: "03", title: "Material", text: "คัดสรรวัสดุคุณภาพสูง" },
  { icon: Printer, num: "04", title: "Printing", text: "พิมพ์ด้วยเครื่องมือที่ทันสมัย" },
  { icon: Settings, num: "05", title: "Production", text: "ผลิตด้วยมาตรฐานมืออาชีพ" },
  { icon: PackageCheck, num: "06", title: "Delivery", text: "จัดส่งทั่วประเทศ รวดเร็วตรงเวลา" },
  { icon: Eye, num: "07", title: "Visibility", text: "ช่วยให้ธุรกิจของคุณมองเห็นชัดขึ้น" },
];

const servicePortfolio: Record<ServiceKey, PortfolioItem[]> = {
  vinyl: [
    { title: "ป้ายไวนิลหน้าร้าน", image: "/images/portfolio/1.png", meta: "งานพิมพ์สีคมชัดสำหรับหน้าร้าน" },
    { title: "ป้ายโปรโมชั่น", image: "/images/portfolio/2.png", meta: "สื่อส่งเสริมการขายสำหรับธุรกิจ" },
    { title: "ป้ายประชาสัมพันธ์", image: "/images/portfolio/3.png", meta: "ผลิตตามขนาดและพื้นที่ใช้งาน" },
    { title: "ป้ายกิจกรรม", image: "/images/portfolio/4.png", meta: "รองรับงานภายในและภายนอก" },
  ],
  sticker: [
    { title: "สติ๊กเกอร์ตกแต่งกระจก", image: "/images/portfolio/sticker-1.jpg", meta: "งาน Indoor / Outdoor" },
    { title: "สติ๊กเกอร์ประชาสัมพันธ์", image: "/images/portfolio/sticker-2.jpg", meta: "พิมพ์สีคมชัด ติดตั้งเรียบร้อย" },
    { title: "สติ๊กเกอร์สำหรับธุรกิจ", image: "/images/portfolio/sticker-3.jpg", meta: "เลือกวัสดุให้เหมาะกับพื้นผิว" },
    { title: "สติ๊กเกอร์ไดคัท", image: "/images/portfolio/sticker-4.jpg", meta: "ผลิตตามรูปทรงที่ต้องการ" },
  ],
  ppboard: [
    { title: "PP Board โปรโมชั่น", image: "/images/portfolio/ppboard-1.png", meta: "น้ำหนักเบา เคลื่อนย้ายสะดวก" },
    { title: "Standee หน้าร้าน", image: "/images/portfolio/ppboard-2.png", meta: "เหมาะกับร้านค้าและกิจกรรม" },
    { title: "ป้ายตั้งพื้น", image: "/images/portfolio/ppboard-3.png", meta: "ผลิตตามขนาดที่ต้องการ" },
    { title: "สื่อประชาสัมพันธ์", image: "/images/portfolio/ppboard-4.png", meta: "งานพิมพ์พร้อมใช้งาน" },
  ],
  rollup: [
    { title: "Roll Up สำหรับหน้าร้าน", image: "/images/portfolio/rollup-1.png", meta: "ติดตั้งง่าย พกพาสะดวก" },
    { title: "Roll Up สำหรับโปรโมชั่น", image: "/images/portfolio/rollup-2.png", meta: "เหมาะกับงานแสดงสินค้าและกิจกรรม" },
  ],
  label: [
    { title: "ฉลากสินค้าสำหรับบรรจุภัณฑ์", image: "/images/portfolio/sticker-1.png", meta: "สติ๊กเกอร์ฉลากสินค้าพร้อมใช้งาน" },
    { title: "ฉลากสินค้ากันน้ำ", image: "/images/portfolio/sticker-2.png", meta: "เหมาะกับอาหาร เครื่องดื่ม และสินค้า" },
    { title: "ฉลากวงกลม", image: "/images/portfolio/sticker-3.png", meta: "ผลิตตามขนาดและจำนวนที่ต้องการ" },
    { title: "ฉลากไดคัท", image: "/images/portfolio/sticker-4.png", meta: "ตัดตามรูปทรงและโลโก้ของแบรนด์" },
  ],
  backdrop: [
    { title: "Backdrop งานอีเวนต์", image: "/images/portfolio/backdrop-1.png", meta: "ฉากหลังสำหรับพื้นที่จัดงาน" },
    { title: "Backdrop เปิดตัวสินค้า", image: "/images/portfolio/backdrop-2.png", meta: "สร้างจุดเด่นให้แบรนด์" },
    { title: "Backdrop ถ่ายภาพ", image: "/images/portfolio/backdrop-3.png", meta: "ออกแบบตามธีมงาน" },
  ],
};

export function SharedSectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="home-section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

export function SharedWorkflow({ id = "process" }: { id?: string }) {
  const cms = useCmsSettings();
  return (
    <section id={id} className="home-section home-process-section shared-marketing-section">
      <SharedSectionTitle
        eyebrow={cmsValue(cms, "shared.workflowEyebrow", "OUR PROCESS")}
        title={cmsValue(cms, "shared.workflowTitle", "จากไอเดีย สู่การมองเห็น")}
        subtitle={cmsValue(cms, "shared.workflowSubtitle", "กระบวนการทำงานที่ใส่ใจในทุกรายละเอียด เพื่อผลงานที่มีคุณภาพและตรงตามเป้าหมาย")}
      />
      <div className="home-workflow-grid">
        {workflow.map(({ icon: Icon, num, title, text }, index) => (
          <div key={num} className="home-workflow-item">
            {index < workflow.length - 1 && <span className="home-workflow-line" />}
            <Icon />
            <b><em>{num}</em> {title}</b>
            <small>{text}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedPortfolio({
  items,
  id = "portfolio",
  title = "ผลงานของเรา",
}: {
  items: PortfolioItem[];
  id?: string;
  title?: string;
}) {
  const cms = useCmsSettings();
  return (
    <section id={id} className="home-section shared-marketing-section">
      <SharedSectionTitle
        eyebrow={cmsValue(cms, "shared.portfolioEyebrow", "OUR WORK")}
        title={cmsValue(cms, "shared.portfolioTitle", title)}
        subtitle={cmsValue(cms, "shared.portfolioSubtitle", "ตัวอย่างผลงานจริงที่ผลิตและส่งมอบให้ลูกค้า ด้วยมาตรฐานเดียวกันในทุกประเภทงาน")}
      />
      <div className={`home-portfolio-grid home-portfolio-count-${Math.min(items.length, 5)}`}>
        {items.slice(0, 5).map((item, index) => (
          <article key={`${item.title}-${index}`} className={index === 0 ? "home-portfolio-featured" : ""}>
            <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            <div><b>{item.title}</b><span>{item.meta}</span></div>
          </article>
        ))}
      </div>
      <div className="home-center-action">
        <Link href="/#portfolio" className="home-btn home-btn-dark">
          ดูผลงานทั้งหมด <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

export function SharedQuoteSection({ id = "quote" }: { id?: string }) {
  const cms = useCmsSettings();
  const quoteTitle = cmsValue(cms, "shared.quoteTitle", "มีงานอยู่?\nเราช่วยดูแลให้");
  return (
    <section id={id} className="home-quote-section shared-marketing-section">
      <div className="home-quote-copy">
        <span>{cmsValue(cms, "shared.quoteEyebrow", "FREE CONSULTATION")}</span>
        <h2>{quoteTitle.split("\n").map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</h2>
        <p className="shared-quote-intro">{cmsValue(cms, "shared.quoteSubtitle", "กรอกรายละเอียดงาน ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง")}</p>
        <ul>
          <li><ShieldCheck /> ไม่มีค่าใช้จ่ายในการประเมินราคา</li>
          <li><ShieldCheck /> ตอบกลับภายใน 24 ชั่วโมง</li>
          <li><ShieldCheck /> ให้คำปรึกษาฟรีก่อนตัดสินใจ</li>
          <li><ShieldCheck /> ยังไม่มีไฟล์งานก็สอบถามได้</li>
        </ul>
      </div>
      <CompactQuoteForm />
    </section>
  );
}

export default function SharedServiceSections({ serviceKey }: { serviceKey: ServiceKey }) {
  return (
    <div className="shared-service-sections">
      <SharedPortfolio items={servicePortfolio[serviceKey]} />
      <SharedWorkflow />
      <SharedQuoteSection />
    </div>
  );
}
