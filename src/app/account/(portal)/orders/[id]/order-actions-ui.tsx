"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelOrderAction, requestReturnAction } from "@/app/account/order-actions";

const RETURN_REASONS = [
  { value: "damaged", label: "Arrived damaged" },
  { value: "wrong_item", label: "Wrong item" },
  { value: "quality", label: "Quality concern" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Something else" },
] as const;

export function CancelOrderForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center rounded-full border border-flo-maroon/20 bg-white px-5 text-sm font-bold text-flo-maroon"
      >
        Cancel order
      </button>
    );
  }

  return (
    <form
      className="w-full max-w-md space-y-3 rounded-3xl border border-flo-maroon/10 bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("orderId", orderId);
        startTransition(async () => {
          const res = await cancelOrderAction(fd);
          setMsg(res.error ?? "Order cancelled — we’ll take care of the rest.");
          if (res.ok) {
            setOpen(false);
            router.refresh();
          }
        });
      }}
    >
      <p className="text-sm font-bold text-flo-maroon">Cancel this pack?</p>
      <p className="text-xs text-flo-maroon/60">
        Only available before we start processing. Soft and reversible only
        through support after that.
      </p>
      <label className="block text-sm font-medium text-flo-maroon">
        Reason (optional)
        <textarea
          name="reason"
          rows={2}
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 py-2 text-sm"
          placeholder="Tell us gently why…"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-full bg-flo-maroon px-5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "Cancelling…" : "Confirm cancel"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-10 rounded-full bg-flo-soft px-5 text-sm font-bold text-flo-maroon"
        >
          Keep order
        </button>
      </div>
      {msg && <p className="text-sm text-flo-maroon">{msg}</p>}
    </form>
  );
}

export function ReturnRequestForm({
  orderId,
  existingStatus,
}: {
  orderId: string;
  existingStatus?: string | null;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (existingStatus) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="font-bold text-flo-maroon">Return / refund</p>
        <p className="mt-1 text-sm text-flo-maroon/70">
          Your request is{" "}
          <span className="font-semibold capitalize">{existingStatus}</span>.
          We’ll follow up by email.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-3 rounded-3xl bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("orderId", orderId);
        startTransition(async () => {
          const res = await requestReturnAction(fd);
          setMsg(
            res.error ??
              "Return request received — our team will review it kindly.",
          );
          if (res.ok) {
            e.currentTarget.reset();
            router.refresh();
          }
        });
      }}
    >
      <h2 className="font-bold text-flo-maroon">Request a return / refund</h2>
      <p className="text-xs text-flo-maroon/60">
        For shipped or delivered packs. One request per order.
      </p>
      <label className="block text-sm font-medium text-flo-maroon">
        Reason
        <select
          name="reason"
          required
          className="mt-1 h-11 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3"
        >
          {RETURN_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-flo-maroon">
        Details
        <textarea
          name="message"
          required
          rows={3}
          className="mt-1 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 py-2"
          placeholder="What happened?"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-full bg-flo-pink px-6 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Submit request"}
      </button>
      {msg && <p className="text-sm text-flo-maroon">{msg}</p>}
    </form>
  );
}
