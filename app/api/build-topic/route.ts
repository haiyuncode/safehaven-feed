import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { topic } = (await request.json()) as { topic?: string };
    if (!topic) return NextResponse.json({ ok: false }, { status: 400 });
    if (process.env.NODE_ENV === "production") {
      // Avoid writing in production; just acknowledge
      return NextResponse.json({ ok: true, skipped: true });
    }
    const file = path.join(process.cwd(), "public", "feeds", `${topic}.json`);
    try {
      await fs.stat(file);
      return NextResponse.json({ ok: true, exists: true });
    } catch {}
    // Ask the page loader to build ad-hoc by touching the file path via a minimal stub
    const payload = {
      topic,
      generatedAt: new Date().toISOString(),
      videos: [],
      articles: [],
    };
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
    return NextResponse.json({ ok: true, created: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}


