/**
 * Dashboard home — temporary scaffold shell proving the App Router + Tailwind
 * pipeline. Real dashboard sections arrive in M4/M5 (see PLAN.md).
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Prism</h1>
      <p className="max-w-md text-center text-zinc-600 dark:text-zinc-400">
        Personalized Content Dashboard — scaffold ready. Milestones tracked in
        PLAN.md.
      </p>
    </main>
  );
}
