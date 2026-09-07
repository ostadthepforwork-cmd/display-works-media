# AI monitoring and expense navigation follow-up

## Evidence and scope
- User production screenshot reports ai_citation_logs missing from schema cache. This does not establish whether the table is absent, unexposed, or inaccessible.
- Production expense shortcut reportedly opens receipts. Local sidebar already has independent expenses navigation and ExpensePage; removed obsolete target alias support and added a source regression assertion. Production fix is not verified.
- Source search found no citation-log writer/automation in src or scripts. Reading an empty table cannot detect every AI answer.

## Implemented locally
- Shared safe referral classification: ordinary Bing/OpenAI corporate traffic is not classified as AI answer traffic.
- Strip referral query/fragment data; reject private, malformed, and non-HTTP targets. Mark session delivery only after successful storage.
- Citation counts require own-domain HTTP(S) URLs plus recorded citation flag, deduplicate URLs, flag inconsistent records, and distinguish no sample from zero percent.
- Preserve independent referral results when citation storage fails (and vice versa). Surface unavailable sources, capped samples, and unverified User-Agent evidence.
- Bangkok calendar ranges, invalid-range 400, no raw response returned, no production-SQL execution advice.
- No schema, RLS, production writes, paid API calls, or deployment.

## Verification
- Unit: 106/106 pass, including five focused tests. Expense navigation assertion is source-based, not browser click acceptance.
- Typecheck and production build pass.
- Scoped AI lint: zero errors, five existing dashboard warnings. Existing admin/page.tsx unrelated purity lint defect remains outside this patch.
- Authenticated post-change browser and real database acceptance remain pending.

## Next gate
1. Read-only inspect production schema visibility/ACL for citation/referral tables and crawler log recording health.
2. Review isolated schema setup if needed; do not execute legacy SQL blindly.
3. Review a zero-cost manual citation evidence workflow before any automation.
4. Validate expense schema/RPC compatibility and isolated deployment candidate before production promotion.

Git branch contains earlier undeployed batches. Do not deploy this mixed branch as-is. Production remains unchanged.
