/**
 * SchemaOrg — ใส่ JSON-LD structured data สำหรับ SEO / GEO / AEO
 * วิธีใช้: ใส่ใน layout หรือ page ที่ต้องการ
 */

interface SchemaOrgProps {
  /** override schema ใดๆ เพิ่มเติมสำหรับหน้าเฉพาะ */
  extra?: Record<string, unknown>;
}

// ─── LocalBusiness Schema (รากฐาน GEO) ──────────────────────────────────────
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://displayworksmedia.com/#business",
  name: "Display Works Media",
  alternateName: "DWM",
  description:
    "บริการสั่งพิมพ์งานป้ายและสื่อสิ่งพิมพ์ออนไลน์ครบวงจร รับทำแบ็คดรอปผ้า ป้ายไวนิล Roll Up Stand สติ๊กเกอร์ PP Board และฉลากสินค้า ส่งทั่วประเทศ",
  url: "https://displayworksmedia.com",
  sameAs: [
    "https://www.facebook.com/profile.php?id=61581015452518",
    "https://lin.ee/O0nPl03",
  ],
  logo: {
    "@type": "ImageObject",
    url: "https://displayworksmedia.com/images/logo.png",
  },
  image: "https://displayworksmedia.com/images/hero-bg.jpg",
  address: {
    "@type": "PostalAddress",
    addressCountry: "TH",
    addressLocality: "กรุงเทพมหานคร",
    addressRegion: "Bangkok",
  },
  areaServed: {
    "@type": "Country",
    name: "Thailand",
  },
  priceRange: "฿฿",
  currenciesAccepted: "THB",
  paymentAccepted: "Cash, Bank Transfer, PromptPay",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
    ],
    opens: "09:00",
    closes: "18:00",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "งานพิมพ์และป้ายครบวงจร",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "แบ็คดรอปผ้า (Fabric Backdrop)",
          url: "https://displayworksmedia.com/services/backdrop",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "ป้ายไวนิล (Vinyl Banner)",
          url: "https://displayworksmedia.com/services/vinyl",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Roll Up Stand / X-Stand",
          url: "https://displayworksmedia.com/services/rollup",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "สติ๊กเกอร์ทุกชนิด",
          url: "https://displayworksmedia.com/services/sticker",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "PP Board / Standee",
          url: "https://displayworksmedia.com/services/ppboard",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "ฉลากสินค้า (Product Label)",
          url: "https://displayworksmedia.com/services/label",
        },
      },
    ],
  },
  // aggregateRating: ลบออก — ห้าม hardcode ตัวเลขปลอม Google อาจ penalize
  // เพิ่มกลับได้เมื่อดึงข้อมูล review จริงจาก Supabase มาแสดงในหน้าเว็บ
};

// ─── FAQPage Schema (AEO — ให้ AI ตอบแทนได้) ─────────────────────────────────
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "สั่งพิมพ์ขั้นต่ำเท่าไหร่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ไม่มีขั้นต่ำในหลายรายการ สามารถสั่ง 1 ชิ้นได้เลย บางรายการอาจมีขั้นต่ำตามเงื่อนไขการผลิต ทีมงานจะแจ้งรายละเอียดเมื่อรับงาน",
      },
    },
    {
      "@type": "Question",
      name: "ใช้เวลาผลิตนานเท่าไหร่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "โดยปกติ 1–3 วันทำการ งานด่วนสามารถแจ้งได้เพื่อดำเนินการเร่งด่วน อาจมีค่าบริการเพิ่มเติม",
      },
    },
    {
      "@type": "Question",
      name: "ต้องส่งไฟล์งานอะไรบ้าง?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "รองรับไฟล์ AI, PDF, PSD ความละเอียด 150–300 dpi ขึ้นไป หากยังไม่มีไฟล์ ทีมงานสามารถช่วยออกแบบได้ (มีค่าบริการเพิ่มเติม)",
      },
    },
    {
      "@type": "Question",
      name: "ชำระเงินอย่างไร?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "โอนเงินผ่านธนาคาร, พร้อมเพย์ หรือ QR Code ชำระเต็มจำนวนก่อนผลิต",
      },
    },
    {
      "@type": "Question",
      name: "Display Works Media จัดส่งทั่วประเทศได้จริงไหม?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ใช่ครับ Display Works Media จัดส่งทุกจังหวัดในประเทศไทย ผ่านขนส่งเอกชนที่เชื่อถือได้ พร้อมแจ้งเลขพัสดุทุกออเดอร์",
      },
    },
    {
      "@type": "Question",
      name: "ถ้างานออกมาไม่ตรงแบบ ทำอย่างไร?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "เราตรวจสอบคุณภาพก่อนส่งทุกครั้ง หากงานไม่ตรงตามที่ตกลงไว้ ยินดีผลิตใหม่ให้โดยไม่มีค่าใช้จ่ายเพิ่มเติม",
      },
    },
    {
      "@type": "Question",
      name: "รับออกแบบกราฟิกด้วยไหม?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "รับออกแบบครับ เรามีทีมกราฟิกช่วยออกแบบและจัดวางให้เหมาะสม มีค่าบริการออกแบบแยกต่างหาก",
      },
    },
  ],
};

// ─── WebSite Schema ──────────────────────────────────────────────────────────
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://displayworksmedia.com/#website",
  url: "https://displayworksmedia.com",
  name: "Display Works Media",
  description: "บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร",
  inLanguage: "th",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://displayworksmedia.com/?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function SchemaOrg({ extra }: SchemaOrgProps) {
  const schemas: Record<string, unknown>[] = [localBusinessSchema, faqSchema, websiteSchema];
  if (extra) schemas.push(extra);

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD ปลอดภัย ไม่มี user input
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

// ─── Helper: Service Page Schema ─────────────────────────────────────────────
export function ServiceSchema({
  name,
  description,
  url,
  image,
  faqs,
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
  faqs?: Array<{ q: string; a: string }>;
}) {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url,
    ...(image && { image }),
    provider: {
      "@type": "LocalBusiness",
      "@id": "https://displayworksmedia.com/#business",
      name: "Display Works Media",
    },
    areaServed: { "@type": "Country", name: "Thailand" },
  };

  const pageFaqSchema = faqs
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {pageFaqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pageFaqSchema) }}
        />
      )}
    </>
  );
}
