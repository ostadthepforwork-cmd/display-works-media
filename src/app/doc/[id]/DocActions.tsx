"use client";

import { useCallback, useEffect } from "react";

type DocActionsProps = {
  title: string;
  autoPrint?: boolean;
};

export default function DocActions({ title, autoPrint = false }: DocActionsProps) {
  const waitForDocumentAssets = useCallback(async () => {
    try {
      if (document.fonts?.ready) await document.fonts.ready;
    } catch {}

    const images = Array.from(document.images || []);
    await Promise.all(images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      if (img.decode) return img.decode().catch(() => {});
      return new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    }));
  }, []);

  const printDocument = useCallback(async () => {
    await waitForDocumentAssets();
    window.setTimeout(() => window.print(), 150);
  }, [waitForDocumentAssets]);

  useEffect(() => {
    // คำนวณ scale ให้ A4 พอดีจอมือถือ
    function updateScale() {
      const A4_PX = 794; // 210mm @ 96dpi
      const A4_HEIGHT_PX = 1123; // 297mm @ 96dpi
      const vw = window.innerWidth;
      if (vw < 820) {
        const scale = Math.min(((vw - 24) / A4_PX), 1);
        document.documentElement.style.setProperty("--doc-scale", String(scale));
        document.documentElement.style.setProperty("--doc-mobile-height", `${A4_HEIGHT_PX * scale}px`);
      } else {
        document.documentElement.style.removeProperty("--doc-scale");
        document.documentElement.style.removeProperty("--doc-mobile-height");
      }
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => {
      void printDocument();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [autoPrint, printDocument]);

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
        <button type="button" className="primary" onClick={() => void printDocument()}>ดาวน์โหลด PDF</button>
      </div>
    </div>
  );
}
