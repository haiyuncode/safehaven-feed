import { promises as fs } from "fs";
import path from "path";
import Player from "@/app/components/Player";
import QuickExit from "@/app/components/QuickExit";

type FeedVideo = { videoId?: string };
type FeedPayload = { videos?: FeedVideo[] };

async function loadFeed(topic: string): Promise<FeedPayload> {
  const file = path.join(process.cwd(), "public", "feeds", `${topic}.json`);
  const raw = await fs.readFile(file, "utf8");
  const clean = raw.replace(/^\uFEFF/, "").trimStart();
  return JSON.parse(clean) as FeedPayload;
}

export default async function Page({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const data = await loadFeed(topic);
  const videoIds: string[] = (data.videos ?? [])
    .map((v) => v.videoId)
    .filter((id): id is string => Boolean(id));
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
      <QuickExit />
      <div className="w-full max-w-2xl">
        <h1 className="text-xl mb-3 capitalize">{topic} feed</h1>
        <Player videoIds={videoIds} />
      </div>
    </main>
  );
}
