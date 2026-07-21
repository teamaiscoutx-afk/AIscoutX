"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserMenuContext } from "@/lib/auth/user-menu";

const Ctx = createContext<UserMenuContext | null>(null);

export function UserMenuProvider({
  value,
  children,
}: {
  value: UserMenuContext;
  children: React.ReactNode;
}) {
  const [currentValue, setCurrentValue] = useState<UserMenuContext>(value);

  useEffect(() => {
    // Sync initial server value
    setCurrentValue(value);

    const supabase = createClient();

    // Fetch fresh profile plan directly from Supabase client
    async function syncProfilePlan() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .maybeSingle();

        const activePlan = profile?.plan || user.user_metadata?.plan;

        if (activePlan) {
          setCurrentValue((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              plan: activePlan,
            },
            user: {
              ...prev.user,
              user_metadata: {
                ...prev.user?.user_metadata,
                plan: activePlan,
              },
            },
          }));
        }
      }
    }

    syncProfilePlan();
  }, [value]);

  return <Ctx.Provider value={currentValue}>{children}</Ctx.Provider>;
}

export function useUserMenu(): UserMenuContext {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      isAuthenticated: false,
      name: "Guest",
      email: "",
      initials: "G",
      avatarUrl: null,
      persona: null,
      goal: null,
      nicheFocus: null,
      activeVenture: "Exploring Opportunities",
    };
  }
  return ctx;
}