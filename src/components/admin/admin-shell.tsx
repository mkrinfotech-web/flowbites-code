"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FileText,
  Tag,
  LogOut,
  Heart,
  Clapperboard,
  Users,
  ImageIcon,
  HelpCircle,
  MessageSquareQuote,
  PanelsTopLeft,
  Newspaper,
  Undo2,
  LifeBuoy,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/returns", label: "Returns", icon: Undo2 },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/posts", label: "Posts", icon: Newspaper },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/banners", label: "Banners", icon: PanelsTopLeft },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/videos", label: "Videos", icon: Clapperboard },
  { href: "/admin/discounts", label: "Discounts", icon: Tag },
  { href: "/admin/flo-circle", label: "Flo Circle", icon: Heart },
  { href: "/admin/staff", label: "Staff", icon: Users, adminOnly: true },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode;
  email?: string | null;
  role?: string | null;
}) {
  const pathname = usePathname() || "/admin";
  const isAdmin = role === "admin";
  const nav = NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_45%,#fce8e2_100%)] text-flo-ink">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-60 shrink-0 border-r border-flo-maroon/10 bg-white/50 p-5 backdrop-blur md:block">
          <div className="mb-8">
            <p className="font-script text-2xl text-flo-pink">FloBites</p>
            <p className="text-xs font-semibold tracking-wide text-flo-maroon/70">
              Admin
            </p>
          </div>
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-flo-pink/15 text-flo-maroon"
                      : "text-flo-maroon hover:bg-flo-pink/10"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${active ? "text-flo-pink" : "text-flo-pink/80"}`}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-10 border-t border-flo-maroon/10 pt-4">
            <p className="truncate text-xs text-flo-maroon/60">{email}</p>
            <p className="text-[10px] uppercase tracking-wider text-flo-pink">
              {role}
            </p>
            <form action={logoutAction} className="mt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-flo-maroon/70 hover:text-flo-pink"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-flo-maroon/10 bg-white/40 px-4 py-3 backdrop-blur md:px-8">
            <div className="flex gap-2 overflow-x-auto md:hidden">
              {nav.map(({ href, label, exact }) => {
                const active = isActive(pathname, href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
                      active
                        ? "bg-flo-pink text-white"
                        : "bg-white/80 text-flo-maroon"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
            <p className="hidden text-sm font-medium text-flo-maroon/70 md:block">
              Soft retail ops · The Hormone Hood
            </p>
            <form action={logoutAction} className="md:hidden">
              <button type="submit" className="text-xs font-semibold text-flo-pink">
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
