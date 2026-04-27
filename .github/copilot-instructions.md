# Copilot Instructions for SafeTag

## Big Picture Architecture
- This is a **Next.js App Router** app (`app/`) with server-rendered operator/admin pages and API route handlers under `app/api/**/route.ts`.
- Core business/data logic is centralized in `lib/repository.ts`; API routes should orchestrate calls there, not reimplement persistence logic.
- Data layer is dual-mode: if `MONGODB_URI` is missing, repository uses an in-memory seeded mock store; if present, it uses Mongoose models in `models/*.ts` and auto-seeds baseline data (`ensureSeedData`).
- Auth is cookie-based HMAC session (`lib/session.ts`, cookie `safetag-session`), checked per page/route via `getCurrentSession()` (no middleware gate).
- Route aliasing/re-export is used to keep URLs stable (e.g. `app/dashboard/page.tsx` re-exports `app/operator/dashboard/page.tsx`, same for `/login` and settings).

## Primary Product Flows (Preserve These)
- **Check-in flow:** `components/checkin/operator-checkin-form.tsx` -> `POST /api/deposits` -> `createDeposit` -> PDF generation (`lib/pdf.ts`) -> Cloudinary upload (`lib/storage.ts`) -> WhatsApp notifications (`lib/notifications.ts`).
- **Scan/return flow:** `components/operator/qr-scanner.tsx` -> `POST /api/operator/scan` -> storage photo capture + AI detection (`lib/vision.ts`) + mismatch check (`compareItemLists` in `lib/utils.ts`) -> mark stored/returned.
- **OTP flow:** `POST /api/auth/request-otp` + `POST /api/auth/verify-otp`; Twilio Verify when configured, otherwise demo OTP persisted via repository (`DEMO_OTP` in `lib/constants.ts`).

## Project-Specific Conventions
- Use path aliases (`@/*`) from `tsconfig.json`; prefer imports like `@/lib/repository`.
- Client components call APIs with `fetch` + `readApiJson` (`lib/api.ts`) and show errors/success through `sonner` toasts.
- Keep response shape convention: success payloads and `{ error: string }` on failure with explicit status codes.
- Time/date display and analytics are India-focused (`en-IN`, `Asia/Kolkata`) across utilities and notifications.
- Deposit status is derived (not raw-only) using `resolveDepositStatus` in `lib/utils.ts`; use it whenever status semantics matter.
- Item/category behavior is venue-type driven from `VENUE_TYPE_META`, `DEFAULT_ITEM_CATEGORIES`, and `DEFAULT_INSTRUCTIONS` in `lib/constants.ts`.

## Integrations and Environment
- Environment contract is in `.env.example` (`MongoDB`, `Twilio`, `Cloudinary`, `Google Vision`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`).
- `lib/storage.ts` intentionally falls back to returning raw base64 if Cloudinary is not configured.
- `lib/vision.ts` supports Google Vision object localization but always has filename-based fallback mapping.
- `lib/twilio.ts` includes in-memory OTP rate limiting and normalizes Indian phone numbers to `+91` format.

## Developer Workflow
- Install/run: `npm install`, `npm run dev`.
- Quality gates used in this repo: `npm run typecheck`, `npm run build` (there is no dedicated test script in `package.json`).
- Seed real Mongo data with `npm run seed` (requires `MONGODB_URI`; script loads `.env.local` directly).

## Editing Guidance for Agents
- For new features, add/extend repository functions first (`lib/repository.ts`), then expose via API route, then wire UI.
- Preserve dual-mode behavior (Mongo + mock fallback) when touching data-access code.
- Reuse existing UI primitives from `components/ui/*` and workspace shell patterns from `components/shared/dashboard-shell.tsx`.