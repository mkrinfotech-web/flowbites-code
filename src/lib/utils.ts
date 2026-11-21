import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInr(paiseOrRupees: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paiseOrRupees);
}

export function getOrCreateSessionId() {
  if (typeof window === "undefined") return "server";
  const key = "flo_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/**
 * Allow only same-origin relative paths: must start with `/` but not `//`
 * (blocks protocol-relative open redirects like `//evil.com`).
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback = "/account",
): string {
  if (!next || typeof next !== "string") return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  return trimmed;
}
