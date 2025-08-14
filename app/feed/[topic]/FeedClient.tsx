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
  const joined = useMemo(() => ids.join("|"), [ids]);

  // If there are no videos, ask server to build the feed and then poll until available
  useEffect(() => {
    let cancelled = false;
    async function bootstrapIfEmpty() {
      if (ids.length > 0) return;
      setIsBootstrapping(true);
      try {
        // Kick off background build (dev/local only)
        await fetch(`/api/build-topic`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        }).catch(() => {});

        // Poll for up to ~20s
        for (let attempt = 0; attempt < 20 && !cancelled; attempt++) {
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
          <div className="rounded-lg bg-neutral-900 px-4 py-3 text-sm text-neutral-200 border border-neutral-800">
            Fetching videos for "{topic}"...
          </div>
        </div>
      )}
    </div>
  );
}


