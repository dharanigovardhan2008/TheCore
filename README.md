# TheCore

Project, platform and encrypted `.env` tracker for developers. Next.js + Supabase.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill every value.
3. Run all files in `supabase/migrations` in order (Supabase SQL editor), including the newest.
4. `npm run dev`

## Before launch

- Set all env values in your host (see `.env.example`). Use `live_mode` for `DODO_PAYMENTS_ENVIRONMENT` and `production` for `CASHFREE_ENV`.
- Polar webhook URL: `https://YOUR-DOMAIN/api/webhooks/polar`
  Events: `order.paid`, `order.refunded`, `subscription.active`, `subscription.canceled`, `subscription.uncanceled`, `subscription.past_due`, `subscription.revoked`, `subscription.updated`
- Cashfree webhook URL: `https://YOUR-DOMAIN/api/cashfree/webhook`
- Polar products must be priced in USD and match `plan_configs` ($5 monthly, $30 yearly).
- Supabase Auth: add `https://YOUR-DOMAIN/auth/callback` to redirect URLs.

## Commands

- `npm run build` build
- `npm test` unit tests
- `npm run typecheck` type check
- `npm run lint` lint
