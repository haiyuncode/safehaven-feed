import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import { execSync } from "child_process";

const topics = ["positivity", "narcissism", "fitness"];

describe("feed json validity", () => {
  beforeAll(() => {
    execSync(
      process.platform === "win32"
        ? "node scripts/build-feeds.cjs"
        : "node scripts/build-feeds.cjs",
      { stdio: "ignore" }
    );
  });
  for (const t of topics) {
    it(`${t} feed has valid JSON and at least one videoId`, () => {
      const raw = fs
        .readFileSync(`public/feeds/${t}.json`, "utf8")
        .replace(/^\uFEFF/, "")
        .trim();
      const j = JSON.parse(raw);
      expect(typeof j.generatedAt).toBe("string");
      expect(j.generatedAt.length).toBeGreaterThan(0);
      expect(Array.isArray(j.videos)).toBe(true);
      expect(j.videos.length).toBeGreaterThan(0);
      expect(typeof j.videos[0].videoId).toBe("string");
      expect(j.videos[0].videoId.length).toBeGreaterThan(3);
    });
  }
});
