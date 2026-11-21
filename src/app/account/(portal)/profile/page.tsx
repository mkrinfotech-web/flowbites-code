"use client";

import { useEffect, useState, useTransition } from "react";
import { updateProfileAction } from "@/app/account/actions";

type Profile = {
  member_id?: string;
  full_name?: string;
  phone?: string;
  email?: string;
};

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/flo-circle/me")
      .then(async (r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then((d) => {
        setProfile(d.profile);
        setAddress(d.address ?? d.defaultAddress ?? null);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-flo-maroon/50">Loading profile…</p>
      </div>
    );
  }

  if (loadError && !profile) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-flo-maroon/70">
          Couldn’t load profile. Refresh and try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-flo-maroon">Profile & address</h1>
      <p className="mt-1 font-mono text-sm text-flo-pink">
        {profile?.member_id ?? "—"}
      </p>
      <form
        className="mt-6 max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-sm"
        action={(fd) => {
          startTransition(async () => {
            const res = await updateProfileAction(fd);
            setMsg(res.error ?? "Saved");
          });
        }}
      >
        <label className="block text-sm font-medium text-flo-maroon">
          Full name
          <input
            name="fullName"
            defaultValue={profile?.full_name ?? ""}
            required
            autoComplete="name"
            className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
          />
        </label>
        <label className="block text-sm font-medium text-flo-maroon">
          Phone
          <input
            name="phone"
            type="tel"
            defaultValue={profile?.phone ?? ""}
            autoComplete="tel"
            className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
          />
        </label>
        <p className="text-sm text-flo-maroon/50">{profile?.email}</p>

        <div className="border-t border-flo-maroon/10 pt-4">
          <p className="text-sm font-bold text-flo-maroon">Default address</p>
          <label className="mt-3 block text-sm font-medium text-flo-maroon">
            Address line 1
            <input
              name="addressLine1"
              defaultValue={address?.line1 ?? ""}
              autoComplete="address-line1"
              className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
            />
          </label>
          <label className="mt-3 block text-sm font-medium text-flo-maroon">
            Address line 2
            <input
              name="addressLine2"
              defaultValue={address?.line2 ?? ""}
              autoComplete="address-line2"
              className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-flo-maroon">
              City
              <input
                name="city"
                defaultValue={address?.city ?? ""}
                autoComplete="address-level2"
                className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
              />
            </label>
            <label className="block text-sm font-medium text-flo-maroon">
              State
              <input
                name="state"
                defaultValue={address?.state ?? ""}
                autoComplete="address-level1"
                className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
              />
            </label>
          </div>
          <label className="mt-3 block text-sm font-medium text-flo-maroon">
            Pincode
            <input
              name="pincode"
              defaultValue={address?.pincode ?? ""}
              inputMode="numeric"
              pattern="\d{6}"
              autoComplete="postal-code"
              className="mt-1 h-12 w-full rounded-xl border border-flo-maroon/15 bg-flo-soft px-3 text-base"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-full bg-flo-brown text-sm font-bold text-white disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {msg && <p className="text-sm text-flo-pink">{msg}</p>}
      </form>
    </div>
  );
}
