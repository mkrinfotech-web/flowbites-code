"use client";

import { useEffect, useState } from "react";
import { Heart, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "flo-love-popup-dismissed";
const DELAY_MS = 5000;

export function LoveSavingsPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // sessionStorage unavailable — still show once this visit
    }

    const timer = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  function goToLove() {
    dismiss();
    window.setTimeout(() => {
      document.getElementById("love")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label="Dismiss"
            className="absolute inset-0 bg-flo-maroon/35 backdrop-blur-[2px]"
            onClick={dismiss}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="love-savings-title"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-flo-soft via-white to-flo-blush shadow-[0_20px_60px_rgba(85,19,19,0.28)]"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-flo-pink/15" />
            <div className="pointer-events-none absolute -bottom-8 -left-4 size-24 rounded-full bg-flo-cream/80" />

            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/80 text-flo-maroon/60 shadow-sm transition hover:bg-white hover:text-flo-maroon"
            >
              <X className="size-4" />
            </button>

            <div className="relative px-6 pb-6 pt-8 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-flo-pink/15">
                <Heart className="size-7 fill-flo-pink text-flo-pink" />
              </div>

              <h2
                id="love-savings-title"
                className="text-2xl font-bold leading-tight text-flo-maroon"
              >
                Love unlocks savings.
              </h2>
              <div className="mx-auto mt-2 h-[3px] w-24 rounded-full bg-flo-pink" />
              <p className="mt-3 text-sm leading-relaxed text-flo-maroon/70">
                Type a loved one&apos;s name and unlock your personal discount —
                soft savings for your cycle week.
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={goToLove}
                  className="rounded-full bg-flo-pink px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
                >
                  Unlock my Love Score →
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-full px-5 py-2 text-sm font-medium text-flo-maroon/55 transition hover:text-flo-maroon"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
