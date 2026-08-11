"use client";
// src/app/admin/LogoutButton.tsx
// à¸›à¸¸à¹ˆà¸¡ Logout â€” à¸•à¹‰à¸­à¸‡à¹€à¸›à¹‡à¸™ Client Component à¹€à¸žà¸£à¸²à¸°à¹ƒà¸Šà¹‰ onClick

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

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
      aria-label="à¸­à¸­à¸à¸ˆà¸²à¸à¸£à¸°à¸šà¸š"
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
      à¸­à¸­à¸à¸ˆà¸²à¸à¸£à¸°à¸šà¸š
    </button>
  );
}
