# SafeTag — Universal Secure Storage Platform

SafeTag is a production-ready Next.js app for QR-based secure belongings management across exam centers, temples, parks, museums, events, and public venues. It uses zero hardware, instant QR receipts, photo proof, WhatsApp alerts, MongoDB, Cloudinary, and Google Vision-ready integrations.

## Setup

1. Clone repo
2. `npm install`
3. Copy `.env.example` to `.env.local`
4. Add all environment variables
5. `npm run dev`

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

SafeTag falls back to seeded in-memory data when `MONGODB_URI` is missing, and Twilio WhatsApp uses the sandbox sender when configured.
# safetag-project
