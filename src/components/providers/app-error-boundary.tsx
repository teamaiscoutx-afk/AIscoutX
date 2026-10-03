"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AIscoutX] client exception", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-semibold text-white">Something went wrong on this page.</p>
          <p className="max-w-md text-sm text-zinc-400">
            Your work is safe. Refresh to continue, or head back to your workspace.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Try again
            </button>
            <a
              href="/dashboard"
              className="rounded-lg bg-[#A3E635] px-3 py-1.5 text-xs font-semibold text-zinc-950"
            >
              Open dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
