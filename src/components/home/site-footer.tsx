import Image from "next/image";
import Link from "next/link";
import {
  BUSINESS_ADDRESS,
  CONTACT_EMAIL,
  PRIVACY_POLICY_HREF,
  contactMailtoHref,
} from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-flo-maroon text-flo-soft">
      <div className="container-flo grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr_1.2fr] md:gap-8">
        <div>
          <Image
            src="/images/logo.png"
            alt="FloBites"
            width={120}
            height={36}
            className="h-10 w-auto brightness-0 invert"
          />
          <p className="mt-3 text-sm text-flo-soft/80">
            Your cycle&apos;s new best friend.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold tracking-wider">SHOP</p>
          <ul className="mt-3 space-y-2 text-sm text-flo-soft/80">
            <li>
              <Link href="/#bestsellers" className="transition hover:text-white">
                Shop FloBites
              </Link>
            </li>
            <li>
              <Link href="/flo-circle" className="transition hover:text-white">
                Flo Circle
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="transition hover:text-white">
                Cart / Checkout
              </Link>
            </li>
            <li>
              <Link href="/track" className="transition hover:text-white">
                Track order
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold tracking-wider">LEARN</p>
          <ul className="mt-3 space-y-2 text-sm text-flo-soft/80">
            <li>
              <Link href="/#stories" className="transition hover:text-white">
                How you Feel
              </Link>
            </li>
            <li>
              <Link href="/#bestsellers" className="transition hover:text-white">
                Best Sellers
              </Link>
            </li>
            <li>
              <Link href="/#ingredients" className="transition hover:text-white">
                What&apos;s Inside
              </Link>
            </li>
            <li>
              <Link href="/blog" className="transition hover:text-white">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="transition hover:text-white">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold tracking-wider">ADDRESS & POLICY</p>
          <address className="mt-3 space-y-1 text-sm not-italic text-flo-soft/80">
            {BUSINESS_ADDRESS.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>
              <a
                href={contactMailtoHref()}
                className="transition hover:text-white hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </address>
          <ul className="mt-4 space-y-2 text-sm text-flo-soft/80">
            <li>
              <Link
                href={PRIVACY_POLICY_HREF}
                className="font-semibold underline-offset-2 transition hover:text-white hover:underline"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/shipping" className="transition hover:text-white">
                Shipping
              </Link>
            </li>
            <li>
              <Link href="/refunds" className="transition hover:text-white">
                Refunds
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition hover:text-white">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-flo-soft/15 py-4 text-center text-xs text-flo-soft/60">
        © {new Date().getFullYear()} {BUSINESS_ADDRESS.brandName}. All rights
        reserved
      </div>
      <div className="border-t border-flo-soft/10 py-2.5 text-center text-[11px] text-flo-soft/50">
        <a
          href="https://mkrinfotech.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition hover:text-flo-soft/80"
        >
          Developed by MKRINFOTECH PRIVATE LIMITED
        </a>
      </div>
    </footer>
  );
}
