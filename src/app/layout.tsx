import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
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
      </head>
      <body>{children}</body>
    </html>
  );
}
