import Image from "next/image";
import Link from "next/link";

type PortfolioItem = {
  id?: string;
  img?: string;
  image?: string;
  title?: string;
  category?: string;
  desc?: string;
  meta?: string;
  href?: string;
  alt?: string;
};

const defaultPortfolio: PortfolioItem[] = [
  {
    id: "1",
    img: "/images/portfolio/work-01.webp",
    title: "ป้ายไวนิลหน้าร้าน",
    category: "ป้ายไวนิล",
    desc: "ตัวอย่างงานป้ายที่ช่วยให้หน้าร้านอ่านชัด เห็นโปรโมชัน และสื่อสารแบรนด์ได้เร็วขึ้น",
    href: "/services/vinyl-banner",
  },
  {
    id: "2",
    img: "/images/portfolio/work-02.webp",
    title: "สื่อออกบูธและงานอีเวนต์",
    category: "Event Media",
    desc: "รวมสื่อหลายรูปแบบสำหรับพื้นที่ขาย งานแสดงสินค้า และกิจกรรมทางธุรกิจ",
    href: "/services/printing-media",
  },
  {
    id: "3",
    img: "/images/portfolio/sticker-1.jpg",
    title: "สติ๊กเกอร์ติดกระจก",
    category: "Sticker",
    desc: "สื่อสารแบรนด์บนพื้นผิวจริง เหมาะกับหน้าร้าน กระจก และงานตกแต่งพื้นที่",
    href: "/services/sticker",
  },
  {
    id: "4",
    img: "/images/portfolio/ppboard-1.png",
    title: "PP Board / Standee",
    category: "PP Board",
    desc: "ป้ายตั้งพื้นและสื่อโปรโมชันที่เคลื่อนย้ายง่าย เหมาะกับจุดขายและงานเปิดตัว",
    href: "/services/pp-board",
  },
  {
    id: "5",
    img: "/images/portfolio/backdrop-1.png",
    title: "Backdrop งานอีเวนต์",
    category: "Backdrop",
    desc: "สร้างฉากหลัง จุดถ่ายภาพ และพื้นที่แบรนด์ให้ดูพร้อมใช้งานจริง",
    href: "/services/backdrop",
  },
  {
    id: "6",
    img: "/images/portfolio/work-06.webp",
    title: "ฉลากสินค้าและแพ็กเกจ",
    category: "Label Sticker",
    desc: "เพิ่มความน่าเชื่อถือให้สินค้าและช่วยให้แพ็กเกจดูเป็นแบรนด์มากขึ้น",
    href: "/services/label-sticker",
  },
];

function normalizePortfolio(items?: PortfolioItem[]) {
  const source = Array.isArray(items) && items.length > 0 ? items : defaultPortfolio;

  return source
    .filter((item) => item?.img || item?.image)
    .map((item, index) => ({
      id: item.id || String(index + 1),
      img: item.img || item.image || "",
      title: item.title || item.category || `ผลงาน ${index + 1}`,
      category: item.category || "งานจริง",
      desc:
        item.desc ||
        item.meta ||
        "ตัวอย่างงานที่ใช้กับธุรกิจจริง ช่วยให้เห็นวัสดุ ขนาด และบริบทก่อนเริ่มสั่งผลิต",
      href: item.href || "/portfolio",
      alt: item.alt || item.title || item.category || `ผลงาน Display Works Media ${index + 1}`,
    }));
}

export default function Portfolio({ items }: { items?: PortfolioItem[] }) {
  const portfolioItems = normalizePortfolio(items);

  return (
    <section
      id="portfolio"
      className="brand-section px-5 py-20 sm:px-6 sm:py-28 lg:px-8"
      style={{ background: "#0D121A" }}
    >
      <div className="mx-auto max-w-[1380px]">
        <div className="reveal-section mb-14">
          <div className="section-label">PORTFOLIO</div>
          <h2 className="section-title">ผลงานของเรา</h2>
          <p className="section-sub">
            ตัวอย่างงานจริงที่ใช้กับธุรกิจหลายประเภท เพื่อช่วยให้เลือกวัสดุ ขนาด และรูปแบบงานได้มั่นใจขึ้น
          </p>
        </div>

        <div className="portfolio-proof-grid">
          {portfolioItems.map((item) => (
            <article key={item.id} className="portfolio-proof-card group reveal-item">
              <Link href={item.href} className="portfolio-proof-link">
                <div className="portfolio-proof-media">
                  <Image
                    src={item.img}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span>{item.category}</span>
                </div>
                <div className="portfolio-proof-copy">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <b>ดูรายละเอียดงาน →</b>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="reveal-section mt-12 text-center">
          <a href="#quote" className="btn-primary">
            ปรึกษางานและประเมินราคาเบื้องต้น
          </a>
        </div>
      </div>
    </section>
  );
}
