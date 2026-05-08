export function WorkflowStepper({
  steps,
  activeIndex = steps.length - 1,
}: {
  steps: string[];
  activeIndex?: number;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-6">
      {steps.map((step, index) => {
        const active = index <= activeIndex;

        return (
          <div
            className="relative rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4"
            key={step}
          >
            <div
              className={`grid h-8 w-8 place-items-center rounded-full text-[12px] font-bold ${
                active
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                  : "bg-[var(--surface-strong)] text-[var(--text-muted)]"
              }`}
            >
              {index + 1}
            </div>
            <p className="mt-4 text-[13px] font-bold text-[var(--text-primary)]">{step}</p>
          </div>
        );
      })}
    </div>
  );
}
