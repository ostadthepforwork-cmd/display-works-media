import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบผู้ดูแล | Display Works Media",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
