"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Bell, Loader2 } from "lucide-react";

import {
  fetchNotifications,
  markNotificationsRead,
  type PlatformNotification,
} from "@/app/actions/notifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type NotificationHubProps = {
  initialNotifications?: PlatformNotification[];
};

export function NotificationHub({
  initialNotifications = [],
}: NotificationHubProps) {
  const [notifications, setNotifications] =
    useState<PlatformNotification[]>(initialNotifications);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(() =>
    new Set(initialNotifications.filter((n) => !n.isRead).map((n) => n.id))
  );
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      const fresh = await fetchNotifications();
      if (fresh.length) {
        setNotifications(fresh);
        setUnreadIds(new Set(fresh.filter((n) => !n.isRead).map((n) => n.id)));
      }
    });
  }, []);

  const hasUnread = unreadIds.size > 0;

  const markAllRead = useCallback(() => {
    const ids = Array.from(unreadIds);
    setUnreadIds(new Set());
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
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
              ? `Notifications, ${unreadIds.size} unread`
              : "Notifications"
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-zinc-500 transition-all duration-200 hover:border-white/[0.12] hover:text-white hover:shadow-[0_0_16px_rgba(222,255,154,0.08)]"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" strokeWidth={1.5} />
          )}
          {hasUnread && (
            <span
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#deff9a] shadow-[0_0_8px_rgba(222,255,154,0.9)]"
              aria-hidden
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)]">
        <div className="border-b border-white/[0.06] px-4 py-3">
          <p className="text-sm font-semibold text-white">Notifications</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Live niche signals from your active workspace
          </p>
        </div>

        <ul className="max-h-72 overflow-y-auto py-1">
          {notifications.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-zinc-500">
              No alerts yet. Mark a workspace active to watch your niche.
            </li>
          ) : (
            notifications.map((notification) => {
              const isUnread = unreadIds.has(notification.id);
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => markOneRead(notification.id)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors hover:bg-white/[0.04]",
                      isUnread && "bg-[#deff9a]/[0.03]"
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
                        <p className="mt-1.5 text-[10px] text-zinc-600">
                          {notification.timestamp}
                        </p>
                      </div>
                      {isUnread && (
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#deff9a] shadow-[0_0_6px_rgba(222,255,154,0.8)]"
                          aria-hidden
                        />
                      )}
                    </div>
                  </button>
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
            className="w-full rounded-lg py-1.5 text-center text-xs font-medium text-zinc-500 transition-colors hover:text-[#deff9a] disabled:cursor-default disabled:opacity-40"
          >
            Mark all as read
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
