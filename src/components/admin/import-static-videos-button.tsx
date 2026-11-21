"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importStaticVideosAction } from "@/app/admin/video-actions";
import { FolderInput } from "lucide-react";

export function ImportStaticVideosButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await importStaticVideosAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(
        `Imported ${result.imported ?? 0} · skipped ${result.skipped ?? 0} already present`,
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-flo-maroon/20 bg-white px-4 py-2 text-sm font-bold text-flo-maroon disabled:opacity-60"
      >
        <FolderInput className="h-4 w-4" />
        {pending ? "Importing…" : "Import from public/"}
      </button>
      {message ? (
        <p className="text-xs font-medium text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
