"use client";
// src/app/admin/LogoutButton.tsx
// ปุ่ม Logout — ต้องเป็น Client Component เพราะใช้ onClick

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: "#ef4444",
        padding: "5px 12px",
        borderRadius: 8,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "'Prompt', sans-serif",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
    >
      ออกจากระบบ
    </button>
  );
}
