"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { FAQS, type Faq } from "@/lib/data";
import { cn } from "@/lib/utils";

/** Figma Frame 1:341 — exact doodle exports */
const F = "/images/figma-exact/faq";

export function FaqSection({ faqs = FAQS }: { faqs?: Faq[] }) {
  const items = faqs.length > 0 ? faqs : FAQS;
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <section
      id="faq"
      className="relative scroll-mt-[var(--flo-header-offset)] overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.4)), linear-gradient(#f9dbd0, #f9dbd0)",
      }}
    >
      {/* Side faces — Figma 1:357 / 1:358 */}
      <Image
        src={`${F}/face-left.svg`}
        alt=""
        width={137}
        height={210}
        className="pointer-events-none absolute left-[clamp(0px,7.6vw,110px)] top-[270px] hidden -scale-y-100 rotate-180 opacity-90 lg:block"
        unoptimized
      />
      <Image
        src={`${F}/face-right.svg`}
        alt=""
        width={326}
        height={287}
        className="pointer-events-none absolute bottom-0 right-0 hidden opacity-90 lg:block"
        unoptimized
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col items-center gap-10 px-4 py-16 sm:px-8 md:px-[160px] md:py-[100px]">
        {/* Header block — Figma 1:342 */}
        <div className="relative flex w-full flex-col items-center gap-5 text-center">
          <div className="relative inline-block max-w-full">
            <h2 className="text-[28px] font-bold leading-none text-black sm:text-[36px] md:text-[45px] md:leading-normal">
              <span className="relative inline-block">
                FloBites
                {/* Brush underline under FloBites — Figma 1:346 */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-[calc(100%-1px)] block h-[6px] w-[110%] max-w-[201px] -translate-x-1/2 md:top-[53px] md:h-[6px] md:w-[201px]"
                >
                  <Image
                    src={`${F}/underline.svg`}
                    alt=""
                    fill
                    className="object-fill"
                    unoptimized
                  />
                </span>
              </span>{" "}
              questions, answered.
            </h2>

            {/* Heart outline — Figma 1:344 (≈57px past text end, top -2) */}
            <Image
              src={`${F}/heart.svg`}
              alt=""
              width={44}
              height={45}
              className="pointer-events-none absolute left-[calc(100%+40px)] top-[-2px] hidden h-[36px] w-[35px] sm:block md:left-[calc(100%+57px)] md:h-[45px] md:w-[44px]"
              unoptimized
            />
            {/* Sparks — Figma 1:345 (≈98px past text end, top -25, right of heart) */}
            <Image
              src={`${F}/sparks.svg`}
              alt=""
              width={36}
              height={36}
              className="pointer-events-none absolute left-[calc(100%+72px)] top-[-28px] hidden h-[28px] w-[28px] sm:block md:left-[calc(100%+98px)] md:top-[-25px] md:h-[36px] md:w-[36px]"
              unoptimized
            />
          </div>

          <p className="max-w-[920px] text-base font-medium leading-normal tracking-[-0.02em] text-[#252525] md:whitespace-nowrap md:text-[24px] md:tracking-[-0.48px]">
            Everything you need to know about ingredients, shipping, Flo
            Circle, and gifting.
          </p>
        </div>

        {/* Accordion — Figma 1:348 */}
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
          {items.map((faq) => {
            const open = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={cn(
                  "overflow-hidden rounded-2xl shadow-sm transition-colors",
                  open
                    ? "bg-[#fa3558]/12 ring-2 ring-[#fa3558]/35"
                    : "bg-white",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-4 px-6 py-[18px] text-left transition",
                    open ? "hover:bg-[#fa3558]/5" : "hover:bg-black/[0.02]",
                  )}
                  onClick={() => setOpenId(open ? null : faq.id)}
                  aria-expanded={open}
                >
                  <span
                    className={cn(
                      "text-base font-semibold leading-7 md:text-[20px]",
                      open ? "text-[#fa3558]" : "text-[#252525]",
                    )}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 transition-transform",
                      open ? "rotate-180 text-[#fa3558]" : "text-[#252525]",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="border-t border-[#fa3558]/15 px-6 pb-5 pt-2 text-sm leading-relaxed text-[#252525]/85 md:text-base">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
