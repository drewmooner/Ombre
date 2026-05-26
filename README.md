# 0mbre

Ankara handkerchief shop — Next.js storefront, admin dashboard, Paystack checkout, and Supabase database.

## Setup

1. Copy `.env.example` to `.env` and fill in keys (Supabase, Paystack, Resend, admin password).
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

See `.env.example` for required environment variables.

Resend sender setup:
- OTP/sign-in emails use `RESEND_FROM_AUTH`
- order/payment emails use `RESEND_FROM_ORDERS`
- both addresses must be verified under your Resend domain before production sending

## Deploy

Deploy to [Vercel](https://vercel.com) and set the same environment variables. Use the Supabase **Session pooler** connection string for `DATABASE_URL` on serverless hosts.
