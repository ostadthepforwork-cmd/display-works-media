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
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
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
    window.location.assign("/admin");
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-hero" aria-label="Display Works Media admin login">
        <div className="admin-login-logo-card">
          <Image src="/images/logo.png" alt="Display Works Media" width={92} height={74} priority />
        </div>
        <p>DISPLAY WORKS MEDIA</p>
        <h1>เข้าสู่ระบบหลังบ้าน</h1>
        <span>จัดการ ERP, CMS และ Marketing ในที่เดียว</span>
      </section>

      <section className="admin-login-panel">
        <div className="admin-login-card">
          <div className="admin-login-heading">
            <h2>ยินดีต้อนรับกลับ</h2>
            <p>กรอกข้อมูลบัญชีผู้ดูแลเพื่อดำเนินการต่อ</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            <label className="admin-login-field">
              <span>อีเมล</span>
              <div>
                <i aria-hidden="true">✉</i>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@displayworksmedia.com"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="admin-login-field">
              <span>รหัสผ่าน</span>
              <div>
                <i aria-hidden="true">⌕</i>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
                  {showPassword ? "ซ่อน" : "ดู"}
                </button>
              </div>
            </label>

            <div className="admin-login-options">
              <label>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>จดจำฉันไว้</span>
              </label>
              <span>ลืมรหัสผ่าน?</span>
            </div>

            {error && <div className="admin-login-error">{error}</div>}

            <button type="submit" disabled={loading} className="admin-login-submit">
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="admin-login-note">
            <span aria-hidden="true">◇</span>
            <p>สำหรับผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น</p>
          </div>
        </div>
        <small>© 2026 Display Works Media</small>
      </section>

      <style>{`
        html, body { overflow-x: hidden; }

        .admin-login-page {
          min-height: 100dvh;
          display: grid;
          grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1fr);
          background: #f4f6f9;
          color: #14171c;
          font-family: 'Prompt', sans-serif;
        }

        .admin-login-hero {
          min-height: 100dvh;
          padding: clamp(40px, 7vw, 88px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          background:
            linear-gradient(120deg, rgba(0,0,0,.74), rgba(0,0,0,.34)),
            radial-gradient(circle at 88% 30%, rgba(255,107,0,.36), transparent 210px),
            linear-gradient(135deg, #101216 0%, #242628 100%);
          position: relative;
          overflow: hidden;
        }

        .admin-login-hero:before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: linear-gradient(90deg, rgba(0,0,0,.95), transparent);
          pointer-events: none;
        }

        .admin-login-hero:after {
          content: "";
          position: absolute;
          right: -70px;
          top: 12%;
          width: 360px;
          height: 520px;
          border-right: 7px solid #FF6B00;
          border-bottom: 7px solid #FF6B00;
          transform: rotate(36deg);
          opacity: .92;
          pointer-events: none;
        }

        .admin-login-hero > * {
          position: relative;
          z-index: 1;
        }

        .admin-login-logo-card {
          width: 116px;
          height: 116px;
          border-radius: 26px;
          display: grid;
          place-items: center;
          background: #fff;
          box-shadow: 0 24px 70px rgba(0,0,0,.28);
          margin-bottom: 38px;
        }

        .admin-login-logo-card img {
          width: 92px;
          height: 74px;
          object-fit: contain;
        }

        .admin-login-hero p {
          color: #fff;
          font-weight: 900;
          letter-spacing: .08em;
          margin: 0 0 22px;
          text-shadow: 0 10px 30px rgba(0,0,0,.32);
        }

        .admin-login-hero h1 {
          color: #fff;
          font-size: clamp(52px, 7vw, 86px);
          line-height: 1.04;
          letter-spacing: 0;
          margin: 0 0 22px;
          text-shadow: 0 14px 40px rgba(0,0,0,.45);
        }

        .admin-login-hero span {
          color: rgba(255,255,255,.78);
          font-size: clamp(18px, 2.4vw, 28px);
          line-height: 1.45;
          max-width: 620px;
        }

        .admin-login-panel {
          display: grid;
          align-content: center;
          justify-items: center;
          gap: 28px;
          padding: clamp(28px, 5vw, 72px);
        }

        .admin-login-card {
          width: min(100%, 560px);
          border-radius: 28px;
          background: #fff;
          box-shadow: 0 32px 100px rgba(15,23,42,.16);
          padding: clamp(28px, 5vw, 58px);
        }

        .admin-login-heading h2 {
          margin: 0;
          font-size: clamp(32px, 4vw, 52px);
          line-height: 1.08;
          letter-spacing: 0;
        }

        .admin-login-heading p {
          margin: 12px 0 0;
          color: #6b7280;
          font-size: 18px;
          line-height: 1.6;
        }

        .admin-login-form {
          display: grid;
          gap: 24px;
          margin-top: 34px;
        }

        .admin-login-field {
          display: grid;
          gap: 10px;
          color: #15191f;
          font-weight: 800;
          font-size: 17px;
        }

        .admin-login-field > div {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr) auto;
          align-items: center;
          min-height: 72px;
          border: 1px solid #d7dce4;
          border-radius: 14px;
          background: #fff;
          overflow: hidden;
        }

        .admin-login-field i {
          color: #6b7280;
          font-style: normal;
          text-align: center;
          font-size: 24px;
        }

        .admin-login-field input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #111827;
          font: inherit;
          font-weight: 500;
          padding: 0 12px;
        }

        .admin-login-field button {
          border: 0;
          background: transparent;
          color: #6b7280;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          padding: 0 16px;
          cursor: pointer;
        }

        .admin-login-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          color: #6b7280;
          font-size: 16px;
        }

        .admin-login-options label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .admin-login-options input {
          width: 22px;
          height: 22px;
          accent-color: #FF6B00;
        }

        .admin-login-options > span {
          color: #FF5A00;
          font-weight: 900;
        }

        .admin-login-error {
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 12px 14px;
          line-height: 1.55;
        }

        .admin-login-submit {
          width: 100%;
          min-height: 72px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, #FF4D00, #FF6B00);
          color: #fff;
          font: inherit;
          font-size: 22px;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          box-shadow: 0 22px 48px rgba(255,107,0,.26);
        }

        .admin-login-submit:disabled {
          opacity: .62;
          cursor: not-allowed;
        }

        .admin-login-submit span {
          font-size: 34px;
          line-height: 1;
        }

        .admin-login-note {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 17px;
        }

        .admin-login-note span {
          color: #FF5A00;
          font-size: 28px;
        }

        .admin-login-note p {
          margin: 0;
        }

        .admin-login-panel > small {
          color: #6b7280;
          font-size: 15px;
        }

        @media (max-width: 900px) {
          .admin-login-page {
            display: block;
            min-height: 100dvh;
          }

          .admin-login-hero {
            min-height: 42dvh;
            padding: max(44px, env(safe-area-inset-top)) 28px 92px;
          }

          .admin-login-logo-card {
            width: 92px;
            height: 92px;
            border-radius: 18px;
            margin-bottom: 28px;
          }

          .admin-login-logo-card img {
            width: 74px;
            height: 58px;
          }

          .admin-login-hero h1 {
            font-size: clamp(44px, 11vw, 62px);
          }

          .admin-login-hero span {
            font-size: 22px;
          }

          .admin-login-panel {
            margin-top: -70px;
            padding: 0 18px max(30px, env(safe-area-inset-bottom));
            position: relative;
            z-index: 2;
          }

          .admin-login-card {
            border-radius: 28px;
            padding: 32px 26px 28px;
          }

          .admin-login-heading h2 {
            font-size: 40px;
          }

          .admin-login-heading p {
            font-size: 17px;
          }

          .admin-login-field > div {
            min-height: 64px;
          }

          .admin-login-options {
            align-items: flex-start;
            font-size: 15px;
          }

          .admin-login-submit {
            min-height: 64px;
            font-size: 21px;
          }
        }
      `}</style>
    </main>
  );
}
