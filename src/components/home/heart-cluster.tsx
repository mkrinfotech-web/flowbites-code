"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Exact Frame 27 center heart cluster — heart photo + pink glow +
 * brush arcs + outline hearts + trailing curl arrow.
 * Frame size 435×432 from Figma Group 6 bounds.
 *
 * Pass `animate={false}` to render a static cluster (client note: keep
 * the image, remove motion only).
 */
export function HeartCluster({
  className = "",
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  const H = "/images/figma-exact/heart";
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && !reduceMotion;

  return (
    <div
      className={`relative mx-auto aspect-[435/432] w-full max-w-[435px] ${className}`}
      aria-hidden={false}
    >
      {/* Soft pink glow behind heart */}
      <div
        className="pointer-events-none absolute left-1/2 top-[48%] h-[72%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(250,53,88,0.28) 0%, rgba(250,53,88,0.10) 42%, transparent 72%)",
        }}
      />

      {/* Heart photo */}
      {shouldAnimate ? (
        <motion.div
          className="absolute left-[4%] top-[15.3%] h-[81.3%] w-[91.8%] will-change-transform"
          style={{ transformOrigin: "50% 55%" }}
          animate={{
            y: [0, -6, 0],
            scale: [1, 1.018, 1],
          }}
          transition={{
            y: {
              duration: 3.6,
              repeat: Infinity,
              ease: "easeInOut",
            },
            scale: {
              duration: 2.05,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          whileHover={{
            scale: 1.03,
            transition: { type: "spring", stiffness: 300, damping: 24 },
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${H}/heart.png`}
            alt="Heart-shaped FloBites bar with chocolate drizzle"
            className="h-full w-full select-none object-contain"
            draggable={false}
          />
        </motion.div>
      ) : (
        <div className="absolute left-[4%] top-[15.3%] h-[81.3%] w-[91.8%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${H}/heart.png`}
            alt="Heart-shaped FloBites bar with chocolate drizzle"
            className="h-full w-full select-none object-contain"
            draggable={false}
          />
        </div>
      )}

      {/* Left shoulder curl — Figma 1:180 (mirrored) */}
      {shouldAnimate ? (
        <motion.div
          className="pointer-events-none absolute left-0 top-[13%] h-[40.5%] w-[27.1%]"
          animate={{ opacity: [0.88, 1, 0.88] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${H}/curl-left.svg`}
            alt=""
            className="h-full w-full -scale-y-100 rotate-180 select-none"
            draggable={false}
          />
        </motion.div>
      ) : (
        <div className="pointer-events-none absolute left-0 top-[13%] h-[40.5%] w-[27.1%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${H}/curl-left.svg`}
            alt=""
            className="h-full w-full -scale-y-100 rotate-180 select-none"
            draggable={false}
          />
        </div>
      )}

      {/* Right shoulder curl — Figma 1:179 */}
      {shouldAnimate ? (
        <motion.div
          className="pointer-events-none absolute left-[72.9%] top-[11.6%] h-[40.5%] w-[27.1%]"
          animate={{ opacity: [1, 0.86, 1] }}
          transition={{
            duration: 4.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.9,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${H}/curl-right.svg`}
            alt=""
            className="h-full w-full select-none"
            draggable={false}
          />
        </motion.div>
      ) : (
        <div className="pointer-events-none absolute left-[72.9%] top-[11.6%] h-[40.5%] w-[27.1%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${H}/curl-right.svg`}
            alt=""
            className="h-full w-full select-none"
            draggable={false}
          />
        </div>
      )}

      {/* Two outline hearts above cleft */}
      {shouldAnimate ? (
        <>
          <motion.div
            className="pointer-events-none absolute left-[42%] top-[0%] h-[14%] w-[14%] will-change-transform"
            animate={{ opacity: [0.72, 1, 0.72], scale: [1, 1.05, 1] }}
            transition={{ duration: 2.9, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${H}/heart-big.svg`}
              alt=""
              className="h-full w-full -scale-x-100 select-none"
              draggable={false}
            />
          </motion.div>
          <motion.div
            className="pointer-events-none absolute left-[48%] top-[9%] h-[6.5%] w-[6.5%] will-change-transform"
            animate={{ opacity: [0.62, 1, 0.62], scale: [1, 1.07, 1] }}
            transition={{
              duration: 2.9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.55,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${H}/heart-small.svg`}
              alt=""
              className="h-full w-full select-none"
              draggable={false}
            />
          </motion.div>
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute left-[42%] top-[0%] h-[14%] w-[14%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${H}/heart-big.svg`}
              alt=""
              className="h-full w-full -scale-x-100 select-none"
              draggable={false}
            />
          </div>
          <div className="pointer-events-none absolute left-[48%] top-[9%] h-[6.5%] w-[6.5%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${H}/heart-small.svg`}
              alt=""
              className="h-full w-full select-none"
              draggable={false}
            />
          </div>
        </>
      )}

      {/* Small trailing arrow along bottom-right curl — Figma 1:184 + tip */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${H}/arrow.svg`}
        alt=""
        className="pointer-events-none absolute left-[64.7%] top-[69%] h-[24.8%] w-[23.8%] select-none"
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${H}/arrow-tip.svg`}
        alt=""
        className="pointer-events-none absolute left-[84.1%] top-[69%] h-[4.2%] w-[4.2%] select-none"
        draggable={false}
      />
    </div>
  );
}
