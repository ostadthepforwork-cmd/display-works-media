"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const supabase = getSupabaseBrowserClient();

function clearStaleSupabaseAuthState() {
  if (typeof window === "undefined") return;

  try {
    [window.localStorage, window.sessionStorage].forEach((storage) => {
      Object.keys(storage)
        .filter((key) => key.startsWith("sb-") || key.includes("supabase.auth.token"))
        .forEach((key) => storage.removeItem(key));
    });
  } catch {}

  try {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0]?.trim();
      if (!name || !name.startsWith("sb-")) return;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    });
  } catch {}
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    clearStaleSupabaseAuthState();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    clearStaleSupabaseAuthState();

    const { data, error: browserError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (browserError || !data.session) {
      setError(
        browserError?.message?.toLowerCase().includes("invalid login")
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : `เข้าสู่ระบบไม่สำเร็จ: ${browserError?.message || "ไม่พบ session จาก Supabase"}`,
      );
      setLoading(false);
      return;
    }

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      setError(result.error ? `เข้าสู่ระบบไม่สำเร็จ: ${result.error}` : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
      setLoading(false);
      return;
    }

    await supabase.auth.getSession().catch(() => undefined);

    // Force a full reload so the server receives the fresh Supabase cookie session.
    window.location.assign("/admin");
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Image
            src="/images/logo.png"
            alt="Display Works Media"
            width={74}
            height={48}
            style={{ width: 74, height: 48, objectFit: "contain", display: "block", margin: "0 auto 12px" }}
          />
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#fff", margin: 0 }}>Display Works Media</h1>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "6px" }}>เข้าสู่ระบบผู้ดูแล</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="admin-login-label">อีเมล</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="admin-login-input"
            />
          </div>

          <div>
            <label className="admin-login-label">รหัสผ่าน</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="admin-login-input"
            />
          </div>

          {error && <div className="admin-login-error">{error}</div>}

          <button type="submit" disabled={loading} className="admin-login-button">
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#374151", marginTop: "24px" }}>
          © 2026 Display Works Media
        </p>
      </div>
      <style>{`
        html, body { overflow-x: hidden; }

        .admin-login-page {
          min-height: 100dvh;
          width: 100%;
          max-width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 50% 18%, rgba(255,107,0,0.14), transparent 310px),
            linear-gradient(180deg, #0B0F19 0%, #080C14 100%);
          font-family: 'Prompt', sans-serif;
          padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .admin-login-card {
          background:
            linear-gradient(180deg, rgba(20,26,36,0.98), rgba(12,18,28,0.98));
          border: 1px solid rgba(255,255,255,0.09);
          border-top-color: rgba(255,107,0,0.26);
          border-radius: 22px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.46);
          padding: clamp(22px, 7vw, 40px);
          width: min(420px, calc(100vw - 32px));
          max-width: calc(100vw - 32px);
          box-sizing: border-box;
          margin: 0 auto;
        }

        .admin-login-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #A8B0C0;
          margin-bottom: 6px;
        }

        .admin-login-input {
          width: 100%;
          min-width: 0;
          max-width: 100%;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 11px 14px;
          font-size: 14px;
          color: #fff;
          background-color: #1A2233;
          outline: none;
          box-sizing: border-box;
        }

        .admin-login-input:focus {
          border-color: #FF6B00;
          box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.12);
        }

        .admin-login-error {
          background-color: #450a0a;
          border: 1px solid #ef4444;
          color: #fca5a5;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13px;
          line-height: 1.6;
        }

        .admin-login-button {
          width: 100%;
          min-width: 0;
          max-width: 100%;
          background: linear-gradient(135deg, #FF6B00, #F97316);
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          padding: 13px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 14px 34px rgba(255,107,0,0.22);
        }

        .admin-login-button:disabled {
          background-color: #555;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .admin-login-page {
            width: 100vw !important;
            max-width: 100vw !important;
            min-height: 100dvh !important;
            padding: max(20px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom)) !important;
          }

          .admin-login-card {
            border-radius: 18px !important;
            width: min(100%, 320px) !important;
            max-width: calc(100vw - 48px) !important;
            margin: 0 auto !important;
            padding: 24px 20px !important;
          }

          .admin-login-card h1 {
            font-size: 20px !important;
            line-height: 1.2 !important;
          }

          .admin-login-card form {
            gap: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
