"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useCartStore } from "@/lib/cart-store";
import { PRODUCTS } from "@/lib/data";

const H = "/images/figma-exact/hero";

/** Exact Figma Frame 13 / 1:41 artboard */
const DESIGN_W = 1440;
const DESIGN_H = 675;

/**
 * Scales a fixed 1440×675 Figma stage to the container width.
 * Keeps every absolute px coordinate pixel-faithful.
 */
function FigmaStage({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    setScale(el.clientWidth / DESIGN_W);
  }, []);

  useEffect(() => {
    measure();
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden"
      style={{ height: DESIGN_H * scale }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Pixel-faithful hero matched to Figma Frame 13 / 1:41 (1440×675).
 *
 * Copy: “Your period week just got better.” + original body.
 * Product side: Group 3 composite (bars + baked-in doodles).
 */
export function HeroSection() {
  const addProduct = useCartStore((s) => s.addProduct);

  return (
    <section className="overflow-hidden bg-[#f9dbd0] pt-[104px] sm:pt-[112px] md:pt-[120px] lg:pt-[128px]">
      {/* Desktop — exact Frame 13 stage */}
      <div className="mx-auto hidden w-full max-w-[1440px] md:block">
        <FigmaStage>
          {/* Copy — node 1:42 x160 y112 w561 h468 */}
          <div
            className="absolute"
            style={{ left: 85, top: 112, width: 561, height: 468 }}
          >
            {/* Hearts — right of “Some Days Just” */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${H}/heart1.svg`}
              alt=""
              width={59}
              height={60}
              className="pointer-events-none absolute object-contain"
              style={{ left: 680, top: -12, width: 59, height: 60 }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${H}/heart2.svg`}
              alt=""
              width={25}
              height={25}
              className="pointer-events-none absolute object-contain"
              style={{ left: 663, top: 47, width: 25, height: 25 }}
            />

            <h1
              className="absolute m-0 text-black"
              style={{
                left: 0,
                top: 3,
                width: 559,
                fontSize: 85,
                lineHeight: "96px",
                letterSpacing: "-0.03em",
              }}
            >
              <span
                className="block whitespace-nowrap font-[family-name:var(--font-figtree)]"
                style={{ fontWeight: 700 }}
              >
                Your period week
              </span>
              <span
                className="block whitespace-nowrap font-script"
                style={{
                  color: "#e1304f",
                  letterSpacing: 0,
                  fontSize: "0.72em",
                  lineHeight: "1.2em",
                }}
              >
                nutrition just got better.
              </span>
            </h1>

            {/* Script underline — under “Need a little love” */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${H}/underline-top.svg`}
              alt=""
              width={247}
              height={6}
              className="pointer-events-none absolute object-contain object-left"
              style={{ left: 4, top: 165, width: 460, height: 6 }}
            />

          <div
          className="absolute text-[#252525]  font-medium"
          style={{
            left: 0,
            top: 235,
            width: 780,
          }}
        >
          
        <ul
          className="
            grid
            grid-cols-2
            list-disc
            gap-x-7
            gap-y-1
            pl-6
            font-medium
            tracking-[-0.48px]
            text-[#252525]
            marker:text-[#fa3558]
          "
          style={{
            fontSize: 24,
            lineHeight: 1.25,
          }}
        >
          <li>Seed Cycling with Dark Chocolate</li>
          <li>Source of Protein</li>
          <li>Iron</li>
          <li>Dietary Fiber</li>
          <li>Magnesium</li>
          <li>Zinc</li>
        </ul>


          <p
            className="mt-3 font-medium"
            style={{
              fontSize: 24,
              lineHeight: 1.3,
            }}
          >
            A perfect snack..
          </p>
        </div>

            {/* CTAs — node 1:49 */}
            <div
              className="absolute bottom-0 left-0 flex items-center"
              style={{ height: 50, gap: 20 }}
            >
              <button
                type="button"
                onClick={() => addProduct(PRODUCTS[0])}
                className="flex h-full items-center justify-center rounded-[30px] border-[3px] border-solid border-[#fa3558] bg-transparent font-semibold text-[#252525] transition hover:bg-[#fa3558]/10 active:scale-95"
                style={{ paddingLeft: 25, paddingRight: 25, fontSize: 20 }}
              >
                Buy Now
              </button>
              <a
                href="#bestsellers"
                className="flex h-full items-center justify-center rounded-[30px] bg-[#fa3558] font-bold text-white transition hover:brightness-110 active:scale-95"
                style={{ paddingLeft: 25, paddingRight: 25, fontSize: 20 }}
              >
                Explore Flo
              </a>
            </div>
          </div>

          {/* Flower doodle — node 1:52, left of Buy Now */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${H}/flower.svg`}
            alt=""
            width={46}
            height={50}
            className="pointer-events-none absolute z-10 object-contain"
            style={{
              left: 35,
              top: 530,
              width: 42,
              height: 48,
              transform: "rotate(7.65deg)",
            }}
          />

          {/*
            Group 3 — Figma product composite (bars + sparks + curly + heart + wave).
            Aspect 978×1010. Placed to match Frame 13 right column.
          */}
          <div
            className="absolute z-[15]"
            style={{ left: 790, top: 48, width: 560, height: 578 }}
          >
            <Image
              src={`${H}/group-3.png`}
              alt="FloBites Dark Chocolate and Classic bars"
              fill
              priority
              className="object-contain object-center"
              sizes="560px"
            />
          </div>
        </FigmaStage>
      </div>

      {/* Mobile — locked 3-line wrap (Figma), doodles glued to script */}
      <div className="flex flex-col gap-8 px-5 pb-10 md:hidden">
        <div className="relative">
          <h1 className="m-0 text-[clamp(2.15rem,9.2vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.03em] text-black">
            <span className="block">
              <span className="relative inline-block whitespace-nowrap pr-9">
                Your period week
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${H}/heart1.svg`}
                  alt=""
                  className="pointer-events-none absolute -right-1 -top-2 h-8 w-8 object-contain"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${H}/heart2.svg`}
                  alt=""
                  className="pointer-events-none absolute right-4 top-5 h-[18px] w-[18px] object-contain"
                />
              </span>
            </span>
            <span className="relative inline-block font-script font-normal text-[#e1304f]">
              nutrition just got better.
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${H}/underline-top.svg`}
                alt=""
                width={160}
                height={6}
                className="pointer-events-none absolute bottom-[0.06em] left-0 h-[6px] w-full object-fill object-left"
              />
            </span>
          </h1>
          <p className="mt-5 text-[15px] font-medium leading-snug text-[#252525] sm:text-base">
            Seed Cycling with Dark Chocolate • Source of Protein • Iron
            Dietary Fiber • Magnesiumand • Zinc and more...  <br /> A perfect snack..
          </p>
          <div className="relative mt-6 flex flex-wrap items-center gap-3 pl-11">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${H}/flower.svg`}
              alt=""
              className="pointer-events-none absolute left-0 top-1 h-10 w-10 object-contain"
              style={{ transform: "rotate(7.65deg)" }}
            />
            <button
              type="button"
              onClick={() => addProduct(PRODUCTS[0])}
              className="flex h-12 items-center rounded-full border-2 border-[#fa3558] px-5 text-base font-semibold text-[#252525]"
            >
              Buy Now
            </button>
            <a
              href="#bestsellers"
              className="flex h-12 items-center rounded-full bg-[#fa3558] px-5 text-base font-bold text-white"
            >
              Explore Flo
            </a>
          </div>
        </div>
        <div className="relative mx-auto aspect-[978/1010] w-full max-w-[340px]">
          <Image
            src={`${H}/group-3.png`}
            alt="FloBites bars"
            fill
            priority
            className="object-contain"
          />
        </div>
      </div>
    </section>
  );
}
