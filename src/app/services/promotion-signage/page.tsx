import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import SEOServicePage from "@/components/SEOServicePage";

const url = "https://displayworksmedia.com/services/promotion-signage";
const faqs = [
  { q: "ป้ายโปรโมชั่นเหมาะกับวัสดุอะไร?", a: "งานระยะสั้นนิยมใช้ไวนิล PP Board หรือสติ๊กเกอร์ เพราะผลิตเร็ว ต้นทุนคุมง่าย และเปลี่ยนแคมเปญได้บ่อย" },
  { q: "ทำป้าย Sale หรือเมนูหน้าร้านได้ไหม?", a: "ทำได้ทั้งป้าย Sale, เมนู, ป้ายตั้งโต๊ะ, ป้ายแขวน และป้ายหน้าร้านช่วงแคมเปญ" },
  { q: "ต้องมีไฟล์ออกแบบเองไหม?", a: "ถ้ามีไฟล์อยู่แล้วทีมช่วยตรวจให้ได้ หากยังไม่มีสามารถส่งข้อความ ราคา รูปสินค้า และโลโก้ให้ทีมช่วยออกแบบ" },
  { q: "ผลิตด่วนได้ไหม?", a: "ผลิตด่วนได้ในบางรายการ ขึ้นอยู่กับวัสดุ ขนาด จำนวน และคิวผลิตในวันนั้น" },
  { q: "มีขั้นต่ำไหม?", a: "หลายรายการสั่งได้ตั้งแต่ 1 ชิ้น ทีมงานจะช่วยจัดสเปกให้เหมาะกับงบประมาณ" },
];

export const metadata: Metadata = {
  title: "รับทำป้ายโปรโมชั่นหน้าร้าน ป้าย Sale ป้ายเมนู | Display Works Media",
  description: "รับทำป้ายโปรโมชั่นหน้าร้าน ป้าย Sale ป้ายเมนู และสื่อส่งเสริมการขาย ผลิตเร็ว เหมาะกับร้านค้าและแคมเปญระยะสั้น",
  alternates: { canonical: url },
  openGraph: {
    title: "รับทำป้ายโปรโมชั่นหน้าร้าน | Display Works Media",
    description: "ป้ายโปรโมชั่น ป้าย Sale และสื่อหน้าร้านสำหรับแคมเปญร้านค้า",
    url,
    images: [{ url: "https://displayworksmedia.com/images/services/ppboard.jpg" }],
  },
};

export default function PromotionSignagePage() {
  return (
    <>
      <ServiceSchema
        name="รับทำป้ายโปรโมชั่นหน้าร้าน"
        description="รับทำป้ายโปรโมชั่นหน้าร้าน ป้าย Sale ป้ายเมนู และสื่อส่งเสริมการขาย ผลิตเร็ว เหมาะกับร้านค้าและแคมเปญระยะสั้น"
        url={url}
        image="https://displayworksmedia.com/images/services/ppboard.jpg"
        faqs={faqs}
      />
      <SEOServicePage
        eyebrow="Promotion Signage"
        title="รับทำป้ายโปรโมชั่นหน้าร้านสำหรับแคมเปญขาย"
        description="ผลิตสื่อโปรโมชั่นที่อ่านง่าย เห็นราคาและข้อเสนอชัดเจน ช่วยกระตุ้นการตัดสินใจของลูกค้าหน้าร้าน"
        heroImage="/images/services/ppboard.jpg"
        highlights={[
          "เหมาะกับแคมเปญ Sale เมนูใหม่ สินค้าใหม่ และโปรโมชันรายเดือน",
          "เลือกวัสดุได้ตามงบและระยะเวลาการใช้งาน",
          "ทีมช่วยจัดวางข้อความให้เด่นและอ่านเร็วจากระยะหน้าร้าน",
        ]}
        useCases={[
          { label: "ป้าย Sale", detail: "เน้นราคา ส่วนลด และข้อเสนอให้ชัดเจนสำหรับหน้าร้านหรือจุดชำระเงิน" },
          { label: "ป้ายเมนู", detail: "เหมาะกับร้านอาหาร คาเฟ่ และร้านเครื่องดื่มที่ต้องเปลี่ยนเมนูตามช่วงเวลา" },
          { label: "ป้ายตั้งโต๊ะ", detail: "ใช้บนเคาน์เตอร์ โต๊ะอาหาร จุดรับออเดอร์ หรือพื้นที่แนะนำสินค้า" },
          { label: "ป้ายแคมเปญ", detail: "สำหรับโปรโมชันตามเทศกาล เปิดร้านใหม่ หรือกิจกรรมในห้าง" },
        ]}
        specs={[
          { label: "วัสดุ", detail: "ไวนิล, PP Board, สติ๊กเกอร์, กระดาษเคลือบ หรือวัสดุตามลักษณะใช้งาน" },
          { label: "ขนาด", detail: "ทำได้ตั้งแต่ป้ายเล็กบนโต๊ะไปจนถึงป้ายหน้าร้านขนาดใหญ่" },
          { label: "งานด่วน", detail: "บางประเภทผลิตด่วนได้หลังตรวจไฟล์และยืนยันคิวผลิต" },
          { label: "การจบงาน", detail: "เจาะรู ติดเทปกาวสองหน้า เคลือบ หรือทำขาตั้งตามการใช้งานจริง" },
        ]}
        faqs={faqs}
        relatedLinks={[
          { label: "รับทำ Standee", href: "/services/standee" },
          { label: "รับทำ PP Board", href: "/services/pp-board" },
          { label: "รับทำป้ายหน้าร้าน", href: "/services/storefront-signage" },
          { label: "เช็กลิสต์ป้ายร้านอาหาร", href: "/blog/restaurant-signage-checklist" },
          { label: "ไอเดียป้ายหน้าร้าน", href: "/blog/storefront-signage-ideas" },
          { label: "PP Board คืออะไร", href: "/blog/pp-board-guide" },
        ]}
      />
    </>
  );
}
