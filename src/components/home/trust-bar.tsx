"use client";

/**
 * Scrolling marquee trust / stats strip.
 * Faster default speed + drag/scrub so users can swipe through quickly.
 * tones:
 *  - maroon + yellowAlt: brand brown bar with alternating cream / yellow text
 *  - whiteBrown: alternating white & brown chips (tight, no trailing gap)
 *  - pink: legacy solid pink bar
 */
import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

/** px per second — ~2.5× the old 28s CSS loop for typical content width */
const SPEED_PX_PER_SEC = 95;

/** Modest horizontal padding around each • separator */
const BULLET_PAD = "mx-3 md:mx-4";

function ScrubbableTrack({
  children,
  className = "",
  /** rtl = content moves left (default); ltr = content moves right */
  direction = "rtl",
}: {
  children: ReactNode;
  className?: string;
  direction?: "ltr" | "rtl";
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);
  const rafRef = useRef(0);
  const lastTs = useRef(0);
  const directionRef = useRef(direction);
  directionRef.current = direction;

  const applyTransform = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // Two (or more) identical halves → wrap at exactly 50% of track width
    const half = el.scrollWidth / 2;
    if (half <= 0) return;
    let o = offsetRef.current % half;
    if (o < 0) o += half;
    offsetRef.current = o;
    el.style.transform = `translate3d(${-o}px, 0, 0)`;
  }, []);

  useEffect(() => {
    lastTs.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs.current) / 1000);
      lastTs.current = now;
      if (!pausedRef.current && !draggingRef.current) {
        const delta = SPEED_PX_PER_SEC * dt;
        // rtl: increase offset → translate -x (content left)
        // ltr: decrease offset → translate +x (content right)
        offsetRef.current +=
          directionRef.current === "ltr" ? -delta : delta;
        applyTransform();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [applyTransform]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    pausedRef.current = true;
    dragStartX.current = e.clientX;
    dragStartOffset.current = offsetRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartX.current;
    offsetRef.current = dragStartOffset.current - dx;
    applyTransform();
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    pausedRef.current = false;
    lastTs.current = performance.now();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
  };

  return (
    <div
      className="cursor-grab touch-pan-x active:cursor-grabbing select-none"
      style={{ touchAction: "pan-x" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={(e) => {
        if (draggingRef.current) endDrag(e);
      }}
    >
      <div
        ref={trackRef}
        className={`flex w-max will-change-transform ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

function splitItems(text: string): string[] {
  return text
    .split("•")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** One continuous strip: item • item • … (trailing bullet so copies seam cleanly) */
function MarqueeUnit({
  items,
  yellowAlt,
  colorOffset = 0,
  className = "",
}: {
  items: string[];
  yellowAlt?: boolean;
  colorOffset?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center whitespace-nowrap ${className}`}
      aria-hidden={colorOffset > 0 ? true : undefined}
    >
      {items.map((item, i) => {
        const idx = colorOffset + i;
        const color = yellowAlt
          ? idx % 2 === 0
            ? "text-flo-soft"
            : "text-flo-yellow"
          : "text-flo-soft";
        return (
          <span key={`${item}-${i}`} className="inline-flex shrink-0 items-center">
            <span
              className={`text-sm font-bold capitalize leading-snug md:text-[22px] lg:text-[25px] ${color}`}
            >
              {item}
            </span>
            <span
              className={`${BULLET_PAD} text-sm font-bold opacity-70 md:text-[22px] lg:text-[25px] ${color}`}
              aria-hidden
            >
              •
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function TrustBar({
  tone,
  children,
  scroll = true,
  yellowAlt = false,
}: {
  tone: "maroon" | "pink" | "whiteBrown";
  children: string;
  scroll?: boolean;
  /** Alternate cream ↔ yellow text on each phrase */
  yellowAlt?: boolean;
}) {
  const text = children.replace(/\s+/g, " ").trim();
  const items = splitItems(text);

  if (tone === "whiteBrown") {
    // Duplicate chip sequence twice for a seamless -50% wrap (no flex-grow gap)
    const chipCopies = 2;
    const loop = Array.from({ length: chipCopies }, () => items).flat();
    // Ensure enough chips to fill wide viewports: repeat the pair again if short
    const chips =
      loop.length < 8
        ? [...loop, ...loop]
        : loop;

    return (
      <div className="w-full overflow-hidden bg-flo-cream py-2.5" role="presentation">
        {scroll ? (
          <ScrubbableTrack direction="ltr">
            {/* Two identical halves, zero gap between them */}
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center">
                {chips.map((chunk, i) => {
                  const brown = i % 2 === 0;
                  return (
                    <p
                      key={`${half}-${i}`}
                      className={`mx-1.5 shrink-0 rounded-full px-5 py-2 text-sm font-bold capitalize leading-snug whitespace-nowrap md:text-[18px] lg:text-[20px] ${brown
                          ? "bg-flo-brown text-flo-soft"
                          : "bg-white text-flo-brown shadow-sm"
                        }`}
                    >
                      {chunk}
                    </p>
                  );
                })}
              </div>
            ))}
          </ScrubbableTrack>
        ) : (
          <p className="px-4 text-center text-sm font-bold capitalize text-flo-brown md:text-[18px]">
            {text}
          </p>
        )}
      </div>
    );
  }

  // Even number of identical units back-to-back (zero gap). Each unit ends
  // with a • so seams read as a normal item separator. Wrap uses scrollWidth/2.
  // 4 units keep wide desktops filled without a brown empty trail.
  const stripCount = 4;

  return (
    <div
      className={`w-full overflow-hidden py-3.5 md:py-4 ${tone === "maroon" ? "bg-flo-maroon" : "bg-flo-pink"
        }`}
      role="presentation"
    >
      {scroll ? (
        <ScrubbableTrack>
          {Array.from({ length: stripCount }, (_, half) => (
            <MarqueeUnit
              key={half}
              items={items}
              yellowAlt={yellowAlt}
              colorOffset={half * items.length}
            />
          ))}
        </ScrubbableTrack>
      ) : (
        <p className="px-4 text-center text-sm font-bold capitalize leading-snug text-flo-soft md:text-[22px] lg:text-[25px]">
          {text}
        </p>
      )}
    </div>
  );
}
