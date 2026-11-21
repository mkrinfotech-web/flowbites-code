/**
 * Editable business details for the public footer.
 * Update these when the client provides a confirmed address.
 */
export const BUSINESS_ADDRESS = {
  brandName: "The Hormone Hood",
  lines: [
    "The Hormone Hood",
    "Hyderabad, Telangana, India",
  ],
} as const;

/** Primary storefront domain (no protocol, no www). Change here to move domains. */
export const SITE_DOMAIN = "thehormonehood.com";

/** Hostnames that serve the admin dashboard (rewritten to /admin). */
export const ADMIN_HOSTNAMES = [`admin.${SITE_DOMAIN}`, "admin.localhost"] as const;

export function isAdminHostname(host: string | null | undefined): boolean {
  const h = (host ?? "").split(":")[0]?.toLowerCase() ?? "";
  return (ADMIN_HOSTNAMES as readonly string[]).includes(h);
}

/** Fallback storefront origin when NEXT_PUBLIC_APP_URL is unset. */
export const DEFAULT_SITE_ORIGIN = `https://www.${SITE_DOMAIN}`;

export const PRIVACY_POLICY_HREF = "/privacy";

/** Public contact + transactional reply-to address. */
export const CONTACT_EMAIL = `reach@${SITE_DOMAIN}`;

export const EMAIL_FROM_NAME = "FloBites";

/** Default Resend / SMTP From header when `EMAIL_FROM` env is unset. */
export const DEFAULT_EMAIL_FROM = `${EMAIL_FROM_NAME} <${CONTACT_EMAIL}>`;

export function emailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM;
}

export function emailReplyTo(): string {
  return CONTACT_EMAIL;
}

export function contactMailtoHref(): string {
  return `mailto:${CONTACT_EMAIL}`;
}

/** Science Behind Flo — Cureus narrative review on functional foods & PCOS. */
export const SCIENCE_BEHIND_FLO_ARTICLE_URL =
  "https://www.cureus.com/articles/472757-role-of-functional-foods-and-nutraceutical-compounds-in-alleviating-polycystic-ovary-syndrome-a-narrative-review#!/";

/** Canonical storefront origin for metadata, sitemap, and robots. */
export function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || DEFAULT_SITE_ORIGIN
  );
}
