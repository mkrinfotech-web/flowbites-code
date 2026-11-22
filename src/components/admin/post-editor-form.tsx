"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { upsertPostAction } from "@/app/admin/cms-actions";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { BLOG_CATEGORIES, readingMinutes } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";

const PRODUCT_SLUGS = [
  "the-flo-edition",
  "the-extra-flo-edition",
  "the-super-flo-edition",
  "the-secret-flo-edition",
  "the-flo-plus-edition",
  "the-extra-flo-plus-edition",
  "the-super-flo-plus-edition",
  "the-secret-flo-plus-edition",
];

const inputClass =
  "mt-1 w-full rounded-xl border border-flo-maroon/15 bg-white px-3 py-2.5 text-sm";
const labelClass = "text-xs font-bold uppercase text-flo-maroon/60";
const toolBtn =
  "rounded-lg border border-flo-maroon/15 bg-white px-2.5 py-1 text-xs font-bold text-flo-maroon hover:bg-flo-blush/60";

/** ISO timestamp -> value for <input type="datetime-local"> in the viewer's timezone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostEditorForm({
  post,
}: {
  post?: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    body_md: string;
    cover_image_path: string | null;
    seo_title: string | null;
    seo_description: string | null;
    is_published: boolean;
    published_at?: string | null;
    category?: string | null;
    tags?: string[] | null;
    author_name?: string | null;
  } | null;
}) {
  const [body, setBody] = useState(post?.body_md ?? "");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [publishLocal, setPublishLocal] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Selection to restore after the body state has been committed to the textarea.
  const pendingSelection = useRef<[number, number] | null>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    const sel = pendingSelection.current;
    if (!el || !sel) return;
    pendingSelection.current = null;
    el.focus();
    el.setSelectionRange(sel[0], sel[1]);
  }, [body]);

  // Prefill in the browser so the value uses the viewer's timezone.
  useEffect(() => {
    setPublishLocal(toLocalInput(post?.published_at));
  }, [post?.published_at]);

  // Sent to the server as an absolute ISO timestamp (avoids timezone ambiguity).
  const publishIso = useMemo(() => {
    if (!publishLocal) return "";
    const d = new Date(publishLocal);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [publishLocal]);

  const previewHtml = useMemo(
    () => (mode === "preview" ? renderMarkdown(body) : ""),
    [mode, body],
  );
  const minutes = readingMinutes(body);

  function edit(
    transform: (selected: string) => { text: string; selStart?: number; selEnd?: number },
  ) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);
    const out = transform(selected);
    const next = body.slice(0, start) + out.text + body.slice(end);
    const from = start + (out.selStart ?? out.text.length);
    const to = start + (out.selEnd ?? out.selStart ?? out.text.length);
    pendingSelection.current = [from, to];
    setBody(next);
  }

  function wrap(before: string, after: string, placeholder: string) {
    edit((sel) => {
      const inner = sel || placeholder;
      return {
        text: `${before}${inner}${after}`,
        selStart: before.length,
        selEnd: before.length + inner.length,
      };
    });
  }

  /** Insert a block (own paragraph) with the given prefix per line. */
  function block(prefix: string | ((i: number) => string), placeholder: string) {
    edit((sel) => {
      const lines = (sel || placeholder).split("\n");
      const first = typeof prefix === "function" ? prefix(0) : prefix;
      const text = lines
        .map((l, i) => `${typeof prefix === "function" ? prefix(i) : prefix}${l}`)
        .join("\n");
      // With no selection, highlight just the placeholder words so typing replaces them.
      const selStart = sel ? 2 : 2 + first.length;
      return { text: `\n\n${text}\n\n`, selStart, selEnd: 2 + text.length };
    });
  }

  function insertLink() {
    const url = window.prompt("Link URL (https://...)", "https://");
    if (!url) return;
    edit((sel) => {
      const label = sel || "link text";
      return {
        text: `[${label}](${url})`,
        selStart: 1,
        selEnd: 1 + label.length,
      };
    });
  }

  function insertImage() {
    const url = window.prompt(
      "Image URL (must be https, e.g. a file uploaded in Media)",
      "https://",
    );
    if (!url) return;
    const alt = window.prompt("Alt text (describe the image)", "") ?? "";
    edit(() => ({ text: `\n\n![${alt}](${url})\n\n` }));
  }

  function insertProduct(slug: string) {
    if (!slug) return;
    edit(() => ({ text: `\n\n[[product:${slug}]]\n\n` }));
  }

  return (
    <form action={upsertPostAction} className="space-y-4">
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          Title
          <input
            name="title"
            required
            defaultValue={post?.title ?? ""}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Slug
          <input
            name="slug"
            required
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            defaultValue={post?.slug ?? ""}
            placeholder="period-week-snacks"
            className={inputClass}
          />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Excerpt
          <input
            name="excerpt"
            defaultValue={post?.excerpt ?? ""}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Category
          <select
            name="category"
            defaultValue={post?.category ?? ""}
            className={inputClass}
          >
            <option value="">No category</option>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Author name
          <input
            name="authorName"
            maxLength={80}
            defaultValue={post?.author_name ?? ""}
            placeholder="The Hormone Hood Team"
            className={inputClass}
          />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Tags (comma separated)
          <input
            name="tags"
            defaultValue={(post?.tags ?? []).join(", ")}
            placeholder="pcos, snacks, period care"
            className={inputClass}
          />
        </label>

        <div className="md:col-span-2">
          <ImageUploadField
            name="coverImagePath"
            label="Featured / cover image"
            defaultValue={post?.cover_image_path ?? ""}
            bucket="media"
            folder="posts"
          />
        </div>

        <label className={labelClass}>
          SEO title
          <input
            name="seoTitle"
            defaultValue={post?.seo_title ?? ""}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          SEO description
          <input
            name="seoDescription"
            defaultValue={post?.seo_description ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <details className="rounded-xl border border-flo-maroon/10 bg-flo-blush/30 p-3 text-sm text-flo-ink/80">
        <summary className="cursor-pointer font-bold text-flo-maroon">
          How to write a post
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Use the toolbar to add headings, bold, italics, links, lists,
            quotes and dividers. Select text first to wrap it.
          </li>
          <li>
            Product card: pick a product in the toolbar, or type{" "}
            <code>[[product:the-flo-edition]]</code> on a line by itself.
          </li>
          <li>
            Images must be https links. Upload the file in Media first, then
            paste its URL via the Image button.
          </li>
          <li>Use Preview to see how the post will look before saving.</li>
        </ul>
      </details>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={labelClass}>Body (Markdown)</span>
          <div className="inline-flex overflow-hidden rounded-lg border border-flo-maroon/15 text-xs font-bold">
            {(["write", "preview"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1 ${
                  mode === m
                    ? "bg-flo-pink text-white"
                    : "bg-white text-flo-maroon"
                }`}
              >
                {m === "write" ? "Write" : "Preview"}
              </button>
            ))}
          </div>
        </div>

        {mode === "write" ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button type="button" className={toolBtn} onClick={() => block("## ", "Heading")}>
              H2
            </button>
            <button type="button" className={toolBtn} onClick={() => block("### ", "Heading")}>
              H3
            </button>
            <button type="button" className={toolBtn} onClick={() => wrap("**", "**", "bold text")}>
              Bold
            </button>
            <button type="button" className={toolBtn} onClick={() => wrap("*", "*", "italic text")}>
              Italic
            </button>
            <button type="button" className={toolBtn} onClick={insertLink}>
              Link
            </button>
            <button type="button" className={toolBtn} onClick={insertImage}>
              Image
            </button>
            <button type="button" className={toolBtn} onClick={() => block("- ", "List item")}>
              Bulleted list
            </button>
            <button
              type="button"
              className={toolBtn}
              onClick={() => block((i) => `${i + 1}. `, "List item")}
            >
              Numbered list
            </button>
            <button type="button" className={toolBtn} onClick={() => block("> ", "Quote")}>
              Quote
            </button>
            <button
              type="button"
              className={toolBtn}
              onClick={() => edit(() => ({ text: "\n\n---\n\n" }))}
            >
              Divider
            </button>
            <select
              aria-label="Insert product card"
              value=""
              onChange={(e) => insertProduct(e.target.value)}
              className="rounded-lg border border-flo-maroon/15 bg-white px-2 py-1 text-xs font-bold text-flo-maroon"
            >
              <option value="">Product card…</option>
              {PRODUCT_SLUGS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Always mounted so the value is submitted in either mode. */}
        <textarea
          ref={textareaRef}
          name="bodyMd"
          rows={16}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`mt-2 w-full rounded-2xl border border-flo-maroon/15 bg-white px-3 py-3 font-mono text-sm leading-relaxed ${
            mode === "write" ? "" : "hidden"
          }`}
        />
        {mode === "preview" ? (
          <div className="mt-2 min-h-[24rem] rounded-2xl border border-flo-maroon/15 bg-white px-5 py-4">
            {body.trim() ? (
              <div
                className="prose-flo"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-sm text-flo-ink/50">Nothing to preview yet.</p>
            )}
          </div>
        ) : null}
        <p className="mt-1 text-xs text-flo-ink/50">
          About {minutes} min read
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={labelClass}>
          Publish date &amp; time
          <input
            type="datetime-local"
            value={publishLocal}
            onChange={(e) => setPublishLocal(e.target.value)}
            className={inputClass}
          />
          <span className="mt-1 block text-[11px] font-normal normal-case text-flo-ink/50">
            Leave empty to publish now; a future date schedules it.
          </span>
        </label>
        <input type="hidden" name="publishAt" value={publishIso} />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-flo-maroon">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={post?.is_published ?? false}
          className="size-4 rounded border-flo-maroon/30"
        />
        Published
      </label>

      <button
        type="submit"
        className="rounded-full bg-flo-pink px-6 py-2.5 text-sm font-bold text-white"
      >
        Save post
      </button>
    </form>
  );
}
