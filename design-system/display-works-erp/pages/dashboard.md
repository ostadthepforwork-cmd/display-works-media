# Dashboard Page Overrides

> **PROJECT:** Display Works ERP
> **Generated:** 2026-09-11 15:44:27
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1400px or full-width
- **Grid:** 12-column grid for data flexibility

### Spacing Overrides

- **Content Density:** High — optimize for information display

### Typography Overrides

- Use the existing Thai-capable product stack: Prompt, Sarabun, Leelawadee UI, Noto Sans Thai, Segoe UI.
- Do not use Fira Code for Thai headings or financial labels.
- Use tabular figures for KPI values, currency columns, and comparison figures.

### Color Overrides

- Display Works orange remains the primary action and brand accent.
- Blue is a secondary data color, not the primary brand color.
- Foreground remains neutral near-black rather than blue so dense Thai text stays calm and readable.

### Component Overrides

- Avoid: Leave UI frozen with no feedback
- Avoid: Make dragging the only way to reorder resize or select
- Use 8px maximum card radius to match the established ERP system.
- Do not add target gauges or bullet charts unless a real business target exists in the data model.
- Keep the existing line chart, waterfall, visible values, legend, tooltip, and data-table fallback.
- On mobile, keep controls at least 44px high with 8px spacing and use vertical scrolling as the primary gesture.

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Hover tooltips, chart zoom on click, row highlighting on hover, smooth filter animations, data loading spinners
- Animation: Use skeleton screens or spinners
- Accessibility: Add buttons menus or tap-to-move controls and retain keyboard operation
- Accessibility: Preserve visible focus, descriptive icon-button labels, text alongside semantic colors, and reduced-motion behavior.
