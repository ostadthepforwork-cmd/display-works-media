import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import VinylLandingPage from "./VinylClient";

export const metadata: Metadata = {
  title: "สั่งทำป้ายไวนิลสำหรับธุรกิจ | Display Works Media",
  description:
    "รับทำป้ายไวนิล Frontlit Backlit โปร่งแสง One-way Vision พิมพ์คมชัด สีสด กันน้ำ ทนแดด ส่งทั่วประเทศไทย ราคาเป็นธรรม ไม่มีขั้นต่ำ",
  keywords: [
    "ป้ายไวนิล", "สั่งพิมพ์ไวนิล", "ไวนิล Frontlit", "ไวนิล Backlit", "ไวนิลโปร่งแสง",
    "ป้ายไวนิลหน้าร้าน", "สั่งป้ายออนไลน์", "Display Works Media",
  ],
  alternates: { canonical: "https://displayworksmedia.com/services/vinyl" },
  openGraph: {
    title: "สั่งทำป้ายไวนิล ทุกชนิด | Display Works Media",
    description: "รับทำป้ายไวนิลทุกชนิด พิมพ์คมชัด กันน้ำ ทนแดด ส่งทั่วไทย",
    url: "https://displayworksmedia.com/services/vinyl",
  },
};

const vinylFaqs = [
  { q: "ใช้เวลาผลิตกี่วัน?", a: "โดยปกติ 1–3 วันทำการ สำหรับงานด่วนสามารถแจ้งล่วงหน้าได้" },
  { q: "มีบริการติดตั้งไหม?", a: "มีบริการติดตั้งสำหรับพื้นที่ใกล้เคียง หรือส่งพร้อมอุปกรณ์ให้ติดตั้งเองได้ง่ายๆ" },
  { q: "รับออกแบบหรือไม่?", a: "รับออกแบบ มีทีมกราฟิกช่วยออกแบบตามความต้องการ" },
  { q: "มีขั้นต่ำไหม?", a: "ไม่มีขั้นต่ำ สั่งเพียง 1 ชิ้นก็ยินดีให้บริการ" },
];

export default function VinylPage() {
  return (
    <>
      <ServiceSchema
        name="ป้ายไวนิล (Vinyl Banner) ทุกชนิด"
        description="รับทำป้ายไวนิล Frontlit Backlit โปร่งแสง One-way Vision พิมพ์คมชัด สีสด กันน้ำ ทนแดด ส่งทั่วประเทศไทย ไม่มีขั้นต่ำ"
        url="https://displayworksmedia.com/services/vinyl"
        faqs={vinylFaqs}
      />
      <VinylLandingPage />
    </>
  );
}
