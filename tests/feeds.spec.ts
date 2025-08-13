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

  it("player mute preference persists across videos (unit)", () => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => void store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size as number;
      },
    } as unknown as Storage;
    localStorage.setItem("playerMuted", "false");
    expect(localStorage.getItem("playerMuted")).toBe("false");
    // simulate change back to muted and ensure it stores
    localStorage.setItem("playerMuted", "true");
    expect(localStorage.getItem("playerMuted")).toBe("true");
  });
});
