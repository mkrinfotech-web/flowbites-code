"use client";

import { assets } from "@/lib/assets";

/** Thin horizontal strip of product showcase videos under Best Sellers */
export function ShowcaseStrip({ videos }: { videos?: string[] }) {
  const clips =
    videos && videos.length > 0 ? videos : ([...assets.showcase] as string[]);

  return (
    <section className="overflow-hidden bg-flo-maroon py-4" aria-label="Product showcase">
      <div className="flex animate-marquee-left gap-3 px-3">
        {[...clips, ...clips].map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative h-28 w-44 shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:h-32 sm:w-52"
          >
            <video
              src={src}
              muted
              playsInline
              loop
              autoPlay
              className="h-full w-full object-cover opacity-90"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
