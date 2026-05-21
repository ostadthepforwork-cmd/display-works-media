import type { Metadata } from "next";
import "../styles/globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GoogleTagManager, { GoogleTagManagerNoScript } from "@/components/GoogleTagManager";
import FacebookPixel from "@/components/FacebookPixel";
import PDPAConsent from "@/components/PDPAConsent";

export const metadata: Metadata = {
  metadataBase: new URL("https://displayworksmedia.com"),
  title: "Display Works Media | บริการสั่งป้ายและงานพิมพ์ออนไลน์",
  description:
    "Display Works Media คือโซลูชันงานพิมพ์สำหรับธุรกิจยุคใหม่ บริการสั่งป้ายไวนิล สติ๊กเกอร์ Roll Up Backdrop และสื่อสิ่งพิมพ์ครบวงจร ส่งทั่วประเทศ",
  keywords: [
    "ป้ายไวนิล",
    "สั่งพิมพ์ออนไลน์",
    "Roll Up",
    "Backdrop",
    "สติ๊กเกอร์",
    "PP Board",
    "งานพิมพ์",
    "Display Works Media",
  ],
  openGraph: {
    title: "Display Works Media | บริการสั่งป้ายและงานพิมพ์ออนไลน์",
    description:
      "บริการสั่งป้ายและงานพิมพ์ออนไลน์ครบวงจร ง่าย เร็ว มืออาชีพ ส่งทั่วประเทศ",
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
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "VyXsiVVM-91AtnePpqjog4ZwTDdkORLpa3drNcdP9ws",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        {/* ─── Google Fonts ─── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* ─── Tracking Scripts ─── */}
        <GoogleTagManager />
        <GoogleAnalytics />
        <FacebookPixel />
      </head>
      <body>
        {/* GTM noscript — must be immediately after <body> */}
        <GoogleTagManagerNoScript />

        {children}

        {/* PDPA Cookie Consent Banner */}
        <PDPAConsent />
      </body>
    </html>
  );
}
