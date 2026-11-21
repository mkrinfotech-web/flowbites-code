"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { forgotPasswordAction } from "@/app/account/actions";
import { SITE_DOMAIN } from "@/lib/site";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email")?.trim() || "";
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="page-under-header flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_100%)] px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10">
      <form
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm sm:p-8"
        action={(fd) => {
          startTransition(async () => {
            setError(null);
            const res = await forgotPasswordAction(fd);
            if (res.error) setError(res.error);
            else setOk(true);
          });
        }}
      >
        <p className="font-script text-3xl text-flo-pink">FloBites</p>
        <h1 className="mt-1 text-2xl font-bold text-flo-maroon">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-flo-maroon/65">
          We’ll email you a FloBites reset link (from{" "}
          {SITE_DOMAIN}) to choose a new password. Use the same
          email from checkout to claim Flo Circle and your orders.
        </p>
        {ok ? (
          <p className="mt-6 rounded-2xl bg-flo-blush px-4 py-3 text-sm font-medium text-flo-maroon">
            Check your inbox for the reset link. You can close this tab.
          </p>
        ) : (
          <>
            <label className="mt-6 block text-sm font-medium text-flo-maroon">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={prefillEmail}
                className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
              />
            </label>
            {error && <p className="mt-3 text-sm text-flo-pink">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="mt-6 h-12 w-full rounded-full bg-flo-brown text-sm font-bold text-white disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}
        <p className="mt-4 text-center text-sm text-flo-maroon/60">
          <Link href="/account/login" className="font-semibold text-flo-pink">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="page-under-header flex min-h-[100dvh] items-center justify-center text-flo-maroon/60">
          Loading…
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
