import { NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/validations";
import { PRODUCTS } from "@/lib/data";
import { lookupValidDiscountCode } from "@/lib/discount-codes";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getRazorpay, isRazorpayConfigured } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import {
  buildCheckoutCandidates,
  FLO_CIRCLE_INTRO_FEE_INR,
  resolveBestDiscount,
  shouldApplyMemberDiscount,
  type StackMode,
} from "@/lib/flo-circle";
import {
  applyPaidOrderSideEffects,
  countPaidOrders,
  ensureMemberProfile,
  getActiveMembership,
  getIntroPlan,
  getMemberDiscountTiming,
  getStackMode,
  resolveOrCreateAuthUserByEmail,
} from "@/lib/flo-circle-server";
import { allowDemoCheckout, PAYMENTS_UNAVAILABLE_MESSAGE } from "@/lib/payments-env";

function orderNumber() {
  return `FLO-${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please fill all required fields correctly." },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const productMap = new Map(PRODUCTS.map((p) => [p.id, p]));

    const admin = getSupabaseAdmin();
    const stockByProduct = new Map<string, number>();
    if (admin) {
      const ids = input.items.map((i) => i.productId);
      const { data } = await admin
        .from("products")
        .select("id, name, price_inr, image_path, slug, stock_qty")
        .in("id", ids)
        .eq("is_active", true);
      if (data?.length) {
        for (const row of data) {
          stockByProduct.set(row.id, row.stock_qty ?? 0);
          productMap.set(row.id, {
            id: row.id,
            slug: row.slug,
            name: row.name,
            tagline: "",
            description: "",
            packLabel: "",
            priceInr: row.price_inr,
            imagePath: row.image_path,
            badge: "",
            shelfColor: "#fa3558",
          });
        }
      }
    }

    // Reject when DB stock is known and insufficient (skip check for static-only products)
    if (stockByProduct.size > 0) {
      for (const item of input.items) {
        if (!stockByProduct.has(item.productId)) continue;
        const available = stockByProduct.get(item.productId)!;
        if (item.quantity > available) {
          const product = productMap.get(item.productId);
          return NextResponse.json(
            {
              error:
                available <= 0
                  ? `${product?.name ?? "An item"} is out of stock.`
                  : `Only ${available} left of ${product?.name ?? "an item"} — please update your cart.`,
              code: "INSUFFICIENT_STOCK",
              productId: item.productId,
              available,
            },
            { status: 409 },
          );
        }
      }
    }

    const lineItems = input.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error("INVALID_PRODUCT");
      return {
        productId: product.id,
        productName: product.name,
        unitPriceInr: product.priceInr,
        quantity: item.quantity,
        lineTotalInr: product.priceInr * item.quantity,
      };
    });

    const subtotal = lineItems.reduce((s, l) => s + l.lineTotalInr, 0);

    let userId: string | null = null;
    let isActiveMember = false;
    let membershipId: string | null = null;
    let guestFloCircleClaim = false;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        if (admin) await ensureMemberProfile(user);
        const membership = await getActiveMembership(user.id);
        if (membership) {
          isActiveMember = true;
          membershipId = membership.id;
        }
      }
    } catch {
      // auth optional for guest checkout
    }

    // Guest + Join Flo Circle: attach to existing account by email, or create
    // a passwordless auth user (claim later via Forgot password). Never redirect to signup.
    if (Boolean(input.joinFloCircle) && !userId && !isActiveMember) {
      if (!admin) {
        console.warn(
          "[checkout] SUPABASE_SERVICE_ROLE_KEY missing — guest Flo Circle join requires service role",
        );
        return NextResponse.json(
          {
            error:
              "Flo Circle join is temporarily unavailable. Uncheck Join Flo Circle to continue as guest, or try again shortly.",
            code: "SERVICE_ROLE_MISSING",
          },
          { status: 503 },
        );
      }

      const resolved = await resolveOrCreateAuthUserByEmail({
        email: input.email,
        fullName: input.name,
      });
      if (!resolved) {
        return NextResponse.json(
          {
            error:
              "Could not set up Flo Circle for this email. Please try again, or uncheck Join Flo Circle to continue.",
            code: "FLO_CIRCLE_USER_FAILED",
          },
          { status: 500 },
        );
      }

      userId = resolved.userId;
      guestFloCircleClaim = true;
      await ensureMemberProfile({
        id: userId,
        email: input.email,
        user_metadata: { full_name: input.name },
      });
      const membership = await getActiveMembership(userId);
      if (membership) {
        isActiveMember = true;
        membershipId = membership.id;
        guestFloCircleClaim = false;
      }
    }

    const joiningNow = Boolean(input.joinFloCircle) && !isActiveMember;

    let loveScorePercent = 0;
    let couponPercent = 0;
    let discountCodeId: string | null = null;

    // Only apply discounts from a valid unused discount_codes row — never forge from code shape
    if (input.discountCode && admin) {
      const validated = await lookupValidDiscountCode(
        admin,
        input.discountCode,
        input.sessionId,
      );
      if (validated) {
        discountCodeId = validated.id;
        if (validated.kind === "manual") couponPercent = validated.percentOff;
        else loveScorePercent = validated.percentOff;
      }
      // Invalid / missing / expired code → ignore (no forge)
    }

    const timing = await getMemberDiscountTiming();
    const paidOrderCount = userId ? await countPaidOrders(userId) : 0;
    const isMemberContext = isActiveMember || joiningNow;
    const applyMemberDiscount =
      isMemberContext && shouldApplyMemberDiscount(timing, paidOrderCount);

    const stackMode: StackMode = await getStackMode();
    const resolved = resolveBestDiscount(
      buildCheckoutCandidates({
        applyMemberDiscount,
        loveScorePercent,
        couponPercent,
      }),
      stackMode,
    );

    const discountInr = Math.round((subtotal * resolved.percent) / 100);
    const membershipFeeInr = joiningNow ? FLO_CIRCLE_INTRO_FEE_INR : 0;
    const productPayable = Math.max(0, subtotal - discountInr);
    const total = Math.max(
      membershipFeeInr > 0 ? membershipFeeInr : 1,
      productPayable + membershipFeeInr,
    );
    const id = crypto.randomUUID();
    const number = orderNumber();
    const isMemberOrder = isMemberContext;

    let newMembershipId: string | null = null;

    if (admin && joiningNow && userId) {
      // Always the intro plan: the checkout only charges the intro fee, so a
      // client-supplied floCirclePlanId must never select a different plan.
      const intro = await getIntroPlan();
      const planId = intro?.id;
      if (planId) {
        newMembershipId = crypto.randomUUID();
        await admin.from("flo_circle_memberships").insert({
          id: newMembershipId,
          user_id: userId,
          plan_id: planId,
          status: "pending",
        });
        membershipId = newMembershipId;
      }
    }

    if (admin) {
      const { error: orderErr } = await admin.from("orders").insert({
        id,
        order_number: number,
        status: "pending",
        customer_name: input.name,
        customer_email: input.email,
        customer_phone: input.phone,
        shipping_address: input.address,
        subtotal_inr: subtotal,
        discount_inr: discountInr,
        membership_fee_inr: membershipFeeInr,
        total_inr: total,
        discount_code_id: discountCodeId,
        user_id: userId,
        is_member_order: isMemberOrder,
        is_priority: isMemberOrder,
        includes_flo_circle_join: joiningNow,
        discount_source: resolved.source,
        discount_percent: resolved.percent,
        membership_id: membershipId,
        subscription_id: null,
      });
      if (orderErr) {
        console.error(orderErr);
        return NextResponse.json(
          { error: "Could not save order" },
          { status: 500 },
        );
      }
      const { error: itemsErr } = await admin.from("order_items").insert(
        lineItems.map((l) => ({
          order_id: id,
          product_id: l.productId,
          product_name: l.productName,
          unit_price_inr: l.unitPriceInr,
          quantity: l.quantity,
          line_total_inr: l.lineTotalInr,
        })),
      );
      if (itemsErr) {
        console.error(itemsErr);
        const { error: failErr } = await admin
          .from("orders")
          .update({ status: "failed" })
          .eq("id", id)
          .eq("status", "pending");
        if (failErr) console.error(failErr);
        if (newMembershipId) {
          await admin
            .from("flo_circle_memberships")
            .update({ status: "cancelled" })
            .eq("id", newMembershipId)
            .eq("status", "pending");
        }
        return NextResponse.json(
          {
            error:
              "We couldn't save your order items. You have not been charged — please try again.",
          },
          { status: 500 },
        );
      }
    }

    if (!isRazorpayConfigured()) {
      if (!allowDemoCheckout()) {
        return NextResponse.json(
          {
            error: PAYMENTS_UNAVAILABLE_MESSAGE,
            code: "PAYMENTS_UNAVAILABLE",
          },
          { status: 503 },
        );
      }
      if (admin) {
        await admin
          .from("orders")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", id);
        await applyPaidOrderSideEffects({
          id,
          user_id: userId,
          discount_inr: discountInr,
          discount_source: resolved.source,
          membership_id: membershipId,
          discount_code_id: discountCodeId,
        });
      }
      return NextResponse.json({
        demo: true,
        orderId: admin ? id : number,
        orderNumber: number,
        amount: total * 100,
        discountSource: resolved.source,
        discountPercent: resolved.percent,
        membershipFeeInr,
        guestFloCircleClaim: guestFloCircleClaim || joiningNow,
        includesFloCircleJoin: joiningNow,
      });
    }

    const razorpay = getRazorpay()!;
    const rzOrder = await razorpay.orders.create({
      amount: total * 100,
      currency: "INR",
      receipt: number,
      notes: {
        flo_order_id: id,
        discount_source: resolved.source,
        membership_fee_inr: String(membershipFeeInr),
      },
    });

    if (admin) {
      await admin
        .from("orders")
        .update({ razorpay_order_id: rzOrder.id })
        .eq("id", id);
    }

    return NextResponse.json({
      orderId: id,
      orderNumber: number,
      razorpayOrderId: rzOrder.id,
      amount: rzOrder.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      discountSource: resolved.source,
      discountPercent: resolved.percent,
      membershipFeeInr,
      guestFloCircleClaim: guestFloCircleClaim || joiningNow,
      includesFloCircleJoin: joiningNow,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_PRODUCT") {
      return NextResponse.json(
        { error: "Invalid product in cart" },
        { status: 400 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
