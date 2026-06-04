import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import GoogleTagManager, { GoogleTagManagerNoScript } from "@/components/GoogleTagManager";
import FacebookPixel from "@/components/FacebookPixel";
import PDPAConsent from "@/components/PDPAConsent";
import SchemaOrg from "@/components/SchemaOrg";
import ScrollReveal from "@/components/ScrollReveal";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale ลบออก — ให้ผู้ใช้ zoom ได้ (Accessibility + Best Practices)
};

export const metadata: Metadata = {
  metadataBase: new URL("https://displayworksmedia.com"),
  title: "Display Works Media | บริการสั่งป้ายและงานพิมพ์ออนไลน์",
  description:
    "Display Works Media คือโซลูชันงานพิมพ์สำหรับธุรกิจยุคใหม่ บริการสั่งป้ายไวนิล สติ๊กเกอร์ Roll Up Backdrop และสื่อสิ่งพิมพ์ครบวงจร ส่งทั่วประเทศ",
  keywords: [
    "ป้ายไวนิล", "สั่งพิมพ์ออนไลน์", "Roll Up", "Roll Up Stand",
    "Backdrop", "แบ็คดรอปผ้า", "สติ๊กเกอร์", "PP Board", "งานพิมพ์",
    "Display Works Media", "สั่งป้ายออนไลน์", "รับทำป้าย", "พิมพ์ป้ายราคาถูก",
    "สั่งพิมพ์ไวนิลกรุงเทพ", "รับทำสติ๊กเกอร์", "ฉลากสินค้า", "Standee",
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
    description: "บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร ง่าย เร็ว มืออาชีพ ส่งทั่วประเทศ",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <head>
        {/* preconnect ก่อน แล้วค่อย preload — ลำดับนี้สำคัญ */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/*
          preload เฉพาะ Kanit 400 (weight ที่ใช้จริงบน Hero)
          ใช้ v17 ซึ่งเป็น version ปัจจุบัน — v15 ที่เคยใช้ให้ 404 error
        */}
        <link
          rel="preload"
          as="font"
          href="https://fonts.gstatic.com/s/kanit/v17/nKKZ-Co32cUR0fj.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
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
        <GoogleTagManagerNoScript />
        {children}
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
