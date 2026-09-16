# Display Works Admin Brand Spec

## Assets
- Primary logo: `/public/images/logo.png`
- Existing ERP contextual image: `/public/images/erp-dashboard-facade.png`
- Product UI reference: current production admin and user-approved white/orange ERP dashboard references

## Identity
- Brand signal: Display Works logo plus a restrained orange accent
- Primary palette: white operational surfaces, cool light-gray canvas, charcoal text, Display Works orange
- Status colors: green for positive/ready, red for negative/error, blue for informational state
- Typography: Kanit for compact display headings, Prompt for interface text and Thai content

## Interaction
- Familiar sidebar and top navigation remain stable
- Controls use 7px radius; repeated content cards use 8px radius
- Motion is limited to state feedback using opacity and transform
- All focusable controls require visible focus treatment and at least 40px mobile targets

## Protected Contracts
- Preserve routes, labels, form names, stored state keys, permissions, analytics hooks, and business calculations
- Do not replace real operational values with presentation data
- Do not change the logo artwork or redraw it in CSS/SVG
