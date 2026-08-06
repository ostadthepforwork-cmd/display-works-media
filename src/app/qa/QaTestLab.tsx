"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calculator, CheckCircle2, ExternalLink, FileText } from "lucide-react";
import { docVatRate, lineAmount, lineCost, lineQtyForBasis } from "@/lib/erp-calculations";

type Scenario = {
  id: string;
  title: string;
  description: string;
  item: {
    qty: number;
    pieces: number;
    widthM: number;
    heightM: number;
    costSnapshot: number;
    price: number;
    costUnit: "piece" | "sqm";
    priceUnit: "piece" | "sqm";
  };
  shipping?: number;
  vatRate?: number;
  expectedRevenue: number;
  expectedCost: number;
};

const scenarios: Scenario[] = [
  {
    id: "vinyl-sqm",
    title: "Vinyl 1.8 x 0.7 m, 2 pieces",
    description: "Cost and sell by square meter. Expected: Revenue 806, Expense 554, Profit 252.",
    item: {
      qty: 2.52,
      pieces: 2,
      widthM: 1.8,
      heightM: 0.7,
      costSnapshot: 200,
      price: 300,
      costUnit: "sqm",
      priceUnit: "sqm",
    },
    shipping: 50,
    expectedRevenue: 806,
    expectedCost: 554,
  },
  {
    id: "sqm-cost-piece-sale",
    title: "SQM cost, piece sale",
    description: "Cost by square meter, sell one finished piece for 500. Revenue must not multiply by sqm again.",
    item: {
      qty: 2,
      pieces: 1,
      widthM: 2,
      heightM: 1,
      costSnapshot: 170,
      price: 500,
      costUnit: "sqm",
      priceUnit: "piece",
    },
    expectedRevenue: 500,
    expectedCost: 340,
  },
  {
    id: "custom-vat",
    title: "Custom VAT 3%",
    description: "Checks that the VAT percent entered by the user is applied to the document total.",
    item: {
      qty: 1,
      pieces: 1,
      widthM: 0,
      heightM: 0,
      costSnapshot: 100,
      price: 1000,
      costUnit: "piece",
      priceUnit: "piece",
    },
    vatRate: 3,
    expectedRevenue: 1030,
    expectedCost: 100,
  },
];

