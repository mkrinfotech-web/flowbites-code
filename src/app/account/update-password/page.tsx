"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePasswordAction } from "@/app/account/actions";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="page-under-header flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_100%)] px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10">
      <form
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm sm:p-8"
        action={(fd) => {
          startTransition(async () => {
            setError(null);
            const res = await updatePasswordAction(fd);
            if (res.error) {
              setError(res.error);
              return;
            }
            router.push("/account");
            router.refresh();
          });
        }}
      >
        <p className="font-script text-3xl text-flo-pink">FloBites</p>
        <h1 className="mt-1 text-2xl font-bold text-flo-maroon">
          Choose a new password
        </h1>
        <label className="mt-6 block text-sm font-medium text-flo-maroon">
          New password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-flo-maroon">
          Confirm password
          <input
            name="confirmPassword"
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
          {pending ? "Saving…" : "Update password"}
        </button>
        <p className="mt-4 text-center text-sm text-flo-maroon/60">
          <Link href="/account/login" className="font-semibold text-flo-pink">
            Sign in instead
          </Link>
        </p>
      </form>
    </div>
  );
}
