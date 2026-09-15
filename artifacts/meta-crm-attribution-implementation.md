# Meta Ads to CRM to ERP Attribution - Implementation Report

Date: 2026-09-15  
Branch: `feature/meta-crm-attribution`

## Delivered

- Additive CRM schema with immutable Lead IDs, structured qualification fields, Lost Reason constraints and evidence-based attribution.
- Auditable Lead to Quote to Receipt mappings. Closed Won is rejected unless a real, active ERP receipt is mapped.
- Messenger webhook with Meta HMAC verification, deterministic one-Lead-per-conversation deduplication and no stored chat body.
- Meta campaign, Ad Set and Ad synchronization into a verified entity registry.
- Internal campaign budget storage. Campaign `120249760412250073` can be assigned THB 200/day only after Meta Sync confirms that ID.
- Staff role split for owner, admin, sales and marketing. Marketing gets aggregate/operational CRM data without customer ID, location, owner or mapping evidence.
- Marketing dashboard fields for structured Lead creation, manual qualification, Lost Reason, document mapping, attribution method, role-aware Lead updates and verified campaign budget activation.
- Meta-reported, ERP-attributed and ERP-unattributed revenue are kept separate. Estimated Lead/Quote values never become revenue.
- Aggregate export produces exactly four files and no customer PII or event-level rows.
- AI Citation table and RLS policy needed by the existing monitor.
- Data-preserving rollback script. New tables are quarantined by rename instead of being dropped.

## Migration Files

- `supabase/migrations/20260915020945_meta_crm_attribution.sql`
- `supabase/rollbacks/20260915020945_meta_crm_attribution.rollback.sql`

No existing Lead or ERP receipt is automatically attributed during migration. Existing receipts without verified evidence remain unattributed.

## Main Application Files

- `src/app/admin/MarketingKpiDashboard.tsx`
- `src/app/api/admin/crm/leads/route.ts`
- `src/app/api/admin/crm/leads/[leadId]/route.ts`
- `src/app/api/admin/crm/mappings/route.ts`
- `src/app/api/admin/marketing/budgets/route.ts`
- `src/app/api/marketing/meta/route.ts`
- `src/app/api/marketing/meta/messenger/route.ts`
- `src/lib/crm-api.ts`
- `src/lib/marketing-attribution.ts`
- `src/lib/marketing-export.ts`
- `src/lib/meta-messenger.ts`
- `src/lib/admin-auth.ts`
- `src/lib/admin-authorization.ts`
- `src/proxy.ts`

## Validation

- TypeScript: passed.
- Unit and contract tests: 87 passed, 0 failed.
- ESLint: 0 errors. Existing repository warnings remain.
- Next.js production build: passed, 48 routes generated.
- Tests cover attribution priority, zero denominators, conversation deduplication, unattributed records, aggregate export privacy, RLS contracts and database invariants.

## Synthetic Example Without PII

```json
{
  "lead_id": "8bc7dd31-b06f-4e06-90b4-9e3e0cf5c214",
  "source": "meta_messenger",
  "campaign_id": "120249760412250073",
  "adset_id": "synthetic-adset-01",
  "ad_id": "synthetic-ad-01",
  "product": "ป้ายไวนิล",
  "size_or_area": "2 x 3 m",
  "quantity": 1,
  "qualified_status": "qualified",
  "qualification_method": "manual",
  "lead_status": "quotation_sent",
  "attribution_method": "automatic"
}
```

The example intentionally contains no customer name, phone number, address or chat message.

## Production Gate Still Required

The code is locally complete, but it is not production-active until the following controlled operations succeed:

1. Take the required database backup before migration.
2. Apply the migration to the linked production Supabase project.
3. Verify table/RLS/RPC contracts with owner, sales and marketing test accounts.
4. Configure `META_APP_SECRET` and `META_WEBHOOK_VERIFY_TOKEN`, then register the production Messenger webhook URL.
5. Run Meta Sync and confirm Campaign `120249760412250073`; only then use the dashboard button to save THB 200/day.
6. Verify one synthetic Lead to Quote to Receipt flow and reconcile ERP total, attributed and unattributed revenue.

LINE OA remains deliberately marked Not Connected until a dedicated Messaging API integration is configured. Token expiry reminders are configuration reminders, not provider-side token validation.
