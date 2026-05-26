"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
        fontFamily: "Kanit, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          padding: "40px",
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: 0 }}>
            Display Works Media
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "6px" }}>
            เข้าสู่ระบบผู้ดูแล
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
              อีเมล
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "14px",
                color: "#111827",
                backgroundColor: "#ffffff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "14px",
                color: "#111827",
                backgroundColor: "#ffffff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: loading ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "14px",
              padding: "13px",
              borderRadius: "8px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "24px" }}>
          © 2025 Display Works Media
        </p>
      </div>
    </div>
  );
}
