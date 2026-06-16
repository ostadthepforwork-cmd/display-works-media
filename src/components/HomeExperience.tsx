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
  { name: "ป้ายไวนิล", desc: "ป้ายโฆษณาพิมพ์สีสด ทนแดด ทนฝน", image: "/images/services/vinyl.jpg", href: "/services/vinyl-banner" },
  { name: "สติ๊กเกอร์", desc: "สติ๊กเกอร์คุณภาพดี ติดได้ทุกพื้นผิว", image: "/images/services/sticker.jpg", href: "/services/sticker" },
  { name: "PP Board / Standee", desc: "น้ำหนักเบา เหมาะกับหน้าร้านและอีเวนต์", image: "/images/services/ppboard.jpg", href: "/services/pp-board" },
  { name: "Roll Up / X-Stand", desc: "พกพาสะดวก ติดตั้งง่ายสำหรับออกบูธ", image: "/images/services/rollup-xstand.jpg", href: "/services/roll-up" },
  { name: "Backdrop", desc: "ฉากหลังงานอีเวนต์และงานประชาสัมพันธ์", image: "/images/services/backdrop.jpg", href: "/services/backdrop" },
  { name: "อื่นๆ", desc: "สื่อโฆษณาและงานพิมพ์สำหรับธุรกิจ", image: "/images/portfolio/work-06.webp", href: "/services" },
];

const fallbackPortfolio = [
  { title: "ป้ายไวนิล หน้าร้านอาหาร", image: "/images/portfolio/work-01.webp", meta: "ป้ายหน้าร้านและสื่อโปรโมชั่น" },
  { title: "บูธและสื่อแสดงสินค้า", image: "/images/portfolio/work-02.webp", meta: "งานอีเวนต์และนิทรรศการ" },
  { title: "ฉลากสินค้า", image: "/images/portfolio/work-06.webp", meta: "สติ๊กเกอร์สินค้าและแพ็กเกจจิ้ง" },
  { title: "Backdrop งานอีเวนต์", image: "/images/portfolio/work-03.webp", meta: "ฉากหลังและพื้นที่ถ่ายภาพ" },
  { title: "งานพิมพ์แคมเปญ", image: "/images/portfolio/work-05.webp", meta: "สื่อโฆษณาสำหรับแบรนด์" },
];

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

function normalizePortfolio(items?: Array<Record<string, any>>) {
  if (!items?.length) return fallbackPortfolio;
  return items.slice(0, 5).map((item, index) => ({
    title: item.title || item.category || fallbackPortfolio[index]?.title || "ผลงานของเรา",
    image: item.image || item.img || fallbackPortfolio[index]?.image,
    meta: item.meta || item.category || fallbackPortfolio[index]?.meta || "ผลงานจริงจากลูกค้า",
  }));
}

export default function HomeExperience({ cms, posts }: { cms: CmsSettings; posts: BlogPost[] }) {
  const liveCms = useCmsSettings();
  const content = { ...cms, ...liveCms } as CmsSettings;
  const services = normalizeServices(content.services);
  const portfolio = normalizePortfolio(content.portfolio);
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
            <p>{hero.subheadline || "เราเปลี่ยนไอเดียให้กลายเป็นสื่อที่ดึงดูด และสร้างการจดจำให้กับแบรนด์ของคุณ"}</p>
            <div className="home-hero-actions">
              <a href="#quote" className="home-btn home-btn-orange">ขอใบเสนอราคา <ArrowRight size={15} /></a>
              <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="home-btn home-btn-dark">ปรึกษาทาง LINE <MessageCircle size={15} /></a>
            </div>
          </div>
        </section>

        <div className="home-trust-grid">
          {liveTrustItems.map(({ icon: Icon, title, text }) => (
            <div key={title}><Icon /><span><b>{title}</b><small>{text}</small></span></div>
          ))}
        </div>

        <SharedWorkflow />

        <SharedPortfolio items={portfolio} />

        <section id="services" className="home-section">
          <SharedSectionTitle
            eyebrow={cmsValue(content as any, "home.servicesEyebrow", "OUR SERVICES")}
            title={cmsValue(content as any, "home.servicesTitle", "บริการของเรา")}
            subtitle={cmsValue(content as any, "home.servicesSubtitle", "ครบวงจรทุกงาน ตั้งแต่ขั้นตอนการออกแบบ ผลิต จนถึงการจัดส่ง")}
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
