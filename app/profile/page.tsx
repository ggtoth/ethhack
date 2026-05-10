import Link from "next/link";
import { listDummyJobs, getDummyEscrowContractForJob } from "@/lib/workflow/dummy-endpoints";

const freelancerSkills = ["Landing pages", "Next.js", "Web3 UI"];

type ProfileView = "customer" | "freelancer";

const customerCurrentJobs = [
  {
    title: "Logo refresh",
    description: "Create a cleaner mark based on the uploaded reference image.",
    budget: "$120",
    due: "Jun 30, 2026",
    status: "Waiting for developer",
  },
  {
    title: "Checkout page fix",
    description: "Fix mobile layout and make the payment button easier to understand.",
    budget: "$240",
    due: "Jul 4, 2026",
    status: "In progress",
  },
];

const customerPreviousJobs = [
  {
    title: "Landing page hero",
    description: "Delivered responsive hero section and source files.",
    budget: "$380",
    due: "May 18, 2026",
    status: "Completed",
  },
  {
    title: "Product card UI",
    description: "Cleaned up spacing, typography, and empty states.",
    budget: "$90",
    due: "May 2, 2026",
    status: "Completed",
  },
];

type ProfilePageProps = {
  searchParams?: Promise<{
    payout?: string | string[];
    view?: string | string[];
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = (await searchParams) ?? {};
  const payoutParam = getFirstParam(params.payout);
  const viewParam = getFirstParam(params.view);
  const view: ProfileView = viewParam === "customer" ? "customer" : "freelancer";
  const showPayout = payoutParam === "success" && view === "freelancer";

  return (
    <main className="flex flex-1 bg-[var(--background)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[900px] gap-3">
        {view === "customer" ? (
          <CustomerProfile />
        ) : (
          <FreelancerProfile showPayout={showPayout} />
        )}
      </section>

      <ProfileStyles />
    </main>
  );
}

function CustomerProfile() {
  return (
    <section className="mx-auto grid w-full max-w-[1120px] gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <p className="inline-flex rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] font-black uppercase tracking-wide text-[var(--text-secondary)]">
            5.0 stars
          </p>
          <p className="inline-flex rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] font-black uppercase tracking-wide text-[var(--text-secondary)]">
            {customerCurrentJobs.length} current jobs
          </p>
        </div>
        <a
          className="inline-flex h-9 items-center rounded-[9px] bg-[var(--text-primary)] px-4 text-[12px] font-black uppercase text-[var(--background)]"
          href="/post-job"
        >
          Create
        </a>
      </div>

      <CustomerJobSection jobs={customerCurrentJobs} title="Current jobs" />
      <CustomerJobSection jobs={customerPreviousJobs} title="Previous jobs" />
    </section>
  );
}

