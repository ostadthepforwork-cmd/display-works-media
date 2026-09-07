# Admin audit remediation action plan

Approved scope: local implementation, verification and Git push. No production promotion.

1. Correct local calendar-date generation and inclusive Marketing trend ranges, including custom, month and all-data modes. Add boundary regression tests.
2. Label ERP selected and comparison periods accurately; distinguish document contribution from business net profit and all-time margin.
3. Show catalog profit only with known costs and matching units. Label markup explicitly; preserve unknown and zero values. Do not change saved document calculations or historical records.
4. Repair narrow-screen foreground/background pairs for CMS, Marketing, receipt names and top products; preserve the existing desktop design.
5. Connect the dashboard expense shortcut to the existing independent expense view. Preserve existing optional document linkage. Do not duplicate the local expense implementation or apply migrations.
6. Run focused tests, unit suite, typecheck, scoped lint and build; attempt local browser verification and record any authentication/environment limitation honestly.
7. Commit on a separate branch based on the current local batch branch and push for review. This branch includes earlier local batch ancestry and is NOT an isolated production deployment candidate.

Deferred gates: Batch 2 SQL/concurrency validation; Batch 3 expense DB/RLS acceptance; Batch 4 reporting reconciliation; Batch 5A archive/restore FK validation. Marketing persistence migration remains a separate scope. No tracker status is upgraded by UI tests.
