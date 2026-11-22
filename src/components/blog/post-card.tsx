import Image from "next/image";
import Link from "next/link";
import { categoryLabel } from "@/lib/blog";
import type { PostListItem } from "@/lib/cms";
import { coverUrl, formatPostDate } from "@/components/blog/cover-url";

export function PostCard({ post }: { post: PostListItem }) {
  const cover = coverUrl(post.cover_image_path);
  const label = categoryLabel(post.category);
  const date = formatPostDate(post.published_at ?? post.created_at);
  const minutes = post.reading_minutes ?? 1;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[4px_10px_37px_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 hover:shadow-[4px_14px_40px_rgba(0,0,0,0.16)]">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-flo-blush"
        aria-label={post.title}
        tabIndex={-1}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            unoptimized
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-script text-3xl text-flo-pink/60">
            FloBites
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {label ? (
          <span className="w-fit rounded-full border border-flo-brown/20 bg-flo-soft px-2.5 py-1 text-[11px] font-semibold text-flo-brown">
            {label}
          </span>
        ) : null}
        <h3 className="text-lg font-bold leading-snug text-flo-maroon">
          <Link href={`/blog/${post.slug}`} className="hover:text-flo-pink">
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? (
          <p className="line-clamp-3 text-sm text-flo-ink/70">{post.excerpt}</p>
        ) : null}
        <p className="mt-auto pt-2 text-xs text-flo-ink/50">
          {date}
          {date ? " · " : ""}
          {minutes} min read
        </p>
      </div>
    </article>
  );
}
