"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ProductContent } from "@/lib/data";
import { contentHasAccordion } from "@/lib/product-content";
import { cn } from "@/lib/utils";

type SectionId = "description" | "nutrition" | "ingredients" | "contains";

type Props = {
  content: ProductContent;
  /** Compact = cart drawer; default = PDP */
  variant?: "cart" | "pdp";
  className?: string;
};

function AccordionRow({
  id,
  title,
  open,
  onToggle,
  children,
  compact,
}: {
  id: SectionId;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white/70 shadow-sm ring-1 ring-flo-maroon/5">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between gap-3 text-left font-bold text-flo-maroon transition hover:bg-white/80",
          compact ? "px-3.5 py-2.5 text-sm" : "px-4 py-3.5 text-base",
        )}
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-flo-pink transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-trigger`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "border-t border-flo-maroon/5 text-flo-maroon/80",
                compact ? "px-3.5 pb-3 pt-2 text-sm" : "px-4 pb-4 pt-3 text-[15px]",
              )}
            >
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function ProductRichAccordion({
  content,
  variant = "pdp",
  className,
}: Props) {
  const compact = variant === "cart";
  const [openId, setOpenId] = useState<SectionId | null>("description");

  if (!contentHasAccordion(content)) return null;

  function toggle(id: SectionId) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  const pillClass = compact
    ? "rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-flo-maroon"
    : "rounded-full bg-flo-blush px-3 py-1.5 text-[12px] font-medium text-flo-maroon";

  return (
    <div
      className={cn(
        "space-y-2",
        compact
          ? "rounded-2xl bg-flo-blush/70 px-2.5 py-2.5"
          : "rounded-3xl bg-flo-blush/50 p-3 sm:p-4",
        className,
      )}
    >
      {(content.descriptionFormal || content.descriptionPunchy) && (
        <AccordionRow
          id="description"
          title="Product Description"
          open={openId === "description"}
          onToggle={() => toggle("description")}
          compact={compact}
        >
          <div className="space-y-2">
            {content.descriptionFormal ? (
              <p className="leading-relaxed">{content.descriptionFormal}</p>
            ) : null}
            {content.descriptionPunchy ? (
              <p className="leading-relaxed text-flo-maroon/65">
                {content.descriptionPunchy}
              </p>
            ) : null}
          </div>
        </AccordionRow>
      )}

      {(content.nutritionSummary ||
        content.nutritionBullets.length > 0 ||
        content.nutritionDisclaimer) && (
        <AccordionRow
          id="nutrition"
          title="Nutritional Highlights"
          open={openId === "nutrition"}
          onToggle={() => toggle("nutrition")}
          compact={compact}
        >
          <div className="space-y-2.5">
            {content.nutritionSummary ? (
              <p className="font-semibold text-flo-maroon">
                {content.nutritionSummary}
              </p>
            ) : null}
            {content.nutritionBullets.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 leading-relaxed">
                {content.nutritionBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
            {content.nutritionDisclaimer ? (
              <p className="text-xs italic text-flo-maroon/55">
                {content.nutritionDisclaimer}
              </p>
            ) : null}
          </div>
        </AccordionRow>
      )}

      {content.ingredients.length > 0 && (
        <AccordionRow
          id="ingredients"
          title="Ingredients"
          open={openId === "ingredients"}
          onToggle={() => toggle("ingredients")}
          compact={compact}
        >
          <div>
            <p
              className={cn(
                "font-bold uppercase tracking-wider text-flo-maroon/50",
                compact ? "text-[10px]" : "text-xs",
              )}
            >
              Thoughtfully Made With
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {content.ingredients.map((ing) => (
                <li key={ing} className={pillClass}>
                  {ing}
                </li>
              ))}
            </ul>
          </div>
        </AccordionRow>
      )}

      {(content.footerContains.length > 0 || content.footerNote) && (
        <AccordionRow
          id="contains"
          title="Contains"
          open={openId === "contains"}
          onToggle={() => toggle("contains")}
          compact={compact}
        >
          <div className="space-y-2">
            {content.footerContains.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4 leading-relaxed">
                {content.footerContains.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
            {content.footerNote ? (
              <p className="text-xs leading-relaxed text-flo-maroon/55">
                {content.footerNote}
              </p>
            ) : null}
          </div>
        </AccordionRow>
      )}
    </div>
  );
}
