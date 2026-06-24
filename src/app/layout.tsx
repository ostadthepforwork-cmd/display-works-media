import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import GoogleTagManager from "@/components/GoogleTagManager";
import FacebookPixel from "@/components/FacebookPixel";
import PDPAConsent from "@/components/PDPAConsent";
import SchemaOrg from "@/components/SchemaOrg";
import ScrollReveal from "@/components/ScrollReveal";
import { CmsSettingsProvider } from "@/components/CmsSettingsProvider";
import { getCmsSettings } from "@/lib/cms-settings";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale ลบออก — ให้ผู้ใช้ zoom ได้ (Accessibility + Best Practices)
};

export const metadata: Metadata = {
  metadataBase: new URL("https://displayworksmedia.com"),
  title: "Display Works Media | บริการสั่งป้ายและงานพิมพ์ออนไลน์",
  description:
    "Display Works Media ช่วยธุรกิจไทยรับบรีฟ ตรวจไฟล์ แนะนำวัสดุ ประสานการผลิต และจัดส่งป้ายไวนิล สติ๊กเกอร์ Roll Up Backdrop และสื่อโฆษณาทั่วประเทศ",
  keywords: [
    "ป้ายไวนิล", "สั่งพิมพ์ออนไลน์", "Roll Up", "Roll Up Stand",
    "Backdrop", "แบ็คดรอปผ้า", "สติ๊กเกอร์", "PP Board", "งานพิมพ์",
    "Display Works Media", "สั่งป้ายออนไลน์", "รับทำป้าย", "สื่อโฆษณาหน้าร้าน",
    "รับทำสติ๊กเกอร์", "ฉลากสินค้า", "Standee", "ป้ายร้านอาหาร", "ป้ายออกบูธ",
  ],
  alternates: {
    canonical: "https://displayworksmedia.com",
  },
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    title: "Display Works Media | บริการสั่งป้ายและงานพิมพ์ออนไลน์",
    description: "บริการงานป้ายและสื่อโฆษณาออนไลน์ ช่วยแนะนำวัสดุ ตรวจไฟล์ ประสานการผลิต และจัดส่งทั่วประเทศ",
    url: "https://displayworksmedia.com",
    type: "website",
    locale: "th_TH",
    siteName: "Display Works Media",
    images: [
      {
        url: "https://displayworksmedia.com/images/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "Display Works Media บริการป้ายและงานพิมพ์ออนไลน์",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Display Works Media",
    description: "บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร",
    images: ["https://displayworksmedia.com/images/hero-bg.jpg"],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cmsSettings = await getCmsSettings();

  return (
    <html lang="th">
      <head>
        {/* preconnect ก่อน แล้วค่อย preload — ลำดับนี้สำคัญ */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          Prompt:400 เท่านั้น — ตัด weight 600 ออกเพราะ globals.css ไม่ได้ใช้
          ประหยัดได้อีก ~40KB และลด dependency chain ของ LCP
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&family=Prompt:wght@400&display=swap"
          rel="stylesheet"
        />
        <GoogleTagManager />
        <SchemaOrg />
      </head>
      <body>
        <CmsSettingsProvider initialSettings={cmsSettings}>{children}</CmsSettingsProvider>
        {/*
          FacebookPixel ย้ายมาไว้ใน body — strategy="lazyOnload" จะโหลด
          หลัง page load เสร็จแล้ว ไม่บล็อก FCP/LCP
        */}
        <FacebookPixel />
        <PDPAConsent />
        {/* ScrollReveal: re-observe ทุกครั้งที่ navigate — แก้บัคหน้าดำเมื่อกลับมาหน้าแรก */}
        <ScrollReveal />
      </body>
    </html>
  );
}
