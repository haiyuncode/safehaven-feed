import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">Topic not found</h1>
        <p className="text-neutral-400">
          Pick one of the available topics or enter another topic.
        </p>
        <Link
          href="/"
          className="inline-block rounded bg-neutral-800 px-4 py-2 hover:bg-neutral-700"
        >
          Back to topics
        </Link>
      </div>
    </main>
  );
}
