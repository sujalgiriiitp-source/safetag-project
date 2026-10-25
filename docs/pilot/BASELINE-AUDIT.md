# Evidence-based baseline audit

Audit of GitHub commit b09bef1. The pitch PDF is a requirements proposal. Its examples, venue names, partnership statements, market totals, uptime and delivery claims are not independently verified. No additional screenshot attachment accompanied the request; repository PDF screenshots are demonstration material.

| Area | Baseline status | Evidence and user consequence |
| --- | --- | --- |
| Existing UI and build | Implemented and tested | TypeScript and build exit 0; this does not exercise transactions. |
| Automated QA | Missing | No tests script; lint prompts for configuration. |
| Check-in authentication | Partially implemented | `app/api/deposits/route.ts` POST checks sessions only in demo mode; production anonymous callers can create records. GET is already scoped to session venue. |
| Roles | Partially implemented | `app/api/superadmin/*` gates on venue `admin`; a venue manager can administer other venues. |
| Sessions | Partially implemented | `lib/session.ts` signed production payload has no server expiry/revocation and does not recheck staff activity. |
| Onboarding | Partially implemented | Approval starts false, but registration API does not consume a verified phone grant; staff changes directly activate accounts. |
| Physical custody | Missing | No rack/bin, item quantities/condition, independent payment or handover records. Creation labels deposit in custody before physical acceptance. |
| Return concurrency | Partially implemented | `markDepositReturned` updates only by token; repeated/concurrent calls overwrite history; stored can reopen returned records. |
| QR protection | Partially implemented | `lib/qr.ts` uses 3 random bytes (24 bits), not UUID/128 bits; readable token and bearer access are conflated. |
| Private evidence | Partially implemented | Public deposit route and receipt server page pass photo/PDF URLs and venue contact data. `lib/storage.ts` uploads public media and falls back to raw base64. HTTPS is not private access or tamper protection. |
| AI | Demo/simulated | `lib/vision.ts` unions filename hints with real Vision results; missing credentials still look detected. |
| Notifications | Implemented but not verified | `lib/twilio.ts` gets a SID, not delivery evidence. No durable jobs, consent, callback, opt-out or retry. UI assumes success. Email adapter exists, not live tested. |
| Public metrics | Demo/simulated | Repository silently falls back to sample data without Mongo; seed records and hardcoded frontend numbers appear as traction. |
| Production config | Partially implemented | Production session secret guard exists; missing Mongo still falls back to in-memory data. Runtime seed guard can skip DB connection. |
| Offline | Partially implemented | `public/sw.js` caches navigation including private pages. No offline transaction protocol; unsafe to imply server confirmation. |
| Payments | Missing | Subscription bookkeeping exists; no independent visitor fee/reconciliation ledger. Deposits times Rs5 is incorrectly described as platform earnings. |
| Integrations | Blocked by external setup | No production credentials, approved WhatsApp templates, documented opt-in, provider expiry evidence or authorized live test recipient supplied for this worktree. |

## Architecture decision

Retain App Router, TypeScript, Tailwind, Mongoose and provider SDKs. The final tested upgrade is Next 16.4.3, React 19.3.1 and Node 22.23.4; the intermediate Next 15 upgrade was superseded by dependency/security review. Use additional pilot collections, preserving existing document fields and records. Custody and its outbox/audit events share a Mongo document: one conditional update commits state, handover evidence and notification intent. A unique partial location index enforces one active allocation per rack/bin without introducing a distributed service or rewriting legacy data. MongoDB is durable storage for session hashes, job leases and rate limits. A separately supervised worker or authenticated scheduler drains jobs; no after-response timer is trusted.

Pilot: staffed secure storage at a small number of reviewed venues, online only, physical receipt/collection coupon, manager exceptions, cash/manual payments. Native apps, franchising, IoT, insurance, government integrations and live online payments are deferred.

Sources: [Next support](https://nextjs.org/support-policy), [October security release](https://nextjs.org/blog/nextjs-security-update-october-14-2026), [Next 15 upgrade](https://nextjs.org/docs/app/guides/upgrading/version-15), [Mongo atomicity](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/), [Cloudinary access control](https://cloudinary.com/documentation/control_access_to_media), [Twilio security](https://www.twilio.com/docs/usage/security), [WhatsApp session/template rules](https://www.twilio.com/docs/whatsapp/key-concepts).
