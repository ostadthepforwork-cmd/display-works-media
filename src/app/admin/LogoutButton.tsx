"use client";
// src/app/admin/LogoutButton.tsx
// ปุ่ม Logout — ต้องเป็น Client Component เพราะใช้ onClick

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      className="admin-logout-btn"
      aria-label="ออกจากระบบ"
      onClick={handleLogout}
    >
      <LogOut size={15} aria-hidden="true" />
      <span className="hide-mobile">ออกจากระบบ</span>
    </button>
  );
}
