"use client";

import { useEffect, useState, useTransition } from "react";

type EventRow = {
  id: string;
  title: string;
  description_md: string;
  event_at: string;
  location: string | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/flo-circle/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]));
  }, []);

  function rsvp(eventId: string) {
    setMsg(null);
    startTransition(async () => {
      const res = await fetch("/api/flo-circle/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status: "going" }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMsg(d.error ?? "RSVP failed");
        return;
      }
      setMsg(`RSVP saved · ${d.status}`);
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-flo-maroon">Member events</h1>
      <ul className="mt-6 space-y-3">
        {events.map((e) => (
          <li key={e.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-bold text-flo-maroon">{e.title}</p>
            <p className="text-sm text-flo-maroon/65">{e.description_md}</p>
            <p className="mt-2 text-xs text-flo-maroon/50">
              {new Date(e.event_at).toLocaleString("en-IN")} · {e.location}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => rsvp(e.id)}
              className="mt-3 rounded-full bg-flo-pink px-4 py-2 text-xs font-bold text-white"
            >
              RSVP
            </button>
          </li>
        ))}
        {!events.length && (
          <li className="text-sm text-flo-maroon/50">No upcoming events.</li>
        )}
      </ul>
      {msg && <p className="mt-3 text-sm text-flo-pink">{msg}</p>}
    </div>
  );
}
