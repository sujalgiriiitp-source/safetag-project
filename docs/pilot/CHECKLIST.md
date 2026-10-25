# Controlled pilot implementation checklist

Baseline: `b09bef1`, branch `codex/pilot-hardening`. No live environment or customer data copied into this worktree.

- [x] Inspect current GitHub source and 12-page pitch PDF.
- [x] Baseline `npm ci`: 300 packages installed.
- [x] Baseline `npm run typecheck`: exit 0.
- [x] Baseline `npm run build`: exit 0, disabled minification and dynamic-render warnings.
- [x] Baseline `npm run lint`: exit 1, interactive ESLint setup; no configured lint/test suite.
- [x] Supported runtime and repeatable local quality gates: Node 22, Next 16, typecheck, lint and production build pass.
- [x] Revocable sessions, venue/platform boundaries, persistent rate limits and TOTP replay checks pass locally.
- [x] Staff invitations, role re-read, one-time acceptance and session revocation pass synthetic tests.
- [ ] Complete live OTP/onboarding/review/suspension journey verified in an approved staging environment.
- [x] Physical custody, atomic capacity, Mongo-private evidence, item condition and payment permissions pass local tests.
- [x] Receipt/collection separation, duplicate check-in, concurrent returns and manager replacement pass local tests.
- [x] Durable notification leases, bounded retries, opt-out and signed/ordered callbacks pass mocked-provider tests.
- [ ] Production notification and Cloudinary privacy/expiry/deletion drills authorized and verified.
- [x] Desktop/mobile operator journeys and thermal PDF layouts checked; explicit return confirmation regression covered.
- [ ] Physical printer/camera, shift handover and outage drills passed at a venue.
- [ ] Legacy public claims, existing public media links and all historical routes exhaustively reviewed.
- [x] Full local suite: 27 unit/integration tests and 5 browser tests pass with no skipped cases.
- [x] Migration/rollback notes, AWS prerequisites, exact file manifest and verification evidence documented.
- [ ] Linux/container staging, restore/recovery, load tests, operating costs and owner/legal release approval completed.

External provider verification is separate from tests using mocks. No live messages, charges, deployment, or production migration is authorized by this checklist.

See [verification results and remaining risks](VERIFICATION.md) and the [production release checklist](AWS-PREREQUISITES.md). Local gates passed; production readiness is not declared complete.
