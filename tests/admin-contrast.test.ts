import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pageSource = readFileSync("src/app/admin/page.tsx", "utf8");
const systemCss = readFileSync("src/app/admin/admin-system.css", "utf8");
const tokens = readFileSync("tokens.css", "utf8");

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
