"use client";
import { useEffect, useRef, useState } from "react";

export default function Player({ videoIds }: { videoIds: string[] }) {
  const [index, setIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Load persisted prefs
  useEffect(() => {
    try {
      const likedRaw = localStorage.getItem("likedVideos");
      const hiddenRaw = localStorage.getItem("hiddenVideos");
      if (likedRaw) setLiked(new Set(JSON.parse(likedRaw)));
      if (hiddenRaw) setHidden(new Set(JSON.parse(hiddenRaw)));
    } catch {}
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem("likedVideos", JSON.stringify(Array.from(liked)));
    } catch {}
  }, [liked]);
  useEffect(() => {
    try {
      localStorage.setItem("hiddenVideos", JSON.stringify(Array.from(hidden)));
    } catch {}
  }, [hidden]);

  const visibleIds = videoIds.filter((id) => !hidden.has(id));
  const vid = visibleIds[index];

  function sendCommand(func: string, args: unknown[] = []) {
    const msg = JSON.stringify({ event: "command", func, args });
    frameRef.current?.contentWindow?.postMessage(msg, "*");
  }

  function next() {
    setIndex((i) => Math.min(i + 1, Math.max(visibleIds.length - 1, 0)));
  }
  function prev() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  function togglePlayPause() {
    if (isPlaying) {
      sendCommand("pauseVideo");
      setIsPlaying(false);
    } else {
      sendCommand("playVideo");
      setIsPlaying(true);
    }
  }

  function toggleMute() {
    if (isMuted) {
      sendCommand("unMute");
      setIsMuted(false);
    } else {
      sendCommand("mute");
      setIsMuted(true);
    }
  }

  function toggleLike(id: string) {
    setLiked((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  }

  function hideCurrent(id: string) {
    setHidden((prev) => new Set(prev).add(id));
    // advance immediately
    next();
  }

  // Auto-advance on YouTube ended messages (robust parsing)
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      // Handle both stringified and object messages
      if (typeof data === "string") {
        if (data.includes("onStateChange") && data.includes('"data":0')) {
          next();
        }
      } else if (data && typeof data === "object") {
        // Some embeds post objects like {event: 'onStateChange', info: 0}
        // @ts-expect-error loose shape from third-party
        if (
          data.event === "onStateChange" &&
          (data.info === 0 || data.data === 0)
        ) {
          next();
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // visibleIds length ensures bounds for next()
  }, [visibleIds.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        prev();
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        next();
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying, isMuted, visibleIds.length]);

  if (!vid) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <p className="text-neutral-400">No videos available. Adjust filters.</p>
      </div>
    );
  }

  const src = `https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&mute=1&autoplay=1`;

  const isLiked = liked.has(vid);

  return (
    <div className="w-full h-[80vh] flex flex-col items-center">
      <iframe
        ref={frameRef}
        className="w-[360px] h-[640px] rounded-xl"
        src={src}
        title="Video player"
        allow="autoplay; encrypted-media"
      />
      <div className="mt-3 flex flex-wrap gap-3 items-center">
        <button aria-label="Previous" onClick={prev}>
          Prev
        </button>
        <button aria-label="Next" onClick={next}>
          Next
        </button>
        <button aria-label="Play or pause" onClick={togglePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button aria-label="Mute or unmute" onClick={toggleMute}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          aria-label={isLiked ? "Unlike" : "Like"}
          onClick={() => toggleLike(vid)}
        >
          {isLiked ? "Unlike" : "Like"}
        </button>
        <button aria-label="Hide this video" onClick={() => hideCurrent(vid)}>
          Hide
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Shortcuts: Space=Play/Pause, Up=Prev, Down=Next, M=Mute
      </p>
    </div>
  );
}
