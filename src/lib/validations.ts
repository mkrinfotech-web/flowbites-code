import { z } from "zod";

export const loveScoreSchema = z.object({
  name: z.string().trim().min(2).max(40),
  sessionId: z.string().min(8).max(80),
});

export const validateDiscountSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/i),
  sessionId: z.string().min(8).max(80),
});

export const createOrderSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  name: z.string().min(2).max(80),
  address: z.object({
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().regex(/^\d{6}$/),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  discountCode: z.string().optional(),
  sessionId: z.string().min(8),
  /** Default true in cart UI; Zod keeps optional for older clients */
  joinFloCircle: z.boolean().optional().default(true),
  floCirclePlanId: z.string().uuid().optional(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const orderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum([
    "pending",
    "paid",
    "verified",
    "processing",
    "shipped",
    "delivered",
    "failed",
    "refunded",
    "cancelled",
  ]),
  adminNotes: z.string().max(2000).optional(),
  trackingNumber: z.string().max(120).optional(),
  /** Safe return path under /admin/orders */
  returnTo: z
    .string()
    .max(200)
    .regex(/^\/admin\/orders(?:\/[0-9a-f-]{36})?(?:\?.*)?$/i)
    .optional(),
});

/** Quick verify / process buttons on admin orders */
export const orderVerifySchema = z.object({
  orderId: z.string().uuid(),
  action: z.enum(["verify", "process", "ship", "deliver", "cancel"]),
  adminNotes: z.string().max(2000).optional(),
  trackingNumber: z.string().max(120).optional(),
  returnTo: z
    .string()
    .max(200)
    .regex(/^\/admin\/orders(?:\/[0-9a-f-]{36})?(?:\?.*)?$/i)
    .optional(),
});

export const resendOrderConfirmationSchema = z.object({
  orderId: z.string().uuid(),
  force: z.boolean().optional().default(true),
  returnTo: z
    .string()
    .max(200)
    .regex(/^\/admin\/orders(?:\/[0-9a-f-]{36})?(?:\?.*)?$/i)
    .optional(),
});

export const productUpdateSchema = z.object({
  id: z.string().uuid(),
  priceInr: z.number().int().positive(),
  stockQty: z.number().int().min(0),
  imagePath: z.string().min(1).max(500),
  isActive: z.boolean(),
  name: z.string().min(1).max(120).optional(),
  sortOrder: z.number().int().optional(),
  edition: z.enum(["flo", "flo_plus"]).optional(),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().max(5000).optional(),
  packLabel: z.string().max(80).optional(),
  descriptionFormal: z.string().max(5000).optional(),
  descriptionPunchy: z.string().max(2000).optional(),
  nutritionSummary: z.string().max(500).optional(),
  nutritionBullets: z.string().max(5000).optional(),
  nutritionDisclaimer: z.string().max(500).optional(),
  ingredientsList: z.string().max(5000).optional(),
  footerContains: z.string().max(2000).optional(),
  footerNote: z.string().max(2000).optional(),
});

export const productCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(120),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().trim().min(1).max(5000),
  packLabel: z.string().trim().min(1).max(80).default("Pack of 6"),
  priceInr: z.number().int().positive(),
  stockQty: z.number().int().min(0).default(0),
  imagePath: z.string().min(1).max(500),
  badge: z.string().max(80).optional().nullable(),
  shelfColor: z.string().max(20).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  edition: z.enum(["flo", "flo_plus"]).default("flo"),
});

export const productDeleteSchema = z.object({
  id: z.string().uuid(),
  mode: z.enum(["soft", "hard"]).default("soft"),
});

export const pageDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const mediaDeleteSchema = z.object({
  bucket: z.enum(["media", "product-images"]),
  path: z.string().min(1).max(500),
});

export const staffInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["staff", "admin"]).default("staff"),
  fullName: z.string().trim().max(80).optional(),
});

export const staffRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["staff", "admin"]),
});

export const staffDeactivateSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});

export const memberStatusUpdateSchema = z.object({
  membershipId: z.string().uuid(),
  status: z.enum(["active", "paused", "cancelled"]),
  notes: z.string().trim().max(1000).optional(),
});

export const memberAdminNotesSchema = z.object({
  membershipId: z.string().uuid(),
  note: z.string().trim().min(1).max(1000),
});

export const adminSubscriptionActionSchema = z.object({
  subscriptionId: z.string().uuid(),
  action: z.enum(["skip", "pause", "resume", "cancel"]),
  cancelReason: z.string().trim().max(200).optional(),
});

export const eventDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const launchDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const pageUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(200),
  type: z.enum([
    "policy",
    "landing",
    "about",
    "contact",
    "ingredient",
    "custom",
  ]),
  bodyMd: z.string().max(100_000),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(500).optional().nullable(),
  isPublished: z.boolean(),
  sortOrder: z.number().int().default(0),
});

export const discountCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/i),
  percentOff: z.number().int().min(1).max(50),
  maxUses: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().datetime().or(z.string().min(8)),
  isActive: z.boolean().default(true),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const customerSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().min(10).max(15).optional(),
});

export const floJoinSchema = z.object({
  planId: z.string().uuid(),
});

export const membershipActionSchema = z.object({
  membershipId: z.string().uuid(),
  action: z.enum(["pause", "resume", "cancel", "change_plan"]),
  planId: z.string().uuid().optional(),
  cancelReason: z.string().max(200).optional(),
});

