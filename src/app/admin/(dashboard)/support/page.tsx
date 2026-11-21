import Link from "next/link";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateTicketStatusAction } from "@/app/admin/support-actions";

// Values from supabase/migrations/004_flo_circle.sql and 015_customer_account_ops.sql.
const STATUSES = ["open", "in_progress", "closed"] as const;
const CATEGORIES = [
  "cancel_membership",
  "cancel_sub",
  "general",
  "shipping",
  "order",
  "return",
] as const;

function label(s: string) {
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function tone(status: string) {
  switch (status) {
    case "open":
      return "bg-amber-100 text-amber-900";
    case "in_progress":
      return "bg-sky-100 text-sky-800";
    case "closed":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-flo-blush text-flo-maroon";
  }
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    category?: string;
    error?: string;
    saved?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const status =
    params.status && (STATUSES as readonly string[]).includes(params.status)
      ? params.status
      : undefined;
  const category =
    params.category &&
    (CATEGORIES as readonly string[]).includes(params.category)
      ? params.category
      : undefined;

  let query = supabase
    .from("flo_support_tickets")
    .select("id, user_id, category, reason_code, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);

  const { data: tickets, error } = await query;
  const rows = tickets ?? [];

  // Customer identity lives in member_profiles (staff-readable via RLS).
  const userIds = Array.from(new Set(rows.map((t) => t.user_id as string)));
  const people = new Map<
    string,
    { full_name: string | null; email: string | null }
  >();
  if (userIds.length > 0) {
    const { data: members } = await supabase
      .from("member_profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    for (const m of members ?? []) {
      people.set(m.id, { full_name: m.full_name, email: m.email });
    }
  }

  const href = (next: { status?: string; category?: string }) => {
    const q = new URLSearchParams();
    const s = "status" in next ? next.status : status;
    const c = "category" in next ? next.category : category;
    if (s) q.set("status", s);
    if (c) q.set("category", c);
    const qs = q.toString();
    return qs ? `/admin/support?${qs}` : "/admin/support";
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-flo-maroon">Support</h1>
      <p className="mt-1 text-sm text-flo-ink/60">
        Customer support tickets, newest first. Reply by email, then update the
        status.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip
          href={href({ status: undefined })}
          active={!status}
          label="All statuses"
        />
        {STATUSES.map((s) => (
          <FilterChip
            key={s}
            href={href({ status: s })}
            active={status === s}
            label={label(s)}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <FilterChip
          href={href({ category: undefined })}
          active={!category}
          label="All categories"
        />
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            href={href({ category: c })}
            active={category === c}
            label={label(c)}
          />
        ))}
      </div>

      {params.error ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          Could not update ticket:{" "}
          {params.error === "invalid" ? "invalid request." : params.error}
        </p>
      ) : null}
      {params.saved ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Ticket updated.
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error.message}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-flo-maroon/20 bg-white/50 p-10 text-center text-flo-ink/50">
            No tickets match these filters.
          </div>
        ) : (
          rows.map((t) => {
            const person = people.get(t.user_id as string);
            const email = person?.email ?? null;
            const subject = `Re: your ${label(t.category).toLowerCase()} request`;
            return (
              <article
                key={t.id}
                className="rounded-2xl border border-flo-maroon/10 bg-white/75 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-flo-maroon/10 px-2.5 py-1 text-[11px] font-bold text-flo-maroon">
                        {label(t.category)}
                      </span>
                      {t.reason_code ? (
                        <span className="text-xs text-flo-ink/60">
                          {label(t.reason_code)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-flo-ink/70">
                      {person?.full_name || "Customer"}
                      {email ? ` · ${email}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-flo-ink/50">
                      {new Date(t.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${tone(t.status)}`}
                  >
                    {label(t.status)}
                  </span>
                </div>

                {t.message ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-flo-ink/80">
                    {t.message}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <form
                    action={updateTicketStatusAction}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="id" value={t.id} />
                    <select
                      name="status"
                      defaultValue={t.status}
                      className="rounded-xl border border-flo-maroon/15 bg-white px-3 py-2 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {label(s)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-full bg-flo-maroon px-4 py-2 text-xs font-bold text-white"
                    >
                      Update status
                    </button>
                  </form>
                  {email ? (
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-flo-maroon hover:bg-white"
                    >
                      <Mail className="h-3.5 w-3.5" /> Reply by email
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
        active
          ? "bg-flo-pink text-white"
          : "bg-white/70 text-flo-maroon hover:bg-white"
      }`}
    >
      {label}
    </Link>
  );
}
