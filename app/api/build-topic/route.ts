import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

async function buildAdHocTopic(topic: string) {
  const Parser = (await import("rss-parser")).default;
  const parser = new Parser();
  const searchUrl = `https://www.youtube.com/feeds/videos.xml?search_query=${encodeURIComponent(
    topic
  )}`;
  const feed = await parser.parseURL(searchUrl);
  const videos = (feed.items || [])
    .map((it: any) => {
      const rawId = typeof it.id === "string" ? it.id : "";
      const idFromId = rawId.includes(":") ? rawId.split(":").pop() : rawId;
      let videoId = idFromId || "";
      if (!videoId && typeof it.link === "string") {
        const m = it.link.match(/[?&]v=([\w-]{6,})/);
        if (m && m[1]) videoId = m[1];
      }
      if (!videoId) return null;
      return {
        id: it.id || videoId,
        title: it.title || topic,
        videoId,
        channel: feed.title || topic,
        publishedAt: it.isoDate || new Date().toISOString(),
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        tags: [topic],
      };
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
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
