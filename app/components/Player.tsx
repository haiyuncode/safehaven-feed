"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type YTMessage = { event?: string; info?: number; data?: number };

function isYTMessage(value: unknown): value is YTMessage {
  return typeof value === "object" && value !== null;
}

export default function Player({
  videoIds,
  topic,
}: {
  videoIds: string[];
  topic?: string;
}) {
  const [index, setIndex] = useState(0);
  const [queueIds, setQueueIds] = useState<string[]>(videoIds);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [playerReady, setPlayerReady] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Load persisted prefs
  useEffect(() => {
    try {
      const likedRaw = localStorage.getItem("likedVideos");
      const hiddenRaw = localStorage.getItem("hiddenVideos");
      const mutedRaw = localStorage.getItem("playerMuted");
      if (likedRaw) setLiked(new Set(JSON.parse(likedRaw)));
      if (hiddenRaw) setHidden(new Set(JSON.parse(hiddenRaw)));
      if (mutedRaw !== null) setIsMuted(mutedRaw === "true");
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
  useEffect(() => {
    try {
      localStorage.setItem("playerMuted", String(isMuted));
    } catch {}
  }, [isMuted]);

  const visibleIds = queueIds.filter((id) => !hidden.has(id));
  const vid = visibleIds[index];
  const [loadedId, setLoadedId] = useState<string | undefined>(vid);

  // Initialize loadedId on first render or when the first visible id changes from empty
  useEffect(() => {
    if (!loadedId && vid) setLoadedId(vid);
  }, [vid, loadedId]);

  function sendCommand(func: string, args: unknown[] = []) {
    const msg = JSON.stringify({ event: "command", func, args });
    frameRef.current?.contentWindow?.postMessage(msg, "*");
  }

  const refreshFeed = useCallback(
    async (advanceIfAtEnd: boolean = false): Promise<number> => {
      if (!topic) return 0;
      try {
        setIsRefreshing(true);
        const res = await fetch(`/feeds/${topic}.json?ts=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        type VideoItem = { videoId?: string };
        const videosUnknown = (data as { videos?: unknown }).videos;
        const videosArr: VideoItem[] = Array.isArray(videosUnknown)
          ? (videosUnknown as VideoItem[])
          : [];
        const newIds: string[] = videosArr
          .map((v) => v.videoId)
          .filter(
            (id): id is string => typeof id === "string" && id.length > 3
          );
        if (newIds.length > 0) {
          const delta = newIds.filter((id) => !queueIds.includes(id));
          if (delta.length > 0) {
            setQueueIds((prev) => {
              const combined = prev.concat(delta);
              if (advanceIfAtEnd && atEnd) {
                setIndex((prevIdx) =>
                  Math.min(prevIdx + 1, combined.length - 1)
                );
                setAtEnd(false);
              }
              return combined;
            });
            return delta.length;
          }
        }
      } catch {
      } finally {
        setIsRefreshing(false);
      }
      return 0;
    },
    [topic, queueIds, atEnd]
  );

  const next = useCallback(() => {
    setIndex((i) => {
      const lastIdx = Math.max(visibleIds.length - 1, 0);
      const targetIdx = Math.min(i + 1, lastIdx);
      if (i >= lastIdx) {
        setAtEnd(true);
        void refreshFeed(true);
        return lastIdx;
      }
      const nextId = visibleIds[targetIdx];
      if (playerReady && nextId) {
        sendCommand("loadVideoById", [nextId]);
        // Always unmute on explicit next per requirement
        sendCommand("unMute");
        sendCommand("setVolume", [100]);
        sendCommand("playVideo");
        setIsMuted(false);
      } else {
        setLoadedId(nextId);
      }
      return targetIdx;
    });
  }, [playerReady, refreshFeed, visibleIds]);
  const prev = useCallback(() => {
    setIndex((i) => {
      const targetIdx = Math.max(i - 1, 0);
      const prevId = visibleIds[targetIdx];
      if (playerReady && prevId) {
        sendCommand("loadVideoById", [prevId]);
        sendCommand("unMute");
        sendCommand("setVolume", [100]);
        sendCommand("playVideo");
        setIsMuted(false);
      } else {
        setLoadedId(prevId);
      }
      return targetIdx;
    });
  }, [playerReady, visibleIds]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      sendCommand("pauseVideo");
      setIsPlaying(false);
    } else {
      sendCommand("playVideo");
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      sendCommand("unMute");
      setIsMuted(false);
    } else {
      sendCommand("mute");
      setIsMuted(true);
    }
  }, [isMuted]);

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
        // Unmute as soon as the player is ready
        if (data.includes("onReady")) {
          setPlayerReady(true);
          sendCommand("unMute");
          sendCommand("setVolume", [100]);
          sendCommand("playVideo");
          setIsMuted(false);
        }
        if (data.includes("onStateChange") && data.includes('"data":0')) {
          next();
        }
      } else if (isYTMessage(data)) {
        // Some embeds post objects like {event: 'onStateChange', info: 0}
        if (
          data.event === "onStateChange" &&
          (data.info === 0 || data.data === 0)
        ) {
          next();
        }
        if (data.event === "onReady") {
          setPlayerReady(true);
          sendCommand("unMute");
          sendCommand("setVolume", [100]);
          sendCommand("playVideo");
          setIsMuted(false);
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // visibleIds length ensures bounds for next()
  }, [visibleIds.length, isMuted, next]);

  // When the video changes and user prefers sound on, attempt to unmute after the iframe loads
  useEffect(() => {
    if (!vid || isMuted) return;
    const t = setTimeout(() => {
      sendCommand("unMute");
      sendCommand("setVolume", [100]);
      sendCommand("playVideo");
    }, 250);
    return () => clearTimeout(t);
  }, [vid, isMuted]);

  // Proactively refresh when nearing the end (<= 3 remaining)
  useEffect(() => {
    const remaining = Math.max(visibleIds.length - 1 - index, 0);
    if (remaining <= 3 && !isRefreshing && topic) {
      void refreshFeed(false);
    }
  }, [index, visibleIds.length, isRefreshing, topic, refreshFeed]);

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
  }, [
    isPlaying,
    isMuted,
    visibleIds.length,
    togglePlayPause,
    prev,
    next,
    toggleMute,
  ]);

  if (!vid) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <p className="text-neutral-400">No videos available. Adjust filters.</p>
      </div>
    );
  }

  const currentId = loadedId || vid;
  const src = `https://www.youtube-nocookie.com/embed/${currentId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&cc_load_policy=1&cc_lang_pref=en&mute=${
    isMuted ? 1 : 0
  }&autoplay=1`;
  const nextId =
    visibleIds[Math.min(index + 1, Math.max(visibleIds.length - 1, 0))];

  const isLiked = liked.has(vid);

  return (
    <div className="w-full h-[80vh] flex flex-col items-center">
      <iframe
        ref={frameRef}
        className="w-[360px] h-[640px] rounded-xl"
        src={src}
        title="Video player"
        allow="autoplay; encrypted-media"
        onLoad={() => {
          // Re-apply user mute preference and play state when the iframe loads
          if (isMuted) sendCommand("mute");
          else sendCommand("unMute");
          if (isPlaying) sendCommand("playVideo");
        }}
      />
      {/* Preload next video in a hidden iframe to reduce transition gap */}
      {nextId && nextId !== currentId && (
        <iframe
          className="w-0 h-0 opacity-0 pointer-events-none absolute"
          aria-hidden
          tabIndex={-1}
          src={`https://www.youtube-nocookie.com/embed/${nextId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=0&autoplay=0&mute=1`}
          title="preload"
        />
      )}
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
        {liked.size > 0 && (
          <a
            href="/liked"
            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
            aria-label="Open liked playlist"
          >
            Liked playlist
          </a>
        )}
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Shortcuts: Space=Play/Pause, Up=Prev, Down=Next, M=Mute
      </p>
      {atEnd && (
        <div className="mt-3 w-full max-w-md rounded-lg bg-neutral-900 border border-neutral-800 p-4 text-sm">
          <p className="mb-2">You&#39;ve reached the end of this feed.</p>
          <div className="flex flex-wrap gap-2">
            {topic && (
              <button
                disabled={isRefreshing}
                onClick={() => void refreshFeed(true)}
                className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50"
              >
                {isRefreshing ? "Refreshing..." : "Refresh feed"}
              </button>
            )}
            <button
              onClick={() => {
                setIndex(0);
                setAtEnd(false);
              }}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
            >
              Restart from beginning
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
            >
              Switch topic
            </button>
          </div>
          {!isRefreshing && (
            <p className="mt-2 text-neutral-500">
              New videos appear as feeds refresh every few hours.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
