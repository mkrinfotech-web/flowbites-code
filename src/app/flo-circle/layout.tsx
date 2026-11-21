import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flo Circle — Membership care for those days",
  description:
    "Join Flo Circle for member perks, early drops, and support for those days from FloBites — The Hormone Hood.",
  alternates: {
    canonical: "/flo-circle",
  },
  openGraph: {
    title: "Flo Circle | FloBites",
    description:
      "Membership care for those days — perks, early access, and community.",
    type: "website",
    url: "/flo-circle",
  },
};

export default function FloCircleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
