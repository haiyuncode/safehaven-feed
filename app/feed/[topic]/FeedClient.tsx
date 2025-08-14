"use client";

import { useEffect, useMemo, useState } from "react";
import Player from "@/app/components/Player";

type Props = {
  topic: string;
  initialIds: string[];
};

export default function FeedClient({ topic, initialIds }: Props) {
  const [ids, setIds] = useState<string[]>(initialIds);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const joined = useMemo(() => ids.join("|"), [ids]);

  // If there are no videos, ask server to build the feed and then poll until available
  useEffect(() => {
    let cancelled = false;
    async function bootstrapIfEmpty() {
      if (ids.length > 0) return;
      setIsBootstrapping(true);
      try {
        // Kick off background build (dev/local only)
        setProgress("Requesting feed build...");
        await fetch(`/api/build-topic`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        }).catch(() => {});

        // Poll for up to ~20s
        for (let attempt = 0; attempt < 30 && !cancelled; attempt++) {
          setProgress(`Checking for videos... (${attempt + 1}/20)`);
          await new Promise((r) => setTimeout(r, 1000));
          const res = await fetch(`/feeds/${topic}.json?ts=${Date.now()}`, {
            cache: "no-store",
          });
          if (!res.ok) continue;
          const data = await res.json();
          const nextIds: string[] = Array.isArray(data?.videos)
            ? data.videos
                .map((v: any) => v?.videoId)
                .filter((x: any): x is string => typeof x === "string")
            : [];
          if (nextIds.length > 0) {
            setIds(nextIds);
            break;
          }
        }
      } finally {
        setIsBootstrapping(false);
        setProgress("");
      }
    }
    void bootstrapIfEmpty();
    return () => {
      cancelled = true;
    };
  }, [topic, joined, ids.length]);

  return (
    <div className="relative">
      <Player videoIds={ids} topic={topic} />
      {isBootstrapping && (
        <div className="absolute inset-0 grid place-items-center bg-black/50">
          <div className="rounded-lg bg-neutral-900 px-4 py-3 text-sm text-neutral-200 border border-neutral-800 flex items-center gap-3">
            <svg
              className="animate-spin h-4 w-4 text-neutral-300"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span>
              Fetching videos for "{topic}"... {progress}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
