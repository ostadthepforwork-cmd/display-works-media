import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import RollUpLandingPage from "../rollup/RollupClient";

const url = "https://displayworksmedia.com/services/roll-up";
const faqs = [
  { q: "Roll Up เหมาะกับงานอะไร?", a: "เหมาะกับงานออกบูธ งานสัมมนา หน้าร้าน จุดต้อนรับ และพื้นที่ที่ต้องการสื่อพกพาใช้งานซ้ำได้" },
  { q: "มีขนาดมาตรฐานอะไรบ้าง?", a: "ขนาดยอดนิยมคือ 60x160, 80x200 และ 85x200 ซม. สามารถสอบถามขนาดอื่นเพิ่มเติมได้" },
  { q: "เปลี่ยนเฉพาะภาพพิมพ์ได้ไหม?", a: "ทำได้ในหลายกรณี โดยทีมงานจะช่วยตรวจโครงเดิมและแนะนำวิธีเปลี่ยนภาพให้เหมาะสม" },
  { q: "ภาพพิมพ์กันน้ำไหม?", a: "วัสดุพิมพ์และการเคลือบสามารถกันน้ำและลดรอยขีดข่วนได้ เหมาะกับการใช้งานซ้ำ" },
  { q: "มีถุงใส่ให้ไหม?", a: "ชุด Roll Up มีถุงใส่สำหรับพกพาและจัดเก็บตามรุ่นของโครง" },
];

export const metadata: Metadata = {
  title: "รับทำ Roll Up Stand สำหรับออกบูธและหน้าร้าน | Display Works Media",
  description: "รับทำ Roll Up Stand พกพาง่าย ใช้งานซ้ำได้ เหมาะกับงานออกบูธ สัมมนา และหน้าร้าน พิมพ์คมชัดพร้อมโครง",
  alternates: { canonical: url },
  openGraph: {
    title: "รับทำ Roll Up Stand | Display Works Media",
    description: "Roll Up สำหรับงานออกบูธ หน้าร้าน และอีเวนต์ พร้อมโครงและถุงใส่",
    url,
    images: [{ url: "https://displayworksmedia.com/images/services/hero-rollup.jpg" }],
  },
};

export default function RollUpSeoPage() {
  return (
    <>
      <ServiceSchema
        name="รับทำ Roll Up Stand"
        description="รับทำ Roll Up Stand สำหรับงานออกบูธ สัมมนา และหน้าร้าน พกพาง่าย ใช้งานซ้ำได้"
        url={url}
        image="https://displayworksmedia.com/images/services/hero-rollup.jpg"
        faqs={faqs}
      />
      <RollUpLandingPage />
    </>
  );
}
