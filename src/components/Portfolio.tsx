import Image from "next/image";

const defaultPortfolio = [
  "/images/portfolio/work-01.webp",
  "/images/portfolio/work-02.webp",
  "/images/portfolio/work-03.webp",
  "/images/portfolio/work-04.webp",
  "/images/portfolio/work-05.webp",
  "/images/portfolio/work-06.webp",
  "/images/portfolio/work-07.webp",
  "/images/portfolio/work-08.webp",
  "/images/portfolio/work-09.webp",
].map((img, index) => ({
  id: String(index + 1),
  img,
  title: `ผลงาน ${index + 1}`,
}));

type PortfolioItem = {
  id?: string;
  img?: string;
  image?: string;
  title?: string;
  category?: string;
};

function normalizePortfolio(items?: PortfolioItem[]) {
  if (!Array.isArray(items) || items.length === 0) return defaultPortfolio;

  return items
    .filter((item) => item?.img || item?.image)
    .map((item, index) => ({
      id: item.id || String(index),
      img: item.img || item.image || "",
      title: item.title || item.category || `ผลงาน ${index + 1}`,
    }));
}

export default function Portfolio({ items }: { items?: PortfolioItem[] }) {
  const portfolioItems = normalizePortfolio(items);

  return (
    <section
      id="portfolio"
      className="brand-section py-20 sm:py-28 px-5 sm:px-6 lg:px-8"
      style={{ background: "#0D121A" }}
    >
      <div className="max-w-[1380px] mx-auto">
        <div className="reveal-section mb-14">
          <div className="section-label">PORTFOLIO</div>
          <h2 className="section-title">ผลงานของเรา</h2>
          <p className="section-sub">
            ตัวอย่างผลงานที่เราภาคภูมิใจ และส่งมอบให้ลูกค้าในหลากหลายธุรกิจ
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
          {portfolioItems.map((item, index) => (
            <div
              key={item.id || index}
              className={`group relative overflow-hidden rounded-md reveal-item ${
                index % 5 === 0 || index % 5 === 3 ? "md:col-span-5" : "md:col-span-4"
              } ${index % 5 === 2 ? "md:col-span-3" : ""}`}
              style={{ aspectRatio: index % 5 === 0 || index % 5 === 3 ? "4 / 3" : "1 / 1" }}
            >
              <Image
                src={item.img}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center"
                style={{ background: "rgba(255,101,0,0.15)", backdropFilter: "blur(2px)" }}
              >
                <div
                  className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ background: "rgba(255,101,0,0.85)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </div>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }}
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-12 reveal-section">
          <a
            href="#quote"
            className="btn-primary"
          >
            ปรึกษางานและประเมินราคาเบื้องต้น
          </a>
        </div>
      </div>
    </section>
  );
}
