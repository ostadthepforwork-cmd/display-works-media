import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import RollUpLandingPage from "../rollup/RollupClient";

const url = "https://displayworksmedia.com/services/x-stand";
const faqs = [
  { q: "X-Stand ต่างจาก Roll Up อย่างไร?", a: "X-Stand น้ำหนักเบาและประหยัดกว่า เหมาะกับงานที่เปลี่ยนภาพบ่อย ส่วน Roll Up ดูเรียบร้อยและแข็งแรงกว่า" },
  { q: "เปลี่ยนภาพเองได้ไหม?", a: "X-Stand สามารถเปลี่ยนภาพเองได้ง่ายเพราะเป็นภาพเจาะตาไก่เกี่ยวกับโครง" },
  { q: "เหมาะกับพื้นที่แบบไหน?", a: "เหมาะกับบูธชั่วคราว หน้าร้าน งานโปรโมชั่น และกิจกรรมที่ต้องเคลื่อนย้ายบ่อย" },
  { q: "มีขนาดมาตรฐานอะไรบ้าง?", a: "ขนาดที่นิยมคือ 60x160 และ 80x180 ซม. สามารถประเมินตามขนาดงานจริงได้" },
  { q: "พิมพ์เฉพาะภาพได้ไหม?", a: "พิมพ์เฉพาะภาพได้ หากมีโครงเดิมอยู่แล้วให้แจ้งขนาดและตำแหน่งตาไก่กับทีมงาน" },
];

export const metadata: Metadata = {
  title: "รับทำ X-Stand ป้ายออกบูธน้ำหนักเบา | Display Works Media",
  description: "รับทำ X-Stand ป้ายออกบูธและป้ายตั้งพื้นน้ำหนักเบา เปลี่ยนภาพง่าย เหมาะกับงานโปรโมชั่นและอีเวนต์",
  alternates: { canonical: url },
  openGraph: {
    title: "รับทำ X-Stand | Display Works Media",
    description: "X-Stand น้ำหนักเบา พกพาง่าย เหมาะกับงานอีเวนต์และโปรโมชั่น",
    url,
    images: [{ url: "https://displayworksmedia.com/images/services/hero-rollup.jpg" }],
  },
};

export default function XStandPage() {
  return (
    <>
      <ServiceSchema
        name="รับทำ X-Stand"
        description="รับทำ X-Stand ป้ายออกบูธและป้ายตั้งพื้นน้ำหนักเบา เปลี่ยนภาพง่าย เหมาะกับงานโปรโมชั่น"
        url={url}
        image="https://displayworksmedia.com/images/services/hero-rollup.jpg"
        faqs={faqs}
      />
      <RollUpLandingPage />
    </>
  );
}
