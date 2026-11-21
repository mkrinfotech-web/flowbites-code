import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateSubscriptionAction } from "@/app/admin/flo-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { AdminNotice } from "@/components/admin/admin-notice";

const ACTION_LABELS: Record<string, string> = {
  skip: "Skip next ship",
  pause: "Pause",
  resume: "Resume",
  cancel: "Cancel",
};

export default async function FloSubsAdminPage() {
  const supabase = await createClient();
  const week = new Date();
  week.setDate(week.getDate() + 7);

  const { data: rows } = await supabase
    .from("flo_subscriptions")
    .select("*, flo_subscription_items(quantity, products(name))")
    .order("next_ship_at", { ascending: true })
    .limit(100);

  const userIds = Array.from(
    new Set((rows ?? []).map((s) => s.user_id).filter(Boolean)),
  );
  const { data: profiles } = userIds.length
    ? await supabase
        .from("member_profiles")
        .select("id, email, full_name, member_id")
        .in("id", userIds)
    : { data: [] as Array<{
        id: string;
        email: string | null;
        full_name: string | null;
        member_id: string | null;
      }> };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const dueSoon = (rows ?? []).filter(
    (s) =>
      s.status === "active" &&
      s.next_ship_at &&
      new Date(s.next_ship_at) <= week,
  ).length;

  return (
    <div>
      <AdminNotice />
      <h1 className="text-2xl font-bold text-flo-maroon">
        Auto-delivery subscriptions
      </h1>
      <p className="mt-1 text-sm text-flo-maroon/60">
        Soft retail ops — pause, resume, skip, or cancel.{" "}
        <span className="font-semibold text-flo-pink">
          {dueSoon} due in 7 days
        </span>
      </p>

      <div className="mt-6 space-y-4">
        {(rows ?? []).map((s) => {
          const item = (
            s.flo_subscription_items as
              | { quantity: number; products: { name: string } | null }[]
              | null
          )?.[0];
          const p = profileMap.get(s.user_id);
          const nextShip = s.next_ship_at
            ? new Date(s.next_ship_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—";
          const canPause = s.status === "active" || s.status === "skipped";
          const canResume = s.status === "paused";
          const canSkip = s.status === "active";
          const canCancel =
            s.status === "active" ||
            s.status === "paused" ||
            s.status === "skipped";

          return (
            <article
              key={s.id}
              className="rounded-2xl border border-flo-maroon/10 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-flo-maroon">
                    {item?.products?.name ?? "—"} × {item?.quantity ?? 1}
                  </p>
                  <p className="mt-0.5 text-sm text-flo-ink/70">
                    <span className="capitalize">{s.status}</span>
                    {" · "}
                    every {s.cadence_days}d
                    {" · "}
                    next ship{" "}
                    <span className="font-semibold text-flo-pink">{nextShip}</span>
                  </p>
                  <p className="mt-1 text-xs text-flo-maroon/50">
                    {p?.full_name ?? "Member"}
                    {p?.email ? ` · ${p.email}` : ""}
                    {p?.member_id ? ` · ${p.member_id}` : ""}
                  </p>
                  {s.cancel_reason ? (
                    <p className="mt-1 text-xs text-flo-ink/45">
                      Reason: {s.cancel_reason}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={
                    p?.email
                      ? `/admin/flo-circle/members?email=${encodeURIComponent(p.email)}`
                      : `/admin/flo-circle/members?userId=${encodeURIComponent(s.user_id)}`
                  }
                  className="rounded-full bg-flo-cream px-3 py-1.5 text-xs font-bold text-flo-maroon"
                >
                  View member
                </Link>
              </div>

              {canPause || canResume || canSkip || canCancel ? (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-flo-maroon/10 pt-3">
                  {canSkip ? (
                    <ActionForm
                      subscriptionId={s.id}
                      action="skip"
                      confirmMessage="Skip the next shipment for this subscription?"
                    />
                  ) : null}
                  {canPause ? (
                    <ActionForm
                      subscriptionId={s.id}
                      action="pause"
                      confirmMessage="Pause this auto-delivery subscription?"
                    />
                  ) : null}
                  {canResume ? (
                    <ActionForm
                      subscriptionId={s.id}
                      action="resume"
                      confirmMessage="Resume this subscription and set next ship?"
                    />
                  ) : null}
                  {canCancel ? (
                    <form
                      action={updateSubscriptionAction}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <input type="hidden" name="subscriptionId" value={s.id} />
                      <input type="hidden" name="action" value="cancel" />
                      <label className="text-xs font-semibold text-flo-maroon/70">
                        Cancel reason
                        <input
                          name="cancelReason"
                          placeholder="Optional"
                          className="mt-1 h-9 w-40 rounded-xl border border-flo-maroon/15 px-2 text-sm"
                        />
                      </label>
                      <ConfirmSubmitButton
                        confirmMessage="Cancel this subscription permanently?"
                        className="h-9 rounded-full bg-rose-50 px-3 text-xs font-bold text-rose-700"
                      >
                        Cancel
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
        {!rows?.length && (
          <p className="rounded-2xl bg-white p-6 text-sm text-flo-maroon/50 shadow-sm">
            No subscriptions yet.
          </p>
        )}
      </div>
    </div>
  );
}

function ActionForm({
  subscriptionId,
  action,
  confirmMessage,
}: {
  subscriptionId: string;
  action: "skip" | "pause" | "resume";
  confirmMessage: string;
}) {
  const tone =
    action === "resume"
      ? "bg-flo-pink text-white"
      : "bg-flo-cream text-flo-maroon";
  return (
    <form action={updateSubscriptionAction}>
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <input type="hidden" name="action" value={action} />
      <ConfirmSubmitButton
        confirmMessage={confirmMessage}
        className={`h-9 rounded-full px-3 text-xs font-bold ${tone}`}
      >
        {ACTION_LABELS[action]}
      </ConfirmSubmitButton>
    </form>
  );
}
