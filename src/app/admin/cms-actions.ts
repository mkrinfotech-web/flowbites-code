"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  bannerDeleteSchema,
  bannerUpsertSchema,
  faqDeleteSchema,
  faqUpsertSchema,
  postDeleteSchema,
  postUpsertSchema,
  testimonialDeleteSchema,
  testimonialUpsertSchema,
} from "@/lib/validations";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_active || !["admin", "staff"].includes(profile.role)) {
    throw new Error("Unauthorized");
  }
  return { supabase, user, profile };
}

function boolFromForm(formData: FormData, key: string) {
  const v = formData.get(key);
  return v === "on" || v === "true";
}

function emptyToNull(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}

function revalidateHome() {
  revalidatePath("/");
}

// —— FAQs ————————————————————————————————————————————————————————————————

export async function upsertFaqAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const parsed = faqUpsertSchema.safeParse({
    id: id && String(id).length > 0 ? id : undefined,
    question: formData.get("question"),
    answer: formData.get("answer"),
    sortOrder: Number(formData.get("sortOrder") || 0),
    isActive: boolFromForm(formData, "isActive"),
  });
  if (!parsed.success) {
    redirect("/admin/faqs?error=invalid");
  }

  const { supabase } = await requireStaff();
  const row = {
    question: parsed.data.question,
    answer: parsed.data.answer,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("faqs")
      .update(row)
      .eq("id", parsed.data.id);
    if (error) {
      redirect(`/admin/faqs?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { error } = await supabase.from("faqs").insert(row);
    if (error) {
      redirect(`/admin/faqs?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/admin/faqs");
  revalidateHome();
  redirect("/admin/faqs");
}

export async function deleteFaqAction(formData: FormData): Promise<void> {
  const parsed = faqDeleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) redirect("/admin/faqs?error=invalid");

  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("faqs")
    .delete()
    .eq("id", parsed.data.id);
  if (error) {
    redirect(`/admin/faqs?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/faqs");
  revalidateHome();
  redirect("/admin/faqs");
}

// —— Testimonials ————————————————————————————————————————————————————————

export async function upsertTestimonialAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  const parsed = testimonialUpsertSchema.safeParse({
    id: id && String(id).length > 0 ? id : undefined,
    quote: formData.get("quote"),
    authorName: formData.get("authorName"),
    city: formData.get("city"),
    sortOrder: Number(formData.get("sortOrder") || 0),
    isActive: boolFromForm(formData, "isActive"),
  });
  if (!parsed.success) {
    redirect("/admin/testimonials?error=invalid");
  }

  const { supabase } = await requireStaff();
  const row = {
    quote: parsed.data.quote,
    author_name: parsed.data.authorName,
    city: parsed.data.city,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("testimonials")
      .update(row)
      .eq("id", parsed.data.id);
    if (error) {
      redirect(
        `/admin/testimonials?error=${encodeURIComponent(error.message)}`,
      );
    }
  } else {
    const { error } = await supabase.from("testimonials").insert(row);
    if (error) {
      redirect(
        `/admin/testimonials?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  revalidatePath("/admin/testimonials");
  revalidateHome();
  redirect("/admin/testimonials");
}

export async function deleteTestimonialAction(
  formData: FormData,
): Promise<void> {
  const parsed = testimonialDeleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) redirect("/admin/testimonials?error=invalid");

  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("testimonials")
    .delete()
    .eq("id", parsed.data.id);
  if (error) {
    redirect(
      `/admin/testimonials?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin/testimonials");
  revalidateHome();
  redirect("/admin/testimonials");
}

// —— Banners ——————————————————————————————————————————————————————————————

export async function upsertBannerAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const parsed = bannerUpsertSchema.safeParse({
    id: id && String(id).length > 0 ? id : undefined,
    name: formData.get("name"),
    placement: formData.get("placement"),
    headline: emptyToNull(formData.get("headline")),
    body: emptyToNull(formData.get("body")),
    ctaLabel: emptyToNull(formData.get("ctaLabel")),
    ctaHref: emptyToNull(formData.get("ctaHref")),
    imagePath: emptyToNull(formData.get("imagePath")),
    isActive: boolFromForm(formData, "isActive"),
    sortOrder: Number(formData.get("sortOrder") || 0),
  });
  if (!parsed.success) {
    redirect("/admin/banners?error=invalid");
  }

  const { supabase } = await requireStaff();
  const row = {
    name: parsed.data.name,
    placement: parsed.data.placement,
    headline: parsed.data.headline,
    body: parsed.data.body,
    cta_label: parsed.data.ctaLabel,
    cta_href: parsed.data.ctaHref,
    image_path: parsed.data.imagePath,
    is_active: parsed.data.isActive,
    sort_order: parsed.data.sortOrder,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("banners")
      .update(row)
      .eq("id", parsed.data.id);
    if (error) {
      redirect(`/admin/banners?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { error } = await supabase.from("banners").insert(row);
    if (error) {
      redirect(`/admin/banners?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/admin/banners");
  revalidateHome();
  redirect("/admin/banners");
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  const parsed = bannerDeleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) redirect("/admin/banners?error=invalid");

  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("banners")
    .delete()
    .eq("id", parsed.data.id);
  if (error) {
    redirect(`/admin/banners?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/banners");
  revalidateHome();
  redirect("/admin/banners");
}

// —— Posts ————————————————————————————————————————————————————————————————

export async function upsertPostAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const parsed = postUpsertSchema.safeParse({
    id: id && String(id).length > 0 ? id : undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    excerpt: emptyToNull(formData.get("excerpt")),
    bodyMd: formData.get("bodyMd") ?? "",
    coverImagePath: emptyToNull(formData.get("coverImagePath")),
    seoTitle: emptyToNull(formData.get("seoTitle")),
    seoDescription: emptyToNull(formData.get("seoDescription")),
    isPublished: boolFromForm(formData, "isPublished"),
    category: emptyToNull(formData.get("category")),
    tags: String(formData.get("tags") ?? ""),
    authorName: emptyToNull(formData.get("authorName")),
    publishAt: emptyToNull(formData.get("publishAt")),
  });
  if (!parsed.success) {
    redirect("/admin/posts?error=invalid");
  }

  const { supabase, user } = await requireStaff();

  // Existing state (needed to keep published_at stable and to revalidate the old slug).
  let existingSlug: string | null = null;
  let existingPublishedAt: string | null = null;
  if (parsed.data.id) {
    const { data: existing } = await supabase
      .from("posts")
      .select("slug, published_at")
      .eq("id", parsed.data.id)
      .maybeSingle();
    existingSlug = existing?.slug ?? null;
    existingPublishedAt = existing?.published_at ?? null;
  }

  // Publish date rule: explicit date wins (may be in the future = scheduled);
  // otherwise keep the existing date if it is already in the past; otherwise
  // (first publish, or a scheduled date that was cleared) publish now.
  const nowIso = new Date().toISOString();
  const keepExisting =
    existingPublishedAt && new Date(existingPublishedAt).getTime() <= Date.now()
      ? existingPublishedAt
      : null;
  const publishedAt = parsed.data.isPublished
    ? (parsed.data.publishAt ?? keepExisting ?? nowIso)
    : null;

  const row = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    excerpt: parsed.data.excerpt,
    body_md: parsed.data.bodyMd,
    cover_image_path: parsed.data.coverImagePath,
    seo_title: parsed.data.seoTitle,
    seo_description: parsed.data.seoDescription,
    is_published: parsed.data.isPublished,
    published_at: publishedAt,
    category: parsed.data.category,
    tags: parsed.data.tags,
    author_name: parsed.data.authorName,
    author_id: user.id,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("posts")
      .update(row)
      .eq("id", parsed.data.id);
    if (error) {
      redirect(`/admin/posts?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { error } = await supabase.from("posts").insert(row);
    if (error) {
      redirect(`/admin/posts?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath(`/blog/${parsed.data.slug}`);
  if (existingSlug && existingSlug !== parsed.data.slug) {
    revalidatePath(`/blog/${existingSlug}`);
  }
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
  redirect("/admin/posts");
}

export async function deletePostAction(formData: FormData): Promise<void> {
  const parsed = postDeleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) redirect("/admin/posts?error=invalid");

  const slug = String(formData.get("slug") || "");
  const { supabase } = await requireStaff();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", parsed.data.id);
  if (error) {
    redirect(`/admin/posts?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
  redirect("/admin/posts");
}
