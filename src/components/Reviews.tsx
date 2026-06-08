"use client";

type ReviewItem = {
  id?: string;
  initials?: string;
  name?: string;
  role?: string;
  company?: string;
  project?: string;
  text?: string;
  rating?: number;
  stars?: number;
  color?: string;
};

const defaultReviews: ReviewItem[] = [
  {
    initials: "ก",
    name: "คุณกตัญญู",
    role: "เจ้าของร้านอาหาร",
    project: "ป้ายไวนิล + สติ๊กเกอร์",
    text: "งานสวย ตรงตามแบบ ส่งไวมาก มีแจ้งทุกขั้นตอน ประทับใจมากครับ ใช้บริการซ้ำมาหลายครั้งแล้ว",
    rating: 5,
    color: "#FF6B00",
  },
  {
    initials: "ข",
    name: "คุณขวัญ",
    role: "เจ้าของร้านกาแฟ",
    project: "Sticker Outdoor",
    text: "คุณภาพงานพิมพ์ดีมาก สติ๊กเกอร์ติดดี ใช้งานได้นาน สีสดใสไม่ซีดจาง",
    rating: 5,
    color: "#3B82F6",
  },
  {
    initials: "จ",
    name: "คุณจุฬา",
    role: "Marketing Manager",
    project: "Backdrop งาน Event",
    text: "บริการเป็นกันเอง ตอบไว งานออกมาน่าประทับใจมาก ช่วยแนะนำแบบให้ด้วย",
    rating: 5,
    color: "#8B5CF6",
  },
];

function normalizeReviews(items?: ReviewItem[]) {
  const source = Array.isArray(items) && items.length > 0 ? items : defaultReviews;
  const colors = ["#FF6B00", "#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B"];

  return source
    .filter((item) => item?.name || item?.text)
    .map((item, index) => ({
      initials: item.initials || String(item.name || "?").trim().slice(0, 1),
      name: item.name || "ลูกค้า",
      role: item.role || item.company || "ลูกค้า Display Works Media",
      project: item.project || item.company || "งานป้ายและสื่อโฆษณา",
      text: item.text || "",
      rating: Number(item.rating || item.stars || 5),
      color: item.color || colors[index % colors.length],
    }));
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: Math.max(1, Math.min(5, count)) }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FF6B00">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function Reviews({ items }: { items?: ReviewItem[] }) {
  const reviews = normalizeReviews(items);
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const ratingText = average.toFixed(1);
  const reviewSchemaJson = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://displayworksmedia.com/#business",
    name: "Display Works Media",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingText,
      reviewCount: String(reviews.length),
      bestRating: "5",
      worstRating: "1",
    },
    review: reviews.slice(0, 5).map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.name },
      reviewRating: { "@type": "Rating", ratingValue: String(review.rating) },
      reviewBody: review.text,
      name: review.project,
    })),
  };

  return (
    <section className="py-20 lg:py-24 px-6 lg:px-8" style={{ background: "#0B0F19" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchemaJson) }}
      />
      <div className="max-w-7xl mx-auto">
        <div className="reveal-section flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <div className="section-label">CUSTOMER VOICE</div>
            <h2 className="section-title">รีวิวจากลูกค้า</h2>
          </div>
          <div
            className="flex items-center gap-4 px-6 py-4 rounded-2xl border flex-shrink-0"
            style={{
              background: "#141A24",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div className="text-center">
              <div className="font-kanit font-extrabold text-5xl leading-none" style={{ color: "#FF6B00" }}>
                {ratingText}
              </div>
              <div className="mt-1">
                <Stars count={Math.round(average || 5)} />
              </div>
              <div className="text-xs mt-1" style={{ color: "#A8B0C0" }}>
                จาก {reviews.length} รีวิว
              </div>
            </div>
            <div className="w-px h-14 self-center" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="text-sm" style={{ color: "#A8B0C0" }}>
              <div className="text-white font-semibold mb-0.5">เสียงตอบรับจากลูกค้า</div>
              <div>งานป้ายและสื่อสิ่งพิมพ์</div>
              <div className="mt-1 text-xs">ตรวจงานก่อนส่งทุกออเดอร์</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review) => (
            <div
              key={`${review.name}-${review.project}`}
              className="reveal-item relative p-7 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#141A24",
                borderColor: "rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.borderColor = "rgba(255,107,0,0.25)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              <div
                className="absolute top-0 right-4 font-kanit font-extrabold leading-none pointer-events-none select-none"
                style={{ fontSize: "100px", color: "rgba(255,107,0,0.05)" }}
              >
                &quot;
              </div>

              <div className="flex items-center justify-between mb-4">
                <Stars count={review.rating} />
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(255,107,0,0.1)",
                    color: "#FF6B00",
                    border: "1px solid rgba(255,107,0,0.2)",
                  }}
                >
                  {review.project}
                </span>
              </div>

              <p className="text-sm leading-relaxed mb-6 relative z-10" style={{ color: "#C8D0DC" }}>
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${review.color}, ${review.color}99)` }}
                >
                  {review.initials}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm leading-tight">{review.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#A8B0C0" }}>{review.role}</div>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#06C755">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#06C755" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs" style={{ color: "#06C755" }}>ยืนยัน</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
