const freelancerSkills = ["Landing pages", "Next.js", "Web3 UI"];
const customerTags = ["Mobile app", "Escrow", "AI review"];

type ProfileView = "customer" | "freelancer";

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
    <section className="grid gap-3 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="profile-card self-start rounded-[14px] p-4">
        <div className="grid justify-items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--text-primary)] text-xl font-black text-[var(--background)] shadow-[0_14px_34px_rgba(15,23,42,0.1)]">
            CL
          </div>
          <h1 className="mt-3 text-lg font-black">Orbit Labs</h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            Product client account
          </p>
          <div className="mt-3 rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-[12px] font-black">
            8 funded jobs
          </div>
        </div>

        <div className="mt-5 grid gap-2 text-[13px]">
          <ProfileFact label="Role" value="Customer" />
          <ProfileFact label="Spent" value="$12,800" />
          <ProfileFact label="Wallet" value="0xA12c...9F04" />
        </div>
      </aside>

      <div className="grid gap-3">
        <section className="profile-card rounded-[14px] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                Customer wallet
              </p>
              <h2 className="mt-1 text-3xl font-black leading-none">$6,400</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <WalletMetric label="Requested" value="$18,200" />
              <WalletMetric label="Escrowed" value="$1,500" />
            </div>
          </div>
        </section>

        <section className="profile-card rounded-[14px] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                Active request
              </p>
              <h2 className="mt-2 max-w-[500px] text-2xl font-black leading-tight">
                Mobile app MVP design
              </h2>
            </div>
            <div className="rounded-[12px] bg-[var(--text-primary)] px-4 py-3 text-[var(--background)]">
              <p className="text-[11px] font-black uppercase opacity-60">Budget</p>
              <p className="mt-1 text-xl font-black leading-none">1,500 USDT</p>
              <p className="mt-2 text-[11px] font-black uppercase opacity-70">Funded</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {customerTags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </section>

        <CustomerReviews />

        <section className="grid gap-3 sm:grid-cols-2">
          <SmallCard eyebrow="Requests" title="12 posted" body="3 active, 9 completed" />
          <StatusCard rows={[["Escrow funded", true], ["Work submitted", false]]} />
        </section>
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

function FreelancerProfile({ showPayout }: { showPayout: boolean }) {
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                Active work
              </p>
              <h2 className="mt-2 max-w-[500px] text-2xl font-black leading-tight">
                Web3 landing page build
              </h2>
            </div>
            <div className="rounded-[12px] bg-[var(--text-primary)] px-4 py-3 text-[var(--background)]">
              <p className="text-[11px] font-black uppercase opacity-60">Escrow</p>
              <p className="mt-1 text-xl font-black leading-none">1,500 USDT</p>
              <p className="mt-2 text-[11px] font-black uppercase opacity-70">
                {showPayout ? "Released" : "Locked"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {freelancerSkills.map((skill) => (
              <Tag key={skill}>{skill}</Tag>
            ))}
          </div>
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
