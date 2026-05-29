import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import RollUpLandingPage from "./RollupClient";

export const metadata: Metadata = {
  title: "Roll Up Stand / X-Stand บูธงาน Event | Display Works Media",
  description:
    "สั่งทำ Roll Up Stand X-Stand สำหรับบูธนิทรรศการ งาน Event ร้านค้า กางง่าย พกพาสะดวก มีกระเป๋า พิมพ์ภาพคมชัด สั่งได้ 1 ชุด ส่งทั่วไทย",
  keywords: [
    "Roll Up Stand", "X-Stand", "สั่งทำ Roll Up", "บูธนิทรรศการ",
    "สแตนด์งาน Event", "Roll Up ราคาถูก", "Display Works Media",
  ],
  alternates: { canonical: "https://displayworksmedia.com/services/rollup" },
  openGraph: {
    title: "Roll Up Stand / X-Stand บูธงาน Event | Display Works Media",
    description: "Roll Up Stand X-Stand กางง่าย พกพาสะดวก พิมพ์คมชัด สั่งได้ 1 ชุด",
    url: "https://displayworksmedia.com/services/rollup",
  },
};

const rollupFaqs = [
  { q: "Roll Up กับ X-Stand เลือกแบบไหนดี?", a: "หากต้องการความดูเป็นทางการ แข็งแรง และภาพเรียบตึง แนะนำ Roll Up แต่ถ้าเน้นน้ำหนักเบา เคลื่อนย้ายบ่อย และงบประหยัด แนะนำ X-Stand" },
  { q: "เปลี่ยนแค่ภาพพิมพ์โดยไม่ซื้อโครงใหม่ได้ไหม?", a: "ได้ สำหรับ X-Stand สามารถสั่งพิมพ์ภาพตอกตาไก่ไปคล้องเองได้ง่ายๆ ส่วน Roll Up แนะนำส่งโครงเดิมมาให้ช่างเปลี่ยนให้เพื่อให้ภาพดึงได้ตึงและสปริงไม่หลุด" },
  { q: "ภาพพิมพ์กันน้ำได้ไหม?", a: "กันน้ำได้ วัสดุพิมพ์ทั้ง PP Paper และ PET Film มีคุณสมบัติกันน้ำ และเคลือบฟิล์ม (เงา/ด้าน) ป้องกันรอยขีดข่วน" },
  { q: "มีกระเป๋าใส่ให้ด้วยไหม?", a: "มี ทั้งชุด Roll Up และ X-Stand จะมาพร้อมกระเป๋าผ้าแคนวาสสีดำสำหรับพกพาฟรีทุกชุด" },
  { q: "สั่งทำขนาดพิเศษที่ไม่ใช่มาตรฐานได้ไหม?", a: "โครงสำเร็จรูปจะมีขนาดคงที่ตามมาตรฐาน หากต้องการขนาดพิเศษแนะนำทำเป็น Standee โครง PP Board หรือเหล็กแทน" },
];

export default function RollupPage() {
  return (
    <>
      <ServiceSchema
        name="Roll Up Stand / X-Stand สำหรับบูธและงาน Event"
        description="สั่งทำ Roll Up Stand X-Stand สำหรับบูธนิทรรศการ งาน Event ร้านค้า กางง่าย พกพาสะดวก มีกระเป๋า พิมพ์ภาพคมชัด สั่งได้ 1 ชุด ส่งทั่วไทย"
        url="https://displayworksmedia.com/services/rollup"
        faqs={rollupFaqs}
      />
      <RollUpLandingPage />
    </>
  );
}
