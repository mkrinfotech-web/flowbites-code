import { VideoUploadForm } from "@/components/admin/video-upload-form";
import { VideoList } from "@/components/admin/video-list";
import { ImportStaticVideosButton } from "@/components/admin/import-static-videos-button";
import { listAdminVideos } from "@/lib/videos";

export default async function AdminVideosPage() {
  let videos: Awaited<ReturnType<typeof listAdminVideos>> = [];
  let error: string | null = null;
  try {
    videos = await listAdminVideos();
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load videos.";
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-flo-maroon">Carousel videos</h1>
      <p className="mt-1 text-sm text-flo-ink/60">
        Upload, reorder, and toggle clips for the Stories carousel and Showcase
        strip. Seeded from the live public/ videos when the library is empty.
      </p>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-flo-maroon/70">
          Upload
        </h2>
        <VideoUploadForm />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-flo-maroon/70">
            Library ({videos.length})
          </h2>
          <ImportStaticVideosButton />
        </div>
        {error ? (
          <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </p>
        ) : (
          <VideoList videos={videos} />
        )}
      </section>
    </div>
  );
}
