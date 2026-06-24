"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Lightbulb,
  MessageCircle,
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
  category?: string;
  alt?: string;
  href?: string;
};

type ServiceKey = "vinyl" | "sticker" | "ppboard" | "rollup" | "label" | "backdrop";

const servicePortfolioLabels: Record<ServiceKey, string> = {
  vinyl: "ป้ายไวนิล",
  sticker: "สติ๊กเกอร์",
  ppboard: "PP Board",
  rollup: "Roll Up",
  label: "ฉลากสินค้า",
  backdrop: "Backdrop",
};

const workflow = [
  { icon: Lightbulb, num: "01", title: "Brief", text: "รับบรีฟและเป้าหมายการใช้งาน" },
  { icon: Palette, num: "02", title: "Artwork", text: "ตรวจไฟล์และแนะนำการเตรียมงาน" },
  { icon: ShieldCheck, num: "03", title: "Material", text: "แนะนำวัสดุให้เหมาะกับพื้นที่จริง" },
  { icon: Printer, num: "04", title: "Production", text: "ประสานการผลิตตามสเปกที่ตกลง" },
  { icon: Settings, num: "05", title: "Check", text: "ตรวจความพร้อมก่อนส่งมอบ" },
  { icon: PackageCheck, num: "06", title: "Delivery", text: "จัดส่งทั่วประเทศ พร้อมแจ้งเลขพัสดุ" },
  { icon: Eye, num: "07", title: "Visibility", text: "ช่วยให้ธุรกิจของคุณมองเห็นชัดขึ้น" },
];

