"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { assets } from "@/lib/assets";
import type { StoryVideoClip } from "@/lib/video-types";

type Slot = -2 | -1 | 0 | 1 | 2;

/**
 * Figma Frame 1:130 — fixed pixel sizes (not CSS scale).
 * x = card center offset from stage center on a 1440 artboard.
 */
const DESKTOP_SLOT: Record<
  Slot,
  {
    x: number;
    width: number;
    height: number;
    blur: number;
    opacity: number;
    z: number;
  }
> = {
  [-2]: { x: -328, width: 158, height: 330, blur: 4, opacity: 0.85, z: 1 },
  [-1]: { x: -181, width: 194, height: 406, blur: 4, opacity: 0.92, z: 3 },
  [0]: { x: 0, width: 261, height: 464, blur: 0, opacity: 1, z: 10 },
  [1]: { x: 183, width: 194, height: 406, blur: 4, opacity: 0.92, z: 3 },
  [2]: { x: 329, width: 158, height: 330, blur: 4, opacity: 0.85, z: 1 },
};

const SPRING = { type: "spring" as const, stiffness: 280, damping: 30 };
const LOCK_MS = 520;

function wrapIndex(i: number, len: number) {
  return ((i % len) + len) % len;
}

function relativeSlot(i: number, index: number, len: number): Slot | null {
  let rel = i - index;
  if (rel > len / 2) rel -= len;
  if (rel < -len / 2) rel += len;
  if (rel < -2 || rel > 2) return null;
  return rel as Slot;
}

