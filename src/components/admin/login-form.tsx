"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { loginAction } from "@/app/admin/actions";

export function LoginForm({
  nextPath,
  errorParam,
}: {
  nextPath: string;
  errorParam?: string;
}) {
  const [error, setError] = useState(
    errorParam === "unauthorized"
      ? "This account is not authorized for admin access."
      : "",
  );
  const [pending, startTransition] = useTransition();

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md rounded-3xl border border-flo-maroon/10 bg-white/80 p-8 shadow-[0_20px_60px_rgba(85,19,19,0.08)] backdrop-blur"
      action={(fd) => {
        startTransition(async () => {
          const res = await loginAction(fd);
          if (res?.error) setError(res.error);
        });
      }}
    >
      <p className="font-script text-3xl text-flo-pink">FloBites</p>
      <h1 className="mt-1 text-2xl font-extrabold text-flo-maroon">Staff login</h1>
      <p className="mt-1 text-sm text-flo-ink/60">
        Orders, products, CMS &amp; discounts
      </p>

      <input type="hidden" name="next" value={nextPath} />

      <label className="mt-6 block text-xs font-bold uppercase tracking-wide text-flo-maroon/70">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1.5 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/50 px-3 py-2.5 text-sm outline-none ring-flo-pink focus:ring-2"
        />
      </label>

      <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-flo-maroon/70">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft/50 px-3 py-2.5 text-sm outline-none ring-flo-pink focus:ring-2"
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-flo-pink px-4 py-3 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="mt-4 text-center text-sm text-flo-maroon/60">
        <Link
          href="/admin/forgot"
          className="font-semibold text-flo-pink hover:underline"
        >
          Forgot password?
        </Link>
      </p>
    </motion.form>
  );
}
