"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
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
        <div className="admin-login-hero-inner">
          <div className="admin-login-logo-card">
            <Image src="/images/logo.png" alt="Display Works Media" width={116} height={84} priority />
          </div>
          <p className="admin-login-brand">DISPLAY WORKS MEDIA</p>
          <h1>เข้าสู่ระบบหลังบ้าน</h1>
          <p className="admin-login-subtitle">จัดการ ERP, CMS และ Marketing ในที่เดียว</p>
        </div>
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
              <div className="admin-login-input">
                <Mail size={24} aria-hidden="true" />
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
              <div className="admin-login-input">
                <Lock size={24} aria-hidden="true" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="admin-login-icon-btn"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
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
              <span>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
              <ArrowRight size={34} aria-hidden="true" />
            </button>
          </form>

          <div className="admin-login-note">
            <ShieldCheck size={32} aria-hidden="true" />
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
          grid-template-columns: minmax(380px, .92fr) minmax(460px, 1fr);
          background: #f4f6f9;
          color: #15171c;
          font-family: 'Prompt', sans-serif;
        }

        .admin-login-hero {
          min-height: 100dvh;
          padding: clamp(42px, 7vw, 92px);
          display: flex;
          align-items: center;
          background:
            linear-gradient(120deg, rgba(10,10,10,.86), rgba(13,13,14,.52)),
            radial-gradient(circle at 88% 28%, rgba(255,107,0,.34), transparent 240px),
            linear-gradient(135deg, #171819 0%, #2b2d2f 100%);
          position: relative;
          overflow: hidden;
        }

        .admin-login-hero:before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 68px 68px;
          mask-image: linear-gradient(90deg, rgba(0,0,0,.96), transparent);
          pointer-events: none;
        }

        .admin-login-hero:after {
          content: "";
          position: absolute;
          right: -84px;
          top: 10%;
          width: 380px;
          height: 560px;
          border-right: 8px solid #ff6b00;
          border-bottom: 8px solid #ff6b00;
          transform: rotate(35deg);
          opacity: .92;
          filter: drop-shadow(0 0 28px rgba(255,107,0,.28));
          pointer-events: none;
        }

        .admin-login-hero-inner {
          position: relative;
          z-index: 1;
          max-width: 680px;
        }

        .admin-login-logo-card {
          width: 132px;
          height: 132px;
          border-radius: 28px;
          display: grid;
          place-items: center;
          background: #fff;
          box-shadow: 0 28px 72px rgba(0,0,0,.34);
          margin-bottom: 40px;
        }

        .admin-login-logo-card img {
          width: 116px;
          height: 84px;
          object-fit: contain;
        }

        .admin-login-brand {
          color: #fff;
          font-weight: 900;
          letter-spacing: .08em;
          margin: 0 0 20px;
          text-shadow: 0 12px 34px rgba(0,0,0,.36);
        }

        .admin-login-hero h1 {
          color: #fff;
          font-size: clamp(58px, 7vw, 92px);
          line-height: 1.03;
          letter-spacing: 0;
          margin: 0 0 22px;
          text-shadow: 0 16px 42px rgba(0,0,0,.46);
        }

        .admin-login-subtitle {
          color: rgba(255,255,255,.78);
          font-size: clamp(20px, 2.25vw, 30px);
          line-height: 1.45;
          margin: 0;
          max-width: 650px;
        }

        .admin-login-panel {
          display: grid;
          align-content: center;
          justify-items: center;
          gap: 28px;
          padding: clamp(30px, 5vw, 78px);
        }

        .admin-login-card {
          width: min(100%, 580px);
          border-radius: 30px;
          background: #fff;
          box-shadow: 0 34px 110px rgba(15,23,42,.16);
          padding: clamp(30px, 5vw, 60px);
        }

        .admin-login-heading h2 {
          margin: 0;
          font-size: clamp(34px, 4vw, 54px);
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

        .admin-login-input {
          display: grid;
          grid-template-columns: 56px minmax(0, 1fr) auto;
          align-items: center;
          min-height: 72px;
          border: 1px solid #d7dce4;
          border-radius: 15px;
          background: #fff;
          overflow: hidden;
          transition: border-color .18s ease, box-shadow .18s ease;
        }

        .admin-login-input:focus-within {
          border-color: #ff6b00;
          box-shadow: 0 0 0 4px rgba(255,107,0,.12);
        }

        .admin-login-input svg {
          justify-self: center;
          color: #6b7280;
        }

        .admin-login-input input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #111827;
          font: inherit;
          font-weight: 500;
          padding: 0 12px 0 0;
        }

        .admin-login-icon-btn {
          width: 54px;
          height: 54px;
          border: 0;
          background: transparent;
          color: #6b7280;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .admin-login-icon-btn svg {
          color: currentColor;
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
          accent-color: #ff6b00;
        }

        .admin-login-options > span {
          color: #ff5a00;
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
          border-radius: 15px;
          background: linear-gradient(135deg, #ff4d00, #ff6b00);
          color: #fff;
          font: inherit;
          font-size: 22px;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          box-shadow: 0 22px 48px rgba(255,107,0,.26);
        }

        .admin-login-submit:disabled {
          opacity: .62;
          cursor: not-allowed;
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

        .admin-login-note svg {
          color: #ff5a00;
          flex: 0 0 auto;
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
            min-height: 45dvh;
            align-items: flex-start;
            padding: max(46px, env(safe-area-inset-top)) 28px 104px;
          }

          .admin-login-hero:after {
            right: -122px;
            top: 8%;
            width: 320px;
            height: 480px;
            border-width: 6px;
          }

          .admin-login-logo-card {
            width: 98px;
            height: 98px;
            border-radius: 20px;
            margin-bottom: 30px;
          }

          .admin-login-logo-card img {
            width: 80px;
            height: 60px;
          }

          .admin-login-brand {
            font-size: 18px;
          }

          .admin-login-hero h1 {
            font-size: clamp(44px, 11vw, 62px);
            max-width: 7.5em;
          }

          .admin-login-subtitle {
            font-size: 22px;
            max-width: 12em;
          }

          .admin-login-panel {
            margin-top: -76px;
            padding: 0 18px max(30px, env(safe-area-inset-bottom));
            position: relative;
            z-index: 2;
          }

          .admin-login-card {
            border-radius: 30px;
            padding: 34px 26px 30px;
          }

          .admin-login-heading h2 {
            font-size: 40px;
          }

          .admin-login-heading p {
            font-size: 17px;
          }

          .admin-login-input {
            min-height: 64px;
            grid-template-columns: 50px minmax(0, 1fr) auto;
          }

          .admin-login-icon-btn {
            width: 48px;
            height: 48px;
          }

          .admin-login-options {
            align-items: flex-start;
            font-size: 15px;
          }

          .admin-login-submit {
            min-height: 64px;
            font-size: 21px;
          }

          .admin-login-note {
            font-size: 15px;
          }
        }

        @media (max-width: 380px) {
          .admin-login-hero {
            padding-left: 22px;
            padding-right: 22px;
          }

          .admin-login-panel {
            padding-left: 12px;
            padding-right: 12px;
          }

          .admin-login-card {
            padding-left: 20px;
            padding-right: 20px;
          }
        }
      `}</style>
    </main>
  );
}