const qaLinks = [
  { label: "Homepage", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Vinyl Banner", href: "/services/vinyl-banner" },
  { label: "Sticker", href: "/services/sticker" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Admin", href: "/admin" },
];

const manualChecks = [
  "Mobile top menu works on every public page.",
  "Mobile sticky LINE / Call / Quote buttons do not cover important form fields.",
  "ERP document modal keeps form data when clicking around inside the page.",
  "Shared document link shows the correct document title and ERP total.",
  "CMS article/service edits show on the website after refresh.",
  "Marketing dashboard updates when the date range changes.",
];

function money(value: number) {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function cardStyle(accent = "#273244"): CSSProperties {
  return {
    border: `1px solid ${accent}`,
    background: "linear-gradient(180deg, #121923 0%, #0d131b 100%)",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 18px 60px rgba(0,0,0,.28)",
  };
}

export default function QaTestLab() {
  const [active, setActive] = useState(scenarios[0].id);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const scenario = scenarios.find((item) => item.id === active) || scenarios[0];

  const result = useMemo(() => {
    const baseRevenue = lineAmount(scenario.item);
    const baseCost = lineCost(scenario.item);
    const vat = scenario.vatRate ? baseRevenue * (docVatRate({ vatRate: scenario.vatRate }) / 100) : 0;
    const revenue = baseRevenue + Number(scenario.shipping || 0) + vat;
    const cost = baseCost + Number(scenario.shipping || 0);

    return {
      costQty: lineQtyForBasis(scenario.item, scenario.item.costUnit),
      priceQty: lineQtyForBasis(scenario.item, scenario.item.priceUnit),
      baseRevenue,
      baseCost,
      vat,
      revenue,
      cost,
      profit: revenue - cost,
      passRevenue: Math.abs(revenue - scenario.expectedRevenue) < 0.01,
      passCost: Math.abs(cost - scenario.expectedCost) < 0.01,
    };
  }, [scenario]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        {scenarios.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            style={{
              ...cardStyle(active === item.id ? "#ff6b00" : "#273244"),
              cursor: "pointer",
              color: "#fff",
              textAlign: "left",
            }}
          >
            <Calculator size={24} color="#ff6b00" />
            <h2 style={{ margin: "14px 0 8px", fontSize: 20 }}>{item.title}</h2>
            <p style={{ color: "#9aa8bd", margin: 0, lineHeight: 1.6 }}>{item.description}</p>
          </button>
        ))}
      </section>

      <section
        className="qa-result"
        style={{
          ...cardStyle("#ff6b00"),
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(260px, .9fr)",
          gap: 18,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#ff6b00", fontWeight: 900, marginBottom: 12 }}>
            <FileText size={18} />
            ERP Calculation Result
          </div>
          <h2 style={{ margin: 0, fontSize: 28 }}>{scenario.title}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 18 }}>
            {[
              ["Cost quantity", result.costQty],
              ["Sale quantity", result.priceQty],
              ["Product revenue", result.baseRevenue],
              ["Product cost", result.baseCost],
              ["VAT", result.vat],
              ["Shipping", scenario.shipping || 0],
            ].map(([label, value]) => (
              <div key={String(label)} style={{ border: "1px solid #253144", borderRadius: 14, padding: 14, background: "#0b1119" }}>
                <div style={{ color: "#91a0b6", fontSize: 12 }}>{label}</div>
                <strong style={{ display: "block", marginTop: 6, fontSize: 22 }}>THB {money(Number(value))}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <SummaryCard label="Revenue" value={result.revenue} pass={result.passRevenue} expected={scenario.expectedRevenue} />
          <SummaryCard label="Expense / Cost" value={result.cost} pass={result.passCost} expected={scenario.expectedCost} />
          <div style={{ border: "1px solid rgba(255,107,0,.5)", borderRadius: 16, padding: 18, background: "rgba(255,107,0,.08)" }}>
            <div style={{ color: "#ffb17b" }}>Net Profit</div>
            <strong style={{ fontSize: 34, color: "#10d070" }}>THB {money(result.profit)}</strong>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
        <div style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Quick Page Links</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {qaLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid #263246",
                  borderRadius: 12,
                  padding: "12px 14px",
                  color: "#fff",
                  textDecoration: "none",
                  background: "#0b1119",
                }}
              >
                {item.label}
                <ExternalLink size={16} color="#ff6b00" />
              </Link>
            ))}
          </div>
        </div>

        <div style={cardStyle()}>
          <h2 style={{ marginTop: 0 }}>Manual QA Checklist</h2>
          <p style={{ color: "#9aa8bd", lineHeight: 1.6 }}>
            These checkboxes are local to your browser only. They do not save to the database.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {manualChecks.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setChecks((prev) => ({ ...prev, [item]: !prev[item] }))}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  textAlign: "left",
                  color: "#fff",
                  border: "1px solid #263246",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: checks[item] ? "rgba(16,208,112,.13)" : "#0b1119",
                  cursor: "pointer",
                }}
              >
                {checks[item] ? <CheckCircle2 size={18} color="#10d070" /> : <AlertTriangle size={18} color="#ffb020" />}
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 720px) {
          .qa-result {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ label, value, pass, expected }: { label: string; value: number; pass: boolean; expected: number }) {
  return (
    <div style={{ border: "1px solid #203041", borderRadius: 16, padding: 18, background: "#071019" }}>
      <div style={{ color: "#91a0b6" }}>{label}</div>
      <strong style={{ fontSize: 34 }}>THB {money(value)}</strong>
      <div style={{ color: pass ? "#10d070" : "#ff5151", marginTop: 8, fontWeight: 800 }}>
        {pass ? "PASS" : `Expected THB ${money(expected)}`}
      </div>
    </div>
  );
}
