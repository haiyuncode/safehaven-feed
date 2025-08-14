import { promises as fs } from "fs";
import path from "path";
import { unstable_noStore as noStore } from "next/cache";
import FeedClient from "./FeedClient";
import QuickExit from "@/app/components/QuickExit";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type FeedVideo = { videoId?: string };
type FeedPayload = { videos?: FeedVideo[] };

async function loadFeed(topic: string): Promise<FeedPayload | null> {
  noStore();
  const file = path.join(process.cwd(), "public", "feeds", `${topic}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    const clean = raw.replace(/^\uFEFF/, "").trimStart();
    return JSON.parse(clean) as FeedPayload;
  } catch {
    // In local/dev, auto-create a skeleton feed so new topics are testable immediately
    try {
      if (process.env.NODE_ENV !== "production") {
        // Try to build an ad-hoc feed using YouTube search RSS (no API key)
        const searchUrl = `https://www.youtube.com/feeds/videos.xml?search_query=${encodeURIComponent(
          topic
        )}`;
        try {
          const res = await fetch(searchUrl, { cache: "no-store" });
          const xml = await res.text();
          // Very small XML extraction to avoid adding a parser here
          const entries = Array.from(xml.matchAll(/<entry>[\s\S]*?<\/entry>/g));
          const videos = entries
            .map((m) => m[0])
            .map((entry) => {
              const id =
                (entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1] ||
                "";
              const title =
                (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
              const published =
                (entry.match(/<published>([^<]+)<\/published>/) || [])[1] || "";
              return id
                ? {
                    id,
                    title,
                    videoId: id,
                    channel: topic,
                    publishedAt: published,
                    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
                    tags: [topic],
                  }
                : null;
            })
            .filter(Boolean) as any[];
          const payload = {
            topic,
            generatedAt: new Date().toISOString(),
            videos,
            articles: [] as { id: string }[],
          };
          await fs.mkdir(path.dirname(file), { recursive: true });
          await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
          return payload as unknown as FeedPayload;
        } catch {
          const payload = {
            topic,
            generatedAt: new Date().toISOString(),
            videos: [] as { videoId: string }[],
            articles: [] as { id: string }[],
          };
          await fs.mkdir(path.dirname(file), { recursive: true });
          await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
          return payload as unknown as FeedPayload;
        }
      }
    } catch {
      // ignore write failures (e.g., production read-only FS)
    }
    return null;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const data = await loadFeed(topic);
  if (!data) {
    notFound();
  }
  const videoIds: string[] = (data.videos ?? [])
    .map((v) => v.videoId)
    .filter((id): id is string => Boolean(id));
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
      <QuickExit />
      <Link
        href="/"
        className="fixed left-3 top-3 z-50 rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
      >
        Back to topics
      </Link>
      <div className="w-full max-w-2xl">
        <h1 className="text-xl mb-3 capitalize">{topic} feed</h1>
        <FeedClient topic={topic} initialIds={videoIds} />
      </div>
    </main>
  );
}
