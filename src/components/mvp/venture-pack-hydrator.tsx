"use client";

import { useEffect, useState } from "react";

import { loadVenturePackLocal } from "@/lib/mvp/venture-pack-storage";
import type { VenturePack } from "@/lib/mvp/types";

type VenturePackHydratorProps = {
  serverPack: VenturePack | null;
  children: (pack: VenturePack | null) => React.ReactNode;
};

function isNewer(a: VenturePack, b: VenturePack): boolean {
  return new Date(a.createdAt).getTime() > new Date(b.createdAt).getTime();
}

export function VenturePackHydrator({
  serverPack,
  children,
}: VenturePackHydratorProps) {
  const [pack, setPack] = useState<VenturePack | null>(serverPack);

  useEffect(() => {
    const local = loadVenturePackLocal();
    if (!local && !serverPack) {
      setPack(null);
      return;
    }
    if (!local) {
      setPack(serverPack);
      return;
    }
    if (!serverPack) {
      setPack(local);
      return;
    }
    setPack(isNewer(local, serverPack) ? local : serverPack);
  }, [serverPack]);

  return <>{children(pack)}</>;
}
