export default function Home() {
  return (
    <main className="flex flex-1 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Jobs
            </p>
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Create job
            </h1>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              This page is reserved for the primary job creation workflow.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
