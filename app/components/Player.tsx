"use client";
import { useEffect, useRef, useState } from "react";

export default function Player({ videoIds }: { videoIds: string[] }) {
  const [index, setIndex] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (
        typeof e.data === "string" &&
        e.data.includes("onStateChange") &&
        e.data.includes('"data":0')
      ) {
        setIndex((i) => Math.min(i + 1, videoIds.length - 1));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [videoIds.length]);

  const vid = videoIds[index];
  const src = `https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&mute=1&autoplay=1`;

  return (
    <div className="w-full h-[80vh] flex flex-col items-center">
      <iframe
        ref={frameRef}
        className="w-[360px] h-[640px] rounded-xl"
        src={src}
        title="Video player"
        allow="autoplay; encrypted-media"
      />
      <div className="mt-3 flex gap-3">
        <button onClick={() => setIndex((i) => Math.max(i - 1, 0))}>Prev</button>
        <button onClick={() => setIndex((i) => Math.min(i + 1, videoIds.length - 1))}>Next</button>
      </div>
    </div>
  );
}
