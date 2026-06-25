"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  MessageCircle,
  Printer,
  Truck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlogSection from "@/components/BlogSection";
import type { BlogPost } from "@/components/BlogSection";
import {
  SharedPortfolio,
  SharedQuoteSection,
  SharedSectionTitle,
  SharedWorkflow,
} from "@/components/SharedMarketingSections";
import Reviews from "@/components/Reviews";
import { cmsValue, useCmsSettings } from "@/components/CmsSettingsProvider";

type CmsSettings = {
  hero?: Record<string, any>;
  services?: Array<Record<string, any>>;
  portfolio?: Array<Record<string, any>>;
  contact?: Record<string, any>;
  reviews?: Array<Record<string, any>>;
  page_content?: Record<string, any>;
};

const fallbackServices = [
  { name: "ป้ายไวนิล", desc: "เหมาะกับป้ายหน้าร้าน โปรโมชัน และป้ายกลางแจ้งที่ต้องเห็นชัด", image: "/images/services/vinyl.jpg", href: "/services/vinyl-banner" },
  { name: "สติ๊กเกอร์", desc: "สำหรับติดกระจก ฉลากสินค้า โลโก้แบรนด์ และงานกันน้ำ", image: "/images/services/sticker.jpg", href: "/services/sticker" },
  { name: "PP Board / Standee", desc: "เหมาะกับป้ายตั้งพื้น หน้าร้าน อีเวนต์ และโปรโมชันชั่วคราว", image: "/images/services/ppboard.jpg", href: "/services/pp-board" },
  { name: "Roll Up / X-Stand", desc: "สื่อออกบูธที่พกพาง่าย ติดตั้งเร็ว และใช้งานซ้ำได้", image: "/images/services/rollup-xstand.jpg", href: "/services/roll-up" },
  { name: "Backdrop", desc: "สำหรับเวที จุดถ่ายภาพ งานเปิดตัวสินค้า และบูธอีเวนต์", image: "/images/services/backdrop.jpg", href: "/services/backdrop" },
  { name: "อื่นๆ", desc: "สื่อส่งเสริมการขายสำหรับร้านค้า SME และแบรนด์สินค้า", image: "/images/portfolio/work-06.webp", href: "/services" },
];

const fallbackPortfolio = [
  { title: "ป้ายไวนิลหน้าร้านอาหาร", category: "ป้ายไวนิล", image: "/images/portfolio/work-01.webp", meta: "ช่วยให้เมนูและโปรโมชันอ่านง่ายจากหน้าร้าน" },
  { title: "บูธและสื่อแสดงสินค้า", category: "อีเวนต์", image: "/images/portfolio/work-02.webp", meta: "รวมสื่อหลายชิ้นให้แบรนด์ดูพร้อมในงานอีเวนต์" },
  { title: "ฉลากสินค้า", category: "สติ๊กเกอร์", image: "/images/portfolio/work-06.webp", meta: "เพิ่มความน่าเชื่อถือให้แพ็กเกจสินค้า" },
  { title: "Backdrop งานอีเวนต์", category: "Backdrop", image: "/images/portfolio/work-03.webp", meta: "สร้างจุดถ่ายภาพและพื้นที่แบรนด์ที่ชัดเจน" },
  { title: "งานพิมพ์แคมเปญ", category: "สื่อโฆษณา", image: "/images/portfolio/work-05.webp", meta: "สื่อโปรโมชันที่ช่วยให้ข้อเสนอเห็นชัดขึ้น" },
];

const servicePortfolioMeta: Record<string, { category: string; href: string }> = {
  vinyl: { category: "ป้ายไวนิล", href: "/services/vinyl-banner" },
  sticker: { category: "สติ๊กเกอร์", href: "/services/sticker" },
  ppboard: { category: "PP Board", href: "/services/pp-board" },
  rollup: { category: "Roll Up / X-Stand", href: "/services/roll-up" },
  label: { category: "ฉลากสินค้า", href: "/services/label-sticker" },
  backdrop: { category: "Backdrop", href: "/services/backdrop" },
};

const trustItems = [
  { icon: Printer, title: "ทีมงานมืออาชีพ", text: "ประสบการณ์มากกว่า 10 ปี" },
  { icon: FileCheck2, title: "ตรวจไฟล์ก่อนผลิต", text: "ลดความผิดพลาด" },
  { icon: CheckCircle2, title: "งานคุณภาพ", text: "วัสดุคุณภาพสูง" },
  { icon: Truck, title: "จัดส่งทั่วประเทศ", text: "รวดเร็ว ตรงเวลา" },
];

function normalizeServices(items?: Array<Record<string, any>>) {
  if (!items?.length) return fallbackServices;
  return items.slice(0, 6).map((item, index) => ({
    name: item.name || fallbackServices[index]?.name || "บริการงานพิมพ์",
    desc: item.desc || fallbackServices[index]?.desc || "",
    image: item.image || item.img || fallbackServices[index]?.image,
    href: item.href || item.url || fallbackServices[index]?.href || "/services",
  }));
}

