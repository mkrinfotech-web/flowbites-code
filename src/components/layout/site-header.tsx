"use client";

/**
 * Capsule header — floating white pill, tight to the top.
 */
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingCart, User, X } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/#bestsellers", label: "Best Sellers" },
  { href: "/flo-circle", label: "Flo Circle" },
  { href: "/#ingredients", label: "What's Inside" },
  { href: "/blog", label: "Blog" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled) setLoggedIn(Boolean(user));
      } catch {
        if (!cancelled) setLoggedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const count = mounted ? itemCount : 0;
  const accountHref = loggedIn ? "/account" : "/account/login";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-none mx-auto w-full max-w-[1440px] px-4 pt-2 sm:px-6 sm:pt-2.5 md:px-10 md:pt-3">
        <div className="pointer-events-auto mx-auto flex min-h-[64px] w-full max-w-[1180px] items-center gap-2 rounded-full bg-white px-3 py-2.5 shadow-[0_10px_40px_rgba(85,19,19,0.14)] sm:min-h-[68px] sm:gap-3 sm:px-4 sm:py-3 md:min-h-[76px] md:gap-4 md:px-5 md:py-3.5 lg:gap-5 lg:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center transition active:scale-95"
          >
            <Image
              src="/images/logo.png"
              alt="FloBites"
              width={120}
              height={36}
              className="h-7 w-auto sm:h-8 md:h-9"
              priority
            />
          </Link>

          <Link
            href="/#love"
            className="hidden shrink-0 items-center justify-center rounded-full bg-flo-brown px-3.5 py-2.5 text-[11px] font-bold whitespace-nowrap text-white transition hover:brightness-110 active:scale-95 sm:inline-flex md:px-4 md:text-[12px] lg:text-[13px]"
          >
            Love Score
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 text-[12px] font-semibold text-[#252525] md:flex lg:gap-6 lg:text-[14px]">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 transition hover:text-[#fa3558]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:ml-0">
            <Link
              href={accountHref}
              className="relative flex size-10 items-center justify-center rounded-full text-[#252525] transition hover:bg-flo-brown/10 active:scale-95 sm:size-11"
              aria-label={loggedIn ? "Your account" : "Sign in"}
              title={loggedIn ? "Account" : "Sign in"}
            >
              <User className="size-5" strokeWidth={1.75} />
            </Link>

            <Link
              href="/#bestsellers"
              className="hidden items-center justify-center rounded-full bg-pink-500 px-3.5 py-2.5 text-[11px] font-bold whitespace-nowrap text-white transition hover:brightness-110 active:scale-95 sm:inline-flex sm:px-4 sm:text-[12px] md:text-[13px]"
            >
              Shop FloBites
            </Link>

            <button
              type="button"
              onClick={openCart}
              className="relative flex size-10 items-center justify-center rounded-full text-[#252525] transition hover:bg-flo-brown/10 active:scale-95 sm:size-11"
              aria-label="Open cart"
            >
              <ShoppingCart className="size-5" strokeWidth={1.75} />
              {count > 0 && (
                <span className="absolute right-0 top-0 flex size-5 items-center justify-center rounded-full bg-flo-brown text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>

            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full text-[#252525] transition hover:bg-flo-brown/10 active:scale-95 md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <X className="size-5" strokeWidth={1.75} />
              ) : (
                <Menu className="size-5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="pointer-events-auto mx-auto mt-2 w-full max-w-[1180px] rounded-3xl bg-white p-4 shadow-[0_10px_40px_rgba(85,19,19,0.14)] md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl px-3 py-3 text-sm font-semibold text-[#252525] hover:bg-flo-brown/10"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={accountHref}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl px-3 py-3 text-sm font-bold text-flo-brown hover:bg-flo-brown/10"
              >
                {loggedIn ? "Account" : "Sign in"}
              </Link>
              <Link
                href="/#bestsellers"
                onClick={() => setMenuOpen(false)}
                className="mt-1 inline-flex h-11 items-center justify-center rounded-full bg-pink-500 text-sm font-bold text-white"
              >
                Shop FloBites
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
