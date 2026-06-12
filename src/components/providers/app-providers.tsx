"use client";

import { Suspense } from "react";

import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import {
  LoadingProvider,
  LoadingProviderEffects,
} from "@/components/providers/loading-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <AuthSessionProvider>
        <Suspense fallback={null}>
          <LoadingProviderEffects />
        </Suspense>
        {children}
      </AuthSessionProvider>
    </LoadingProvider>
  );
}
