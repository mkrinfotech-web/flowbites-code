"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { customerLoginAction } from "@/app/account/actions";

export default function AccountLoginPage() {
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const authError = params.get("error");
  const [error, setError] = useState<string | null>(
    authError === "auth" ? "That link expired. Sign in or reset again." : null,
  );
  const [pending, startTransition] = useTransition();

  return (
    <div className="page-under-header flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_100%)] px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10">
      <form
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm sm:p-8"
        action={(fd) => {
          startTransition(async () => {
            const res = await customerLoginAction(fd);
            if (res?.error) setError(res.error);
          });
        }}
      >
        <p className="font-script text-3xl text-flo-pink">Flo Circle</p>
        <h1 className="mt-1 text-2xl font-bold text-flo-maroon">Sign in</h1>
        <p className="mt-1 text-sm text-flo-maroon/60">
          Track orders, membership &amp; auto-delivery.
        </p>
        <input type="hidden" name="next" value={next} />
        <label className="mt-6 block text-sm font-medium text-flo-maroon">
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
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
          />
        </label>
        <div className="mt-2 text-right">
          <Link
            href="/account/forgot"
            className="text-sm font-semibold text-flo-pink"
          >
            Forgot password?
          </Link>
        </div>
        {error && <p className="mt-3 text-sm text-flo-pink">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 h-12 w-full rounded-full bg-flo-brown text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-center text-sm text-flo-maroon/60">
          New here?{" "}
          <Link
            href={`/account/signup${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-flo-pink"
          >
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}
