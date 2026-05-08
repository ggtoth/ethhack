import { PageHeader } from "@/components/page-header";
import { ReviewConsole } from "@/components/review-console";

export default function ReviewPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Review"
        title="AI delivery review console"
        description="Upload source and delivery images, add a compact brief, and submit them to the existing structured review endpoint."
      />
      <ReviewConsole />
    </main>
  );
}