export const subscribeSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20).default(1),
  cadenceDays: z.number().int().min(14).max(90).default(30),
  addressId: z.string().uuid().optional(),
});

export const subscriptionActionSchema = z.object({
  subscriptionId: z.string().uuid(),
  action: z.enum(["skip", "pause", "resume", "cancel", "swap"]),
  productId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(20).optional(),
  cancelReason: z.string().max(200).optional(),
});

export const rsvpSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(["going", "waitlist", "cancelled"]).default("going"),
});

export const supportTicketSchema = z.object({
  category: z.enum([
    "cancel_membership",
    "cancel_sub",
    "general",
    "shipping",
    "order",
    "return",
  ]),
  reasonCode: z.string().max(80).optional(),
  message: z.string().trim().min(2).max(2000),
});

/** Guest order tracking: email + order number */
export const guestTrackOrderSchema = z.object({
  email: z.string().trim().email().max(200),
  orderNumber: z
    .string()
    .trim()
    .min(4)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/),
});

/** Customer cancel before processing/shipped */
export const cancelOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().trim().min(2).max(400).optional(),
});

export const returnRequestSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.enum([
    "damaged",
    "wrong_item",
    "quality",
    "changed_mind",
    "other",
  ]),
  message: z.string().trim().min(2).max(2000),
});

export const floPlanUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(80),
  description: z.string().max(500).optional().default(""),
  durationDays: z.number().int().positive(),
  /** Allows ₹1 intro plan */
  priceInr: z.number().int().min(1),
  razorpayPlanId: z.string().max(80).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const memberDiscountTimingSchema = z.enum([
  "first_order",
  "second_order",
  "always",
  "never",
]);


export const giftStatusSchema = z.object({
  giftId: z.string().uuid(),
  status: z.enum(["queued", "assigned", "shipped", "delivered", "cancelled"]),
  notes: z.string().max(1000).optional(),
});

export const eventUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2).max(160),
  descriptionMd: z.string().max(20_000).default(""),
  eventAt: z.string().min(8),
  location: z.string().max(200).optional().nullable(),
  isPublished: z.boolean().default(false),
  maxRsvp: z.number().int().positive().optional().nullable(),
});

export const launchUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2).max(160),
  teaser: z.string().max(300).optional().nullable(),
  bodyMd: z.string().max(20_000).default(""),
  goesLiveAt: z.string().optional().nullable(),
  isPublished: z.boolean().default(false),
  earlyAccessMembersOnly: z.boolean().default(true),
});

export const profileUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().min(10).max(15).optional().nullable(),
    addressLine1: z.string().trim().max(120).optional().default(""),
    addressLine2: z.string().trim().max(120).optional().default(""),
    city: z.string().trim().max(80).optional().default(""),
    state: z.string().trim().max(80).optional().default(""),
    pincode: z.string().trim().max(6).optional().default(""),
  })
  .superRefine((data, ctx) => {
    const anyAddress = Boolean(
      data.addressLine1 || data.city || data.state || data.pincode,
    );
    if (!anyAddress) return;
    if (!data.addressLine1 || data.addressLine1.length < 3) {
      ctx.addIssue({
        code: "custom",
        message: "Enter address line 1",
        path: ["addressLine1"],
      });
    }
    if (!data.city || data.city.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Enter city",
        path: ["city"],
      });
    }
    if (!data.state || data.state.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Enter state",
        path: ["state"],
      });
    }
    if (!/^\d{6}$/.test(data.pincode || "")) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a 6-digit pincode",
        path: ["pincode"],
      });
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

/** Absolute URL or site-relative public path (e.g. /videos/foo.mp4). */
const mediaRefSchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine(
    (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
    "Must be a public path or http(s) URL",
  );

export const videoCreateSchema = z.object({
  title: z.string().trim().max(120).default(""),
  url: mediaRefSchema,
  poster: mediaRefSchema.optional().nullable(),
  storagePath: z.string().max(500).optional().nullable(),
  posterStoragePath: z.string().max(500).optional().nullable(),
  placement: z.enum(["stories", "showcase", "both"]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().optional(),
});

export const videoToggleSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});

export const videoReorderSchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export const videoDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const faqUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().trim().min(2).max(300),
  answer: z.string().trim().min(2).max(5000),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const faqDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const testimonialUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  quote: z.string().trim().min(2).max(1000),
  authorName: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(80),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const testimonialDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const bannerPlacementSchema = z.enum([
  "homepage_top",
  "homepage_mid",
  "sitewide",
  "checkout",
]);

export const bannerUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  placement: bannerPlacementSchema,
  headline: z.string().trim().max(200).optional().nullable(),
  body: z.string().trim().max(1000).optional().nullable(),
  ctaLabel: z.string().trim().max(80).optional().nullable(),
  ctaHref: z.string().trim().max(500).optional().nullable(),
  imagePath: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const bannerDeleteSchema = z.object({
  id: z.string().uuid(),
});

export const postUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional().nullable(),
  bodyMd: z.string().max(100_000).default(""),
  coverImagePath: z.string().trim().max(500).optional().nullable(),
  seoTitle: z.string().trim().max(200).optional().nullable(),
  seoDescription: z.string().trim().max(500).optional().nullable(),
  isPublished: z.boolean().default(false),
});

export const postDeleteSchema = z.object({
  id: z.string().uuid(),
});