const servicePortfolio: Record<ServiceKey, PortfolioItem[]> = {
  vinyl: [
    { title: "ป้ายไวนิลหน้าร้าน", image: "/images/portfolio/1.png", meta: "ช่วยให้ร้านและโปรโมชันอ่านชัดจากระยะหน้าร้าน" },
    { title: "ป้ายโปรโมชั่น", image: "/images/portfolio/2.png", meta: "ใช้สื่อสารราคา เมนู หรือแคมเปญให้คนเห็นทันที" },
    { title: "ป้ายประชาสัมพันธ์", image: "/images/portfolio/3.png", meta: "ประสานขนาดและวัสดุให้เหมาะกับพื้นที่ติดตั้ง" },
    { title: "ป้ายกิจกรรม", image: "/images/portfolio/4.png", meta: "เหมาะกับงานชั่วคราว งานอีเวนต์ และพื้นที่กลางแจ้ง" },
  ],
  sticker: [
    { title: "สติ๊กเกอร์ตกแต่งกระจก", image: "/images/portfolio/sticker-1.jpg", meta: "เหมาะกับหน้าร้าน กระจกออฟฟิศ และพื้นที่ Indoor / Outdoor" },
    { title: "สติ๊กเกอร์ประชาสัมพันธ์", image: "/images/portfolio/sticker-2.jpg", meta: "ช่วยทำให้ข้อความแคมเปญดูชัดและติดตั้งเป็นระเบียบ" },
    { title: "สติ๊กเกอร์สำหรับธุรกิจ", image: "/images/portfolio/sticker-3.jpg", meta: "แนะนำวัสดุตามพื้นผิว การใช้งาน และงบประมาณ" },
    { title: "สติ๊กเกอร์ไดคัท", image: "/images/portfolio/sticker-4.jpg", meta: "ตัดตามรูปทรงโลโก้ ฉลาก หรือชิ้นงานเฉพาะแบรนด์" },
  ],
  ppboard: [
    { title: "PP Board โปรโมชั่น", image: "/images/portfolio/ppboard-1.png", meta: "น้ำหนักเบา เหมาะกับโปรโมชันหน้าร้านที่ต้องย้ายตำแหน่งได้" },
    { title: "Standee หน้าร้าน", image: "/images/portfolio/ppboard-2.png", meta: "ช่วยให้สินค้า เมนู หรือบริการเด่นขึ้นในพื้นที่ขาย" },
    { title: "ป้ายตั้งพื้น", image: "/images/portfolio/ppboard-3.png", meta: "ประเมินขนาดตามตำแหน่งวางและระยะมองเห็น" },
    { title: "สื่อประชาสัมพันธ์", image: "/images/portfolio/ppboard-4.png", meta: "เหมาะกับกิจกรรม งานเปิดตัว และสื่อแนะนำสินค้า" },
  ],
  rollup: [
    { title: "Roll Up สำหรับหน้าร้าน", image: "/images/portfolio/rollup-1.png", meta: "ติดตั้งง่าย เหมาะกับพื้นที่จำกัดและใช้งานซ้ำได้" },
    { title: "Roll Up สำหรับโปรโมชั่น", image: "/images/portfolio/rollup-2.png", meta: "ช่วยให้บูธ งานแสดงสินค้า และกิจกรรมดูพร้อมขึ้น" },
  ],
  label: [
    { title: "ฉลากสินค้าสำหรับบรรจุภัณฑ์", image: "/images/portfolio/sticker-1.png", meta: "ช่วยให้แพ็กเกจดูน่าเชื่อถือและสื่อสารแบรนด์ชัดขึ้น" },
    { title: "ฉลากสินค้ากันน้ำ", image: "/images/portfolio/sticker-2.png", meta: "เหมาะกับอาหาร เครื่องดื่ม และสินค้าที่ต้องเจอความชื้น" },
    { title: "ฉลากวงกลม", image: "/images/portfolio/sticker-3.png", meta: "ประเมินขนาดและจำนวนให้เหมาะกับรูปทรงสินค้า" },
    { title: "ฉลากไดคัท", image: "/images/portfolio/sticker-4.png", meta: "ตัดตามโลโก้หรือรูปทรงเฉพาะเพื่อเพิ่มมูลค่าสินค้า" },
  ],
  backdrop: [
    { title: "Backdrop งานอีเวนต์", image: "/images/portfolio/backdrop-1.png", meta: "สร้างฉากหลังที่ช่วยให้พื้นที่จัดงานดูเป็นแบรนด์เดียวกัน" },
    { title: "Backdrop เปิดตัวสินค้า", image: "/images/portfolio/backdrop-2.png", meta: "ช่วยให้จุดถ่ายภาพและเวทีสื่อสารสินค้าเด่นขึ้น" },
    { title: "Backdrop ถ่ายภาพ", image: "/images/portfolio/backdrop-3.png", meta: "แนะนำขนาดตามมุมกล้อง พื้นที่ และรูปแบบงาน" },
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
        title={cmsValue(cms, "shared.workflowTitle", "จากบรีฟ สู่สื่อที่พร้อมใช้งาน")}
        subtitle={cmsValue(cms, "shared.workflowSubtitle", "เริ่มจากการคุยความต้องการ ตรวจไฟล์ แนะนำวัสดุ ประสานการผลิต และจัดส่งให้พร้อมใช้งานจริง")}
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
  title = "ตัวอย่างงานจริง",
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
        subtitle={cmsValue(cms, "shared.portfolioSubtitle", "ตัวอย่างผลงานจริงที่ช่วยให้เห็นการใช้งาน ขนาด วัสดุ และบริบทของธุรกิจได้ชัดขึ้น")}
      />
      <div className={`home-portfolio-grid home-portfolio-count-${Math.min(items.length, 5)}`}>
        {items.slice(0, 5).map((item, index) => {
          const card = (
            <article key={`${item.title}-${index}`} className={index === 0 ? "home-portfolio-featured" : ""}>
              <Image src={item.image} alt={item.alt || item.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover home-portfolio-photo" />
              <div className="home-portfolio-caption">
                <small>{item.category || "งานจริง"}</small>
                <b>{item.title}</b>
                <span>{item.meta}</span>
              </div>
            </article>
          );
          return item.href ? (
            <Link key={`${item.title}-${index}`} href={item.href} className="home-portfolio-link">
              {card}
            </Link>
          ) : card;
        })}
      </div>
      <div className="home-center-action">
        <Link href="/portfolio" className="home-btn home-btn-dark fx-button">
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
        <p className="shared-quote-intro">{cmsValue(cms, "shared.quoteSubtitle", "ยังไม่แน่ใจเรื่องขนาด วัสดุ หรือไฟล์งาน ทัก LINE ให้ทีมช่วยแนะนำก่อนได้ หรือกรอกข้อมูลเพื่อให้เราประเมินราคาเบื้องต้น")}</p>
        <a className="home-btn home-btn-line fx-button shared-line-cta" href="https://lin.ee/O0nPl03" target="_blank" rel="noopener noreferrer">
          ปรึกษาทาง LINE <MessageCircle size={15} />
        </a>
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
  const items = servicePortfolio[serviceKey].map((item) => ({
    ...item,
    category: item.category || servicePortfolioLabels[serviceKey],
  }));

  return (
    <div className="shared-service-sections">
      <SharedPortfolio items={items} />
      <SharedWorkflow />
      <SharedQuoteSection />
    </div>
  );
}
