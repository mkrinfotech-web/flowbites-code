import type { Metadata } from "next";
import { Figtree, Pacifico, Caveat } from "next/font/google";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/layout/site-header";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { isAdminHostname, siteOrigin } from "@/lib/site";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: "400",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const origin = siteOrigin();

const DEFAULT_OG_IMAGE = "/images/logo.png";

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: "FloBites — Those days just got better",
    template: "%s | FloBites",
  },
  description:
    "Snacks for those days made with seeds, ragi, amla & dark chocolate. Cravings? Mood swings? Meet FloBites.",
  openGraph: {
    title: "FloBites — Those days just got better",
    description: "Those days just got better.",
    type: "website",
    siteName: "FloBites",
    url: origin,
    locale: "en_IN",
    images: [{ url: DEFAULT_OG_IMAGE, alt: "FloBites" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FloBites — Those days just got better",
    description: "Snacks for those days with seeds, ragi, amla & dark chocolate.",
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: "/",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FloBites",
  legalName: "The Hormone Hood",
  url: origin,
  logo: `${origin}${DEFAULT_OG_IMAGE}`,
  brand: {
    "@type": "Brand",
    name: "FloBites",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hdrs = await headers();
  const isAdminHost = isAdminHostname(hdrs.get("host"));
  const adminShell = hdrs.get("x-flobites-admin") === "1";
  const storeChrome = !(isAdminHost || adminShell);

  return (
    <html lang="en">
      <body
        className={`${figtree.variable} ${pacifico.variable} ${caveat.variable} antialiased`}
      >
        {storeChrome ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationJsonLd),
            }}
          />
        ) : null}
        {storeChrome ? <SiteHeader /> : null}
        <main>{children}</main>
        {storeChrome ? <CartDrawer /> : null}
      </body>
    </html>
  );
}
