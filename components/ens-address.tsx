"use client";

import { useEffect, useState } from "react";

type EnsResult = { name: string | null; avatar: string | null };

const cache = new Map<string, EnsResult>();

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function EnsAddress({
  address,
  className,
  showAvatar = false,
}: {
  address: string;
  className?: string;
  showAvatar?: boolean;
}) {
  const [result, setResult] = useState<EnsResult>(
    () => cache.get(address) ?? { name: null, avatar: null },
  );

  useEffect(() => {
    if (!address?.startsWith("0x")) return;
    if (cache.has(address)) {
      setResult(cache.get(address)!);
      return;
    }

    fetch(`/api/ens/${address}`)
      .then((r) => r.json())
      .then((data: EnsResult) => {
        cache.set(address, data);
        setResult(data);
      })
      .catch(() => {});
  }, [address]);

  const display = result.name ?? shortAddress(address);

  if (showAvatar) {
    return (
      <div className="flex items-center gap-2">
        {result.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={display}
            className="h-6 w-6 rounded-full object-cover"
            src={result.avatar}
          />
        ) : (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-strong)] text-[9px] font-black">
            {address.slice(2, 4).toUpperCase()}
          </div>
        )}
        <span className={className}>{display}</span>
      </div>
    );
  }

  return <span className={className}>{display}</span>;
}
