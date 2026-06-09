"use client";

import { useEffect, useState } from "react";

import { LaunchView } from "@/components/mvp/launch-view";
import { loadVenturePackLocal } from "@/lib/mvp/venture-pack-storage";
import type { VenturePack } from "@/lib/mvp/types";

type LaunchPageClientProps = {
  serverPack: VenturePack | null;
};

function pickLatest(
  local: VenturePack | null,
  server: VenturePack | null
): VenturePack | null {
  if (!local) return server;
  if (!server) return local;
  return new Date(local.createdAt).getTime() > new Date(server.createdAt).getTime()
    ? local
    : server;
}

export function LaunchPageClient({ serverPack }: LaunchPageClientProps) {
  const [pack, setPack] = useState<VenturePack | null>(serverPack);

  useEffect(() => {
    setPack(pickLatest(loadVenturePackLocal(), serverPack));
  }, [serverPack]);

  return <LaunchView pack={pack} />;
}
