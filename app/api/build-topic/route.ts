import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

async function buildAdHocTopic(topic: string) {
  const searchUrl = `https://www.youtube.com/feeds/videos.xml?search_query=${encodeURIComponent(
    topic
  )}`;
  const res = await fetch(searchUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`search feed ${res.status}`);
  const xml = await res.text();
  const entries = Array.from(xml.matchAll(/<entry>[\s\S]*?<\/entry>/g));
  const videos = entries
    .map((m) => m[0])
    .map((entry) => {
      const id = (entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1] || "";
      const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
      const published = (entry.match(/<published>([^<]+)<\/published>/) || [])[1] || "";
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

  const file = path.join(process.cwd(), "public", "feeds", `${topic}.json`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

export async function POST(request: Request) {
  try {
    const { topic } = (await request.json()) as { topic?: string };
    if (!topic) return NextResponse.json({ ok: false }, { status: 400 });
    if (process.env.NODE_ENV === "production") {
      // Avoid writing in production; just acknowledge
      return NextResponse.json({ ok: true, skipped: true });
    }
    // Always build or refresh on demand during dev
    const payload = await buildAdHocTopic(topic);
    return NextResponse.json({ ok: true, count: payload.videos.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
