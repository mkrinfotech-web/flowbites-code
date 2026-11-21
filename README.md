# The Hormone Hood (FloBites)

E-commerce site for **The Hormone Hood**, a period-care snack bar brand in India. Customers browse and buy FloBites snack bars, pay with Razorpay, track orders and join the Flo Circle loyalty programme. Staff run the business from a built-in admin panel.

- Storefront: https://www.thehormonehood.com
- Admin panel: https://admin.thehormonehood.com

For the full handover (architecture, database, flows, operations guide, troubleshooting, known limitations) read **[docs/KT.md](docs/KT.md)**.

## Tech stack

| Layer | Technology | Version | Docs |
|---|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 15.5 | https://nextjs.org/docs |
| UI | React | 19.1 | https://react.dev |
| Language | TypeScript | 5 | https://www.typescriptlang.org/docs |
| Styling | Tailwind CSS | 4 | https://tailwindcss.com/docs |
| Animation | Framer Motion | 12 | https://motion.dev/docs |
| Icons | Lucide React | 1.x | https://lucide.dev |
| Client state | Zustand (cart, wishlist) | 5 | https://zustand.docs.pmnd.rs |
| Validation | Zod | 4 | https://zod.dev |
| Database, Auth, Storage | Supabase (Postgres, Auth, Storage; Mumbai region) | supabase-js 2 | https://supabase.com/docs |
| Payments | Razorpay (orders, refunds, subscriptions, webhooks) | razorpay 2.9 | https://razorpay.com/docs |
| Email | Resend (app emails + Supabase Auth SMTP + inbound reach@) | resend 6 | https://resend.com/docs |
| Hosting | Vercel (Node 24.x) | - | https://vercel.com/docs |
| Domain / DNS | GoDaddy (thehormonehood.com) | - | https://www.godaddy.com/help |

## Links

**Live**

| What | URL |
|---|---|
| Storefront | https://www.thehormonehood.com |
| Admin panel | https://admin.thehormonehood.com |
| Guest order tracking | https://www.thehormonehood.com/track |
| Customer account | https://www.thehormonehood.com/account |
| Razorpay webhook endpoint | https://www.thehormonehood.com/api/webhooks/razorpay |
| Contact email | reach@thehormonehood.com |

**Dashboards** (sign-in required)

| Service | URL |
|---|---|
| Source code (GitHub) | https://github.com/mkrinfotech-web/flowbites-code |
| Hosting (Vercel project `flowbites`) | https://vercel.com/flow-bites/flowbites |
| Database & Auth (Supabase project) | https://supabase.com/dashboard/project/vvlyqvahfaowwjaflumd |
| Payments (Razorpay) | https://dashboard.razorpay.com |
| Email (Resend) | https://resend.com/emails |
| Domain DNS (GoDaddy) | https://dcc.godaddy.com/control/portfolio/thehormonehood.com/settings?tab=dns |

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
```

The admin panel runs locally at http://admin.localhost:3000 (the `admin.` host is rewritten to `/admin`). You need a staff account in your Supabase project.

Database schema lives in `supabase/migrations/` and is applied manually, in numeric order (see KT guide, Database section).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Deploy to production with the Vercel CLI (`npx vercel --prod --yes`) |

There is no automated test suite yet.

## Environment variables

Copy `.env.example` to `.env.local`. Never commit real values.

| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key (protected by row-level security) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only full-access key for checkout, webhooks, emails, staff invites |
| `NEXT_PUBLIC_APP_URL` | Storefront origin (used in emails, auth links, sitemap) |
| `NEXT_PUBLIC_ADMIN_URL` | Admin origin (staff invite and admin password-reset links) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key id |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (payment verification, refunds) |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies Razorpay webhook signatures |
| `RAZORPAY_ALLOW_DEMO_WEBHOOK` | Local testing only: accept unsigned webhooks when no secret is set |
| `ALLOW_DEMO_CHECKOUT` | Allow demo checkout without Razorpay in production (leave unset) |
| `RESEND_API_KEY` | Resend API key (app emails and Supabase Auth SMTP password) |
| `EMAIL_FROM` | Sender, for example `FloBites <noreply@thehormonehood.com>` |
| `SUPABASE_ACCESS_TOKEN` | Only for `scripts/configure-auth-resend-smtp.mjs` |

## Deploy

Deployment is manual through the Vercel CLI (project `flowbites`, team `flow-bites`); there is no Git auto-deploy.

```bash
npm run lint && npm run build
npm run deploy
```

Set environment variables in Vercel > Project > Settings > Environment Variables and redeploy after changing them. To roll back, promote a previous deployment from the Vercel dashboard (Deployments tab). Details are in the KT guide.

## Repository layout

- `src/app` routes: storefront, `account/` (customer portal), `admin/` (staff panel), `api/`
- `src/lib` business logic (orders, refunds, discounts, Flo Circle, email, Supabase and Razorpay clients)
- `src/components` UI components
- `supabase/migrations` SQL migrations, `supabase/auth-email-templates` Auth email HTML
- `scripts` maintenance scripts, `public` static assets

Full handover documentation: [docs/KT.md](docs/KT.md).
