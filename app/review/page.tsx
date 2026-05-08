import { PageHeader } from "@/components/page-header";
import { ReviewConsole } from "@/components/review-console";

export default function ReviewPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Review"
        title="AI delivery review console"
        description="Upload source and delivery images. The backend loads the locked job requirements before requesting the AI review."
      />
      <ReviewConsole />
    </main>
  );
}
