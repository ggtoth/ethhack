import { ReviewWorkbench } from "@/components/review-workbench";

export default function Home() {
  return (
    <main className="flex flex-1 bg-[var(--background)] text-[var(--foreground)]">
      <ReviewWorkbench />
    </main>
  );
}
