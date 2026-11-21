# FloBites Auth email templates (Resend SMTP)

Branded HTML for Supabase Auth → custom SMTP via Resend.

| File | Supabase template |
|---|---|
| `confirm-signup.html` | Confirm sign up |
| `magic-link.html` | Magic Link |
| `reset-password.html` | Reset password |
| `invite.html` | Invite user |

Go template variables used: `{{ .RedirectTo }}`, `{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .Token }}` (magic link only).



## Apply via API

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...   # https://supabase.com/dashboard/account/tokens
node scripts/configure-auth-resend-smtp.mjs
```

Uses `RESEND_API_KEY` and `EMAIL_FROM` from `.env.local` (default sender `FloBites <noreply@thehormonehood.com>`).

## Apply via Dashboard

See **Auth emails via Resend** in `ADMIN_SETUP.md` / `deployment_guide.md`.
