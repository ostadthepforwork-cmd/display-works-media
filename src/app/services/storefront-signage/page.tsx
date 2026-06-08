import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import SEOServicePage from "@/components/SEOServicePage";

const url = "https://displayworksmedia.com/services/storefront-signage";
const faqs = [
  { q: "ป้ายหน้าร้านควรเลือกวัสดุอะไร?", a: "ขึ้นอยู่กับตำแหน่งติดตั้ง งบประมาณ และระยะเวลาการใช้งาน งานระยะสั้นใช้ไวนิลหรือ PP Board ได้ ส่วนงานถาวรควรประเมินโครงสร้างและวัสดุให้เหมาะกับแดดฝน" },
  { q: "มีบริการออกแบบป้ายหน้าร้านไหม?", a: "มีทีมช่วยจัดวางข้อความ โลโก้ สี และลำดับข้อมูลให้ลูกค้าอ่านง่ายจากระยะจริง" },
  { q: "ต้องวัดขนาดอย่างไร?", a: "ถ่ายรูปพื้นที่จริงพร้อมระบุความกว้าง ความสูง และระยะมองเห็น ทีมงานจะช่วยแนะนำขนาดที่เหมาะสม" },
  { q: "ติดตั้งให้ได้ไหม?", a: "มีบริการติดตั้งในพื้นที่ที่ทีมงานรองรับ หรือสามารถผลิตพร้อมส่งให้ลูกค้านำไปติดตั้งเองได้" },
  { q: "ใช้เวลาผลิตกี่วัน?", a: "โดยทั่วไป 1-5 วันทำการ ขึ้นอยู่กับประเภทวัสดุ ขนาด และรายละเอียดการติดตั้ง" },
];

export const metadata: Metadata = {
  title: "รับทำป้ายหน้าร้าน ออกแบบ ผลิต ติดตั้ง | Display Works Media",
  description: "รับทำป้ายหน้าร้านสำหรับร้านอาหาร คาเฟ่ คลินิก ร้านค้า และธุรกิจบริการ ออกแบบ ผลิต และแนะนำวัสดุตามพื้นที่จริง",
  alternates: { canonical: url },
  openGraph: {
    title: "รับทำป้ายหน้าร้าน | Display Works Media",
    description: "ป้ายหน้าร้านสำหรับธุรกิจทุกประเภท พร้อมแนะนำวัสดุ ขนาด และ CTA ขอใบเสนอราคา",
    url,
    images: [{ url: "https://displayworksmedia.com/images/services/vinyl.jpg" }],
  },
};

export default function StorefrontSignagePage() {
  return (
    <>
      <ServiceSchema
        name="รับทำป้ายหน้าร้าน"
        description="รับทำป้ายหน้าร้านสำหรับร้านอาหาร คาเฟ่ คลินิก ร้านค้า และธุรกิจบริการ ออกแบบ ผลิต และแนะนำวัสดุตามพื้นที่จริง"
        url={url}
        image="https://displayworksmedia.com/images/services/vinyl.jpg"
        faqs={faqs}
      />
      <SEOServicePage
        eyebrow="Storefront Signage"
        title="รับทำป้ายหน้าร้านสำหรับธุรกิจทุกประเภท"
        description="ออกแบบและผลิตป้ายหน้าร้านให้เหมาะกับพื้นที่จริง อ่านง่าย เห็นชัด และช่วยให้ลูกค้าจำแบรนด์ได้ตั้งแต่หน้าร้าน"
        heroImage="/images/services/vinyl.jpg"
        highlights={[
          "ช่วยแนะนำขนาดและวัสดุจากรูปพื้นที่จริงก่อนผลิต",
          "รองรับร้านอาหาร คาเฟ่ คลินิก ร้านค้าปลีก และออฟฟิศ",
          "ออกแบบให้ข้อความอ่านง่ายและเหมาะกับระยะมองเห็น",
        ]}
        useCases={[
          { label: "ป้ายชื่อร้าน", detail: "สื่อสารชื่อแบรนด์ โลโก้ และประเภทธุรกิจให้เห็นชัดจากหน้าร้าน" },
          { label: "ป้ายเมนูหรือบริการ", detail: "เหมาะกับร้านอาหาร คาเฟ่ คลินิก และร้านบริการที่ต้องการบอกข้อมูลสำคัญ" },
          { label: "ป้ายทางเข้าและจุดต้อนรับ", detail: "ช่วยนำทางลูกค้าและสร้างภาพลักษณ์มืออาชีพตั้งแต่จุดแรก" },
          { label: "ป้ายชั่วคราวช่วงเปิดร้าน", detail: "ใช้โปรโมทช่วงเปิดร้านใหม่หรือปรับปรุงหน้าร้านด้วยงบคุมได้" },
        ]}
        specs={[
          { label: "วัสดุยอดนิยม", detail: "ไวนิล, PP Board, สติ๊กเกอร์, Backdrop หรือวัสดุอื่นตามพื้นที่ติดตั้ง" },
          { label: "ขนาดงาน", detail: "ประเมินตามหน้ากว้างร้าน ระยะมองเห็น และตำแหน่งติดตั้งจริง" },
          { label: "ไฟล์ Artwork", detail: "รองรับ AI, PDF, PSD หรือให้ทีมช่วยออกแบบจากโลโก้และข้อมูลร้าน" },
          { label: "การติดตั้ง", detail: "ประเมินตามพื้นที่หน้างาน หรือผลิตพร้อมส่งให้ลูกค้านำไปติดตั้งเอง" },
        ]}
        faqs={faqs}
        relatedLinks={[
          { label: "รับทำป้ายไวนิล", href: "/services/vinyl-banner" },
          { label: "รับทำ PP Board", href: "/services/pp-board" },
          { label: "ป้ายโปรโมชั่นหน้าร้าน", href: "/services/promotion-signage" },
          { label: "ไอเดียป้ายหน้าร้าน", href: "/blog/storefront-signage-ideas" },
          { label: "เช็กลิสต์ป้ายร้านอาหาร", href: "/blog/restaurant-signage-checklist" },
          { label: "เลือกขนาดป้ายไวนิลให้คุ้มงบ", href: "/blog/vinyl-banner-size-guide" },
        ]}
      />
    </>
  );
}
