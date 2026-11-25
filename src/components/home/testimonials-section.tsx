"use client";

import Image from "next/image";
import { TESTIMONIALS, type Testimonial } from "@/lib/data";
import { assets } from "@/lib/assets";

const T = assets.periodStories;

function Row({
  items,
  direction,
  offsetClass = "",
}: {
  items: Testimonial[];
  direction: "left" | "right";
  offsetClass?: string;
}) {
  const loop = [...items, ...items];
  return (
    <div className={`overflow-hidden ${offsetClass}`}>
      <div
        className={`flex w-max gap-5 md:gap-6 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
          }`}
      >
        {loop.map((t, i) => (
          <article
            key={`${t.id}-${i}`}
            className="w-[248px] shrink-0 rounded-[14px] bg-white px-5 py-[18px] sm:w-[268px] sm:px-6 sm:py-5"
          >
            <p className="text-[13px] leading-[1.45] text-flo-ink sm:text-sm">
              &ldquo;{t.quote}&rdquo;
            </p>
            <p className="mt-2.5 text-[13px] font-bold leading-snug text-flo-pink sm:mt-3 sm:text-sm">
              {t.authorName}, {t.city}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection({
  testimonials = TESTIMONIALS,
}: {
  testimonials?: Testimonial[];
}) {
  const items = testimonials.length > 0 ? testimonials : TESTIMONIALS;
  const mid = Math.ceil(items.length / 2);
  const row1 = items.slice(0, mid);
  const row2 = items.slice(mid);

  return (
    <section
      id="period-stories"
      className="relative scroll-mt-24 overflow-hidden bg-flo-pink py-12 md:py-[56px]"
      aria-labelledby="period-stories-heading"
    >
      <div className="container-flo relative z-10 mb-8 md:mb-10">
        <div className="relative mx-auto max-w-[980px] px-12 sm:px-16 md:px-20">
          {/* White heart + 3 motion lines — top-left (Frame 30) */}
          <div
            className="pointer-events-none absolute left-0 top-0 hidden h-[72px] w-[64px] sm:block md:left-1 lg:left-4"
            aria-hidden
          >
            <Image
              src={T.motionWhite}
              alt=""
              width={34}
              height={34}
              className="absolute left-[2px] top-0 h-[28px] w-[28px] rotate-[-12deg] object-contain"
              unoptimized
            />
            <Image
              src={T.heartWhite}
              alt=""
              width={48}
              height={48}
              className="absolute bottom-0 left-[14px] h-10 w-10 object-contain md:h-11 md:w-11"
              unoptimized
            />
          </div>

          {/* Yellow motion lines — near “Flo.” (Frame 30) */}
          <Image
            src={T.motionYellow}
            alt=""
            width={36}
            height={36}
            className="pointer-events-none absolute right-2 top-0 hidden h-7 w-7 object-contain sm:block md:right-4 md:h-8 md:w-8 lg:right-8"
            unoptimized
            aria-hidden
          />

          <h2
            id="period-stories-heading"
            className="text-balance text-center text-[28px] font-bold leading-[1.2] tracking-tight text-white sm:text-[34px] md:whitespace-nowrap md:text-[40px] lg:text-[44px]"
          >
            Thousands Of{" "}
            <span className="relative inline-block pb-1 text-[#FFD54A]">
              Period Days
              <Image
                src={T.underline}
                alt=""
                width={120}
                height={8}
                className="pointer-events-none absolute bottom-0 left-1/2 h-[9px] w-[105%] max-w-none -translate-x-1/2"
                unoptimized
              />
            </span>{" "}
            Stories. One Flo.
          </h2>
        </div>
      </div>

      <div className="space-y-5 md:space-y-6">
        <Row items={row1.length ? row1 : items} direction="left" />
        {row2.length > 0 ? (
          <Row
            items={row2}
            direction="right"
            offsetClass="pl-[72px] sm:pl-[110px] md:pl-[140px]"
          />
        ) : null}
      </div>
    </section>
  );
}
