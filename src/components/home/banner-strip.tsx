import type { BannerRow } from "@/lib/cms";

const MEDIA_BUCKET = "media";

function safeHref(href: string | null): string | null {
  const value = href?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return null;
}

function imageUrl(path: string | null): string | null {
  const value = path?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${value.replace(/^\/+/, "")}`;
}

export function BannerStrip({ banners }: { banners: BannerRow[] }) {
  const visible = banners.filter((b) => b.headline || b.body);
  if (visible.length === 0) return null;

  return (
    <section aria-label="Announcements" className="w-full">
      {visible.map((b) => {
        const href = safeHref(b.cta_href);
        const img = imageUrl(b.image_path);
        return (
          <div
            key={b.id}
            className="bg-flo-soft text-flo-maroon"
          >
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 text-center text-sm">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt=""
                  className="h-10 w-auto rounded-md object-cover"
                />
              ) : null}
              {b.headline ? (
                <strong className="font-extrabold">{b.headline}</strong>
              ) : null}
              {b.body ? <span className="text-flo-ink/80">{b.body}</span> : null}
              {href && b.cta_label ? (
                <a
                  href={href}
                  {...(/^https?:/i.test(href)
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="rounded-full bg-flo-maroon px-3 py-1 text-xs font-bold text-white hover:opacity-90"
                >
                  {b.cta_label}
                </a>
              ) : null}
            </div>
          </div>
        );
      })}
    </section>
  );
}