function CustomerJobSection({
  jobs,
  title,
}: {
  jobs: Array<{
    title: string;
    description: string;
    budget: string;
    due: string;
    status: string;
  }>;
  title: string;
}) {
  return (
    <section className="grid gap-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-[var(--text-muted)]">
        {title}
      </p>
      <div className="grid gap-4">
        {jobs.map((job) => (
          <article
            className="grid gap-5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-5 py-5 shadow-[var(--shadow-card)] sm:grid-cols-[minmax(0,1fr)_140px_150px] sm:items-center sm:px-6"
            key={job.title}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-[18px] font-black text-[var(--text-primary)]">
                  {job.title}
                </h2>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-2.5 py-1 text-[10px] font-black uppercase text-[var(--text-muted)]">
                  {job.status}
                </span>
              </div>
              <p className="mt-1 truncate text-[13px] text-[var(--text-muted)]">
                {job.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
              <div>
                <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">
                  Budget
                </p>
                <p className="mt-1 text-[14px] font-black text-[var(--text-primary)]">
                  {job.budget}
                </p>
              </div>
              <div className="sm:mt-3">
                <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">
                  Due
                </p>
                <p className="mt-1 text-[14px] font-black text-[var(--text-primary)]">
                  {job.due}
                </p>
              </div>
            </div>

            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-[11px] bg-[var(--text-primary)] px-4 text-[13px] font-black text-[var(--background)] sm:w-auto"
              type="button"
            >
              View
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function CustomerReviews() {
  return (
    <section className="profile-card rounded-[14px] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black">Reviews from freelancers</h2>
        <p className="text-[13px] font-black">5.0 (7)</p>
      </div>

      <div className="mt-4 grid gap-3">
        <FreelancerReview
          initials="BQ"
          location="Venezuela"
          name="betoquintana"
          text="Clear brief, fast answers, escrow ready."
        />
        <FreelancerReview
          initials="SG"
          location="India"
          name="theserverguy"
          text="Outstanding client. Smooth review and quick approval."
        />
      </div>
    </section>
  );
}

function FreelancerReview({
  initials,
  location,
  name,
  text,
}: {
  initials: string;
  location: string;
  name: string;
  text: string;
}) {
  return (
    <article className="rounded-[12px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--text-primary)] text-[12px] font-black text-[var(--background)]">
          {initials}
        </div>
        <div>
          <p className="text-[14px] font-black">{name}</p>
          <p className="text-[12px] text-[var(--text-muted)]">{location}</p>
        </div>
        <p className="ml-auto text-[13px] font-black">5.0</p>
      </div>
      <p className="mt-3 text-[13px] leading-5 text-[var(--text-secondary)]">{text}</p>
    </article>
  );
}

async function FreelancerProfile({ showPayout }: { showPayout: boolean }) {
  const allJobs = listDummyJobs();
  const activeJobs = allJobs
    .filter((j) => j.status === "in_progress" || j.status === "submitted" || j.status === "ai_reviewed")
    .map((j) => ({ job: j, contract: getDummyEscrowContractForJob(j.id) }));

  return (
    <section className="grid gap-3 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="profile-card self-start rounded-[14px] p-4">
        <div className="grid justify-items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--text-primary)] text-xl font-black text-[var(--background)] shadow-[0_14px_34px_rgba(15,23,42,0.1)]">
            MC
          </div>
          <h1 className="mt-3 text-lg font-black">Mira Chen</h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Landing page freelancer
          </p>
          <div className="mt-3 rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-[12px] font-black">
            4.9 rating - 42 orders
          </div>
        </div>

        <div className="mt-5 grid gap-2 text-[13px]">
          <ProfileFact label="Location" value="Budapest" />
          <ProfileFact label="Response" value="1h" />
          <ProfileFact label="Wallet" value="0xBae26...7eAe3" />
        </div>
      </aside>

      <div className="grid gap-3">
        <section className="profile-card wallet-card relative overflow-hidden rounded-[14px] p-4 sm:p-5">
          {showPayout && (
            <div className="coin-flight" aria-hidden="true">
              +$1,500
            </div>
          )}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                Wallet
              </p>
              <h2 className="mt-1 text-3xl font-black leading-none">
                {showPayout ? "$1,750" : "$250"}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <WalletMetric label="Earned" value={showPayout ? "$1,500" : "$0"} />
              <WalletMetric label="Payout" value={showPayout ? "$1,500" : "$0"} />
            </div>
          </div>
          {showPayout && (
            <p className="mt-3 rounded-[12px] bg-[var(--surface-strong)] px-4 py-2.5 text-[13px] font-black text-[var(--text-primary)]">
              Payment received in wallet
            </p>
          )}
        </section>

        <section className="profile-card rounded-[14px] p-4 sm:p-5">
          <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
            Active work
          </p>

          {activeJobs.length === 0 ? (
            <p className="mt-3 text-[14px] text-[var(--text-muted)]">No active jobs yet.</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {activeJobs.map(({ job, contract }) => (
                <article
                  key={job.id}
                  className="flex flex-col gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-black text-[var(--text-primary)]">
                        {job.title}
                      </h3>
                      <span className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1 text-[10px] font-black uppercase text-[var(--text-muted)]">
                        {job.status === "in_progress" ? "In Progress" : job.status === "submitted" ? "Submitted" : "AI Reviewed"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--text-secondary)]">
                      {job.requirements ?? job.description}
                    </p>
                    {contract && (
                      <p className="mt-1 text-[12px] font-black text-[var(--text-muted)]">
                        Escrow: {contract.amount} ETH · {contract.status}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/submit-work?job=${encodeURIComponent(job.id)}`}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--text-primary)] px-5 text-[13px] font-black text-[var(--background)]"
                  >
                    Submit work
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <SmallCard eyebrow="Latest review" title="Clean delivery" body="Fast handoff, clear files, responsive UI." />
          <StatusCard
            rows={[
              ["AI approved", showPayout],
              ["Wallet paid", showPayout],
            ]}
          />
        </section>
      </div>
    </section>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-2.5">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}

function WalletMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[104px] rounded-[10px] bg-[var(--surface-strong)] px-3 py-2.5">
      <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-[16px] font-black">{value}</p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-[12px] font-bold">
      {children}
    </span>
  );
}

function SmallCard({
  body,
  eyebrow,
  title,
}: {
  body: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <article className="profile-card rounded-[14px] p-4">
      <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-lg font-black">{title}</h3>
      <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{body}</p>
    </article>
  );
}

function StatusCard({ rows }: { rows: Array<[string, boolean]> }) {
  return (
    <aside className="profile-card rounded-[14px] p-4">
      <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
        Status
      </p>
      <div className="mt-4 grid gap-3 text-[13px] font-black">
        {rows.map(([label, done]) => (
          <StatusRow done={done} key={label} label={label} />
        ))}
      </div>
    </aside>
  );
}

function StatusRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          done ? "bg-[var(--text-primary)]" : "bg-[var(--surface-strong)]"
        }`}
      />
      <span className={done ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
        {label}
      </span>
    </div>
  );
}

function getFirstParam(value?: string | string[]) {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();

  return trimmed || null;
}

function ProfileStyles() {
  return (
    <style>{`
      .profile-card {
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.56)),
          color-mix(in srgb, var(--surface) 88%, white);
        border: 1px solid rgba(20, 26, 35, 0.08);
        box-shadow:
          0 24px 64px rgba(15, 23, 42, 0.055),
          inset 0 1px 0 rgba(255, 255, 255, 0.72);
      }

      :root[data-theme="dark"] .profile-card {
        background:
          linear-gradient(180deg, rgba(32, 36, 43, 0.72), rgba(25, 27, 32, 0.58)),
          var(--surface);
        border-color: var(--border);
        box-shadow:
          0 24px 64px rgba(0, 0, 0, 0.22),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      .wallet-card {
        box-shadow:
          0 26px 72px rgba(15, 23, 42, 0.07),
          inset 0 1px 0 rgba(255, 255, 255, 0.72);
      }

      .coin-flight {
        position: absolute;
        right: 28px;
        top: 24px;
        border-radius: 999px;
        background: var(--text-primary);
        color: var(--background);
        padding: 8px 14px;
        font-size: 15px;
        font-weight: 900;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14);
        animation: coin-to-wallet 1200ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }

      @keyframes coin-to-wallet {
        0% {
          opacity: 0;
          transform: translate(70px, -26px) scale(0.76);
        }
        42% {
          opacity: 1;
          transform: translate(0, 0) scale(1.04);
        }
        100% {
          opacity: 0;
          transform: translate(-220px, 42px) scale(0.45);
        }
      }
    `}</style>
  );
}
