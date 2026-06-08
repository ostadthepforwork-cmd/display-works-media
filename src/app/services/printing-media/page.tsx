import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import SEOServicePage from "@/components/SEOServicePage";

const url = "https://displayworksmedia.com/services/printing-media";
const faqs = [
  { q: "งานพิมพ์สื่อโฆษณารวมอะไรบ้าง?", a: "รวมงานไวนิล สติ๊กเกอร์ PP Board Roll Up X-Stand Backdrop ฉลากสินค้า และสื่อหน้าร้านอื่น ๆ" },
  { q: "ช่วยเลือกวัสดุให้ได้ไหม?", a: "ทีมงานช่วยแนะนำวัสดุตามพื้นที่ใช้งาน ระยะเวลา งบประมาณ และภาพลักษณ์ที่ต้องการ" },
  { q: "ตรวจไฟล์ก่อนผลิตให้ไหม?", a: "ช่วยตรวจขนาด ความละเอียด สี และรายละเอียดเบื้องต้นก่อนส่งผลิต" },
  { q: "รับงานจำนวนมากไหม?", a: "รับทั้งงานชิ้นเดียว งานหลายสาขา และงานโปรเจกต์ที่ต้องแบ่งผลิตหรือจัดส่งหลายพื้นที่" },
  { q: "ติดต่อขอราคาอย่างไร?", a: "ส่งรายละเอียดงาน ขนาด จำนวน วัสดุ และไฟล์ Artwork ผ่านหน้า Contact หรือ Line OA เพื่อประเมินราคา" },
];

export const metadata: Metadata = {
  title: "งานพิมพ์สื่อโฆษณา ป้ายและสื่อหน้าร้านครบวงจร | Display Works Media",
  description: "บริการงานพิมพ์สื่อโฆษณาครบวงจร ไวนิล สติ๊กเกอร์ PP Board Roll Up Backdrop ฉลากสินค้า และป้ายหน้าร้าน",
  alternates: { canonical: url },
  openGraph: {
    title: "งานพิมพ์สื่อโฆษณาครบวงจร | Display Works Media",
    description: "ผลิตป้ายและสื่อโฆษณาสำหรับธุรกิจ พร้อมตรวจไฟล์ แนะนำวัสดุ และจัดส่งทั่วไทย",
    url,
    images: [{ url: "https://displayworksmedia.com/images/hero-bg.jpg" }],
  },
};

export default function PrintingMediaPage() {
  return (
    <>
      <ServiceSchema
        name="งานพิมพ์สื่อโฆษณา"
        description="บริการงานพิมพ์สื่อโฆษณาครบวงจร ไวนิล สติ๊กเกอร์ PP Board Roll Up Backdrop ฉลากสินค้า และป้ายหน้าร้าน"
        url={url}
        image="https://displayworksmedia.com/images/hero-bg.jpg"
        faqs={faqs}
      />
      <SEOServicePage
        eyebrow="Printing Media"
        title="งานพิมพ์สื่อโฆษณาครบวงจรสำหรับธุรกิจ"
        description="รวมบริการผลิตป้าย งานพิมพ์ และสื่อหน้าร้านที่ช่วยให้ธุรกิจสื่อสารชัดเจนขึ้น ตั้งแต่ตรวจไฟล์ เลือกวัสดุ ไปจนถึงจัดส่ง"
        heroImage="/images/hero-bg.jpg"
        highlights={[
          "ครอบคลุมงานป้ายและงานพิมพ์สำหรับหน้าร้าน อีเวนต์ และแบรนด์สินค้า",
          "แนะนำวัสดุตามพื้นที่ใช้งานจริงและงบประมาณ",
          "รองรับงานชิ้นเดียว งานหลายสาขา และงานโปรเจกต์",
        ]}
        useCases={[
          { label: "สื่อหน้าร้าน", detail: "ป้ายชื่อร้าน ป้ายเมนู ป้ายโปรโมชั่น และป้ายนำทางภายในร้าน" },
          { label: "งานออกบูธ", detail: "Roll Up, X-Stand, Backdrop, Standee และสื่อประชาสัมพันธ์สำหรับอีเวนต์" },
          { label: "สื่อสินค้า", detail: "ฉลากสินค้า สติ๊กเกอร์แพ็กเกจ สติ๊กเกอร์ QR Code และ Barcode" },
          { label: "งานแคมเปญ", detail: "สื่อโปรโมชันรายเดือน งานเปิดตัวสินค้า และชุดป้ายสำหรับหลายสาขา" },
        ]}
        specs={[
          { label: "ไฟล์ที่รองรับ", detail: "AI, PDF, PSD, JPG, PNG พร้อมตรวจความละเอียดและขนาดก่อนผลิต" },
          { label: "วัสดุ", detail: "ไวนิล, PP Board, สติ๊กเกอร์, วัสดุ Roll Up, ผ้า Backdrop และวัสดุตามงานจริง" },
          { label: "การจัดส่ง", detail: "จัดส่งทั่วประเทศหรือประเมินติดตั้งตามพื้นที่ที่ทีมงานรองรับ" },
          { label: "การประเมินราคา", detail: "คิดตามขนาด จำนวน วัสดุ รายละเอียดจบงาน และเวลาผลิต" },
        ]}
        faqs={faqs}
        relatedLinks={[
          { label: "รับทำป้ายไวนิล", href: "/services/vinyl-banner" },
          { label: "รับทำ Roll Up", href: "/services/roll-up" },
          { label: "รับทำสติ๊กเกอร์ฉลากสินค้า", href: "/services/label-sticker" },
          { label: "เตรียมไฟล์ Artwork ก่อนส่งพิมพ์", href: "/blog/prepare-artwork-for-print" },
          { label: "CMYK กับ RGB ต่างกันอย่างไร", href: "/blog/cmyk-vs-rgb-printing" },
          { label: "เลือกขนาดป้ายไวนิลให้คุ้มงบ", href: "/blog/vinyl-banner-size-guide" },
        ]}
      />
    </>
  );
}
