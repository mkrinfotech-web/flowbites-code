"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Product, ProductEdition } from "@/lib/data";
import { EDITION_TABS, productsForEdition } from "@/lib/product-catalog";
import { useCartStore } from "@/lib/cart-store";
import { PRODUCT_DISPLAY_IMAGES } from "@/lib/product-display";
import { WishlistButton } from "@/components/product/wishlist-button";
import { formatInr } from "@/lib/utils";

const B = "/images/figma-exact/bestsellers";

/** Frame 34 artboard — Best Sellers (1440×820: cards + shadow + modest pad) */
const DESIGN_W = 1440;
const DESIGN_H = 820;

const IMAGES = PRODUCT_DISPLAY_IMAGES;

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
      className="relative w-full overflow-x-clip overflow-y-visible"
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

function PickYourFloCopy({ size }: { size: "desktop" | "mobile" }) {
  const compact = size === "mobile";
  return (
    <div
      className={`flex flex-col items-center text-center ${
        compact ? "mt-5" : "mt-[30px]"
      }`}
    >
      <p
        className={`font-bold leading-none tracking-[-0.02em] text-flo-brown ${
          compact ? "text-[20px]" : "text-[32px]"
        }`}
      >
        PICK YOUR FLO
      </p>
    </div>
  );
}

function DoodleUnderline({ className }: { className?: string }) {
  return (
    <Image
      src={`${B}/doodle-underline.svg`}
      alt=""
      width={120}
      height={8}
      className={className}
      unoptimized
    />
  );
}

/** Pink FLO / FLO+ / EXTRA FLO / SUPER FLO / SECRET FLO — never THE. */
function ProductTitle({ name }: { name: string }) {
  const trimmed = name.trim();
  const match = trimmed.match(
    /^(THE\s+)((?:EXTRA|SUPER|SECRET)\s+)?(FLO\+?)(\s+EDITION.*)?$/i,
  );
  if (match) {
    const the = match[1];
    const distinctive = `${match[2] ?? ""}${match[3]}`;
    const rest = match[4] ?? "";
    return (
      <h3 className="text-[22px] font-bold leading-none tracking-[-0.02em]">
        <span className="text-black">{the}</span>
        <span className="text-[#fa3558]">{distinctive}</span>
        {rest ? <span className="text-black">{rest}</span> : null}
      </h3>
    );
  }
  return (
    <h3 className="text-[22px] font-bold leading-none tracking-[-0.02em] text-black">
      {trimmed}
    </h3>
  );
}

