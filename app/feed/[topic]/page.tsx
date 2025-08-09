import fs from "fs";
import path from "path";
import Player from "@/app/components/Player";
import QuickExit from "@/app/components/QuickExit";

async function loadFeed(topic: string) {
  const file = path.join(process.cwd(), "public", "feeds", `${topic}.json`);
  const json = await fs.promises.readFile(file, "utf8");
  return JSON.parse(json);
}

export default async function Page({ params }: { params: { topic: string } }) {
  const data = await loadFeed(params.topic);
  const videoIds: string[] = (data.videos || []).map((v: any) => v.videoId).filter(Boolean);
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
      <QuickExit />
      <div className="w-full max-w-2xl">
        <h1 className="text-xl mb-3 capitalize">{params.topic} feed</h1>
        <Player videoIds={videoIds} />
      </div>
    </main>
  );
}
