import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/home/site-footer";

export default function NotFound() {
  return (
    <>
      <div className="page-under-header flex min-h-[70dvh] flex-col items-center justify-center bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_55%,#fce8e2_100%)] px-4 py-16 text-center">
        <Image
          src="/images/logo.png"
          alt="FloBites"
          width={140}
          height={42}
          className="h-10 w-auto"
          priority
        />
        <p className="mt-8 font-script text-3xl text-flo-pink md:text-4xl">
          Soft miss
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-flo-maroon md:text-4xl">
          This page took those days off
        </h1>
        <p className="mt-3 max-w-md text-flo-maroon/70">
          We couldn&apos;t find what you&apos;re looking for. Head home or shop
          FloBites — your cycle&apos;s soft retail snack is waiting.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-flo-brown px-7 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
          >
            Back home
          </Link>
          <Link
            href="/#bestsellers"
            className="inline-flex h-12 items-center justify-center rounded-full border border-flo-maroon/25 bg-white px-7 text-sm font-bold text-flo-maroon transition hover:border-flo-brown hover:text-flo-brown"
          >
            Shop FloBites
          </Link>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
