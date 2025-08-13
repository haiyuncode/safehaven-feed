const Parser = require("rss-parser");
const fs = require("fs");

const parser = new Parser();

const topics = ["positivity", "narcissism", "fitness"];

function readSources() {
  const raw = fs.readFileSync("data/sources.json", "utf-8");
  return JSON.parse(raw);
}

async function fetchYouTubeChannel(channelId) {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feed = await parser.parseURL(url);
    return feed.items.map((it) => {
      const videoId = (it.id || "").split(":").pop() || "";
      return {
        id: it.id || videoId,
        title: it.title || "",
        videoId,
        channel: feed.title || "",
        publishedAt: it.isoDate || "",
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        tags: [],
      };
    });
  } catch (err) {
    return [];
  }
}

async function fetchBlog(rss) {
  try {
    const feed = await parser.parseURL(rss);
    return feed.items.map((it) => ({
      id: `link:${it.link}`,
      title: it.title || "",
      url: it.link || "",
      source: feed.title || "",
      publishedAt: it.isoDate || "",
      tags: [],
    }));
  } catch (err) {
    return [];
  }
}

async function buildTopic(topic, sources) {
  const src = sources[topic];
  if (!src) return;
  const videos = (
    await Promise.all(src.youtubeChannels.map((c) => fetchYouTubeChannel(c.channelId)))
  ).flat();
  const articles = (await Promise.all(src.blogs.map((b) => fetchBlog(b.rss)))).flat();

  const seen = new Set();
  const dedupedVideos = videos.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
  const dedupedArticles = articles.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));

  const newestFirst = (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  dedupedVideos.sort(newestFirst);
  dedupedArticles.sort(newestFirst);

  const payload = {
    topic,
    generatedAt: new Date().toISOString(),
    videos: dedupedVideos.slice(0, 200),
    articles: dedupedArticles.slice(0, 100),
  };
  fs.mkdirSync("public/feeds", { recursive: true });
  fs.writeFileSync(`public/feeds/${topic}.json`, JSON.stringify(payload, null, 2));
}

async function main() {
  const sources = readSources();
  for (const t of topics) {
    // build sequentially to be gentle on RSS endpoints
    // eslint-disable-next-line no-await-in-loop
    await buildTopic(t, sources);
  }
}

main().catch(() => process.exit(1));


