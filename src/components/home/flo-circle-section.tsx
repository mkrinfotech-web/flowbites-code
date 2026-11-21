"use client";

import { motion } from "framer-motion";
import { Gift, Heart, Package, Sparkles, Star, Users } from "lucide-react";
import { FLO_CIRCLE_BENEFITS } from "@/lib/flo-circle";

const ICONS = [Heart, Package, Sparkles, Gift, Star, Users];

export function FloCircleSection() {
  return (
    <section
      id="flo-circle"
      className="relative scroll-mt-[var(--flo-header-offset)] overflow-hidden bg-[linear-gradient(180deg,#fef3f0_0%,#f9dbd0_55%,#fce8e2_100%)] pb-24 pt-16 md:pb-32 md:pt-24"
    >
      <div className="container-flo">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="font-script text-3xl text-flo-pink md:text-4xl">
            Flo Circle
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-flo-maroon md:text-4xl">
            Soft retail membership for your cycle weeks
          </h2>
          <p className="mt-3 text-flo-maroon/70">
            Your cycle week has perks, Up to 20% off on every order.
            Priority packing, gifts, early access, and optional auto-delivery —
            all in one circle.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FLO_CIRCLE_BENEFITS.map((b, i) => {
            const Icon = ICONS[i] ?? Heart;
            return (
              <motion.div
                key={b.key}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="rounded-3xl bg-white/80 p-5 shadow-sm backdrop-blur"
              >
                <div className="mb-3 inline-flex rounded-full bg-flo-pink/10 p-2.5 text-flo-pink">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-flo-maroon">{b.title}</h3>
                <p className="mt-1 text-sm text-flo-maroon/65">{b.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
