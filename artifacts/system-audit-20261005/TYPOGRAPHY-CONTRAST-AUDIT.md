# Production Typography and Text Contrast Audit

Date: 2026-10-05, Asia/Bangkok.
Target: authenticated https://displayworksmedia.com/admin.
Status: audit only. No application fixes, commit, push, deployment or business-data writes in this audit.

## Scope and Method

- Used the Playwright skill and the authenticated in-app browser's Playwright interface. Reading styles did not require copying authentication credentials into another browser.
- Tested desktop 1440 x 1000 and mobile 390 x 844, then reset the viewport override. The browser reports its font loading status as `loaded`; computed font-family stacks were collected. Exact glyph-level font substitution was not verified.
- Navigated all main module views: Home; ERP overview, customers, products/services, quotes, bills, invoices, receipts, expenses, suppliers, company and exports; CMS articles, hero, services, reviews, portfolio, page text and contact; Marketing Overview, Ads Performance, Leads & CRM, Customer Intel, Sales Pipeline, Reports, Data & API and AI Search.
- Opened but did not save representative quote, expense and CRM Lead forms. Checked CMS article editor General, SEO, AI Search and Publish tabs at both widths. Closed the forms after inspection.
- Inspected computed color, font size, weight, line height, ancestor solid backgrounds and opacity. Converted CSS Lab and OKLCH colors to sRGB before computing contrast. Initial measurements with unsupported color formats were discarded.
- Excluded decorative emoji from findings. Text on images/gradients/filter effects was marked uncertain instead of being certified. Rounded ratios below are diagnostic approximations; borderline pairs must be rechecked using unrounded values.
- Benchmark: normal text needs 4.5:1 and large text 3:1 under [WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Font sizes below 12px are flagged as a usability concern, not an automatic WCAG violation.

## Prioritized Findings

### P1: Mobile Expense Surface Mixes Dark Backgrounds with Dark Text

The expense heading and total use approximately #111827 on #101620, around 1.02:1. The opened expense form also has an effectively invisible title and evidence heading on its dark surface, around 1:1; its amount block is around 1.06:1. The screenshot confirmed the title was not visibly readable. Desktop expense form did not reproduce these solid-background failures.

Action: choose one coherent surface theme for the expense page/dialog at every breakpoint. Set heading, value and evidence text through matching semantic surface tokens. Do not globally force dark text onto retained dark containers.

### P1: Mobile Document Customer Names Are Almost White on White

Quote and receipt mobile cards retain #e2e8f0 customer-name text on #ffffff, around 1.23:1 at 13px. Quote document-number links use #3b82f6 on white, around 3.68:1 at 14px. This affects identification of the correct document, not merely decorative copy.

Action: use strong dark text for customer names and a darker accessible link color. Review all four document-card types through their shared component. Bills/invoices had empty lists during this audit, so their populated-card state is not certified.

Relevant source location: `src/app/admin/page.tsx:7703` contains the mobile customer-name color. This is a source lead, not a verified production commit identity.

### P1: CMS SEO and Publish Panels Retain Dark Containers under Light-Theme Text Overrides

CMS editor desktop navigation labels measured about 1.73:1 for the active tab and 2.30:1 for inactive tabs. SEO Checklist and Publish content have dark backgrounds with dark heading/helper text on both device sizes. Examples: SEO heading approximately 1.10:1, checklist text 1.79:1, publish heading 1.07:1. Mobile General's auto-slug button is approximately 1.93:1. The AI Search add-FAQ button is approximately 1.76:1.

Action: migrate editor tabs, checklist, publish settings, helper text and secondary buttons together to explicit light-surface tokens, or give retained dark panels explicit inverse text. Verify General/SEO/AI/Publish separately.

Source leads: `src/app/admin/page.tsx:9185` (dark tabs), `:9271` (SEO surface), `:9371` and `:9382` (Publish surfaces). Broad inherited color rules and inline dark backgrounds should not be treated independently.

### P2: Customer Classification Badges Are Too Pale

At both sizes, B2B/B2C badges use #ffb076 on pale orange, around 1.58:1. Business-type badges use #a7f3d0 on pale green, around 1.17:1. Both are 12px and carry business classification information.

Action: dark orange/green text on the existing pale surfaces; preserve the visible classification label rather than relying on color alone.

Source: `src/app/admin/page.tsx:6485` and `:6486`.

### P2: Shared Mobile Navigation and Marketing Active Tabs Have Low Contrast

The Home/ERP/CMS/MKT module indicator uses #f97316 on #fff7ed, around 2.64:1 at 12px. Marketing active section buttons use near-white text on #ff6b00, around 2.73:1 at 12px, across all eight sections. Ads Performance's active overview control measured white-on-white at 1:1. Customer Intel contained dark-on-dark count values around 1:1 on mobile.

Action: use dark-orange text on pale navigation backgrounds, and either dark text on bright orange or a darker orange fill with white text. Fix selected tabs and Customer Intel values at component scope, not through a global button text override.

Source leads: `src/app/admin/MarketingKpiDashboard.tsx:1719` (mobile active tab), `:1722` (selected segmented control).

### P2: Font Scale Is Too Small and Inconsistent

- Shared desktop brand subtitle: 9px, about 9.9px line height.
- Mobile bottom navigation: 10.5px, about 12.1px line height.
- CMS article statuses: 10px; portfolio labels: 11px.
- ERP dashboard mobile: some text as small as 8px and 8.8px; many helpers/labels at 10-11px.
- Product/services view: about 100 rendered text nodes below 12px at each tested size, including unit/cost/profit annotations. This is not 100 distinct defects.
- Expense form: many labels at 11px while inputs are 16px; readability is uneven.
- Marketing: supporting text predominantly 10-13px, with main headings 38px desktop and 31.2px mobile. Dense supporting data remains hard to scan.
- Computed stacks differ between modules/components: Kanit + Prompt for parts of the shell, Prompt for most pages, and Prompt + Sarabun + system fallbacks in ERP dashboard. This does not prove missing fonts, but shows typography is not governed by one consistent scale.

Action: agree a body/control size of 14-16px, labels/table text 13-14px, meaningful captions at least 12px, and Thai body line height around 1.5-1.65. Treat these as product design targets, not WCAG-required minimum sizes. Keep one body family and one deliberate display family. Use fixed/rem scale tokens rather than viewport-driven font sizing.

Source examples: `src/app/admin/admin-system.css:49`, `:295`, `:322`, `:326`, `:363`; `src/app/admin/dashboard/ErpDataExport.module.css:1`.

### P2/P3: Export, Home and Secondary Controls Need Contrast Cleanup

- Production ERP export: download CSV button is white on orange, about 2.86:1. Some help text is 4.03-4.31:1 and the page eyebrow about 4.29:1. Local unshipped export changes already address some, but not all, of these pairs; they are not live proof.
- Home mobile: some secondary captions fall around 3.95-4.47:1. Desktop main solid-background copy had no detected failure in the inspected state, but hero imagery/gradient text was excluded from automatic certification.
- CMS Hero: change-background button white on #3b82f6 is approximately 3.68:1 at 13px.
- ERP company QR upload label #3b82f6 on pale blue is approximately 3.28:1.
- Quote editor: step numbers on colored chips measured 2.87/3.26:1; desktop VAT label around 1.45:1; a summary amount around 3.32:1. These need component-level correction.

## Coverage Summary

| Module | Desktop main views | Mobile main views | Extra inspected states | Result |
| --- | --- | --- | --- | --- |
| Home | Home | Home | Solid text and hero context | Small captions; mobile contrast gaps |
| ERP | All 11 main views | All 11 main views | Quote and expense forms, both sizes | Customer badges; mobile cards/expense; export; small dashboard annotations |
| CMS | All 7 main views | All 7 main views | All 4 article editor tabs, both sizes | Main lists mostly readable; editor has serious dark/light mismatches |
| Marketing | All 8 main sections | All 8 main sections | Expanded database Lead form, both sizes | Active mobile controls and some values fail; many gradient-backed pairs uncertain |

No page-level horizontal overflow was detected in returned measurements for the inspected states. Scrollable tables/section navigation can still scroll internally. This is not proof that every text box fits or that every interaction state is accessible.

## Recommended Fix Order

1. Fix invisible text first: expense mobile, document customer names, CMS SEO/Publish and Marketing count/selected controls.
2. Consolidate semantic foreground/background tokens for light surfaces, retained dark surfaces, selected states and category badges. Remove conflicting broad style-string selectors incrementally.
3. Apply a shared readable font scale to labels, captions, tables, badges and mobile navigation; check wrapping and stable control dimensions after increasing sizes.
4. Verify the same view matrix again, plus populated bill/invoice cards, error/loading/success/disabled states, hover/focus, chart tooltips, placeholders, expanded dropdowns and 200% text zoom.
5. Review and deploy the selected patch; repeat the production audit. Existing local fixes must not be assumed deployed.

## Limits

- This is not an all-state WCAG certificate. Gradients/images and some translucent effects need additional pixel-backed or manual contrast verification.
- Other mobile widths, real iOS/Android font rendering, native select popups, all record pages, every modal and rich-text color choices were not exhaustively exercised.
- Main CMS article list pagination was sampled, not every article. Bill/invoice lists were empty. CRM Lead form was inspected without submitting or changing its mapping/status.
- No changes to production records, login state, database schema or application code. Only this report was created. Browser viewport override was reset and inspected forms closed.
