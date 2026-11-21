"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function NoticeInner() {
  const params = useSearchParams();
  const error = params.get("error");
  const saved = params.get("saved");
  if (error) {
    return (
      <p
        role="alert"
        className="mb-4 rounded-2xl border border-flo-pink/30 bg-flo-blush px-4 py-3 text-sm font-medium text-flo-maroon"
      >
        {error}
      </p>
    );
  }
  if (saved) {
    return (
      <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        Saved.
      </p>
    );
  }
  return null;
}

/** Shows ?error= / ?saved= flash messages set by admin server actions. */
export function AdminNotice() {
  return (
    <Suspense fallback={null}>
      <NoticeInner />
    </Suspense>
  );
}
