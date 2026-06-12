"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { tryCreateBrowserSupabaseClient } from "@/lib/supabase/client";

const AUTH_BROADCAST_CHANNEL = "aiscoutx-auth-sync";

/**
 * Keeps Supabase session in sync across browser tabs via auth events + BroadcastChannel.
 * Cookie session is authoritative; this refreshes server components when another tab signs in/out.
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    const supabase = tryCreateBrowserSupabaseClient();
    if (!supabase) return;

    const scheduleRefresh = () => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }
      refreshTimer.current = window.setTimeout(() => {
        router.refresh();
      }, 80);
    };

    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(AUTH_BROADCAST_CHANNEL)
        : null;

    channel?.addEventListener("message", scheduleRefresh);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        channel?.postMessage({ event, at: Date.now() });
        scheduleRefresh();
      }
    });

    return () => {
      subscription.unsubscribe();
      channel?.close();
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }
    };
  }, [router]);

  return children;
}

/** Notify other tabs after a successful server-side sign-in redirect lands. */
export function broadcastAuthSessionChange() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
  channel.postMessage({ event: "SIGNED_IN", at: Date.now() });
  channel.close();
}
