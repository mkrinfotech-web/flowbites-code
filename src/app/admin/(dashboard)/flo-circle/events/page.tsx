import { createClient } from "@/lib/supabase/server";
import {
  deleteEventAction,
  deleteLaunchAction,
  upsertEventAction,
  upsertLaunchAction,
} from "@/app/admin/flo-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Download } from "lucide-react";
import { AdminNotice } from "@/components/admin/admin-notice";

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function csvEscape(value: string | null | undefined) {
  const s = value ?? "";
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

type RsvpRow = {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
};

export default async function FloEventsAdminPage() {
  const supabase = await createClient();
  const [{ data: events }, { data: launches }, { data: rsvps }] =
    await Promise.all([
      supabase.from("flo_events").select("*").order("event_at", { ascending: false }),
      supabase.from("flo_launches").select("*").order("created_at", { ascending: false }),
      supabase
        .from("flo_event_rsvps")
        .select("id, event_id, user_id, status, created_at")
        .order("created_at", { ascending: false }),
    ]);

  const rsvpList = (rsvps ?? []) as RsvpRow[];
  const rsvpUserIds = Array.from(
    new Set(rsvpList.map((r) => r.user_id).filter(Boolean)),
  );
  const { data: profiles } = rsvpUserIds.length
    ? await supabase
        .from("member_profiles")
        .select("id, email, full_name, member_id")
        .in("id", rsvpUserIds)
    : { data: [] as Array<{
        id: string;
        email: string | null;
        full_name: string | null;
        member_id: string | null;
      }> };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rsvpsByEvent = new Map<string, RsvpRow[]>();
  for (const r of rsvpList) {
    const list = rsvpsByEvent.get(r.event_id) ?? [];
    list.push(r);
    rsvpsByEvent.set(r.event_id, list);
  }

  const eventTitle = new Map((events ?? []).map((e) => [e.id, e.title]));
  const csvRows = [
    ["event", "email", "name", "member_id", "status", "rsvp_at"].join(","),
    ...rsvpList.map((r) => {
      const p = profileMap.get(r.user_id);
      return [
        csvEscape(eventTitle.get(r.event_id) ?? r.event_id),
        csvEscape(p?.email),
        csvEscape(p?.full_name),
        csvEscape(p?.member_id),
        r.status,
        r.created_at,
      ].join(",");
    }),
  ].join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvRows)}`;
  const goingCount = rsvpList.filter((r) => r.status === "going").length;

  return (
    <div className="space-y-10">
      <AdminNotice />
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-flo-maroon">Events</h1>
            <p className="mt-1 text-sm text-flo-maroon/60">
              {rsvpList.length} RSVPs total · {goingCount} going
            </p>
          </div>
          {rsvpList.length > 0 ? (
            <a
              href={csvHref}
              download={`flo-circle-rsvps-${new Date().toISOString().slice(0, 10)}.csv`}
              className="inline-flex items-center gap-2 rounded-full bg-flo-maroon px-4 py-2.5 text-sm font-bold text-white"
            >
              <Download className="h-4 w-4" /> Export RSVPs ({rsvpList.length})
            </a>
          ) : null}
        </div>
        <form
          action={upsertEventAction}
          className="mt-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-2"
        >
          <input name="slug" placeholder="slug" required className="h-10 rounded-xl border px-3" />
          <input name="title" placeholder="title" required className="h-10 rounded-xl border px-3" />
          <input name="eventAt" type="datetime-local" required className="h-10 rounded-xl border px-3" />
          <input name="location" placeholder="location" className="h-10 rounded-xl border px-3" />
          <textarea name="descriptionMd" placeholder="description" className="md:col-span-2 rounded-xl border px-3 py-2" rows={3} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublished" /> Published
          </label>
          <button type="submit" className="h-10 rounded-full bg-flo-pink text-sm font-bold text-white">
            Add event
          </button>
        </form>
        <ul className="mt-4 space-y-3">
          {(events ?? []).map((e) => {
            const eventRsvps = rsvpsByEvent.get(e.id) ?? [];
            const going = eventRsvps.filter((r) => r.status === "going").length;
            return (
              <li key={e.id} className="rounded-xl bg-white p-4 text-sm shadow-sm">
                <form action={upsertEventAction} className="grid gap-2 md:grid-cols-2">
                  <input type="hidden" name="id" value={e.id} />
                  <input name="slug" defaultValue={e.slug} required className="h-10 rounded-xl border px-3" />
                  <input name="title" defaultValue={e.title} required className="h-10 rounded-xl border px-3" />
                  <input
                    name="eventAt"
                    type="datetime-local"
                    defaultValue={toLocalInput(e.event_at)}
                    required
                    className="h-10 rounded-xl border px-3"
                  />
                  <input
                    name="location"
                    defaultValue={e.location ?? ""}
                    className="h-10 rounded-xl border px-3"
                  />
                  <textarea
                    name="descriptionMd"
                    defaultValue={e.description_md ?? ""}
                    className="md:col-span-2 rounded-xl border px-3 py-2"
                    rows={2}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="isPublished"
                      defaultChecked={e.is_published}
                    />{" "}
                    Published
                  </label>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button
                      type="submit"
                      className="h-9 rounded-full bg-flo-pink px-4 text-xs font-bold text-white"
                    >
                      Save
                    </button>
                  </div>
                </form>
                <form action={deleteEventAction} className="mt-2">
                  <input type="hidden" name="id" value={e.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`Delete event “${e.title}”?`}
                    className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>

                <div className="mt-3 border-t border-flo-maroon/10 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-flo-maroon/50">
                    RSVPs · {going} going · {eventRsvps.length} total
                    {e.max_rsvp ? ` / ${e.max_rsvp} max` : ""}
                  </p>
                  {eventRsvps.length > 0 ? (
                    <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                      {eventRsvps.map((r) => {
                        const p = profileMap.get(r.user_id);
                        return (
                          <li
                            key={r.id}
                            className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-flo-cream/50 px-2.5 py-1.5 text-xs"
                          >
                            <span className="text-flo-maroon">
                              {p?.full_name ?? p?.member_id ?? r.user_id.slice(0, 8)}
                              {p?.email ? (
                                <span className="text-flo-maroon/55">
                                  {" "}
                                  · {p.email}
                                </span>
                              ) : null}
                            </span>
                            <span className="capitalize text-flo-pink">
                              {r.status}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-flo-maroon/40">No RSVPs yet.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-flo-maroon">Launches</h2>
        <form
          action={upsertLaunchAction}
          className="mt-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-2"
        >
          <input name="slug" placeholder="slug" required className="h-10 rounded-xl border px-3" />
          <input name="title" placeholder="title" required className="h-10 rounded-xl border px-3" />
          <input name="teaser" placeholder="teaser" className="h-10 rounded-xl border px-3 md:col-span-2" />
          <input name="goesLiveAt" type="datetime-local" className="h-10 rounded-xl border px-3" />
          <textarea name="bodyMd" placeholder="body" className="md:col-span-2 rounded-xl border px-3 py-2" rows={3} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublished" /> Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="earlyAccessMembersOnly" defaultChecked /> Members only
          </label>
          <button type="submit" className="h-10 rounded-full bg-flo-maroon text-sm font-bold text-white md:col-span-2">
            Add launch
          </button>
        </form>
        <ul className="mt-4 space-y-3">
          {(launches ?? []).map((l) => (
            <li key={l.id} className="rounded-xl bg-white p-4 text-sm shadow-sm">
              <form action={upsertLaunchAction} className="grid gap-2 md:grid-cols-2">
                <input type="hidden" name="id" value={l.id} />
                <input name="slug" defaultValue={l.slug} required className="h-10 rounded-xl border px-3" />
                <input name="title" defaultValue={l.title} required className="h-10 rounded-xl border px-3" />
                <input
                  name="teaser"
                  defaultValue={l.teaser ?? ""}
                  className="h-10 rounded-xl border px-3 md:col-span-2"
                />
                <input
                  name="goesLiveAt"
                  type="datetime-local"
                  defaultValue={toLocalInput(l.goes_live_at)}
                  className="h-10 rounded-xl border px-3"
                />
                <textarea
                  name="bodyMd"
                  defaultValue={l.body_md ?? ""}
                  className="md:col-span-2 rounded-xl border px-3 py-2"
                  rows={2}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isPublished"
                    defaultChecked={l.is_published}
                  />{" "}
                  Published
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="earlyAccessMembersOnly"
                    defaultChecked={l.early_access_members_only}
                  />{" "}
                  Members only
                </label>
                <button
                  type="submit"
                  className="h-9 rounded-full bg-flo-maroon px-4 text-xs font-bold text-white md:col-span-2 md:justify-self-end"
                >
                  Save
                </button>
              </form>
              <form action={deleteLaunchAction} className="mt-2">
                <input type="hidden" name="id" value={l.id} />
                <ConfirmSubmitButton
                  confirmMessage={`Delete launch “${l.title}”?`}
                  className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
