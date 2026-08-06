import type { Metadata } from "next";
import Link from "next/link";
import QaTestLab from "./QaTestLab";

export const metadata: Metadata = {
  title: "QA Test Lab | Display Works Media",
  description: "Internal QA page for testing ERP calculations and key website links.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function QaPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#080c12", color: "#fff" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 18px 72px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#ff6b00",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 4,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              QA TEST LAB
            </div>
            <h1 style={{ fontSize: "clamp(34px, 6vw, 72px)", lineHeight: 0.95, margin: 0, letterSpacing: 0 }}>
              Display Works Media
              <br />
              <span style={{ color: "#ff6b00" }}>Manual Test Page</span>
            </h1>
            <p style={{ color: "#a8b3c7", maxWidth: 720, fontSize: 16, lineHeight: 1.8, marginTop: 18 }}>
              This page uses mock data only. Use it to test ERP calculation rules, important links, and manual QA
              checklist items before production use.
            </p>
          </div>
          <Link
            href="/"
            style={{
              border: "1px solid rgba(255,107,0,.45)",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 12,
              padding: "14px 18px",
              background: "rgba(255,107,0,.12)",
              fontWeight: 800,
            }}
          >
            Back to homepage
          </Link>
        </div>

        <QaTestLab />
      </div>
    </main>
  );
}
