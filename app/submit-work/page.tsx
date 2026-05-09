import { DeveloperSubmitWorkspace } from "@/components/developer-submit-workspace";

export default function SubmitWorkPage() {
  return (
    <main className="flex flex-1 bg-[var(--background)] px-4 py-8 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <DeveloperSubmitWorkspace />
    </main>
  );
}
