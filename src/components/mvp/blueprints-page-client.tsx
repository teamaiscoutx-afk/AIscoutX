"use client";

import { useEffect, useState } from "react";

import type { UsageSnapshot } from "@/app/actions/usage";
import { BlueprintsView } from "@/components/mvp/blueprints-view";
import { loadVenturePackLocal } from "@/lib/mvp/venture-pack-storage";
import type { VenturePack } from "@/lib/mvp/types";

type BlueprintsPageClientProps = {
  serverPack: VenturePack | null;
  usage: UsageSnapshot;
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

export function BlueprintsPageClient({
  serverPack,
  usage,
}: BlueprintsPageClientProps) {
  const [pack, setPack] = useState<VenturePack | null>(serverPack);

  useEffect(() => {
    setPack(pickLatest(loadVenturePackLocal(), serverPack));
  }, [serverPack]);

  return <BlueprintsView pack={pack} usage={usage} />;
}
