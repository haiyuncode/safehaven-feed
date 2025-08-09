"use client";
import { useRouter } from "next/navigation";

export default function QuickExit() {
  const router = useRouter();
  function quickExit() {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {}
    window.open("https://news.ycombinator.com", "_blank");
    router.replace("/");
  }
  return (
    <button onClick={quickExit} className="fixed right-3 top-3 z-50 rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700">
      Quick Exit
    </button>
  );
}
