"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  customerSignupAction,
  resendSignupConfirmationAction,
} from "@/app/account/actions";
import { SITE_DOMAIN } from "@/lib/site";

export default function AccountSignupForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [needsConfirmEmail, setNeedsConfirmEmail] = useState<string | null>(
    null,
  );
  const [resent, setResent] = useState(false);

  if (needsConfirmEmail) {
    return (
      <div className="page-under-header flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_100%)] px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <p className="font-script text-3xl text-flo-pink">FloBites</p>
          <h1 className="mt-1 text-2xl font-bold text-flo-maroon">
            Check your inbox
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-flo-maroon/70">
            We sent a confirmation email to{" "}
            <strong className="text-flo-maroon">{needsConfirmEmail}</strong>.
            It comes from <strong>FloBites</strong> at{" "}
            {SITE_DOMAIN}. Open it, tap Confirm email, then sign
            in.
          </p>
          {error && <p className="mt-3 text-sm text-flo-pink">{error}</p>}
          {resent && (
            <p className="mt-3 text-sm text-flo-maroon/70">
              Sent again. Give it a minute, and check spam.
            </p>
          )}
          <form
            className="mt-6"
            action={(fd) => {
              startTransition(async () => {
                setError(null);
                const res = await resendSignupConfirmationAction(fd);
                if (res.error) setError(res.error);
                else setResent(true);
              });
            }}
          >
            <input type="hidden" name="email" value={needsConfirmEmail} />
            <input type="hidden" name="next" value={next} />
            <button
              type="submit"
              disabled={pending}
              className="h-12 w-full rounded-full border border-flo-maroon/20 bg-white text-sm font-bold text-flo-maroon disabled:opacity-60"
            >
              {pending ? "Sending…" : "Resend confirmation email"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-flo-maroon/60">
            Confirmed?{" "}
            <Link
              href={`/account/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-semibold text-flo-pink"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-under-header flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_100%)] px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10">
      <form
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm sm:p-8"
        action={(fd) => {
          startTransition(async () => {
            const res = await customerSignupAction(fd);
            if (res && "error" in res && res.error) setError(res.error);
            else if (res && "needsConfirm" in res && res.needsConfirm) {
              const email = String(fd.get("email") || "").trim();
              setNeedsConfirmEmail(email);
            }
          });
        }}
      >
        <p className="font-script text-3xl text-flo-pink">Flo Circle</p>
        <h1 className="mt-1 text-2xl font-bold text-flo-maroon">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-flo-maroon/60">
          Save addresses, track orders, and manage Flo Circle.
        </p>
        <input type="hidden" name="next" value={next} />
        <label className="mt-6 block text-sm font-medium text-flo-maroon">
          Full name
          <input
            name="fullName"
            required
            autoComplete="name"
            className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-flo-maroon">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-flo-maroon">
          Phone (optional)
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-flo-maroon">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
          />
        </label>
        {error && <p className="mt-3 text-sm text-flo-pink">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 h-12 w-full rounded-full bg-flo-brown text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "Creating…" : "Join FloBites"}
        </button>
        <p className="mt-4 text-center text-sm text-flo-maroon/60">
          Have an account?{" "}
          <Link
            href={`/account/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-flo-pink"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
