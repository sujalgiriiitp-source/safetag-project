# Verification report: controlled-pilot candidate

Verified on 24 October 2026. Branch: `codex/pilot-hardening`, baseline `b09bef1`.
No deploy, commit, push, production AWS connection, production database operation, live message or charge was performed.

## Separate check results

| Gate | Final result | Evidence |
| --- | --- | --- |
| Runner/compiler repair | PASS | Node 22.23.4; TypeScript 5.9.3; tsx 4.23.15; MongoDB Collection export and transpilation verified. |
| Typecheck | PASS, exit 0 | `tsc --noEmit --incremental false`, 5.0 seconds in final full run. |
| Production build | PASS, exit 0 | Next 16.4.3, minification enabled; compilation, TypeScript and 51 static-generation tasks completed. 13.9 seconds. |
| Unit/integration | PASS, 27/27 | Real isolated MongoDB on 127.0.0.1:27029. Fresh random safetag_test_* database; 0 skipped. |
| Browser workflows | PASS, 5/5 | Actual production server; Chrome at 390px and 1280px; 0 skipped. |
| Lint | PASS, exit 0 | No suppressed rules added; zero errors/warnings. |
| Dependency advisory scan | PASS at verification time | npm audit: 0 known vulnerabilities. This is not a guarantee that the application has no vulnerabilities. |

Final orchestrator: `npm run verify:local`, exit 0, completed at 2026-10-24T14:08:51.999Z. Raw logs and structured results are in `.pilot-data/verification/`. The runner stops its own server and drops only its generated synthetic databases.

Because macOS iCloud marked source/dependency files as dataless, validation ran from a non-synced source copy at `/private/tmp/safetag-pilot-validation`. All 183 checked source/config/lockfile assets matched the working tree byte-for-byte; their SHA-256 manifest is in `.pilot-data/verification/source-fingerprint.json`. Generated Next declarations, PDFs, build metadata, documentation and environment files are excluded from this code fingerprint. Dependency recovery used `/private/tmp/safetag-pilot-dependencies`; the worktree's node_modules links there. Original generated dependencies were preserved in `node_modules.dataless-backup`, ignored by Git and TypeScript. These local filesystem workarounds are not deployment artifacts. Use `npm ci` in a non-synced checkout for a durable fresh installation.

## Security checks, reported independently

| Control | Tested evidence | Result |
| --- | --- | --- |
| Role and venue access | Anonymous write/read denial; cross-venue lookup 404; operator export/invitation denial; venue manager cannot use platform APIs; live role re-read; TOTP replay rejection. | PASS |
| Private photos | Anonymous 401, other venue 404, own venue success/no-store; invalid image and size rejection; metadata removal; unrelated-deposit photo rejection; retained active evidence and deleted returned evidence. | PASS for Mongo adapter |
| QR/receipt secrets | 32-byte random nonce; distinct purpose-derived collection/view credentials; hashed storage; fragment removed after exchange; no secret in HTTP URLs; HttpOnly/Secure/Strict receipt cookie; public DTO omits photos/bins; view token cannot release. | PASS |
| Duplicate check-ins | Eight simultaneous same-key requests create one record and stable credentials; changed payload with same key rejected. | PASS |
| Concurrent returns | Ten competing requests yield one new return transition and one return job per opted-in recipient; returned record cannot reopen; same-key retry is a replay. | PASS |
| Rack allocation | Two simultaneous deposits compete for one bin; unique partial index permits only one allocation. Unknown bins/unverified acceptance rejected. | PASS |
| Notification retries | Provider failure retains custody; four-attempt bound; concurrent leases avoid duplicate sends; expired lease becomes uncertain; opt-out/not-configured states; signed callbacks, out-of-order/idempotent updates and callback-before-send-response preserved. | PASS with mock senders |
| Staff-session revocation | Stored sessions deleted on revoke; subsequent real-cookie API request returns 401; logout invalidates cookie; expired/forged cookie rejected; current role re-read. | PASS |
| Invitation concurrency | Single-use invite under eight competing acceptances; same phone cannot bind concurrently to two venues. | PASS |

