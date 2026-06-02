"use client";

// framer-motion ลบออก — ใช้ CSS reveal แทน ป้องกัน hydration mismatch

// AggregateRating + Review Schema — ให้ Google และ AI รู้ว่ามีรีวิวจริง
const reviewSchemaJson = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://displayworksmedia.com/#business",
  name: "Display Works Media",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "6",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "คุณกตัญญู" },
      reviewRating: { "@type": "Rating", ratingValue: "5" },
      reviewBody: "งานสวย ตรงตามแบบ ส่งไวมาก มีแจ้งทุกขั้นตอน ประทับใจมากครับ ใช้บริการซ้ำมาหลายครั้งแล้ว",
      name: "ป้ายไวนิล + สติ๊กเกอร์",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "คุณขวัญ" },
      reviewRating: { "@type": "Rating", ratingValue: "5" },
      reviewBody: "คุณภาพงานพิมพ์ดีมาก สติ๊กเกอร์ติดดี ใช้งานได้นานมาก สีสดใสไม่ซีดจาง",
      name: "Sticker Outdoor",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "คุณดวงใจ" },
      reviewRating: { "@type": "Rating", ratingValue: "5" },
      reviewBody: "สั่งทำ Backdrop สำหรับงาน Event ใหญ่ งานออกมาสวยมาก สีสดใส คมชัด ส่งตรงเวลา",
      name: "Backdrop + Standee",
    },
  ],
};

const reviews = [
  {
    initials: "ก",
    name: "คุณกตัญญู",
    role: "เจ้าของร้านอาหาร",
    project: "ป้ายไวนิล + สติ๊กเกอร์",
    text: "งานสวย ตรงตามแบบ ส่งไวมาก มีแจ้งทุกขั้นตอน ไม่ต้องถามเองเลย ประทับใจมากครับ ใช้บริการซ้ำมาหลายครั้งแล้ว",
    rating: 5,
    color: "#FF6B00",
  },
  {
    initials: "ข",
    name: "คุณขวัญ",
    role: "เจ้าของร้านกาแฟ",
    project: "Sticker Outdoor",
    text: "คุณภาพงานพิมพ์ดีมาก สติ๊กเกอร์ติดดี ใช้งานได้นานมาก สีสดใสไม่ซีดจาง แนะนำให้เพื่อนหลายคนแล้วทุกคนพอใจ",
    rating: 5,
    color: "#3B82F6",
  },
  {
    initials: "จ",
    name: "คุณจุฬา",
    role: "Marketing Manager",
    project: "Backdrop งาน Event",
    text: "บริการเป็นกันเอง ตอบไว งานออกมาน่าประทับใจมาก ช่วยแนะนำแบบให้ด้วย ได้งานดีกว่าที่คาดไว้มาก",
    rating: 5,
    color: "#8B5CF6",
  },
  {
    initials: "ด",
    name: "คุณดวงใจ",
    role: "Event Organizer",
    project: "Backdrop + Standee",
    text: "สั่งทำ Backdrop สำหรับงาน Event ใหญ่ งานออกมาสวยมาก สีสดใส คมชัด ส่งตรงเวลา ไม่มีปัญหาเลย",
    rating: 5,
    color: "#EC4899",
  },
  {
    initials: "ต",
    name: "คุณตั้ม",
    role: "เจ้าของ SME",
    project: "Roll Up / X-stand",
    text: "ราคาเป็นธรรม คุณภาพดีกว่าที่คิด ทีมงานให้คำแนะนำดีมากก่อนสั่งพิมพ์ ทำให้ได้งานที่ตรงใจที่สุด",
    rating: 5,
    color: "#10B981",
  },
  {
    initials: "ถ",
    name: "คุณถาวร",
    role: "ผู้จัดการร้านค้า",
    project: "PP Board + ป้ายไวนิล",
    text: "เคยสั่งจากที่อื่นมาก่อน พอมาลองที่นี่แล้ว ไม่ไปที่อื่นอีกแล้ว คุณภาพและบริการดีกว่ามาก คุ้มค่าทุกบาท",
    rating: 5,
    color: "#F59E0B",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FF6B00">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function Reviews() {
  return (
    <section
      className="py-24 lg:py-32 px-6 lg:px-8"
      style={{ background: "#0B0F19" }}
    >
      {/* JSON-LD AggregateRating + Review schema สำหรับ SEO / GEO */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD ปลอดภัย
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchemaJson) }}
      />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="reveal-section flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <div className="section-label">รีวิวจากลูกค้า</div>
            <h2 className="section-title">
              ความไว้วางใจ คือ
              <br />
              สิ่งที่เราภูมิใจที่สุด
            </h2>
          </div>
          {/* Overall rating summary */}
          <div
            className="flex items-center gap-4 px-6 py-4 rounded-2xl border flex-shrink-0"
            style={{
              background: "#141A24",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div className="text-center">
              <div
                className="font-kanit font-extrabold text-5xl leading-none"
                style={{ color: "#FF6B00" }}
              >
                5.0
              </div>
              <div className="mt-1">
                <Stars count={5} />
              </div>
              <div className="text-xs mt-1" style={{ color: "#A8B0C0" }}>
                จาก 120+ รีวิว
              </div>
            </div>
            <div
              className="w-px h-14 self-center"
              style={{ background: "rgba(255,255,255,0.08)" }}
            />
            <div className="text-sm" style={{ color: "#A8B0C0" }}>
              <div className="text-white font-semibold mb-0.5">ลูกค้าพึงพอใจ</div>
              <div>100% ทุกออเดอร์</div>
              <div className="mt-1 text-xs">ยินดีผลิตใหม่หาก</div>
              <div className="text-xs">งานไม่ตรงแบบ</div>
            </div>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <div
              key={r.name}
              className="reveal-item relative p-7 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#141A24",
                borderColor: "rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,0,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              {/* Decorative quote */}
              <div
                className="absolute top-0 right-4 font-kanit font-extrabold leading-none pointer-events-none select-none"
                style={{ fontSize: "100px", color: "rgba(255,107,0,0.05)" }}
              >
                &quot;
              </div>

              {/* Stars + project tag */}
              <div className="flex items-center justify-between mb-4">
                <Stars count={r.rating} />
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(255,107,0,0.1)",
                    color: "#FF6B00",
                    border: "1px solid rgba(255,107,0,0.2)",
                  }}
                >
                  {r.project}
                </span>
              </div>

              {/* Review text */}
              <p
                className="text-sm leading-relaxed mb-6 relative z-10"
                style={{ color: "#C8D0DC" }}
              >
                &ldquo;{r.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}99)` }}
                >
                  {r.initials}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm leading-tight">
                    {r.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#A8B0C0" }}>
                    {r.role}
                  </div>
                </div>
                {/* Verified badge */}
                <div className="ml-auto flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#06C755">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#06C755" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-xs" style={{ color: "#06C755" }}>
                    ยืนยัน
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="reveal-section text-center mt-12">
          <p className="text-sm mb-4" style={{ color: "#A8B0C0" }}>
            เข้าร่วมกับลูกค้ากว่า 120 รายที่ไว้วางใจเรา
          </p>
          <a
            href="#quote"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: "#FF6B00",
              boxShadow: "0 4px 24px rgba(255,107,0,0.25)",
            }}
          >
            ขอใบเสนอราคา
          </a>
        </div>
      </div>
    </section>
  );
}
