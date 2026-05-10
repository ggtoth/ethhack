"use client";

import { useEffect, useState } from "react";

import { EnsAddress } from "@/components/ens-address";

const badges = [
  { icon: "✓", label: "Verified", style: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { icon: "◆", label: "Funded", style: "bg-sky-100 text-sky-800 border-sky-200" },
];

export function ProfileIdentityCard() {
  const [imageUrl, setImageUrl] = useState("");
  const [displayName, setDisplayName] = useState("My freelancer profile");
  const [editingName, setEditingName] = useState(false);
  const [copied, setCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState("0xBae26833E6be85011f8620b24e223b908457eAe3");

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    window.ethereum
      .request<string[]>({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts[0]) setWalletAddress(accounts[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <label className="group relative grid h-20 w-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--surface-elevated)_78%,transparent)] shadow-[inset_0_0_0_1px_var(--border),0_18px_38px_rgba(15,23,42,0.06)]">
          <input
            accept="image/*"
            className="sr-only"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (imageUrl) URL.revokeObjectURL(imageUrl);
              setImageUrl(URL.createObjectURL(file));
            }}
          />
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="Profile preview" className="h-full w-full object-cover" src={imageUrl} />
          ) : (
            <EnsAvatarOrFallback address={walletAddress} />
          )}
          <span className="absolute inset-x-0 bottom-0 bg-[color-mix(in_srgb,var(--background)_85%,transparent)] py-1 text-center text-[9px] font-black uppercase opacity-0 transition group-hover:opacity-100">
            Upload
          </span>
        </label>

        <div>
          <p className="text-[11px] font-black uppercase text-[var(--success)]">
            Freelancer profile
          </p>
          {editingName ? (
            <input
              autoFocus
              className="mt-2 w-full max-w-[360px] rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[24px] font-black leading-none outline-none focus:border-[var(--text-primary)]"
              value={displayName}
              onBlur={() => setEditingName(false)}
              onChange={(event) => setDisplayName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") setEditingName(false);
              }}
            />
          ) : (
            <button
              className="mt-2 block text-left text-[30px] font-black leading-none text-[var(--text-primary)]"
              type="button"
              onClick={() => setEditingName(true)}
            >
              <EnsNameOrFallback address={walletAddress} fallback={displayName} />
            </button>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-muted)]">
            <span>Sepolia · active escrow user</span>
            <button
              className="rounded-full bg-[color-mix(in_srgb,var(--surface-strong)_74%,transparent)] px-3 py-1 text-[11px] font-black uppercase text-[var(--text-primary)]"
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(walletAddress);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }}
            >
              {copied ? "Copied" : "Copy profile"}
            </button>
            <span className="rounded-full bg-[color-mix(in_srgb,var(--surface-strong)_74%,transparent)] px-3 py-1 text-[11px] font-black text-[var(--text-muted)]">
              <EnsAddress address={walletAddress} />
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-black uppercase ${badge.style}`}
                key={badge.label}
              >
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-center">
        {[
          ["Active", "1"],
          ["Locked", "1,500"],
        ].map(([label, value]) => (
          <div
            className="min-w-[86px] rounded-[14px] bg-[color-mix(in_srgb,var(--surface-elevated)_70%,transparent)] px-4 py-3 shadow-[inset_0_0_0_1px_var(--border)]"
            key={label}
          >
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">{label}</p>
            <p className="mt-1 text-[16px] font-black">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnsAvatarOrFallback({ address }: { address: string }) {
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!address?.startsWith("0x")) return;
    fetch(`/api/ens/${address}`)
      .then((r) => r.json())
      .then((d: { avatar: string | null }) => setAvatar(d.avatar))
      .catch(() => {});
  }, [address]);

  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="ENS avatar" className="h-full w-full object-cover" src={avatar} />
    );
  }

  return <span className="text-[22px] font-black">0x</span>;
}

function EnsNameOrFallback({ address, fallback }: { address: string; fallback: string }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!address?.startsWith("0x")) return;
    fetch(`/api/ens/${address}`)
      .then((r) => r.json())
      .then((d: { name: string | null }) => setName(d.name))
      .catch(() => {});
  }, [address]);

  return <>{name ?? fallback}</>;
}
