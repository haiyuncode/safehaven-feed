"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TopicSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function normalizeTopic(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function go() {
    const topic = normalizeTopic(value);
    if (!topic) return;
    router.push(`/feed/${topic}`);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") go();
        }}
        placeholder="Enter a topic (e.g., positivity)"
        className="w-full rounded-lg bg-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-600"
      />
      <button
        onClick={go}
        className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-4 py-2"
      >
        Go
      </button>
    </div>
  );
}