export function StoriesSection({
  videos: videosProp,
}: {
  videos?: StoryVideoClip[];
}) {
  const videos =
    videosProp && videosProp.length > 0 ? videosProp : [...assets.testimonials];
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [locked, setLocked] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [inView, setInView] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const centerRef = useRef<HTMLVideoElement>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (locked) return;
      setPlaying(true);
      setIndex((i) => wrapIndex(i + dir, videos.length));
      if (reduceMotion) return;
      setLocked(true);
      if (lockTimer.current) clearTimeout(lockTimer.current);
      lockTimer.current = setTimeout(() => setLocked(false), LOCK_MS);
    },
    [locked, reduceMotion, videos.length],
  );

  useEffect(() => {
    return () => {
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  /* Only the center video ever plays. */
  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    if (!inView) {
      el.pause();
      return;
    }
    el.currentTime = 0;
    if (playing) {
      void el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [index, playing, inView]);

  const transition = reduceMotion ? { duration: 0 } : SPRING;

  const lockAndSet = (next: number) => {
    if (locked || next === index) return;
    setIndex(next);
    setPlaying(true);
    if (!reduceMotion) {
      setLocked(true);
      if (lockTimer.current) clearTimeout(lockTimer.current);
      lockTimer.current = setTimeout(() => setLocked(false), LOCK_MS);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-16 md:py-20"
      style={{ backgroundColor: "#551313" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-20"
        style={{
          backgroundImage: `url(${assets.stories.wavePattern})`,
          backgroundSize: "1024px 1024px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* Pink doodles — Figma placement, locked aspect ratios */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden md:block"
      >
        {/* Heart + motion TL — viewBox 87×178 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assets.stories.overlayHeartMotion}
          alt=""
          width={87}
          height={178}
          className="absolute max-w-none origin-center"
          style={{
            left: "9.79%",
            top: "13.02%",
            width: 58,
            height: 118,
            transform: "rotate(12.43deg)",
          }}
        />
        {/* Face TR — viewBox 210×185 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assets.stories.overlayFace}
          alt=""
          width={210}
          height={185}
          className="absolute max-w-none origin-center"
          style={{
            right: "5.76%",
            top: "6.5%",
            width: 168,
            height: 148,
            transform: "rotate(9.76deg)",
          }}
        />
        {/* Flower A BL — viewBox 73×81 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assets.stories.overlayFlowerA}
          alt=""
          width={73}
          height={81}
          className="absolute max-w-none origin-center"
          style={{
            left: "13.19%",
            bottom: "16.07%",
            width: 52,
            height: 58,
            transform: "rotate(180deg)",
          }}
        />
        {/* Flower B BL — viewBox 34×38 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assets.stories.overlayFlowerB}
          alt=""
          width={34}
          height={38}
          className="absolute max-w-none origin-center"
          style={{
            left: "18.54%",
            bottom: "13.77%",
            width: 34,
            height: 38,
            transform: "rotate(180deg)",
          }}
        />
        {/* Spiral BR — viewBox 56×129 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assets.stories.overlaySpiral}
          alt=""
          width={56}
          height={129}
          className="absolute max-w-none"
          style={{
            right: "10.17%",
            bottom: "10.11%",
            width: 47,
            height: 110,
          }}
        />
      </div>

      <div className="relative z-10 container-flo text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-white md:text-[45px]"
        >
          Real stories, real flo.
        </motion.h2>
        <div className="relative mx-auto mt-2 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assets.stories.underline}
            alt=""
            className="h-[5px] w-[120px] translate-x-8 object-contain md:w-[154px] md:translate-x-12"
          />
        </div>

        <div className="relative mx-auto mt-10 flex max-w-6xl items-center justify-center gap-1 md:mt-12 md:gap-3 lg:gap-5">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={locked}
            className="z-30 flex size-14 shrink-0 items-center justify-center transition hover:opacity-90 active:scale-95 disabled:opacity-50 md:size-[100px]"
            aria-label="Previous story"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assets.stories.arrowCircleRight}
              alt=""
              className="hidden size-full -scale-x-100 object-contain md:block"
            />
            <Image
              src={assets.stories.arrowLeft}
              alt=""
              width={40}
              height={30}
              className="h-7 w-auto object-contain md:hidden"
            />
          </button>

          <div
            className={`relative w-full ${
              isDesktop
                ? "h-[520px] max-w-[920px]"
                : "h-[420px] max-w-[340px] sm:h-[460px]"
            }`}
          >
            {videos.map((item, i) => {
              const slot = relativeSlot(i, index, videos.length);
              if (slot === null) return null;
              if (!isDesktop && Math.abs(slot) > 1) return null;

              const isCenter = slot === 0;

              if (isDesktop) {
                const desk = DESKTOP_SLOT[slot];
                return (
                  <motion.div
                    key={i}
                    className="absolute left-1/2 top-1/2 overflow-hidden rounded-[15px]"
                    initial={false}
                    animate={{
                      x: desk.x - desk.width / 2,
                      y: -desk.height / 2,
                      width: desk.width,
                      height: desk.height,
                      opacity: desk.opacity,
                      zIndex: desk.z,
                      filter: desk.blur
                        ? `blur(${desk.blur}px)`
                        : "blur(0px)",
                    }}
                    transition={transition}
                    style={{
                      border: isCenter
                        ? "2px solid rgba(250,53,88,0.7)"
                        : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: isCenter
                        ? "0 20px 44px rgba(0,0,0,0.3)"
                        : slot < 0
                          ? "-40px 4px 44px rgba(0,0,0,0.45)"
                          : "30px 4px 34px rgba(0,0,0,0.45)",
                    }}
                  >
                    {isCenter ? (
                      <>
                        <video
                          ref={centerRef}
                          src={item.src}
                          poster={item.poster}
                          muted
                          playsInline
                          loop
                          preload="metadata"
                          className="h-full w-full object-cover object-bottom"
                        />
                        <button
                          type="button"
                          onClick={() => setPlaying((p) => !p)}
                          className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#551313]/40 via-transparent to-transparent"
                          aria-label={playing ? "Pause" : "Play"}
                        >
                          {!playing && (
                            <span className="flex size-14 items-center justify-center rounded-full bg-white/95 text-flo-pink shadow-lg">
                              <Play className="ml-0.5 size-6 fill-current" />
                            </span>
                          )}
                          {playing && (
                            <span className="absolute bottom-4 right-4 flex size-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition hover:opacity-100 focus:opacity-100">
                              <Pause className="size-4" />
                            </span>
                          )}
                        </button>
                      </>
                    ) : (
                      // Side cards: static posters only — never play
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.poster}
                        alt=""
                        className="h-full w-full object-cover object-bottom"
                        draggable={false}
                      />
                    )}
                  </motion.div>
                );
              }

              /* Mobile — keep hero + peek pattern */
              const width = isCenter ? 220 : 110;
              const height = isCenter ? 391 : 280;
              return (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 overflow-hidden rounded-[15px] shadow-xl"
                  initial={false}
                  animate={{
                    x: slot * 115 - width / 2,
                    y: -height / 2,
                    scale: isCenter ? 1 : 0.92,
                    opacity: isCenter ? 1 : 0.5,
                    width,
                    height,
                    filter: isCenter ? "blur(0px)" : "blur(3px)",
                    zIndex: isCenter ? 10 : 1,
                  }}
                  transition={transition}
                  style={{
                    border: isCenter
                      ? "2px solid rgba(250,53,88,0.7)"
                      : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {isCenter ? (
                    <>
                      <video
                        ref={centerRef}
                        src={item.src}
                        poster={item.poster}
                        muted
                        playsInline
                        loop
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPlaying((p) => !p)}
                        className="absolute inset-0 flex items-center justify-center"
                        aria-label={playing ? "Pause" : "Play"}
                      >
                        {!playing && (
                          <span className="flex size-12 items-center justify-center rounded-full bg-white/95 text-flo-pink shadow-lg">
                            <Play className="ml-0.5 size-5 fill-current" />
                          </span>
                        )}
                      </button>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.poster}
                      alt=""
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            disabled={locked}
            className="z-30 flex size-14 shrink-0 items-center justify-center transition hover:opacity-90 active:scale-95 disabled:opacity-50 md:size-[100px]"
            aria-label="Next story"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assets.stories.arrowCircleRight}
              alt=""
              className="hidden size-full object-contain md:block"
            />
            <Image
              src={assets.stories.arrowRight}
              alt=""
              width={40}
              height={30}
              className="h-7 w-auto object-contain md:hidden"
            />
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {videos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to story ${i + 1}`}
              disabled={locked}
              onClick={() => lockAndSet(i)}
              className={`h-2 rounded-full transition ${
                i === index ? "w-6 bg-flo-pink" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
