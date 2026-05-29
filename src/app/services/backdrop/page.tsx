/**
 * backdrop/page.tsx — Server Component wrapper
 * ทำหน้าที่: inject metadata + JSON-LD Schema สำหรับ SEO/GEO/AEO
 * BackdropClient.tsx คือ Client Component ที่มี animation/form
 */
import type { Metadata } from "next";
import { ServiceSchema } from "@/components/SchemaOrg";
import BackdropLandingPage from "./BackdropClient";

export const metadata: Metadata = {
  title: "แบ็คดรอปผ้า แบ็คดรอป Pop-up โครงทรัส | Display Works Media",
  description:
    "สั่งทำแบ็คดรอปผ้า แบ็คดรอป Pop-up แบ็คดรอปโครงทรัส คุณภาพสูง ส่งทั่วไทย ราคาเป็นธรรม พิมพ์ภาพคมชัด สีสด ไร้รอยต่อ เหมาะสำหรับงาน Event ถ่ายรูป บูธสินค้า",
  keywords: [
    "แบ็คดรอปผ้า", "Fabric Backdrop", "แบ็คดรอป Pop-up", "แบ็คดรอปโครงทรัส",
    "ฉากหลังถ่ายรูป", "สั่งทำแบ็คดรอป", "backdrop ราคาถูก", "Display Works Media",
  ],
  alternates: { canonical: "https://displayworksmedia.com/services/backdrop" },
  openGraph: {
    title: "แบ็คดรอปผ้า แบ็คดรอป Pop-up โครงทรัส | Display Works Media",
    description: "สั่งทำแบ็คดรอปทุกชนิด คุณภาพสูง ส่งทั่วไทย",
    url: "https://displayworksmedia.com/services/backdrop",
    images: [{ url: "https://displayworksmedia.com/images/services/backdrop.jpg" }],
  },
};

const backdropFaqs = [
  { q: "ใช้เวลาผลิตกี่วัน?", a: "โดยปกติแบ็คดรอปใช้เวลาผลิต 3–5 วันทำการ หลังจากคอนเฟิร์มแบบ หากมีงานด่วนสามารถแจ้งล่วงหน้าได้" },
  { q: "ประกอบติดตั้งเองได้ไหม?", a: "ได้แน่นอน สำหรับแบ็คดรอปผ้าและ Pop-up ถูกออกแบบมาให้ประกอบง่าย ใช้เวลาไม่ถึง 10 นาที" },
  { q: "มีโครงอยู่แล้ว สั่งแค่ผ้าหรือแผ่นพิมพ์ได้ไหม?", a: "สามารถทำได้ เพียงแจ้งขนาดโครงเดิมที่มีอยู่ ยินดีรับผลิตเฉพาะส่วนงานพิมพ์เพื่อประหยัดงบประมาณ" },
  { q: "รับออกแบบกราฟิกแบ็คดรอปไหม?", a: "รับออกแบบ มีทีมกราฟิกช่วยออกแบบและจัดวางคอมโพสิชันให้เหมาะสมกับการถ่ายรูปมากที่สุด" },
];

export default function BackdropPage() {
  return (
    <>
      <ServiceSchema
        name="แบ็คดรอปผ้า / แบ็คดรอป Pop-up / แบ็คดรอปโครงทรัส"
        description="รับสั่งทำแบ็คดรอปทุกชนิด ผ้า Pop-up โครงทรัส พิมพ์ภาพคมชัด สีสด ไร้รอยต่อ เหมาะสำหรับงาน Event ถ่ายรูป บูธสินค้า"
        url="https://displayworksmedia.com/services/backdrop"
        image="https://displayworksmedia.com/images/services/backdrop.jpg"
        faqs={backdropFaqs}
      />
      <BackdropLandingPage />
    </>
  );
}
