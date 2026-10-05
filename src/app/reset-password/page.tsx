import type { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = { title: "ตั้งรหัสผ่านใหม่ | Display Works Media", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
