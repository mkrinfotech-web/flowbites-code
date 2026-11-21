"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CANCEL_REASONS } from "@/lib/flo-circle";

type Ticket = {
  id: string;
  category: string;
  reason_code: string | null;
  message: string;
  status: string;
  created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  shipping: "Shipping",
  order: "Order",
  return: "Return / refund",
  cancel_membership: "Cancel membership",
  cancel_sub: "Cancel auto-delivery",
};

export function SupportTicketForm() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="max-w-lg space-y-3 rounded-3xl bg-white p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await fetch("/api/flo-circle/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: fd.get("category"),
              reasonCode: fd.get("reasonCode") || undefined,
              message: fd.get("message"),
            }),
          });
          const d = await res.json();
          setMsg(res.ok ? "Ticket submitted — we’ll reply soon." : d.error ?? "Failed");
          if (res.ok) {
            e.currentTarget.reset();
            router.refresh();
          }
        });
      }}
    >
      <h2 className="font-bold text-flo-maroon">New message</h2>
      <label className="block text-sm font-medium text-flo-maroon">
        Category
        <select
          name="category"
          className="mt-1 h-11 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3"
        >
          <option value="general">General</option>
          <option value="order">Order</option>
          <option value="shipping">Shipping</option>
          <option value="return">Return / refund</option>
          <option value="cancel_membership">Cancel membership</option>
          <option value="cancel_sub">Cancel auto-delivery</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-flo-maroon">
        Reason (optional)
        <select
          name="reasonCode"
          className="mt-1 h-11 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3"
        >
          <option value="">—</option>
          {CANCEL_REASONS.map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-flo-maroon">
        Message
        <textarea
          name="message"
          required
          rows={4}
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 py-2"
          placeholder="How can we help?"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-full bg-flo-pink px-6 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send"}
      </button>
      {msg && <p className="text-sm text-flo-maroon">{msg}</p>}
    </form>
  );
}

export function SupportTicketList({ tickets }: { tickets: Ticket[] }) {
  if (!tickets.length) {
    return (
      <p className="rounded-3xl bg-white px-5 py-6 text-sm text-flo-maroon/60 shadow-sm">
        No tickets yet — send a note anytime.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {tickets.map((t) => (
        <li
          key={t.id}
          className="rounded-2xl bg-white px-4 py-3.5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-flo-maroon">
              {CATEGORY_LABELS[t.category] ?? t.category}
            </p>
            <span className="rounded-full bg-flo-blush px-2.5 py-0.5 text-[10px] font-bold uppercase text-flo-maroon">
              {t.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-flo-maroon/70">
            {t.message}
          </p>
          <p className="mt-2 text-xs text-flo-maroon/45">
            {new Date(t.created_at).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {t.reason_code ? ` · ${t.reason_code}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
