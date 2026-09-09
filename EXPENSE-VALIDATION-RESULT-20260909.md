# Expense SQL validation checkpoint

Status: ISOLATED CONTRACT CHECKS PASSED. NOT PRODUCTION READY.

## Evidence
- Environment probe: https://github.com/ostadthepforwork-cmd/display-works-media/actions/runs/34199718354 succeeded.
- Original SQL run: https://github.com/ostadthepforwork-cmd/display-works-media/actions/runs/34200450774 failed the numbering boundary: 10000 became 1000. Ten other groups passed.
- Fix commit: f5fccebdf12e7e51c0ca8aadb8804c12bcca472d.
- Fixed SQL run: https://github.com/ostadthepforwork-cmd/display-works-media/actions/runs/34309359039 succeeded, job 2m12s, total 2m16s.
- All 11 SQL test groups passed, including 8 independent simultaneous sessions, identical retry, revision conflict, authorization, rollback and private Storage SQL policy tests.
- Local focused tests: 22/22 passed with the project's tsx runner.
- Candidate matches the local Batch 3 migration after newline normalization.
- The workflow's first environment summary is an intermediate pre-test message. The subsequent SQL results are the final executed test outcomes.

## Fix
Expense numbering now pads to greatest(4, length(sequence)) rather than truncating to four characters. Regression covers 9999, 10000 and 10001.
Only the unpublished local expense migration and isolated test copy changed. No Batch 2 numbering was changed.

## Boundaries
Real disposable Supabase Auth and Storage schemas; unchanged Batch 1A membership SQL; synthetic users and minimal UUID ERP FK targets.
This is NOT production schema equivalence. No business data or production credentials used.
Standard Linux runner in the existing public repository, no paid service enabled, no cache/artifact upload. Disposable stack shutdown succeeded.
Branch is ci/expense-environment-20260908. Main and production were not promoted.

## Still Required
1. Reconstruct and compare relevant production schema/ACL dependencies using reviewed metadata, not synthetic FK stubs.
2. Test actual Storage HTTP upload/download/signed URLs and attachment registration failures.
3. Isolate expense UI/API changes from the mixed workspace; verify save/edit/payment/archive/void and independent rent/advertising flows in a browser against isolated DB.
4. Resolve the existing Batch 2-before-Batch 3 deployment-order hold explicitly before promotion.
5. Review migration executor/default privileges, backups and rollback; then obtain applicable production approval and verify after deployment.

Production expense button is NOT fixed by this CI-only branch. Do not claim expenses are live.
