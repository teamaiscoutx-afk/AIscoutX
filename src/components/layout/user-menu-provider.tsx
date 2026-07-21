"use client";

import { createContext, useContext } from "react";
import type { UserMenuContext } from "@/lib/auth/user-menu";

const Ctx = createContext<UserMenuContext | null>(null);

export function UserMenuProvider({
  value,
  children,
}: {
  value: UserMenuContext;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
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