"use client";

import Image from "next/image";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { assets } from "@/lib/assets";

const ROWS = [
  {
    flo: "A smarter way to answer cycle-week cravings",
    regular: "Made to fill your stomach",
  },
  {
    flo: "Thoughtfully crafted for those days",
    regular: "Just another snack bar",
  },
  {
    flo: "Seeds • Ragi • Amla • Dark Chocolate • Myo Incitol — thoughtfully picked",
    regular: "Generic ingredients",
  },
  {
    flo: "Finally, something made for her",
    regular: "Made for everyone",
  },
];

function Squiggle() {
  return (
    <svg
      viewBox="0 0 600 8"
      className="h-2 w-full text-flo-maroon/25"
      preserveAspectRatio="none"
    >
      <path
        d="M0 4 Q50 0 100 4 T200 4 T300 4 T400 4 T500 4 T600 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ComparisonSection() {
  return (
    <section
      id="why"
      className="relative scroll-mt-[var(--flo-header-offset)] overflow-hidden bg-flo-cream py-16 md:py-20"
    >
      <Image
        src={assets.faceLeft}
        alt=""
        width={140}
        height={150}
        className="pointer-events-none absolute bottom-16 left-2 hidden opacity-80 lg:block xl:left-10"
      />
      <Image
        src={assets.faceCompare}
        alt=""
        width={130}
        height={200}
        className="pointer-events-none absolute bottom-10 right-2 hidden opacity-80 lg:block xl:right-8"
      />
      <Image
        src={assets.spark}
        alt=""
        width={36}
        height={36}
        className="pointer-events-none absolute right-[18%] top-24 hidden lg:block"
      />

      <div className="container-flo relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-bold leading-tight text-flo-ink md:text-[45px]">
            Periods already ask you to adjust enough.{" "}
            <span className="text-flo-pink">Your snack shouldn&apos;t.</span>
          </h2>
          <div className="mx-auto mt-3 h-[3px] w-48 rounded-full bg-flo-pink md:w-80" />
          <p className="mt-4 text-base font-medium md:text-lg">
            Regular bars didn&apos;t think about your Flo. We did.
          </p>
        </motion.div>

        <div className="relative mx-auto mt-12 max-w-3xl rounded-3xl bg-white/80 px-4 py-6 shadow-[0_10px_40px_rgba(85,19,19,0.08)] md:px-10 md:py-8">
          <div className="grid grid-cols-2 gap-4 pb-4">
            <div className="flex items-center justify-end gap-2 pr-4 text-right font-bold text-flo-maroon/45 md:pr-8">
              <Heart
                className="size-5 shrink-0 fill-flo-maroon/25 text-flo-maroon/35"
                aria-hidden
              />
              Regular Snack Bars
            </div>
            <div className="flex items-center gap-2 pl-4 font-bold text-flo-pink md:pl-8">
              <Heart
                className="size-5 shrink-0 fill-flo-pink text-flo-pink"
                aria-hidden
              />
              Flo Bites
            </div>
          </div>

          {ROWS.map((row, i) => (
            <div key={`${row.regular}-${i}`}>
              {i > 0 && <Squiggle />}
              <div className="grid grid-cols-2 gap-4 py-4">
                <p className="pr-3 text-right text-sm text-flo-maroon/50 md:text-base">
                  {row.regular}
                </p>
                <p className="pl-3 text-sm font-medium text-flo-ink md:text-base">
                  {row.flo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
