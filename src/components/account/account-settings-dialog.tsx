"use client";

import { useState } from "react";
import { Bell, Moon, Palette } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type AccountSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AccountSettingsDialog({
  open,
  onOpenChange,
}: AccountSettingsDialogProps) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage notifications and workspace appearance preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Bell className="h-4 w-4 text-[#deff9a]" />
              Notifications
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="email-alerts" className="text-zinc-400">
                  Opportunity email alerts
                </Label>
                <Switch
                  id="email-alerts"
                  checked={emailAlerts}
                  onCheckedChange={setEmailAlerts}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="weekly-digest" className="text-zinc-400">
                  Weekly founder digest
                </Label>
                <Switch
                  id="weekly-digest"
                  checked={weeklyDigest}
                  onCheckedChange={setWeeklyDigest}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="product-updates" className="text-zinc-400">
                  Product update announcements
                </Label>
                <Switch
                  id="product-updates"
                  checked={productUpdates}
                  onCheckedChange={setProductUpdates}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Palette className="h-4 w-4 text-[#deff9a]" />
              Appearance
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-zinc-500" />
                <Label className="text-zinc-400">Premium Dark</Label>
              </div>
              <span className="rounded-full border border-[#deff9a]/30 bg-[#deff9a]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#deff9a]">
                Active
              </span>
            </div>
            <p className="mt-2 text-[11px] text-zinc-600">
              AIscoutX is optimized for the dark execution workspace. Light mode
              ships in a future release.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
