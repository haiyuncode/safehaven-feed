"use client";
import { useEffect, useMemo, useState } from "react";

type FSWritable = {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
};
type FSFileHandle = {
  getFile: () => Promise<File>;
  createWritable: () => Promise<FSWritable>;
};
type WindowFS = Window & {
  showOpenFilePicker?: (opts?: unknown) => Promise<FSFileHandle[]>;
  showSaveFilePicker?: (opts?: unknown) => Promise<FSFileHandle>;
};
type NavigatorWithPersist = Navigator & {
  storage?: { persist?: () => Promise<boolean> };
};

export default function LikedPage() {
  const [liked, setLiked] = useState<string[]>([]);
  const [autoHandle, setAutoHandle] = useState<FSFileHandle | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("likedVideos");
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      setLiked(Array.isArray(arr) ? arr : []);
    } catch {
      setLiked([]);
    }
    // Request persistent storage to reduce eviction risk
    try {
      const nav = navigator as NavigatorWithPersist;
      void nav.storage?.persist?.();
    } catch {}
  }, []);

  const unique = useMemo(() => Array.from(new Set(liked)), [liked]);

  function saveToLocal(newList: string[]) {
    setLiked(newList);
    try {
      localStorage.setItem("likedVideos", JSON.stringify(newList));
    } catch {}
  }

  function remove(id: string) {
    const next = unique.filter((x) => x !== id);
    saveToLocal(next);
  }

  function clearAll() {
    saveToLocal([]);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(unique, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "liked-videos.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function importJson(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        const merged = Array.from(
          new Set([
            ...(liked || []),
            ...arr.filter((x) => typeof x === "string"),
          ])
        );
        saveToLocal(merged);
      }
    } catch {}
    ev.target.value = "";
  }

  async function openFromFile() {
    try {
      const w = window as WindowFS;
      if (!w.showOpenFilePicker) return;
      const [fileHandle] = await w.showOpenFilePicker({
        types: [
          {
            description: "JSON",
            accept: { "application/json": [".json"] },
          },
        ],
        excludeAcceptAllOption: false,
        multiple: false,
      } as unknown);
      const file = await fileHandle.getFile();
      const text = await file.text();
      const arr = JSON.parse(text);
      if (Array.isArray(arr)) {
        const merged = Array.from(
          new Set([
            ...(liked || []),
            ...arr.filter((x) => typeof x === "string"),
          ])
        );
        saveToLocal(merged);
      }
    } catch {}
  }

  async function chooseAutoSaveFile() {
    try {
      const w = window as WindowFS;
      if (!w.showSaveFilePicker) return;
      const fileHandle = await w.showSaveFilePicker({
        suggestedName: "liked-videos.json",
        types: [
          {
            description: "JSON",
            accept: { "application/json": [".json"] },
          },
        ],
        excludeAcceptAllOption: false,
      } as unknown);
      setAutoHandle(fileHandle);
      setAutoSaving(true);
      await writeToHandle(fileHandle, unique);
    } catch {}
  }

  async function writeToHandle(handle: FSFileHandle, list: string[]) {
    try {
      const writable = await handle.createWritable();
      await writable.write(
        new Blob([JSON.stringify(list, null, 2)], { type: "application/json" })
      );
      await writable.close();
    } catch {}
  }

  useEffect(() => {
    if (autoHandle && autoSaving) {
      void writeToHandle(autoHandle, unique);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unique, autoSaving]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl">Liked videos</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportJson}
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
          >
            Export
          </button>
          <button
            onClick={openFromFile}
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
          >
            Open file
          </button>
          {!autoSaving ? (
            <button
              onClick={chooseAutoSaveFile}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
            >
              Auto-save (session)
            </button>
          ) : (
            <button
              onClick={() => {
                setAutoSaving(false);
                setAutoHandle(null);
              }}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
            >
              Stop auto-save
            </button>
          )}
          <label className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm cursor-pointer">
            Import
            <input
              type="file"
              accept="application/json,.json"
              onChange={importJson}
              className="hidden"
            />
          </label>
          {unique.length > 0 && (
            <button
              onClick={clearAll}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      {unique.length === 0 ? (
        <p className="text-neutral-400">No liked videos yet.</p>
      ) : (
        <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {unique.map((id) => (
            <li
              key={id}
              className="rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800"
            >
              <iframe
                className="w-full aspect-video"
                src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`}
                title={`Liked ${id}`}
                allow="autoplay; encrypted-media"
              />
              <div className="p-3 flex items-center justify-between text-xs text-neutral-400">
                <span className="truncate pr-2">{id}</span>
                <button
                  onClick={() => remove(id)}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px]"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
