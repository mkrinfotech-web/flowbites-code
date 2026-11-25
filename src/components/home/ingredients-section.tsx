"use client";

import { useCallback, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { INGREDIENT_GROUPS } from "@/lib/data";
import { SCIENCE_BEHIND_FLO_ARTICLE_URL } from "@/lib/site";
import { HeartCluster } from "@/components/home/heart-cluster";

const SCIENCE_CTA_SRC = "/images/figma-exact/ingredients/link-img.svg";

const LEFT_IDS = ["super-seeds", "ragi"] as const;
const RIGHT_IDS = ["iron-duo", "crafted"] as const;
const BOTTOM_ID = "Inositol" as const;

function groupById(id: string) {
  return INGREDIENT_GROUPS.find((g) => g.id === id)!;
}

const scienceCtaClassName =
  "group inline-block cursor-pointer transition-transform duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa3558]";

/**
 * Figma-exact "Science Behind Flo" composite PNG as a clickable CTA.
 * Prefer the external science article; fall back to the on-page hub until URL is set.
 */
function ScienceBehindFloCta({ className = "" }: { className?: string }) {
  const articleUrl = SCIENCE_BEHIND_FLO_ARTICLE_URL.trim();

  const scrollToScience = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      document.getElementById("ingredients-hub")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [],
  );

  if (articleUrl) {
    return (
      <a
        href={articleUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Science Behind Flo — open article"
        className={`${scienceCtaClassName} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SCIENCE_CTA_SRC}
          alt=""
          className="pointer-events-none h-auto w-full select-none transition-opacity duration-200 group-hover:opacity-90 group-active:opacity-80"
          draggable={false}
        />
      </a>
    );
  }

  return (
    <a
      href="#ingredients-hub"
      aria-label="Science Behind Flo"
      onClick={scrollToScience}
      className={`${scienceCtaClassName} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SCIENCE_CTA_SRC}
        alt=""
        className="pointer-events-none h-auto w-full select-none transition-opacity duration-200 group-hover:opacity-90 group-active:opacity-80"
        draggable={false}
      />
    </a>
  );
}

function IngredientCopy({
  id,
  align = "left",
  className = "",
}: {
  id: string;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const group = groupById(id);
  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";

  return (
    <article className={`${alignClass} ${className}`}>
      <p className="text-[20px] font-bold leading-tight tracking-[-0.01em] text-[#fa3558] md:text-[22px]">
        {group.title}
      </p>
      <p className="mt-1.5 text-[12px] font-semibold leading-snug text-[#551313]/70 md:text-[13px]">
        {group.subtitle}
      </p>
      <p className="mt-2 text-[13px] font-normal leading-[1.55] text-[#252525] md:text-[14px]">
        {group.blurb}
      </p>
    </article>
  );
}

/**
 * Soft-retail ingredients hub — heart chocolate is the visual centerpiece;
 * four client-grouped copy blocks flank it (no white card stack).
 * Heart motion is off (`animate={false}`).
 */
export function IngredientsSection() {
  return (
    <section
      id="ingredients"
      className="relative scroll-mt-28 overflow-x-clip bg-[#fff0ed] py-14 md:py-20"
    >
      <div className="container-flo relative z-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-bold leading-tight text-black md:text-[42px] md:leading-[1.15]"
          >
            &ldquo;Those days happen.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="relative mt-1 inline-block pb-4 md:pb-5"
          >
            <p className="text-3xl font-bold leading-tight text-[#fa3558] md:text-[42px] md:leading-[1.15]">
              So we made snacking simpler.&rdquo;
            </p>
            {/* Gap below “in.” so brush stroke doesn’t overlap glyphs */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/figma-exact/hero/underline-bottom.svg"
              alt=""
              className="pointer-events-none absolute bottom-0 left-[4%] right-[4%] h-[14px] w-[92%] object-fill md:h-[18px]"
            />
          </motion.div>

          {/* Science Behind Flo — under headline so face doodle never crops into hub copy */}
          <div className="mt-6 w-[42vw] max-w-[150px] min-w-[110px]">
            <ScienceBehindFloCta />
          </div>
        </div>

        <div id="ingredients-hub" className="scroll-mt-28">
          {/* ── Desktop: heart hub + flanking groups ── */}
          <div className="relative mx-auto mt-10 hidden max-w-6xl lg:block lg:mt-14">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(280px,400px)_minmax(0,1fr)] items-center gap-x-8 gap-y-10 xl:gap-x-12">
              {/* Left column */}
              <div className="flex flex-col justify-center gap-12 self-stretch py-4">
                {LEFT_IDS.map((id, i) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  >
                    <IngredientCopy id={id} align="right" />
                  </motion.div>
                ))}
              </div>

              {/* Center heart — hero of the section */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="relative z-10 mx-auto w-full max-w-[400px]"
              >
                <HeartCluster animate={false} />
              </motion.div>

              {/* Right column */}
              <div className="flex flex-col justify-center gap-12 self-stretch py-4">
                {RIGHT_IDS.map((id, i) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  >
                    <IngredientCopy id={id} align="left" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom center — 5th ingredient below the heart image */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: 0.16, duration: 0.4 }}
              className="mx-auto mt-6 max-w-md"
            >
              <IngredientCopy id={BOTTOM_ID} align="center" />
            </motion.div>
          </div>

          {/* ── Mobile / tablet: heart first, then copy ── */}
          <div className="mx-auto mt-10 max-w-lg lg:hidden">
            <div className="relative mx-auto w-[min(88%,360px)]">
              <HeartCluster animate={false} />
            </div>

            <div className="mt-10 space-y-8">
              {INGREDIENT_GROUPS.map((group, i) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                >
                  <IngredientCopy id={group.id} align="left" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
