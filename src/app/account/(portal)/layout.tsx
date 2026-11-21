import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { customerLogoutAction } from "@/app/account/actions";
import {
  Gift,
  Heart,
  LayoutDashboard,
  Package,
  Sparkles,
  Ticket,
  User,
  Calendar,
  Wallet,
  LifeBuoy,
  Truck,
  LogOut,
  Crown,
} from "lucide-react";

const NAV = [
  { href: "/account", label: "Hub", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/membership", label: "Membership", icon: Crown },
  { href: "/account/subscriptions", label: "Auto-delivery", icon: Truck },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/support", label: "Support", icon: LifeBuoy },
  { href: "/account/savings", label: "Savings", icon: Wallet },
  { href: "/account/perks", label: "Perks", icon: Sparkles },
  { href: "/account/gifts", label: "Gifts", icon: Gift },
  { href: "/account/launches", label: "Launches", icon: Ticket },
  { href: "/account/events", label: "Events", icon: Calendar },
];

const MOBILE_PRIMARY = NAV.slice(0, 6);

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account/login");
  }

  return (
    <div className="page-under-header min-h-[100dvh] bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_50%,#fce8e2_100%)] text-flo-ink pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1200px]">
        <aside className="hidden w-56 shrink-0 border-r border-flo-maroon/10 bg-white/50 p-5 backdrop-blur md:block">
          <Link href="/" className="font-script text-2xl text-flo-pink">
            FloBites
          </Link>
          <p className="text-xs font-semibold text-flo-maroon/60">Your account</p>
          <nav className="mt-6 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-flo-maroon transition hover:bg-flo-pink/10"
              >
                <Icon className="h-4 w-4 text-flo-pink" />
                {label}
              </Link>
            ))}
          </nav>
          <form action={customerLogoutAction} className="mt-8">
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-xs font-semibold text-flo-maroon/60 hover:text-flo-pink"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-[72px] z-10 flex gap-2 overflow-x-auto border-b border-flo-maroon/10 bg-white/70 px-3 py-3 backdrop-blur md:hidden">
            {MOBILE_PRIMARY.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-xs font-bold text-flo-maroon shadow-sm"
              >
                {label}
              </Link>
            ))}
            <form action={customerLogoutAction} className="shrink-0">
              <button
                type="submit"
                className="whitespace-nowrap rounded-full bg-flo-maroon/10 px-3.5 py-2 text-xs font-bold text-flo-maroon"
              >
                Sign out
              </button>
            </form>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
