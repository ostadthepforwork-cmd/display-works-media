# Executive Dashboard Redesign

## Status
Implemented locally, not deployed. Preview: http://127.0.0.1:64795/

## Design Rationale
- White surfaces and restrained orange accents prioritize the numbers, not navigation.
- Revenue and estimated profit after operating expenses receive stronger visual weight. Red and green retain financial meaning; blue decorative icons are removed.
- Compact alerts retain their actions. Trend and waterfall use approximately 65/35 desktop columns; expense, products and documents use 40/35/25.
- Mobile uses two-column secondary KPIs with full-width revenue, operating expense and final profit. Small-screen currency sizes are reduced where necessary instead of breaking amounts across lines.
- Sections stay unframed for scanability. Repeated cards retain the existing 8px corner convention rather than introducing nested, larger-radius panels.

## Components
| Component | Responsibility |
| --- | --- |
| ExecutiveDashboard | Global period, comparison, KPI hierarchy, alerts, expense bars, products, documents, activity |
| DashboardCharts | Selectable trend series, aggregation, accessible chart data and waterfall |
| dashboard-waterfall | Presentation-only start/end ranges including negative and unavailable values |
| DashboardDetail | Read-only drill-down, search, pagination and exact-record navigation |
| useExpenseReport | Period-specific reads, loading, error and stale-result handling |
| ErpNavigation | Existing destinations, restrained sidebar and light mobile navigation styling |

## Date Filter And Drill-Down
- Today, 7 days, 30 days, current month and current year share one period state.
- Custom control supports day, date range, month and year; invalid periods are rejected.
- Comparison supports equal preceding period, preceding calendar month, same period last year or none. Zero/negative comparison bases show an amount rather than a misleading percentage; margin changes remain percentage points.
- Period is stored in URL parameters and applies to all dashboard sections.
- Document and expense drill-down retain the period. Category and class drill-down add their corresponding filters. Return restores the dashboard period.
- Activity rows are clickable; the document button remains keyboard-accessible and receives the row hover/focus indication.

## Data Boundaries
- No financial formulas or database schema changed. Receipt totals remain VAT-inclusive under existing eligibility, not cash receipts.
- Gross and final profit remain explicitly estimated. Actual direct expense is not deducted twice.
- Budget and variance show unavailable because no comparable approved budget source exists.
- Expense categories reflect stored categories, not hard-coded fictitious Supplier/Facebook/etc. categories.
- No placeholder Reports or Settings destinations added. Existing company settings and reporting sections remain available.

## Verification
- TypeScript passed; 70 unit tests passed.
- Five-width browser checks passed: 320, 375, 768, 1280, 1448px. Includes visible text contrast, page overflow, charts, series switching, detail Escape, expense navigation/back, product sorting and pagination.
- Waterfall tests cover floating deductions, negative balances and unavailable expense data.
- Desktop/mobile screenshots inspected. Synthetic fixtures only, no live reconciliation or production build in this pass.
- Parent mobile navigation styles are integrated in the app; isolated preview does not render the full authenticated parent shell.
