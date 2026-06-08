import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import LabelServicePage from "../label/LabelClient";

const url = "https://displayworksmedia.com/services/label-sticker";
const faqs = [
  { q: "ฉลากสินค้ากันน้ำควรใช้วัสดุอะไร?", a: "แนะนำสติ๊กเกอร์ PP หรือ PVC เพราะกันน้ำ ทนความชื้น และเหมาะกับสินค้าที่ต้องแช่เย็นหรือสัมผัสน้ำ" },
  { q: "ทำฉลากแบบไดคัทได้ไหม?", a: "ทำได้ทั้งทรงสี่เหลี่ยม วงกลม วงรี และไดคัทตามรูปทรงโลโก้หรือแพ็กเกจ" },
  { q: "ขั้นต่ำเท่าไหร่?", a: "สามารถเริ่มผลิตตามพื้นที่พิมพ์หรือจำนวนที่เหมาะสม ทีมงานช่วยจัดวางบนแผ่นให้คุ้มที่สุด" },
  { q: "รองรับ QR Code และ Barcode ไหม?", a: "รองรับ QR Code, Barcode และข้อมูลสินค้า โดยควรส่งไฟล์ที่คมชัดเพื่อลดปัญหาสแกนไม่ติด" },
  { q: "มีบริการออกแบบฉลากไหม?", a: "มีบริการออกแบบและจัดวางไฟล์ฉลากสินค้าให้เหมาะกับขนาดบรรจุภัณฑ์" },
];

export const metadata: Metadata = {
  title: "รับทำสติ๊กเกอร์ฉลากสินค้า กันน้ำ ไดคัท | Display Works Media",
  description: "รับทำสติ๊กเกอร์ฉลากสินค้า กันน้ำ ไดคัท QR Code Barcode สำหรับอาหาร เครื่องสำอาง และสินค้าแช่เย็น",
  alternates: { canonical: url },
  openGraph: {
    title: "รับทำสติ๊กเกอร์ฉลากสินค้า | Display Works Media",
    description: "ฉลากสินค้า PP/PVC กันน้ำ ไดคัท และพิมพ์คมชัดสำหรับแพ็กเกจสินค้า",
    url,
    images: [{ url: "https://displayworksmedia.com/images/services/product-label-hero.jpg" }],
  },
};

export default function LabelStickerPage() {
  return (
    <>
      <ServiceSchema
        name="รับทำสติ๊กเกอร์ฉลากสินค้า"
        description="รับทำสติ๊กเกอร์ฉลากสินค้า กันน้ำ ไดคัท QR Code Barcode สำหรับอาหาร เครื่องสำอาง และสินค้าแช่เย็น"
        url={url}
        image="https://displayworksmedia.com/images/services/product-label-hero.jpg"
        faqs={faqs}
      />
      <LabelServicePage />
    </>
  );
}
