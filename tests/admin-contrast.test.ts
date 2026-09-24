import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pageSource = readFileSync("src/app/admin/page.tsx", "utf8");
const systemCss = readFileSync("src/app/admin/admin-system.css", "utf8");
const tokens = readFileSync("tokens.css", "utf8");
const erpNavigationCss = readFileSync("src/app/admin/dashboard/ErpNavigation.module.css", "utf8");

test("admin design tokens separate light and dark surface text", () => {
  assert.match(tokens, /--color-admin-muted:/);
  assert.match(tokens, /--color-admin-on-dark:/);
  assert.match(tokens, /--color-admin-on-dark-muted:/);
  assert.match(tokens, /--color-admin-on-dark-subtle:/);
});

test("ERP document table uses scoped contrast classes", () => {
  for (const className of [
    "doc-table-row",
    "doc-number",
    "doc-date",
    "doc-total",
    "doc-status-button",
    "doc-action-button",
    "doc-popover",
  ]) {
    assert.match(pageSource, new RegExp(className));
    assert.match(systemCss, new RegExp(`\\.${className}`));
  }
  assert.match(systemCss, /\.erp-admin-content \.doc-table td\s*\{[\s\S]*?color:\s*var\(--color-admin-ink\)!important/);
});

test("CMS and Marketing have surface-specific readable text rules", () => {
  assert.match(systemCss, /\.cms-page-count/);
  assert.match(systemCss, /\.cms-page-tools input::placeholder/);
  assert.match(systemCss, /\.marketing-dashboard-shell \[style\*="#A8B0C0"\]/);
  assert.match(systemCss, /\.mk-dashboard \.mk-spark-caption/);
  assert.match(systemCss, /\.admin-app-shell \.cms-page-head \{[\s\S]*?background: color-mix\(in oklch, var\(--color-admin-paper-raised\) 96%, transparent\)!important/);
  assert.match(systemCss, /\.admin-app-shell \.cms-page-tools \{[\s\S]*?background: var\(--color-admin-paper-soft\)!important/);
});

test("ERP operational pages opt into the shared light-surface contrast contract", () => {
  for (const className of [
    "erp-dashboard-page",
    "erp-customer-page",
    "erp-product-page",
    "erp-product-table",
    "erp-supplier-page",
    "erp-supplier-card",
    "erp-company-page",
    "erp-company-section",
    "erp-document-page",
  ]) {
    assert.match(pageSource, new RegExp(className));
  }

  assert.match(systemCss, /\.erp-operational-page/);
  assert.match(systemCss, /\.erp-dashboard-page/);
  assert.match(systemCss, /\.erp-product-table/);
  assert.match(systemCss, /\.erp-supplier-card/);
  assert.match(systemCss, /\.erp-company-section/);
  assert.match(systemCss, /\.erp-product-name\s*\{[\s\S]*?color:\s*var\(--color-admin-ink-strong\)!important/);
  assert.match(systemCss, /\.erp-product-secondary[\s\S]*?color:\s*var\(--color-admin-muted\)!important/);
  assert.match(systemCss, /\.erp-supplier-card,[\s\S]*?background:\s*var\(--color-admin-paper-raised\)!important/);
});

test("CMS cards, forms, and dialogs use readable semantic surfaces", () => {
  for (const className of [
    "cms-manager-page",
    "cms-content-card",
    "cms-review-card",
    "cms-portfolio-card",
    "cms-info-note",
    "cms-section-tabs",
    "admin-field",
    "admin-modal-panel",
    "admin-modal-header",
    "admin-modal-body",
  ]) {
    assert.match(pageSource, new RegExp(className));
    assert.match(systemCss, new RegExp(`\\.${className}`));
  }

  assert.match(systemCss, /\.admin-field > label\s*\{[\s\S]*?color:\s*var\(--color-admin-muted\)!important/);
  assert.match(systemCss, /\.admin-modal-panel\s*\{[\s\S]*?background:\s*var\(--color-admin-paper-raised\)!important/);
  assert.match(systemCss, /\.admin-modal-body input,[\s\S]*?color:\s*var\(--color-admin-ink-strong\)!important/);
});

test("mobile admin lists and CMS media controls remain usable", () => {
  assert.match(pageSource, /mobileVisibleCount/);
  assert.match(pageSource, /filtered\.slice\(0, mobileVisibleCount\)/);
  assert.match(pageSource, /className="doc-mobile-load-more"/);
  assert.match(pageSource, /className="cms-hero-media"/);
  assert.match(pageSource, /\.cms-manager-page button \{[\s\S]*?min-height: 44px !important/);
  assert.match(systemCss, /\.admin-home-metrics strong \{ color: #f8fafc!important/);
});

test("document internal costs use semantic light-surface contrast", () => {
  for (const className of [
    "erp-internal-cost-panel",
    "erp-internal-cost-help",
    "erp-internal-cost-metric",
    "erp-internal-cost-preset",
    "erp-internal-cost-empty",
    "erp-internal-cost-row",
    "erp-internal-cost-remove",
  ]) {
    assert.match(pageSource, new RegExp(className));
    assert.match(systemCss, new RegExp(`\\.${className}`));
  }

  assert.match(tokens, /--color-admin-warning:/);
  assert.match(systemCss, /\.erp-internal-cost-metric,[\s\S]*?background:\s*var\(--color-admin-paper-raised\)!important/);
  assert.match(systemCss, /\.erp-internal-cost-preset\s*\{[\s\S]*?color:\s*var\(--color-admin-ink\)!important/);
  assert.match(systemCss, /\.admin-modal-body :is\(input, select, textarea, button\):disabled\s*\{[\s\S]*?opacity:\s*1!important/);
});

test("navigation and document actions keep accessible foregrounds", () => {
  assert.match(systemCss, /\.admin-primary-nav button\[aria-current="page"\]\s*\{[\s\S]*?color:\s*var\(--color-admin-ink-strong\)/);
  assert.match(pageSource, /className="doc-type-badge"/);
  assert.match(systemCss, /\.erp-document-page \.doc-type-badge\s*\{[\s\S]*?color:\s*var\(--color-admin-accent-ink\)!important/);
  assert.match(pageSource, /"#10B981": "#047857"/);
  assert.match(pageSource, /"#3B82F6": "#1D4ED8"/);
  assert.match(erpNavigationCss, /footer em\{[^}]*color:var\(--color-admin-muted/);
});

test("legacy status colors map to readable semantic ink on light surfaces", () => {
  assert.match(systemCss, /\.erp-operational-page \[style\*="color: rgb\(148, 163, 184\)"\]/);
  assert.match(systemCss, /\.cms-blog-manager \[style\*="color: rgb\(148, 163, 184\)"\]/);
  assert.match(systemCss, /:is\(\.erp-operational-page, \.cms-manager-page, \.cms-blog-manager\) \[style\*="color: rgb\(249, 115, 22\)"\]/);
  assert.match(systemCss, /:is\(\.erp-operational-page, \.cms-manager-page, \.cms-blog-manager\) \[style\*="color: rgb\(16, 185, 129\)"\]/);
  assert.match(systemCss, /:is\(\.erp-operational-page, \.cms-manager-page, \.cms-blog-manager\) \[style\*="color: rgb\(239, 68, 68\)"\]/);
  assert.match(systemCss, /\.mk-dashboard \.mk-dot\s*\{[\s\S]*?color:\s*var\(--color-admin-charcoal\)!important/);
  assert.match(systemCss, /\.mk-dashboard \.mk-dot\.blue\s*\{[\s\S]*?color:\s*var\(--color-admin-on-dark\)!important/);
  assert.match(pageSource, /color: "#047857"/);
});

test("admin layout loads shared tokens and dashboard controls stay bounded", () => {
  const layout = readFileSync("src/app/admin/layout.tsx", "utf8");
  const dashboardCss = readFileSync("src/app/admin/dashboard/ExecutiveDashboard.module.css", "utf8");
  const charts = readFileSync("src/app/admin/dashboard/DashboardCharts.tsx", "utf8");

  assert.match(layout, /import "\.\.\/\.\.\/\.\.\/tokens\.css"/);
  assert.match(dashboardCss, /\.filters>select \{width:auto!important;min-width:150px/);
  assert.match(charts, /initialDimension=\{\{width:45,height:28\}\}/);
  assert.match(charts, /initialDimension=\{\{width:640,height:260\}\}/);
  assert.match(charts, /initialDimension=\{\{width:480,height:240\}\}/);
});
