import { redirect } from "next/navigation";

/** Alias for guest tracking */
export default function OrdersTrackRedirect() {
  redirect("/track");
}
