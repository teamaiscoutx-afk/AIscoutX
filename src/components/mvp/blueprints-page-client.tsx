"use client";

import { useEffect, useState } from "react";

import { BlueprintsView } from "@/components/mvp/blueprints-view";
import { loadVenturePackLocal } from "@/lib/mvp/venture-pack-storage";
import type { VenturePack } from "@/lib/mvp/types";

type BlueprintsPageClientProps = {
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

export function BlueprintsPageClient({ serverPack }: BlueprintsPageClientProps) {
  const [pack, setPack] = useState<VenturePack | null>(serverPack);

  useEffect(() => {
    setPack(pickLatest(loadVenturePackLocal(), serverPack));
  }, [serverPack]);

  return <BlueprintsView pack={pack} />;
}
