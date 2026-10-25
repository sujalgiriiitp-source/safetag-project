# SafeTag — Universal Secure Storage Platform

SafeTag is a controlled-pilot candidate for staffed belongings custody. Production launch is not approved. Read [verification](docs/pilot/VERIFICATION.md), [AWS prerequisites](docs/pilot/AWS-PREREQUISITES.md), and [migration](docs/pilot/MIGRATION.md) before enabling any real venue or provider.

## Local verification

Use Node 22 in a non-synced working directory. On macOS, iCloud-evicted source/dependency placeholders can return incomplete modules or stall reads. Do not run installs while builds/tests are using the same dependencies.

1. Install locked dependencies with `npm ci --include=dev`.
2. Start a dedicated MongoDB 8 process bound to `127.0.0.1:27029` with a new, local-only data directory. Do not point tests at a real database.
3. Install Chromium with `npx playwright install chromium` (or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE`; installed Chrome is used on macOS).
4. Leave localhost port 3100 free and run `npm run verify:local`.

The runner executes compiler checks, lint, every top-level `tests/*.test.mts` file, a production build, synthetic fixtures and all Playwright tests. It overrides provider credentials, uses unique `safetag_test_*` databases on the isolated local MongoDB, stops its own app server and drops only those generated databases. Results are written to `.pilot-data/verification/`; synthetic screenshots and thermal PDFs are in `test-results/`.

The pilot workspace is `/pilot`, platform review is `/pilot/platform`, and visitor receipt secrets use `/pilot/receipt#...`. Receipt view access is not collection authorization. Missing provider configuration is not successful delivery.

## Setup

1. Clone repo
2. `npm install`
3. Copy `.env.example` to `.env.local`
4. Add all environment variables
5. `npm run dev`

## Local demonstration mode

Demo mode is for local presentations only. It cannot run in production and refuses to start when `MONGODB_URI` is set. It uses a separate in-memory demo venue, disables OTP and all external messaging/storage/vision integrations, and loses demo changes when the server restarts. Never enter real visitor information.

1. Copy `.env.example` to `.env.local` and leave `MONGODB_URI` empty.
2. Set `DEMO_MODE=true`, `DEMO_USERNAME=demo.operator`, and `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
3. Generate a password hash with `npm run demo:hash-password`. Enter a password of at least 12 characters at the prompt and copy the printed `DEMO_PASSWORD_HASH` into `.env.local`. Set `DEMO_DISPLAY_PASSWORD` to that same password; it is intentionally shown on the demo login page, so use only a dedicated synthetic demo credential.
4. Generate a session secret with `openssl rand -hex 32` and set it as `SESSION_SECRET` in `.env.local`.
5. Leave Twilio, Gmail, Cloudinary, and Google Vision credentials empty, then run `npm run dev`.
6. Open `http://localhost:3000/login` and sign in with the configured demo username and password.
7. From the dashboard, select **New Check-in**, enter fictional visitor details, choose at least one item, and generate the receipt. Open its QR receipt or use the token in **Scan QR** to look up the deposit, mark it returned, and return to the dashboard to confirm the status.

Demo sessions are server-side, process-local sessions with an eight-hour expiry. Restarting the development server clears demo data and invalidates sessions. Demo credentials are not committed; do not reuse them outside this local presentation. The login page displays `DEMO_USERNAME` and `DEMO_DISPLAY_PASSWORD` only in validated local demo mode, and only when the display password matches the stored scrypt hash.

The demo login allows five failed attempts per client IP in a 15-minute window. In local development, the limiter is held in memory by the dev server process; restart `npm run dev` to clear it. This resets demo data and sessions too, and does not disable authentication or rate limiting.

## Deploy

No deployment is authorized yet. The proposed AWS topology and release gates are documented in [AWS prerequisites](docs/pilot/AWS-PREREQUISITES.md). Build and test a private staging environment only after explicit approval. No AWS resources were created or connected during local verification.

## Seed Database

```bash
npm run seed
```

The seed script upserts 11 venues, demo operators, and sample deposits without deleting existing data.

## Important Routes

- `/` world-class public landing page
- `/nearby` public SafeTag operator finder
- `/about` founder story and contact page
- `/register` venue onboarding
- `/dashboard` operator workspace
- `/superadmin` platform control tower

## Local Development

```bash
npm run dev
npm run typecheck
npm run build
```

Outside explicit local demo mode, MongoDB is required and missing configuration fails closed. Staff OTP requires Twilio Verify; outbound pilot notifications stay disabled until approved sender/templates, consent and callbacks are configured. The existing seed command is development-only and must not be used to fabricate production venues, operators or traction.
# safetag-project
