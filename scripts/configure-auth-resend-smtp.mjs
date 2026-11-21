#!/usr/bin/env node
/**
 * Configure Supabase Auth to send branded emails via Resend SMTP.
 *
 * Requires:
 *   SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens
 *   RESEND_API_KEY         — from .env.local or environment
 *
 * Usage:
 *   export SUPABASE_ACCESS_TOKEN=sbp_...
 *   node scripts/configure-auth-resend-smtp.mjs
 *
 * Does not print secrets.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "vvlyqvahfaowwjaflumd";
const ROOT = path.resolve(__dirname, "..");
const TEMPLATES = path.join(ROOT, "supabase/auth-email-templates");

const SITE_URL = "https://www.thehormonehood.com";
const URI_ALLOW_LIST = [
  "https://www.thehormonehood.com",
  "https://www.thehormonehood.com/**",
  "https://thehormonehood.com",
  "https://thehormonehood.com/**",
  "https://www.thehormonehood.com/auth/callback",
  "https://www.thehormonehood.com/account/update-password",
  "https://thehormonehood.com/auth/callback",
  "https://thehormonehood.com/account/update-password",
  "https://admin.thehormonehood.com/**",
  "https://admin.thehormonehood.com/auth/callback",
  "http://localhost:3000/**",
  "http://localhost:3000/auth/callback",
  "http://admin.localhost:3000/**",
  "http://admin.localhost:3000/auth/callback",
].join(",");

function loadDotEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function readTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATES, name), "utf8").trim();
}

function mask(s) {
  if (!s) return "(missing)";
  if (s.length <= 8) return "***";
  return `${s.slice(0, 4)}…${s.slice(-4)} (len ${s.length})`;
}

/** Parse `Name <email@domain>` or a bare address. */
function parseFrom(raw) {
  const fallbackEmail = "reach@thehormonehood.com";
  const fallbackName = "FloBites";
  const value = (raw || "").trim();
  if (!value) return { name: fallbackName, email: fallbackEmail };
  const angled = value.match(/^(.*)<([^>]+)>$/);
  if (angled) {
    const name = angled[1].trim().replace(/^"|"$/g, "") || fallbackName;
    const email = angled[2].trim().toLowerCase();
    return { name, email };
  }
  if (value.includes("@")) {
    return { name: fallbackName, email: value.toLowerCase() };
  }
  return { name: fallbackName, email: fallbackEmail };
}

async function main() {
  loadDotEnvLocal();

  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const sender = parseFrom(process.env.EMAIL_FROM);

  if (!token) {
    console.error(
      "Missing SUPABASE_ACCESS_TOKEN.\n" +
        "Create one at https://supabase.com/dashboard/account/tokens\n" +
        "Then: export SUPABASE_ACCESS_TOKEN=sbp_... && node scripts/configure-auth-resend-smtp.mjs\n\n" +
        "Or apply SMTP by hand (no token):\n" +
        "  https://supabase.com/dashboard/project/vvlyqvahfaowwjaflumd/auth/smtp\n" +
        `  Sender: ${sender.name} <${sender.email}>\n` +
        "  Host smtp.resend.com · Port 465 · User resend · Password = RESEND_API_KEY",
    );
    process.exit(2);
  }
  if (!resendKey) {
    console.error("Missing RESEND_API_KEY (check .env.local or export it).");
    process.exit(2);
  }

  console.log("Project:", PROJECT_REF);
  console.log("Token:", mask(token));
  console.log("Resend key:", mask(resendKey));
  console.log(`Sender: ${sender.name} <${sender.email}>`);

  const payload = {
    external_email_enabled: true,
    mailer_secure_email_change_enabled: true,
    mailer_autoconfirm: false,
    smtp_admin_email: sender.email,
    smtp_host: "smtp.resend.com",
    smtp_port: "465",
    smtp_user: "resend",
    smtp_pass: resendKey,
    smtp_sender_name: sender.name,
    site_url: SITE_URL,
    uri_allow_list: URI_ALLOW_LIST,
    mailer_subjects_confirmation: "Confirm your FloBites email",
    mailer_templates_confirmation_content: readTemplate("confirm-signup.html"),
    mailer_subjects_magic_link: "Your FloBites sign-in link",
    mailer_templates_magic_link_content: readTemplate("magic-link.html"),
    mailer_subjects_recovery: "Reset your FloBites password",
    mailer_templates_recovery_content: readTemplate("reset-password.html"),
    mailer_subjects_invite: "You're invited to FloBites",
    mailer_templates_invite_content: readTemplate("invite.html"),
  };

  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 500) };
  }

  if (!res.ok) {
    console.error("PATCH failed:", res.status);
    console.error(
      typeof data === "object"
        ? JSON.stringify(
            {
              message: data.message || data.error || data.msg,
              hint: data.hint,
            },
            null,
            2,
          )
        : text.slice(0, 400),
    );
    process.exit(1);
  }

  console.log("Configured successfully:");
  console.log("  smtp_host:", data.smtp_host);
  console.log("  smtp_port:", data.smtp_port);
  console.log("  smtp_user:", data.smtp_user);
  console.log("  smtp_admin_email:", data.smtp_admin_email);
  console.log("  smtp_sender_name:", data.smtp_sender_name);
  console.log("  smtp_pass set:", Boolean(data.smtp_pass));
  console.log("  site_url:", data.site_url);
  console.log(
    "  uri_allow_list entries:",
    String(data.uri_allow_list || "")
      .split(",")
      .filter(Boolean).length,
  );
  console.log("  confirmation subject:", data.mailer_subjects_confirmation);
  console.log("  magic_link subject:", data.mailer_subjects_magic_link);
  console.log("  recovery subject:", data.mailer_subjects_recovery);
  console.log("  invite subject:", data.mailer_subjects_invite);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
