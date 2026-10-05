"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordClient() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);

  useEffect(() => {
    let mounted = true;
    getSupabaseBrowserClient().auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      setReady(Boolean(data.user && !error));
      setChecking(false);
    }).catch(() => { if (mounted) setChecking(false); });
    return () => { mounted = false; };
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || pending.current) return;
    if (password !== confirm) { setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน"); return; }
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      const client = getSupabaseBrowserClient();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      await client.auth.signOut();
      window.location.assign("/login?password=updated");
    } catch {
      setError("เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาตรวจรหัสผ่านหรือลิงก์ แล้วลองใหม่");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return <main className="password-reset-page">
    <section aria-labelledby="reset-title">
      <Link href="/login">Display Works Media</Link>
      <h1 id="reset-title">ตั้งรหัสผ่านใหม่</h1>
      {checking ? <p role="status">กำลังตรวจสอบลิงก์…</p> : !ready ? <p role="alert">ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ</p> :
        <form onSubmit={save}>
          <label>รหัสผ่านใหม่<input type="password" autoComplete="new-password" required minLength={12} value={password} onChange={event => setPassword(event.target.value)} /></label>
          <label>ยืนยันรหัสผ่าน<input type="password" autoComplete="new-password" required minLength={12} value={confirm} onChange={event => setConfirm(event.target.value)} /></label>
          {error && <p role="alert">{error}</p>}
          <button disabled={saving} type="submit">{saving ? "กำลังบันทึก…" : "บันทึกรหัสผ่าน"}</button>
        </form>}
      <Link href="/login">กลับหน้าเข้าสู่ระบบ</Link>
    </section>
    <style>{`
      .password-reset-page{min-height:100dvh;display:grid;place-items:center;background:#f3f5f7;color:#171717;padding:24px;}
      .password-reset-page section{width:100%;max-width:440px;background:#fff;border:1px solid #cbd5e1;border-radius:8px;padding:28px;}
      .password-reset-page h1{font-size:26px;line-height:1.3;margin:20px 0;letter-spacing:0;}
      .password-reset-page a{color:#9a3412;display:inline-block;padding:12px 0;}
      .password-reset-page form{display:grid;gap:18px;margin-bottom:12px;}
      .password-reset-page label{display:grid;gap:8px;font-weight:600;}
      .password-reset-page input{min-width:0;width:100%;min-height:48px;border:1px solid #64748b;border-radius:6px;background:#fff;color:#171717;font:inherit;padding:10px;}
      .password-reset-page button{min-height:48px;background:#c2410c;color:#fff;border:0;border-radius:6px;font:inherit;font-weight:600;cursor:pointer;}
      .password-reset-page button:disabled{background:#6b7280;cursor:wait;}
      .password-reset-page [role=alert]{color:#b91c1c;line-height:1.6;}
      .password-reset-page :focus-visible{outline:3px solid #ea580c;outline-offset:3px;}
    `}</style>
  </main>;
}
