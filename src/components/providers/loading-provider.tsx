"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

type LoadingContextValue = {
  isLoading: boolean;
  message: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  trackPromise: <T>(promise: Promise<T>, message?: string) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

function GlobalLoadingOverlay({
  active,
  message,
}: {
  active: boolean;
  message: string;
}) {
  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#020206]/75 backdrop-blur-[2px]"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="glass-panel flex max-w-sm flex-col items-center gap-4 rounded-2xl border-white/[0.08] px-8 py-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <Loader2 className="h-10 w-10 animate-spin text-[#deff9a]" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-white">{message}</p>
          <p className="mt-1 text-xs text-zinc-500">Please wait — do not close this tab.</p>
        </div>
      </div>
    </div>
  );
}

function NavigationLoadingListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { stopLoading } = useLoading();

  useEffect(() => {
    stopLoading();
  }, [pathname, searchParams, stopLoading]);

  return null;
}

function InternalLinkLoadingListener() {
  const { startLoading } = useLoading();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor?.href || anchor.target === "_blank") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      startLoading("Loading page…");
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [startLoading]);

  return null;
}

function BodyLoadingLock({ active }: { active: boolean }) {
  useEffect(() => {
    if (active) {
      document.body.dataset.globalLoading = "true";
    } else {
      delete document.body.dataset.globalLoading;
    }
    return () => {
      delete document.body.dataset.globalLoading;
    };
  }, [active]);

  return null;
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const depthRef = useRef(0);
  const [message, setMessage] = useState("Processing…");
  const [visible, setVisible] = useState(false);

  const startLoading = useCallback((nextMessage = "Processing…") => {
    depthRef.current += 1;
    setMessage(nextMessage);
    setVisible(true);
  }, []);

  const stopLoading = useCallback(() => {
    depthRef.current = Math.max(0, depthRef.current - 1);
    if (depthRef.current === 0) {
      setVisible(false);
    }
  }, []);

  const trackPromise = useCallback(
    async <T,>(promise: Promise<T>, nextMessage = "Processing…"): Promise<T> => {
      startLoading(nextMessage);
      try {
        return await promise;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  const value = useMemo(
    () => ({
      isLoading: visible,
      message,
      startLoading,
      stopLoading,
      trackPromise,
    }),
    [visible, message, startLoading, stopLoading, trackPromise]
  );

  return (
    <LoadingContext.Provider value={value}>
      <BodyLoadingLock active={visible} />
      <GlobalLoadingOverlay active={visible} message={message} />
      {children}
    </LoadingContext.Provider>
  );
}

export function LoadingProviderEffects() {
  return (
    <>
      <NavigationLoadingListener />
      <InternalLinkLoadingListener />
    </>
  );
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return ctx;
}

export function useOptionalLoading(): LoadingContextValue | null {
  return useContext(LoadingContext);
}
