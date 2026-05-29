import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import StickerLandingPage from "./StickerClient";

export const metadata: Metadata = {
  title: "สติ๊กเกอร์ทุกชนิด Die-Cut กันน้ำ UV | Display Works Media",
  description:
    "รับทำสติ๊กเกอร์ทุกชนิด PP ใส กระดาษ Die-cut ตัดขอบ โฮโลแกรม กันน้ำ UV Resistant พิมพ์สีสด สั่งขั้นต่ำ 1 ชิ้น ส่งทั่วไทย",
  keywords: [
    "สติ๊กเกอร์", "สติ๊กเกอร์ die-cut", "สติ๊กเกอร์ PP", "สติ๊กเกอร์ใส",
    "สติ๊กเกอร์กันน้ำ", "สั่งพิมพ์สติ๊กเกอร์ออนไลน์", "Display Works Media",
  ],
  alternates: { canonical: "https://displayworksmedia.com/services/sticker" },
  openGraph: {
    title: "สติ๊กเกอร์ทุกชนิด Die-Cut | Display Works Media",
    description: "รับทำสติ๊กเกอร์ทุกชนิด กันน้ำ พิมพ์สีสด สั่งได้ตั้งแต่ 1 ชิ้น",
    url: "https://displayworksmedia.com/services/sticker",
  },
};

const stickerFaqs = [
  { q: "ใช้เวลาผลิตนานแค่ไหน?", a: "โดยปกติ 1–3 วันทำการ ขึ้นอยู่กับจำนวนและประเภทงาน งานด่วนแจ้งล่วงหน้าได้เลย" },
  { q: "ต้องส่งไฟล์แบบไหน?", a: "รองรับไฟล์ AI, PDF, PSD ความละเอียดขั้นต่ำ 150 dpi สำหรับงานที่ต้องการคมชัดสูงแนะนำ 300 dpi" },
  { q: "สั่งขั้นต่ำเท่าไหร่?", a: "ไม่มีขั้นต่ำ สั่งได้ตั้งแต่ 1 ชิ้น บางประเภทอาจมีขั้นต่ำตามเงื่อนไขการผลิต ทีมงานจะแจ้งให้ทราบ" },
  { q: "Die-Cut ตัดรูปทรงอะไรได้บ้าง?", a: "ตัดได้ทุกรูปทรงตามไฟล์ที่ส่งมา ทั้งวงกลม สี่เหลี่ยม รูปดาว หรือรูปทรงอิสระตามแบบของคุณ" },
];

export default function StickerPage() {
  return (
    <>
      <ServiceSchema
        name="สติ๊กเกอร์ทุกชนิด (PP, ใส, กระดาษ, Die-Cut)"
        description="รับทำสติ๊กเกอร์ทุกชนิด PP ใส กระดาษ Die-cut กันน้ำ UV Resistant พิมพ์สีสด สั่งขั้นต่ำ 1 ชิ้น ส่งทั่วไทย"
        url="https://displayworksmedia.com/services/sticker"
        faqs={stickerFaqs}
      />
      <StickerLandingPage />
    </>
  );
}