function normalizePortfolioItem(item: Record<string, any>, index: number, serviceKey?: string) {
  const service = serviceKey ? servicePortfolioMeta[serviceKey] : null;
  return {
    title: item.title || item.category || fallbackPortfolio[index]?.title || "ผลงานของเรา",
    image: item.image || item.img || fallbackPortfolio[index]?.image,
    meta: item.meta || item.desc || item.category || fallbackPortfolio[index]?.meta || "ผลงานจริงจากลูกค้า",
    category: item.category || service?.category || fallbackPortfolio[index]?.category || "งานจริง",
    alt: item.alt || item.altText || item.title || fallbackPortfolio[index]?.title || "ผลงาน Display Works Media",
    href: item.href || item.url || service?.href || "",
  };
}

function collectServicePortfolio(content: CmsSettings) {
  const details = content.page_content?.servicesDetail || {};
  return Object.keys(servicePortfolioMeta).flatMap((serviceKey) => {
    const items = details?.[serviceKey]?.portfolioItems;
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => (item?.image || item?.img) && item?.title)
      .map((item, index) => normalizePortfolioItem(item, index, serviceKey));
  });
}

function mergePortfolio(content: CmsSettings) {
  const cmsPortfolio = Array.isArray(content.portfolio)
    ? content.portfolio
        .filter((item) => item?.image || item?.img)
        .map((item, index) => normalizePortfolioItem(item, index))
    : [];
  const servicePortfolio = collectServicePortfolio(content);
  const fallback = fallbackPortfolio.map((item, index) => normalizePortfolioItem(item, index));
  const seen = new Set<string>();

  return [...cmsPortfolio, ...servicePortfolio, ...fallback].filter((item) => {
    if (!item.image) return false;
    const key = `${item.image}|${item.title}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function HomeExperience({ cms, posts }: { cms: CmsSettings; posts: BlogPost[] }) {
  const liveCms = useCmsSettings();
  const content = { ...cms, ...liveCms } as CmsSettings;
  const services = normalizeServices(content.services);
  const portfolio = mergePortfolio(content);
  const hero = content.hero || {};
  const lineUrl = hero.lineUrl || content.contact?.lineUrl || content.contact?.line || "https://lin.ee/O0nPl03";
  const liveTrustItems = trustItems.map((item, index) => ({
    ...item,
    title: hero.trustPoints?.[index] || item.title,
  }));

  return (
    <main className="home-premium min-h-screen text-white">
      <section className="home-shell">
        <Navbar />

        <section className="home-hero">
          <Image
            src={hero.bgImage || "/images/hero-bg-home.jpg"}
            alt="เครื่องพิมพ์งานป้ายและสื่อโฆษณา Display Works Media"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="home-hero-shade" />
          <div className="home-hero-edge" />
          <div className="home-hero-copy">
            <h1>
              {hero.headline1 || "รับทำป้ายและสื่อโฆษณา"}
              <span>{hero.headlineHighlight || "ให้ธุรกิจของคุณมองเห็นชัดขึ้น"}</span>
            </h1>
            <p>{hero.subheadline || "ป้ายไวนิล สติ๊กเกอร์ PP Board Roll Up Backdrop และสื่อหน้าร้านสำหรับธุรกิจ รับบรีฟ ตรวจไฟล์ แนะนำวัสดุ ประสานการผลิต และจัดส่งทั่วประเทศ"}</p>
            <div className="home-hero-actions">
              <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="home-btn home-btn-line">ปรึกษาทาง LINE <MessageCircle size={15} /></a>
              <a href="#quote" className="home-btn home-btn-orange">ส่งข้อมูลขอราคา <ArrowRight size={15} /></a>
            </div>
          </div>
        </section>

        <div className="home-trust-grid">
          {liveTrustItems.map(({ icon: Icon, title, text }) => (
            <div key={title}><Icon /><span><b>{title}</b><small>{text}</small></span></div>
          ))}
        </div>

        <SharedWorkflow />

        <SharedPortfolio items={portfolio} maxItems={8} />

        <section id="services" className="home-section">
          <SharedSectionTitle
            eyebrow={cmsValue(content as any, "home.servicesEyebrow", "OUR SERVICES")}
            title={cmsValue(content as any, "home.servicesTitle", "บริการของเรา")}
            subtitle={cmsValue(content as any, "home.servicesSubtitle", "เลือกประเภทงานที่ต้องการ แล้วให้ทีมช่วยแนะนำขนาด วัสดุ และวิธีเตรียมไฟล์ให้เหมาะกับการใช้งานจริง")}
          />
          <div className="home-service-grid">
            {services.map((service) => (
              <Link key={service.name} href={service.href} className="home-service-card">
                <div className="home-service-image"><Image src={service.image} alt={service.name} fill sizes="(max-width: 768px) 28vw, 16vw" className="object-cover" /></div>
                <div><h3>{service.name}</h3><p>{service.desc}</p><span>ดูรายละเอียด <ArrowRight size={11} /></span></div>
              </Link>
            ))}
          </div>
          <div className="home-center-action"><Link href="/services" className="home-btn home-btn-dark">ดูบริการทั้งหมด <ArrowRight size={14} /></Link></div>
        </section>

        <BlogSection initialPosts={posts} />

        <Reviews items={content.reviews} />

        <SharedQuoteSection />

        <Footer />
      </section>
    </main>
  );
}
