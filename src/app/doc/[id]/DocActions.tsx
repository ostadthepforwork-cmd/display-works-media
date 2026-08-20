"use client";

import { useCallback, useEffect, useState } from "react";

type DocActionsProps = {
  title: string;
  autoPrint?: boolean;
};

const A4_WIDTH_PX = 794; // 210mm @ 96dpi
const A4_HEIGHT_PX = 1123; // 297mm @ 96dpi

function clearDocumentScale() {
  document.documentElement.style.removeProperty("--doc-scale");
  document.documentElement.style.removeProperty("--doc-mobile-height");
}

function updateDocumentScale() {
  if (document.documentElement.dataset.docPrinting === "true") {
    clearDocumentScale();
    return;
  }

  const vw = window.innerWidth;
  if (vw < 820) {
    const scale = Math.min((vw - 24) / A4_WIDTH_PX, 1);
    document.documentElement.style.setProperty("--doc-scale", String(scale));
    document.documentElement.style.setProperty("--doc-mobile-height", `${A4_HEIGHT_PX * scale}px`);
  } else {
    clearDocumentScale();
  }
}

export default function DocActions({ title, autoPrint = false }: DocActionsProps) {
  const [statusMessage, setStatusMessage] = useState("");

  const copyText = useCallback(async (value: string) => {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const copied = document.execCommand("copy");
      if (!copied) throw new Error("Copy command failed");
    } finally {
      document.body.removeChild(textarea);
    }
  }, []);

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
    setStatusMessage("กำลังเตรียมเอกสารสำหรับบันทึกเป็น PDF...");
    document.documentElement.dataset.docPrinting = "true";
    clearDocumentScale();
    await waitForDocumentAssets();

    const restoreScreenScale = () => {
      delete document.documentElement.dataset.docPrinting;
      updateDocumentScale();
    };

    const handleAfterPrint = () => {
      restoreScreenScale();
      window.removeEventListener("afterprint", handleAfterPrint);
    };

    window.addEventListener("afterprint", handleAfterPrint, { once: true });

    window.setTimeout(() => {
      window.print();
      setStatusMessage("เลือก Save as PDF หรือบันทึกลงเครื่องจากหน้าต่างพิมพ์");
      window.setTimeout(restoreScreenScale, 5000);
    }, 150);
  }, [waitForDocumentAssets]);

  useEffect(() => {
    updateDocumentScale();
    window.addEventListener("resize", updateDocumentScale);
    return () => window.removeEventListener("resize", updateDocumentScale);
  }, []);

  useEffect(() => {
    const handleBeforePrint = () => {
      document.documentElement.dataset.docPrinting = "true";
      clearDocumentScale();
    };

    const handleAfterPrint = () => {
      delete document.documentElement.dataset.docPrinting;
      updateDocumentScale();
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
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
    const shareData = {
      title,
      text: `${title}\nเปิดดูเอกสารและบันทึกเป็น PDF ได้จากลิงก์นี้`,
      url,
    };

    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setStatusMessage("เปิดหน้าต่างแชร์เอกสารแล้ว");
        return;
      }
      await copyText(url);
      setStatusMessage("คัดลอกลิงก์เอกสารแล้ว");
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") return;
      try {
        await copyText(url);
        setStatusMessage("คัดลอกลิงก์เอกสารแล้ว");
      } catch {
        setStatusMessage("ไม่สามารถแชร์หรือคัดลอกลิงก์ได้");
      }
    }
  };

  return (
    <div className="doc-toolbar">
      <div>
        <strong>{title}</strong>
        <span>เปิดดูเอกสาร และบันทึกเป็น PDF ได้จากหน้านี้</span>
      </div>
      <div className="doc-toolbar-actions">
        <button type="button" onClick={shareLink} aria-label={`แชร์ลิงก์ ${title}`}>แชร์ลิงก์</button>
        <button type="button" className="primary" onClick={() => void printDocument()} aria-label={`บันทึกหรือพิมพ์ PDF ${title}`}>บันทึก PDF</button>
      </div>
      {statusMessage && <p className="doc-toolbar-status" role="status">{statusMessage}</p>}
    </div>
  );
}
