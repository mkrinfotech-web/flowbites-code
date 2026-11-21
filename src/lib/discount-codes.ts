import type { SupabaseClient } from "@supabase/supabase-js";

export type DiscountKind = "love_score" | "manual";

export type ValidatedDiscount = {
  id: string;
  code: string;
  percentOff: number;
  kind: DiscountKind;
  lovedName: string;
};

type DiscountCodeRow = {
  id: string;
  code: string;
  percent_off: number;
  kind: string | null;
  loved_name: string | null;
  session_id: string | null;
  max_uses: number | null;
  use_count: number | null;
  is_active: boolean | null;
  expires_at: string;
  used_at: string | null;
};

/**
 * Same eligibility rules as create-order — unused, unexpired, session match,
 * under max uses, and active.
 */
export function evaluateDiscountCode(
  codeRow: DiscountCodeRow,
  sessionId: string,
): ValidatedDiscount | null {
  if (codeRow.used_at) return null;
  if (new Date(codeRow.expires_at) <= new Date()) return null;
  if (codeRow.is_active === false) return null;

  const sessionOk =
    !codeRow.session_id || codeRow.session_id === sessionId;
  if (!sessionOk) return null;

  const usesOk =
    codeRow.max_uses == null ||
    (codeRow.use_count ?? 0) < codeRow.max_uses;
  if (!usesOk) return null;

  const kind: DiscountKind =
    codeRow.kind === "manual" ? "manual" : "love_score";

  return {
    id: codeRow.id,
    code: codeRow.code,
    percentOff: codeRow.percent_off,
    kind,
    lovedName: codeRow.loved_name ?? "",
  };
}

/** Lookup + evaluate a discount code against the live discount_codes table. */
export async function lookupValidDiscountCode(
  admin: SupabaseClient,
  code: string,
  sessionId: string,
): Promise<ValidatedDiscount | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data: codeRow } = await admin
    .from("discount_codes")
    .select("*")
    .eq("code", normalized)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!codeRow) return null;
  return evaluateDiscountCode(codeRow as DiscountCodeRow, sessionId);
}
