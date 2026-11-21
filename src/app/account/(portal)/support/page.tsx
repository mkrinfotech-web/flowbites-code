import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SupportTicketForm, SupportTicketList } from "./support-ui";

export default async function SupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = getSupabaseAdmin();

  const { data: tickets } =
    user && admin
      ? await admin
          .from("flo_support_tickets")
          .select("id, category, reason_code, message, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(40)
      : { data: [] };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-flo-maroon">Support</h1>
        <p className="mt-1 text-sm text-flo-maroon/60">
          Soft help for orders, shipping, membership, and returns.{" "}
          <Link href="/track" className="font-semibold text-flo-pink">
            Guest track order
          </Link>
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-flo-maroon/50">
          Your tickets
        </h2>
        <SupportTicketList tickets={tickets ?? []} />
      </section>

      <SupportTicketForm />
    </div>
  );
}
