"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    // ใช้ window.location แทน router.push เพื่อให้ server reload cookie session ใหม่
    window.location.href = "/admin";
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "#0B0F19", fontFamily: "'Prompt', sans-serif",
    }}>
      <div style={{
        backgroundColor: "#141A24", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px", boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        padding: "40px", width: "100%", maxWidth: "420px",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ background: "#FF6B00", color: "#fff", fontWeight: 800, fontSize: 18, padding: "6px 14px", borderRadius: 8, display: "inline-block", marginBottom: 12 }}>DW</div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#fff", margin: 0 }}>Display Works Media</h1>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "6px" }}>เข้าสู่ระบบผู้ดูแล</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A8B0C0", marginBottom: "6px" }}>อีเมล</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              style={{ width: "100%", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "11px 14px", fontSize: "14px", color: "#fff", backgroundColor: "#1A2233", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#A8B0C0", marginBottom: "6px" }}>รหัสผ่าน</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "11px 14px", fontSize: "14px", color: "#fff", backgroundColor: "#1A2233", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ backgroundColor: "#450a0a", border: "1px solid #ef4444", color: "#fca5a5", borderRadius: "8px", padding: "10px 14px", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ width: "100%", backgroundColor: loading ? "#555" : "#FF6B00", color: "#fff", fontWeight: "600", fontSize: "14px", padding: "13px", borderRadius: "8px", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#374151", marginTop: "24px" }}>© 2025 Display Works Media</p>
      </div>
    </div>
  );
}
