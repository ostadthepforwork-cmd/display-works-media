import Image from "next/image";

const portfolioImages = [
  "/images/portfolio/work-01.webp",
  "/images/portfolio/work-02.webp",
  "/images/portfolio/work-03.webp",
  "/images/portfolio/work-04.webp",
  "/images/portfolio/work-05.webp",
  "/images/portfolio/work-06.webp",
  "/images/portfolio/work-07.webp",
  "/images/portfolio/work-08.webp",
  "/images/portfolio/work-09.webp",
];

export default function Portfolio() {
  return (
    <section
      id="portfolio"
      className="py-16 sm:py-24 px-5 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(180deg, #0B0F19 0%, #0d1220 100%)" }}
    >
      <div className="max-w-7xl mx-auto">

        <div className="reveal-section mb-14">
          <div className="section-label">PORTFOLIO</div>
          <h2 className="section-title">ผลงานของเรา</h2>
          <p className="section-sub">
            ตัวอย่างผลงานที่เราภาคภูมิใจ และส่งมอบให้ลูกค้าในหลากหลายธุรกิจ
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {portfolioImages.map((src, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-xl reveal-item"
              style={{ aspectRatio: "1 / 1" }}
            >
              <Image
                src={src}
                alt={`ผลงาน ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center"
                style={{ background: "rgba(255,107,0,0.15)", backdropFilter: "blur(2px)" }}
              >
                <div
                  className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ background: "rgba(255,107,0,0.8)" }}
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
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "#FF6B00", boxShadow: "0 4px 24px rgba(255,107,0,0.25)" }}
          >
            สนใจงานแบบนี้? ขอใบเสนอราคาเลย
          </a>
        </div>

      </div>
    </section>
  );
}
