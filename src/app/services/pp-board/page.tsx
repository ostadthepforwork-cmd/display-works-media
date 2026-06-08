import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import PPBoardLandingPage from "@/components/PPBoardPage";

const url = "https://displayworksmedia.com/services/pp-board";
const faqs = [
  { q: "PP Board เหมาะกับงานแบบไหน?", a: "เหมาะกับป้ายตั้งพื้น ป้ายโปรโมชั่น ป้ายออกบูธ ป้ายเมนู และสื่อหน้าร้านที่ต้องการน้ำหนักเบา" },
  { q: "PP Board ใช้กลางแจ้งได้ไหม?", a: "ใช้ได้ในพื้นที่กึ่งกลางแจ้งและงานระยะสั้น หากโดนแดดจัดระยะยาวควรเลือกความหนาและการจบงานให้เหมาะสม" },
  { q: "สั่งตัดรูปทรงได้ไหม?", a: "สั่งตัดตามรูปทรงโลโก้ ตัวการ์ตูน สินค้า หรือแบบไดคัทเฉพาะงานได้" },
  { q: "มีขาตั้งให้ไหม?", a: "สามารถทำพร้อมขาตั้งด้านหลังหรือโครงตั้งพื้นตามรูปแบบการใช้งานได้" },
  { q: "ขั้นต่ำเท่าไหร่?", a: "สั่งผลิตได้ตั้งแต่ 1 ชิ้น ทีมงานช่วยประเมินราคาตามขนาดและจำนวนจริง" },
];

export const metadata: Metadata = {
  title: "รับทำ PP Board ป้ายตั้งพื้นและป้ายโปรโมชั่น | Display Works Media",
  description: "รับทำ PP Board ป้ายตั้งพื้น ป้ายโปรโมชั่น และป้ายออกบูธ ตัดรูปทรงได้ น้ำหนักเบา พิมพ์คมชัด สั่งได้ตั้งแต่ 1 ชิ้น",
  alternates: { canonical: url },
  openGraph: {
    title: "รับทำ PP Board | Display Works Media",
    description: "PP Board สำหรับหน้าร้าน อีเวนต์ และโปรโมชั่น พร้อมไดคัทและขาตั้ง",
    url,
    images: [{ url: "https://displayworksmedia.com/images/services/ppboard.jpg" }],
  },
};

export default function PPBoardSeoPage() {
  return (
    <>
      <ServiceSchema
        name="รับทำ PP Board"
        description="รับทำ PP Board ป้ายตั้งพื้น ป้ายโปรโมชั่น และป้ายออกบูธ ตัดรูปทรงได้ น้ำหนักเบา พิมพ์คมชัด"
        url={url}
        image="https://displayworksmedia.com/images/services/ppboard.jpg"
        faqs={faqs}
      />
      <PPBoardLandingPage />
    </>
  );
}
