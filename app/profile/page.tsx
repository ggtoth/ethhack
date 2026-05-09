const skills = ["Landing pages", "Next.js", "Web3 UI"];

type ProfilePageProps = {
  searchParams?: Promise<{ payout?: string | string[] }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = (await searchParams) ?? {};
  const payoutParam = Array.isArray(params.payout) ? params.payout[0] : params.payout;
  const showPayout = payoutParam === "success";

  return (
    <main className="flex flex-1 bg-[var(--background)] px-4 py-8 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[980px] gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="profile-card rounded-[18px] p-5">
          <div className="grid justify-items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--text-primary)] text-2xl font-black text-[var(--background)] shadow-[0_18px_42px_rgba(15,23,42,0.12)]">
              MC
            </div>
            <h1 className="mt-4 text-xl font-black">Mira Chen</h1>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              Landing page freelancer
            </p>
            <div className="mt-4 rounded-full bg-[var(--surface-strong)] px-4 py-2 text-[12px] font-black">
              4.9 rating · 42 orders
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-[13px]">
            <ProfileFact label="Location" value="Budapest" />
            <ProfileFact label="Response" value="1h" />
            <ProfileFact label="Wallet" value="0xBae26...7eAe3" />
          </div>
        </aside>

        <div className="grid gap-4">
          <section className="profile-card wallet-card relative overflow-hidden rounded-[18px] p-5 sm:p-6">
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
                <h2 className="mt-1 text-4xl font-black leading-none">
                  {showPayout ? "$1,750" : "$250"}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <WalletMetric label="Earned" value={showPayout ? "$1,500" : "$0"} />
                <WalletMetric label="Payout" value={showPayout ? "$1,500" : "$0"} />
              </div>
            </div>
            {showPayout && (
              <p className="mt-4 rounded-[14px] bg-[var(--surface-strong)] px-4 py-3 text-[13px] font-black text-[var(--text-primary)]">
                Payment received in wallet
              </p>
            )}
          </section>

          <section className="profile-card rounded-[18px] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                  Active work
                </p>
                <h2 className="mt-2 max-w-[520px] text-2xl font-black leading-tight sm:text-3xl">
                  Web3 landing page build
                </h2>
              </div>
              <div className="rounded-[14px] bg-[var(--text-primary)] px-5 py-4 text-[var(--background)]">
                <p className="text-[11px] font-black uppercase opacity-60">Escrow</p>
                <p className="mt-1 text-xl font-black leading-none">1,500 USDT</p>
                <p className="mt-2 text-[11px] font-black uppercase opacity-70">
                  {showPayout ? "Released" : "Locked"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  className="rounded-full bg-[var(--surface-strong)] px-3 py-2 text-[12px] font-bold"
                  key={skill}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <article className="profile-card rounded-[18px] p-5">
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                Latest review
              </p>
              <h3 className="mt-2 text-lg font-black">Clean delivery</h3>
              <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
                Fast handoff, clear files, responsive UI.
              </p>
            </article>

            <aside className="profile-card rounded-[18px] p-5">
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                Status
              </p>
              <div className="mt-4 grid gap-3 text-[13px] font-black">
                <StatusRow label="AI approved" done={showPayout} />
                <StatusRow label="Wallet paid" done={showPayout} />
              </div>
            </aside>
          </section>
        </div>
      </section>

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
    </main>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-3">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}

function WalletMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[110px] rounded-[12px] bg-[var(--surface-strong)] px-3 py-3">
      <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-[16px] font-black">{value}</p>
    </div>
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
