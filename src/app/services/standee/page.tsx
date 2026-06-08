import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import PPBoardLandingPage from "@/components/PPBoardPage";

const url = "https://displayworksmedia.com/services/standee";
const faqs = [
  { q: "Standee ทำจากวัสดุอะไรได้บ้าง?", a: "นิยมทำจาก PP Board, Foam Board หรือวัสดุแผ่นพิมพ์พร้อมขาตั้ง ขึ้นอยู่กับพื้นที่ใช้งานและงบประมาณ" },
  { q: "Standee ตัดตามตัวคนหรือสินค้าได้ไหม?", a: "ทำได้ สามารถไดคัทตามรูปทรงตัวละคร พรีเซนเตอร์ สินค้า หรือโลโก้แบรนด์" },
  { q: "เหมาะกับงานอะไร?", a: "เหมาะกับหน้าร้าน งานเปิดตัวสินค้า งานออกบูธ จุดถ่ายรูป และสื่อโปรโมชั่นภายในห้าง" },
  { q: "มีขาตั้งด้านหลังไหม?", a: "มีตัวเลือกขาตั้งด้านหลังหรือฐานตั้งพื้นตามขนาดและน้ำหนักของงาน" },
  { q: "ต้องเตรียมไฟล์อย่างไร?", a: "ควรส่งไฟล์ความละเอียดสูงพร้อมเส้นไดคัทหรือแนวตัด เพื่อให้ทีมตรวจไฟล์ก่อนผลิต" },
];

export const metadata: Metadata = {
  title: "รับทำ Standee ป้ายตั้งพื้นไดคัท | Display Works Media",
  description: "รับทำ Standee ป้ายตั้งพื้นไดคัท ตัวคน ตัวสินค้า และสื่อโปรโมชั่นหน้าร้าน พิมพ์คมชัด พร้อมขาตั้ง",
  alternates: { canonical: url },
  openGraph: {
    title: "รับทำ Standee ป้ายตั้งพื้นไดคัท | Display Works Media",
    description: "Standee สำหรับหน้าร้าน งานออกบูธ และจุดถ่ายรูป พร้อมตรวจไฟล์ก่อนผลิต",
    url,
    images: [{ url: "https://displayworksmedia.com/images/services/ppboard.jpg" }],
  },
};

export default function StandeePage() {
  return (
    <>
      <ServiceSchema
        name="รับทำ Standee"
        description="รับทำ Standee ป้ายตั้งพื้นไดคัท ตัวคน ตัวสินค้า และสื่อโปรโมชั่นหน้าร้าน พร้อมขาตั้ง"
        url={url}
        image="https://displayworksmedia.com/images/services/ppboard.jpg"
        faqs={faqs}
      />
      <PPBoardLandingPage />
    </>
  );
}
