"use client";

import { useEffect } from "react";

type DocActionsProps = {
  title: string;
  autoPrint?: boolean;
};

export default function DocActions({ title, autoPrint = false }: DocActionsProps) {
  useEffect(() => {
    // คำนวณ scale ให้ A4 พอดีจอมือถือ
    function updateScale() {
      const A4_PX = 794; // 210mm @ 96dpi
      const vw = window.innerWidth;
      if (vw < 820) {
        const scale = Math.min((vw / A4_PX), 1);
        document.documentElement.style.setProperty("--doc-scale", String(scale));
      } else {
        document.documentElement.style.removeProperty("--doc-scale");
      }
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => window.print(), 700);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  const shareLink = async () => {
    // สร้าง URL ใหม่ที่สะอาด — เก็บแค่ path ไม่เอา query params ใดๆ ติดไป
    const url = `${window.location.origin}${window.location.pathname}`;
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
