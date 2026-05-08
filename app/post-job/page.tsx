import { CreateJobForm } from "@/components/create-job-form";

export default function PostJobPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-3 py-5 font-mono text-[var(--text-primary)] sm:px-6 sm:py-8 lg:px-8 lg:py-5">
      <section className="mx-auto grid w-full max-w-[980px] gap-4 lg:grid-cols-[1fr_320px] lg:gap-5">
        <CreateJobForm />
      </section>
    </main>
  );
}
