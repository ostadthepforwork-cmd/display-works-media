import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Display Works Media",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

// layout.tsx ไม่ต้องเช็ค auth อีกแล้ว เพราะ middleware จัดการแล้ว
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