function CornerRibbon({ label }: { label: "Best seller" | "Try this" }) {
  const isBest = label === "Best seller";
  return (
    <div
      className="pointer-events-none absolute right-0 top-0 z-30 h-[88px] w-[88px] overflow-hidden rounded-tr-[20px]"
      aria-hidden
    >
      <span
        className={`absolute right-[-34px] top-[18px] block w-[118px] rotate-45 py-[6px] text-center text-[10px] font-bold uppercase tracking-wide text-white shadow-sm ${
          isBest ? "bg-flo-brown" : "bg-[#fa3558]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function EditionTabs({
  value,
  onChange,
  size = "desktop",
  panelId,
}: {
  value: ProductEdition;
  onChange: (id: ProductEdition) => void;
  size?: "desktop" | "mobile";
  panelId: string;
}) {
  const compact = size === "mobile";
  return (
    <div
      role="tablist"
      aria-label="Product editions"
      className={`flex items-center justify-center ${compact ? "gap-2" : "gap-3"}`}
    >
      {EDITION_TABS.map((tab) => {
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${panelId}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={panelId}
            onClick={() => onChange(tab.id)}
            className={`rounded-full font-bold tracking-wide transition ${
              compact
                ? "px-3.5 py-1.5 text-[11px]"
                : "px-5 py-2 text-[13px]"
            } ${
              selected
                ? "bg-flo-brown text-white shadow-sm"
                : "border border-flo-brown/35 bg-white text-flo-brown hover:border-flo-brown"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function ProductCard({
  product,
  index,
  className,
}: {
  product: Product;
  index: number;
  className?: string;
}) {
  const addProduct = useCartStore((s) => s.addProduct);
  const img = IMAGES[product.slug] ?? product.imagePath;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className={`relative flex w-[322px] flex-col items-center overflow-hidden rounded-[20px] bg-white pb-[26px] shadow-[4px_10px_37px_rgba(0,0,0,0.15)] ${className ?? ""}`}
    >
      {product.cornerRibbon ? (
        <CornerRibbon label={product.cornerRibbon} />
      ) : null}

      <div className="relative h-[220px] w-full overflow-hidden rounded-t-[20px] border-b border-[#d8d8d8] bg-white">
        <span className="absolute left-[14px] top-[14px] z-20 max-w-[62%] truncate rounded-[40px] border border-[rgba(85,19,19,0.25)] bg-flo-soft px-[8px] py-[4px] text-[10px] font-medium leading-none text-flo-brown">
          {product.badge}
        </span>

        <WishlistButton
          product={product}
          size="sm"
          className="absolute bottom-3 right-3 z-30 shadow-md"
        />

        <div
          className="absolute bottom-0 left-1/2 h-[122px] w-[274px] -translate-x-1/2 rounded-t-[20px]"
          style={{ backgroundColor: product.shelfColor }}
        />

        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-x-[18px] bottom-[8px] top-[42px] z-10"
          aria-label={`View ${product.name}`}
        >
          <span className="relative block h-full w-full">
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-contain object-bottom drop-shadow-sm"
              sizes="274px"
              priority={index === 0}
            />
          </span>
        </Link>
      </div>

      <div className="mt-[22px] flex w-[274px] flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[12px] font-bold leading-none text-[#252525]">
            {product.packLabel}
          </p>
          <Link href={`/product/${product.slug}`} className="hover:opacity-90">
            <ProductTitle name={product.name} />
          </Link>
          <div className="mt-0.5 text-[13px] leading-[1.35] text-black">
            <p className="mb-0 font-bold">{product.tagline}</p>
            <p className="line-clamp-3 font-normal">{product.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[22px] font-bold leading-none text-[#fa3558]">
            {formatInr(product.priceInr)}
          </p>
          <button
            type="button"
            onClick={() => addProduct(product)}
            className="flex shrink-0 items-center gap-[5px] rounded-[16px] bg-flo-brown px-3.5 py-2 text-[12px] font-medium text-white transition hover:brightness-110 active:scale-95"
          >
            <Image
              src={`${B}/cart.svg`}
              alt=""
              width={12}
              height={12}
              unoptimized
            />
            Add to Cart
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/** Handwritten Frame 34 callouts — two-tone + squiggle underlines */
function DesktopDoodles() {
  return (
    <>
      <div
        className="pointer-events-none absolute z-20 text-center font-[family-name:var(--font-caveat)] text-[20px] font-bold leading-[1.15]"
        style={{
          left: 96,
          top: 64,
          width: 200,
          transform: "rotate(-8deg)",
        }}
      >
        <p className="text-[#fa3558]">
          You crave <span className="text-[#551313]">chocolate</span> during
          <br />
          <span className="relative inline-block">
            those days?
            <DoodleUnderline className="absolute -bottom-[2px] left-1/2 h-auto w-[70px] -translate-x-1/2" />
          </span>
        </p>
      </div>

      <div
        className="pointer-events-none absolute z-20 text-center font-[family-name:var(--font-caveat)] text-[20px] font-bold leading-[1.15]"
        style={{
          left: 292,
          top: 162,
          width: 190,
          transform: "rotate(8deg)",
        }}
      >
        <p className="text-[#551313]">
          You want better{" "}
          <span className="relative inline-block text-[#fa3558]">
            those days snacking?
            <DoodleUnderline className="absolute -bottom-[2px] left-0 h-auto w-[112px]" />
          </span>
        </p>
      </div>

      <div
        className="pointer-events-none absolute z-20 text-center font-[family-name:var(--font-caveat)] text-[20px] font-bold leading-[1.15]"
        style={{
          left: 1040,
          top: 58,
          width: 250,
          transform: "rotate(-6deg)",
        }}
      >
        <p className="text-[#551313]">
          You don&apos;t want another boring{" "}
          <span className="relative inline-block text-[#fa3558]">
            snack?
            <DoodleUnderline className="absolute -bottom-[2px] left-1/2 h-auto w-[50px] -translate-x-1/2" />
          </span>
        </p>
      </div>

      <div
        className="pointer-events-none absolute z-20 text-center font-[family-name:var(--font-caveat)] text-[20px] font-bold leading-[1.15]"
        style={{
          left: 1100,
          top: 158,
          width: 210,
          transform: "rotate(7deg)",
        }}
      >
        <p className="text-[#fa3558]">
          Your <span className="text-[#551313]">energy</span> dips during{" "}
          <span className="relative inline-block">
            those days?
            <DoodleUnderline className="absolute -bottom-[2px] left-1/2 h-auto w-[90px] -translate-x-1/2" />
          </span>
        </p>
      </div>
    </>
  );
}

function DesktopBestSellers({
  products,
  tab,
  onTabChange,
}: {
  products: Product[];
  tab: ProductEdition;
  onTabChange: (id: ProductEdition) => void;
}) {
  return (
    <FigmaStage>
      <DesktopDoodles />

      <div
        className="absolute flex flex-col items-center"
        style={{ left: 0, right: 0, top: 88 }}
      >
        <h2 className="relative text-center text-[45px] font-bold leading-[1.05] text-black">
          <span className="block">Loved by thousands of</span>
          <span className="relative inline-block">
            women across India.
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${B}/underline.svg`}
              alt=""
              width={420}
              height={6}
              className="pointer-events-none absolute left-1/2 top-full mt-[2px] h-[6px] w-[420px] max-w-none -translate-x-1/2"
            />
          </span>
        </h2>
        <PickYourFloCopy size="desktop" />
        <div className="mt-[30px]">
          <EditionTabs
            value={tab}
            onChange={onTabChange}
            panelId="bestsellers-desktop"
          />
        </div>
      </div>

      <div
        id="bestsellers-desktop"
        role="tabpanel"
        aria-labelledby={`bestsellers-desktop-tab-${tab}`}
        className="absolute flex items-start justify-center gap-4"
        style={{ left: 0, right: 0, top: 340 }}
      >
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </FigmaStage>
  );
}

function MobileBestSellers({
  products,
  tab,
  onTabChange,
}: {
  products: Product[];
  tab: ProductEdition;
  onTabChange: (id: ProductEdition) => void;
}) {
  return (
    <div className="mx-auto flex max-w-[420px] flex-col items-center gap-8 px-4 py-12">
      <div className="relative flex flex-col items-center gap-[10px] text-center">
        <h2 className="relative max-w-[340px] text-[28px] font-bold leading-tight text-black">
          Loved by thousands of women across India.
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${B}/underline.svg`}
            alt=""
            width={280}
            height={5}
            className="pointer-events-none absolute left-1/2 top-full mt-1 h-[5px] w-[280px] max-w-none -translate-x-1/2"
          />
        </h2>
        <PickYourFloCopy size="mobile" />
      </div>

      <EditionTabs
        value={tab}
        onChange={onTabChange}
        size="mobile"
        panelId="bestsellers-mobile"
      />

      <div
        id="bestsellers-mobile"
        role="tabpanel"
        aria-labelledby={`bestsellers-mobile-tab-${tab}`}
        className="flex w-full flex-col items-center gap-5"
      >
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            className="w-full max-w-[325px]"
          />
        ))}
      </div>
    </div>
  );
}

export function BestSellers({ products }: { products: Product[] }) {
  const [tab, setTab] = useState<ProductEdition>("flo");
  const visible = productsForEdition(products, tab);

  return (
    <section
      id="bestsellers"
      className="relative scroll-mt-[var(--flo-header-offset)] overflow-x-clip"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.4)), linear-gradient(#f9dbd0, #f9dbd0)",
      }}
    >
      <div className="mx-auto hidden w-full max-w-[1440px] md:block">
        <DesktopBestSellers
          products={visible}
          tab={tab}
          onTabChange={setTab}
        />
      </div>
      <div className="md:hidden">
        <MobileBestSellers
          products={visible}
          tab={tab}
          onTabChange={setTab}
        />
      </div>
    </section>
  );
}
