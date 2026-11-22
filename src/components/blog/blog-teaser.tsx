import Link from "next/link";
import { PostCard } from "@/components/blog/post-card";
import type { PostListItem } from "@/lib/cms";

export function BlogTeaser({ posts }: { posts: PostListItem[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="bg-flo-soft py-14 md:py-20">
      <div className="container-flo">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-script text-xl text-flo-pink">From the blog</p>
            <h2 className="mt-1 text-2xl font-extrabold text-flo-maroon md:text-3xl">
              Tips, rituals and snack talk
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-sm font-semibold text-flo-pink hover:underline"
          >
            View all articles →
          </Link>
        </div>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
