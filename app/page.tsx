import Link from 'next/link';

export default function Page() {
  const topics = [
    { id: 'positivity', name: 'Daily Positivity' },
    { id: 'narcissism', name: 'Narcissism Recovery' },
    { id: 'fitness', name: 'Fitness Basics' },
  ];
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Choose your topic</h1>
        <ul className="space-y-3">
          {topics.map((t) => (
            <li key={t.id}>
              <Link className="block rounded-lg bg-neutral-800 hover:bg-neutral-700 p-4" href={'/feed/' + t.id}>
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
