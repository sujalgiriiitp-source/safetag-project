# SafeTag — Universal Secure Storage Platform

SafeTag is a production-ready Next.js app for QR-based secure belongings management across exam centers, temples, parks, museums, events, and public venues. It uses zero hardware, instant QR receipts, photo proof, WhatsApp alerts, MongoDB, Cloudinary, and Google Vision-ready integrations.

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

1. Push to GitHub
2. Connect to Vercel
3. Add env variables in Vercel dashboard
4. Deploy

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

SafeTag falls back to seeded in-memory data when `MONGODB_URI` is missing. Twilio is optional for non-demo environments; demo mode blocks OTP and outbound messaging.
# safetag-project