## Browser and print evidence

The full visitor journey exercised registration, image upload, rack assignment, explicit physical acceptance, separate receipt/coupon generation, cash recording, collection-factor entry, explicit physical handover, return and audit-backed state refresh. The return checkbox must be unchecked after storing; this regression assertion is included.

No page errors or horizontal overflow were observed in the two tested viewport journeys. Four 58mm/80mm thermal PDFs were generated, each one page; desktop/mobile screenshots and PDF renders were visually inspected. Long names and collection tokens wrap, and the receipt view QR is separate from the collection QR. PDF page sizes round to approximately 58.25mm/80.09mm in Chromium. Real printers, camera scans and QR readability on physical paper remain venue UAT gates.

Browser tests also verify anonymous/cross-origin rejection, private photos, fragment receipt exchange/reload, manager/operator restrictions, real-cookie staff revocation and logout.

## Failures found and fixed

- Compiler/driver exports were incomplete or stalled because macOS had evicted package files. A fresh non-synced install repaired imports; ESLint was aligned to the peer-compatible 9.39.5 release. Lockfile audit is clean.
- React purity/effect lint errors were repaired with proper external-store subscriptions, asynchronous fetch results, stable request keys, and clock updates. Legacy derived activity no longer claims unverified messages were delivered or fabricates reminder events.
- Invitation acceptance was race-prone; a durable phone/operator binding and atomic invite consumption now enforce scope and one-time use.
- Retention cleanup could delete evidence on still-registered deposits; active and registered records are now held.
- Storage confirmation carried its checked state into the return checkbox; it now resets on state change and is asserted in browser tests.
- Initial browser failures were strict-selector ambiguity between screen and print elements; the test now targets the exact visible fee label.
- A retention test expected undefined instead of the schema's null default; the assertion was corrected and rerun.
- The new verification runner initially violated Next's readonly NODE_ENV typing; environment objects are now replaced rather than mutated, and the entire runner passed.

## Unresolved risks and release blockers

1. Live Twilio Verify, WhatsApp sender/template approval, real delivery/read receipts and authorized opt-out drills were not exercised. No real messages were sent.
2. Cloudinary authenticated originals/derivatives and actual link expiry/deletion were not live-verified. Only the private Mongo adapter passed the full local journey. Legacy public media URLs require inventory and provider-side remediation.
3. Backup restore, server-process/database restart recovery, Linux/container CI, multi-replica/load testing, physical printer/camera testing and an outage/shift handover drill remain required. A client disconnect/reconnect test is not a disaster-recovery test.
4. Platform TOTP currently has one configured secret; restrict the pilot to one platform administrator. Per-person enrollment/recovery is a multi-admin production prerequisite.
5. Staff phone transfers between venues require supervised handling. A consumed invite followed by a database failure needs manager reissue; it does not silently restore authorization.
6. Uncertain provider acceptance deliberately stops automatic retries and requires human reconciliation. Administrative cross-document writes are not a tamper-proof or transactional audit ledger.
7. Legacy marketing/support copy, existing publicly issued assets, all old UI routes and the complete live OTP/onboarding journey are not exhaustively regression-tested. Passing the targeted suite does not certify all historical features.
8. ESLint 9 is peer-compatible with installed Next plugins but upstream marks it deprecated; migrate when the plugin ecosystem supports the successor. This is a tooling maintenance risk, not a current npm advisory finding.
9. This macOS worktree is inside iCloud-synced Documents. The tested runtime uses non-synced temporary storage; move development to a non-synced checkout and reinstall from the lockfile rather than shipping symlinks or caches.
10. Legal/retention terms, venue custody responsibilities, incident handling, staffing and operational approval need owner/professional sign-off.

## Readiness decision

All requested **local** gates pass. The product is **not approved for production** and the larger production-readiness task is not declared complete. Use the separate [AWS prerequisites and release checklist](AWS-PREREQUISITES.md) and [cutover/rollback procedure](MIGRATION.md). The [exact file manifest](CHANGED-FILES.md) distinguishes this continuation from cumulative branch changes.
