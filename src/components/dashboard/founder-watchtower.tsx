"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Bell, ExternalLink, Loader2, Radar } from "lucide-react";

import {
  fetchNotifications,
  markNotificationsRead,
  type PlatformNotification,
} from "@/app/actions/notifications";
import { useDashboardShell } from "@/components/dashboard/dashboard-shell-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type FounderWatchtowerProps = {
  initialNotifications?: PlatformNotification[];
};

/** Curated niche alerts with verified source links — no spam. */
export function FounderWatchtower({
  initialNotifications,
}: FounderWatchtowerProps) {
  const shell = useDashboardShell();
  const seed = initialNotifications ?? shell.notifications;

  const [notifications, setNotifications] = useState<PlatformNotification[]>(seed);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(() =>
    new Set(seed.filter((n) => !n.isRead).map((n) => n.id))
  );
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const fresh = await fetchNotifications();
        setNotifications(fresh);
        setUnreadIds(new Set(fresh.filter((n) => !n.isRead).map((n) => n.id)));
      } catch {
        // Keep seeded notifications — never leave the hub blank on fetch failure.
      }
    });
  }, []);

  const hasUnread = unreadIds.size > 0;

  const markAllRead = useCallback(() => {
    const ids = Array.from(unreadIds);
    setUnreadIds(new Set());
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    void markNotificationsRead(ids);
  }, [unreadIds]);

  const markOneRead = useCallback((id: string) => {
    setUnreadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    void markNotificationsRead([id]);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            hasUnread
              ? `Founder Watchtower, ${unreadIds.size} unread`
              : "Founder Watchtower"
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-zinc-500 transition-all duration-200 hover:border-[#00FF66]/30 hover:text-white hover:shadow-[0_0_16px_rgba(0,255,102,0.12)]"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" strokeWidth={1.5} />
          )}
          {hasUnread && (
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.9)]"
              aria-hidden
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(100vw-2rem,24rem)]">
        <div className="border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-[#00FF66]" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-white">Founder Watchtower</p>
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Curated updates for your niche — each with a verified source link
          </p>
        </div>

        <ul className="max-h-80 overflow-y-auto py-1">
          {notifications.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-zinc-500">
              No alerts yet. Mark a workspace active in your niche to start
              watching live signals.
            </li>
          ) : (
            notifications.map((notification) => {
              const isUnread = unreadIds.has(notification.id);
              return (
                <li key={notification.id}>
                  <div
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors",
                      isUnread && "bg-[#00FF66]/[0.03]"
                    )}
                  >
                    <div className="flex gap-3">
                      <span className="mt-0.5 text-base" aria-hidden>
                        {notification.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                          {notification.body}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="text-[10px] text-zinc-600">
                            {notification.timestamp}
                          </p>
                          {notification.sourceLink && (
                            <a
                              href={notification.sourceLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-[#00FF66] hover:underline"
                              onClick={() => markOneRead(notification.id)}
                            >
                              View source
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => markOneRead(notification.id)}
                          className="mt-2 text-[10px] text-zinc-500 hover:text-zinc-300"
                        >
                          Mark as read
                        </button>
                      </div>
                      {isUnread && (
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00FF66] shadow-[0_0_6px_rgba(0,255,102,0.8)]"
                          aria-hidden
                        />
                      )}
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>

        <div className="border-t border-white/[0.06] px-4 py-2.5">
          <button
            type="button"
            onClick={markAllRead}
            disabled={!hasUnread}
            className="w-full rounded-lg py-1.5 text-center text-xs font-medium text-zinc-500 transition-colors hover:text-[#00FF66] disabled:cursor-default disabled:opacity-40"
          >
            Mark all as read
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** @deprecated Use FounderWatchtower */
export const NotificationHub = FounderWatchtower;
