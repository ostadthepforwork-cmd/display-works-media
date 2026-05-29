import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import LabelServicePage from "./LabelClient";

export const metadata: Metadata = {
  title: "ฉลากสินค้า สติ๊กเกอร์ฉลาก บาร์โค้ด | Display Works Media",
  description:
    "รับทำฉลากสินค้า สติ๊กเกอร์ฉลาก บาร์โค้ด QR Code กันน้ำ ทนความชื้น เหมาะสำหรับสินค้าแช่เย็น พิมพ์คมชัด สั่งขั้นต่ำ 1 ตร.ม. ส่งทั่วไทย",
  keywords: [
    "ฉลากสินค้า", "สติ๊กเกอร์ฉลาก", "Product Label", "บาร์โค้ด", "QR Code",
    "ฉลากแช่เย็น", "สั่งพิมพ์ฉลาก", "Display Works Media",
  ],
  alternates: { canonical: "https://displayworksmedia.com/services/label" },
  openGraph: {
    title: "ฉลากสินค้า สติ๊กเกอร์ฉลาก | Display Works Media",
    description: "รับทำฉลากสินค้า บาร์โค้ด QR Code กันน้ำ สั่งขั้นต่ำ 1 ตร.ม.",
    url: "https://displayworksmedia.com/services/label",
  },
};

const labelFaqs = [
  { q: "ฉลากสินค้าขั้นต่ำในการสั่งผลิตกี่แผ่น?", a: "ไม่มีขั้นต่ำในการสั่งผลิต สามารถสั่งเริ่มต้นเพียง 1 ตารางเมตร (หรือตามข้อตกลง) เพื่อทดลองติดสินค้าก่อนได้" },
  { q: "สติ๊กเกอร์ PP กับสติ๊กเกอร์กระดาษต่างกันอย่างไร?", a: "สติ๊กเกอร์ PP เป็นเนื้อพลาสติก กันน้ำได้ 100% ฉีกไม่ขาด เหมาะกับของแช่เย็น แช่น้ำ ส่วนสติ๊กเกอร์กระดาษไม่กันน้ำแต่ราคาประหยัด เหมาะกับสินค้าแห้งทั่วไป" },
  { q: "ส่งไฟล์งานรูปแบบไหนดีที่สุด?", a: "แนะนำไฟล์ AI, PDF, PSD หรือรูปภาพ PNG/JPG ความละเอียดสูง เพื่อให้งานพิมพ์ออกมาคมชัดที่สุด" },
  { q: "มีบริการออกแบบโลโก้ฉลากสินค้าให้ไหม?", a: "มีบริการออกแบบโดยทีมกราฟิกมืออาชีพ สามารถแจ้งแนวคิด โทนสี หรือรูปแบบที่ต้องการให้ทีมงานช่วยประเมินราคาค่าออกแบบได้" },
];

export default function LabelPage() {
  return (
    <>
      <ServiceSchema
        name="ฉลากสินค้า / Product Label / สติ๊กเกอร์ฉลาก"
        description="รับทำฉลากสินค้า สติ๊กเกอร์ฉลาก บาร์โค้ด QR Code กันน้ำ ทนความชื้น เหมาะสำหรับสินค้าแช่เย็น สั่งขั้นต่ำ 1 ตร.ม. ส่งทั่วไทย"
        url="https://displayworksmedia.com/services/label"
        faqs={labelFaqs}
      />
      <LabelServicePage />
    </>
  );
}
