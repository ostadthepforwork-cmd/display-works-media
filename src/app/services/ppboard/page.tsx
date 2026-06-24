import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import PPBoardLandingPage from "@/components/PPBoardPage";

export const metadata: Metadata = {
  title: "PP Board / Standee ตัดรูปทรงสำหรับธุรกิจ | Display Works Media",
  description:
    "รับทำ PP Board Standee Foam Board ตัดรูปทรงทุกแบบ กันน้ำ แข็งแรง เหมาะสำหรับป้ายตั้งพื้น บูธ งาน Event ส่งทั่วไทย สั่งขั้นต่ำ 1 ชิ้น",
  keywords: [
    "PP Board", "Standee", "โฟมบอร์ด", "ป้ายตั้งพื้น", "Standee ตัดรูปทรง",
    "PP Board หน้าร้าน", "สั่งทำ Standee", "Display Works Media",
  ],
  alternates: { canonical: "https://displayworksmedia.com/services/ppboard" },
  openGraph: {
    title: "PP Board / Standee ตัดรูปทรง | Display Works Media",
    description: "รับทำ PP Board Standee ตัดรูปทรงทุกแบบ กันน้ำ สั่งได้ 1 ชิ้น ส่งทั่วไทย",
    url: "https://displayworksmedia.com/services/ppboard",
  },
};

const ppboardFaqs = [
  { q: "PP Board กับ Foam Board ต่างกันอย่างไร?", a: "PP Board ทำจากพลาสติก PP ทนน้ำ ทนความชื้น แข็งแรงกว่า ส่วน Foam Board ทำจากโฟมเบากว่าแต่เปราะกว่า เหมาะสำหรับงานในอาคารเท่านั้น" },
  { q: "ใช้เวลาผลิตกี่วัน?", a: "โดยปกติ 1–3 วันทำการ สำหรับงานด่วนสามารถแจ้งล่วงหน้าได้ อาจมีค่าบริการเพิ่มเติม" },
  { q: "PP Board ใช้งานกลางแจ้งได้ไหม?", a: "ได้ PP Board ทนความชื้นและน้ำได้ดี แต่ไม่ทนแดดจัดในระยะยาว หากใช้กลางแจ้งแนะนำความหนา 5–8 มม. และหลีกเลี่ยงแดดตรง" },
  { q: "Standee มีขาตั้งให้ด้วยไหม?", a: "มีทั้งแบบแผ่น PP Board อย่างเดียว และแบบพร้อมโครง X-Stand หรือ L-Stand สอบถามทีมงานเพื่อเลือกที่เหมาะสม" },
  { q: "มีขั้นต่ำไหม?", a: "ไม่มีขั้นต่ำ สั่งได้ตั้งแต่ 1 ชิ้น" },
];

export default function PPBoardPage() {
  return (
    <>
      <ServiceSchema
        name="PP Board / Standee ตัดรูปทรง"
        description="รับทำ PP Board Standee Foam Board ตัดรูปทรงทุกแบบ กันน้ำ แข็งแรง สั่งขั้นต่ำ 1 ชิ้น ส่งทั่วไทย"
        url="https://displayworksmedia.com/services/ppboard"
        faqs={ppboardFaqs}
      />
      <PPBoardLandingPage />
    </>
  );
}
