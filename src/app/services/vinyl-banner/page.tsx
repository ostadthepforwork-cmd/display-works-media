import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import VinylLandingPage from "../vinyl/VinylClient";

const url = "https://displayworksmedia.com/services/vinyl-banner";
const faqs = [
  { q: "ป้ายไวนิลเหมาะกับงานแบบไหน?", a: "เหมาะกับป้ายหน้าร้าน ป้ายโปรโมชั่น ป้ายอีเวนต์ ป้ายโครงการ และงานประชาสัมพันธ์ทั้งในอาคารและกลางแจ้ง" },
  { q: "ใช้ไฟล์ Artwork แบบไหน?", a: "แนะนำไฟล์ AI, PDF, PSD หรือ JPG/PNG ความละเอียดสูง พร้อมขนาดงานจริงหรือสัดส่วนที่ชัดเจน" },
  { q: "มีบริการออกแบบไหม?", a: "มีทีมกราฟิกช่วยออกแบบและจัดวางข้อความให้เหมาะกับระยะการมองเห็นของป้าย" },
  { q: "ใช้เวลาผลิตกี่วัน?", a: "โดยทั่วไป 1-3 วันทำการ ขึ้นอยู่กับขนาด จำนวน และรายละเอียดการจบงาน" },
  { q: "จัดส่งต่างจังหวัดได้ไหม?", a: "จัดส่งได้ทั่วประเทศไทย พร้อมแจ้งเลขพัสดุหลังจัดส่ง" },
];

export const metadata: Metadata = {
  title: "รับทำป้ายไวนิล ป้ายหน้าร้านและป้ายโฆษณา | Display Works Media",
  description: "รับทำป้ายไวนิลสำหรับหน้าร้าน งานโปรโมชั่น อีเวนต์ และป้ายโฆษณา พิมพ์คมชัด สีสด ทนแดดกันน้ำ ส่งทั่วไทย",
  alternates: { canonical: url },
  openGraph: {
    title: "รับทำป้ายไวนิล | Display Works Media",
    description: "ป้ายไวนิล Frontlit Backlit และป้ายโฆษณาทุกขนาด พร้อมตรวจไฟล์และประเมินราคา",
    url,
    images: [{ url: "https://displayworksmedia.com/images/services/vinyl.jpg" }],
  },
};

export default function VinylBannerPage() {
  return (
    <>
      <ServiceSchema
        name="รับทำป้ายไวนิล"
        description="รับทำป้ายไวนิลสำหรับป้ายหน้าร้าน ป้ายโปรโมชั่น ป้ายอีเวนต์ และป้ายโฆษณา พิมพ์คมชัด ส่งทั่วไทย"
        url={url}
        image="https://displayworksmedia.com/images/services/vinyl.jpg"
        faqs={faqs}
      />
      <VinylLandingPage />
    </>
  );
}
