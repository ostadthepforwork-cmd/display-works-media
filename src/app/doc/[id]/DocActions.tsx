"use client";

import { useEffect } from "react";

type DocActionsProps = {
  title: string;
  autoPrint?: boolean;
};

export default function DocActions({ title, autoPrint = false }: DocActionsProps) {
  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => window.print(), 700);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  const shareLink = async () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("print");
    const url = currentUrl.toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      window.alert("คัดลอกลิงก์เอกสารแล้ว");
    } catch {
      window.alert("ไม่สามารถแชร์ลิงก์ได้");
    }
  };

  return (
    <div className="doc-toolbar">
      <div>
        <strong>{title}</strong>
        <span>เปิดดูเอกสาร และบันทึกเป็น PDF ได้จากหน้านี้</span>
      </div>
      <div className="doc-toolbar-actions">
        <button type="button" onClick={shareLink}>แชร์ลิงก์</button>
        <button type="button" className="primary" onClick={() => window.print()}>ดาวน์โหลด PDF</button>
      </div>
    </div>
  );
}
