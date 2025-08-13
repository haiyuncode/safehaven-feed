// Use CommonJS-style requires to avoid ESM loader issues in Node/ts-node
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Parser = require("rss-parser");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");

type Topic = "positivity" | "narcissism" | "fitness";
type Sources = {
	[topic in Topic]: {
		youtubeChannels: { name: string; channelId: string }[];
		blogs: { name: string; rss: string }[];
	};
};

const parser = new Parser();
const sources: Sources = JSON.parse(fs.readFileSync("data/sources.json", "utf-8"));

async function fetchYouTubeChannel(channelId: string) {
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
			tags: [] as string[],
		};
	});
}

async function fetchBlog(rss: string) {
	const feed = await parser.parseURL(rss);
	return feed.items.map((it) => ({
		id: `link:${it.link}`,
		title: it.title || "",
		url: it.link || "",
		source: feed.title || "",
		publishedAt: it.isoDate || "",
		tags: [] as string[],
	}));
}

async function buildTopic(topic: Topic) {
	const src = sources[topic];
	const videos = (
		await Promise.all(src.youtubeChannels.map((c) => fetchYouTubeChannel(c.channelId)))
	).flat();
	const articles = (await Promise.all(src.blogs.map((b) => fetchBlog(b.rss)))).flat();

	const seen = new Set<string>();
	const dedupedVideos = videos.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
	const dedupedArticles = articles.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));

	const newestFirst = (a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
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
	const topics: Topic[] = ["positivity", "narcissism", "fitness"];
	await Promise.all(topics.map(buildTopic));
}

main();


