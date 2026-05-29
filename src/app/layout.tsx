import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import GoogleTagManager, { GoogleTagManagerNoScript } from "@/components/GoogleTagManager";
import FacebookPixel from "@/components/FacebookPixel";
import PDPAConsent from "@/components/PDPAConsent";
import SchemaOrg from "@/components/SchemaOrg";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
  openGraph: {
    title: "Display Works Media | บริการสั่งป้ายและงานพิมพ์ออนไลน์",
    description: "บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร ง่าย เร็ว มืออาชีพ ส่งทั่วประเทศ",
    url: "https://displayworksmedia.com",
    type: "website",
    locale: "th_TH",
    siteName: "Display Works Media",
  },
  twitter: {
    card: "summary_large_image",
    title: "Display Works Media",
    description: "บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <head>
        {/* Preload critical font weight to unblock FCP */}
        <link
          rel="preload"
          as="font"
          href="https://fonts.gstatic.com/s/kanit/v15/nKKZ-Co32cUR0fj.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Load only the weights actually used — saves ~120KB vs 5 weights each */}
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&family=Prompt:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <GoogleTagManager />
        <FacebookPixel />
        <SchemaOrg />
      </head>
      <body>
        <GoogleTagManagerNoScript />
        {children}
        <PDPAConsent />
        {/* Scroll-reveal: lightweight IntersectionObserver — replaces framer-motion whileInView */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  },{threshold:0.12});
  function observe(){
    document.querySelectorAll('.reveal-section,.reveal-item').forEach(function(el){io.observe(el);});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',observe);
  else observe();
})();
            `,
          }}
        />
      </body>
    </html>
  );
}
