"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Gift, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { computeLoveScore, makeDiscountCode } from "@/lib/love-score";
import { useCartStore } from "@/lib/cart-store";
import { getOrCreateSessionId } from "@/lib/utils";
import { assets } from "@/lib/assets";

const EXAMPLES = ["Mom", "Dad", "Sister", "Partner", "Bestie"];
const DEBOUNCE_MS = 500;

/** Blur focused fields so iOS keyboard zoom resets before the cart opens. */
function resetIosZoom() {
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
  window.scrollBy(0, 0);
}

export function LoveScoreSection() {
  const [name, setName] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const setDiscount = useCartStore((s) => s.setDiscount);
  const openCart = useCartStore((s) => s.openCart);
  const lastComputedName = useRef("");

  const calculate = useCallback(
    (lovedName: string) => {
      const trimmed = lovedName.trim();
      if (trimmed.length < 2) {
        setScore(null);
        lastComputedName.current = "";
        return null;
      }
      if (trimmed === lastComputedName.current) {
        return null;
      }

      const percent = computeLoveScore(trimmed);
      const code = makeDiscountCode(trimmed, percent);
      setScore(percent);
      setDiscount({
        code,
        percentOff: percent,
        lovedName: trimmed,
        kind: "love_score",
      });
      lastComputedName.current = trimmed;

      startTransition(async () => {
        try {
          await fetch("/api/love-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: trimmed,
              sessionId: getOrCreateSessionId(),
            }),
          });
        } catch {
          // local discount still works
        }
      });

      return percent;
    },
    [setDiscount],
  );

  // Auto-calc when the user stops typing
  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setScore(null);
      lastComputedName.current = "";
      return;
    }
    const timer = window.setTimeout(() => {
      calculate(trimmed);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [name, calculate]);

  function applyAndOpenCart() {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    calculate(trimmed);
    resetIosZoom();
    // Let iOS finish collapsing visual viewport before drawer mounts
    window.setTimeout(() => openCart(), 80);
  }

  return (
    <section
      id="love"
      className="relative z-[1] -mt-14 scroll-mt-[var(--flo-header-offset)] overflow-hidden bg-flo-maroon md:-mt-16"
    >
      {/* Wavy top edge — blush matches Flo Circle’s end so valleys don’t show page cream */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 overflow-hidden bg-flo-blush">
        <svg
          viewBox="0 0 1440 80"
          className="absolute bottom-0 h-full w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
            fill="#551313"
          />
        </svg>
      </div>

      <div className="container-flo relative grid items-end gap-10 pb-16 pt-24 md:pb-20 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <h2 className="text-4xl font-bold text-white md:text-[45px]">
            Love unlocks savings.
          </h2>
          <div className="mt-2 h-[3px] w-48 rounded-full bg-flo-pink" />
          <p className="mt-4 max-w-md text-lg font-medium text-flo-soft/90 md:text-2xl">
            Type your favorite loved one&apos;s name and unlock your discount.
          </p>

          <div className="relative mt-8 flex items-end gap-3">
            <div className="relative h-[260px] w-[280px] sm:h-[300px] sm:w-[320px] md:h-[340px] md:w-[360px]">
              <Image
                src={assets.loveWoman}
                alt="Love unlocks savings illustration"
                fill
                className="object-contain object-left-bottom mix-blend-screen"
                sizes="360px"
              />
            </div>
            <span className="mb-16 hidden font-script text-7xl text-flo-pink md:block">
              %
            </span>
            <Heart className="absolute right-8 top-4 size-12 fill-flo-pink text-flo-pink md:right-20" />
            <Heart className="absolute right-0 top-20 size-8 fill-flo-pink/70 text-flo-pink/70" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[28px] bg-white p-6 shadow-2xl md:p-8"
        >
          <label
            htmlFor="love-score-name"
            className="text-sm font-semibold text-flo-maroon"
          >
            Type Their Name
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="love-score-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  calculate(name);
                }
              }}
              placeholder="Enter their name..."
              autoComplete="off"
              enterKeyHint="done"
              className="h-11 min-w-0 flex-1 rounded-xl border border-flo-maroon/15 bg-flo-soft px-4 text-base outline-none transition focus:border-flo-pink"
            />
            <button
              type="button"
              disabled={pending || name.trim().length < 2}
              onClick={() => calculate(name)}
              className="shrink-0 rounded-full bg-flo-brown px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              Calculate
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-flo-maroon/50">Example:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setName(ex);
                  calculate(ex);
                }}
                className="rounded-full bg-flo-cream px-2.5 py-1 font-medium text-flo-maroon transition hover:bg-flo-pink hover:text-white"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="relative mt-6 overflow-hidden rounded-2xl bg-flo-pink px-6 py-8 text-center text-white">
            <p className="text-left text-sm font-semibold">Your Love Score</p>
            <p className="mt-2 text-5xl font-bold md:text-6xl">
              {score === null ? "--- %" : `${score} %`}
            </p>
            <p className="mt-2 text-sm">Off on your total purchase</p>
            <Heart className="absolute right-4 top-4 size-8 fill-white/25 text-white/25" />
            <Heart className="absolute bottom-4 left-6 size-5 fill-white/20 text-white/20" />
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-flo-soft px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-flo-pink/15 text-flo-pink">
                <Gift className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Special Bonus</p>
                <p className="text-sm text-flo-maroon/70">6 Months Subscription</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-flo-maroon/60">At Just</p>
              <p className="text-2xl font-bold text-flo-pink">₹1</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-flo-maroon/10 pt-4">
            <p className="text-sm font-medium text-flo-maroon/70">
              The more you love, the more you save!
            </p>
            <button
              type="button"
              disabled={pending || name.trim().length < 2}
              onClick={applyAndOpenCart}
              className="rounded-full bg-flo-brown px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              Claim My Discount →
            </button>
          </div>
          <p className="mt-3 text-center text-xs leading-relaxed text-flo-maroon/55 md:text-left">
            Your discount will be automatically applied to your cart at
            checkout.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold tracking-wide text-flo-maroon/50">
            <span className="rounded-full bg-flo-cream px-2 py-1">
              • MADE FOR THOSE DAYS
            </span>
            <span className="rounded-full bg-flo-cream px-2 py-1">
              • SAFE. CLEAN. EFFECTIVE
            </span>
            <span className="rounded-full bg-flo-cream px-2 py-1">
              • YOU FIRST ALWAYS
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
