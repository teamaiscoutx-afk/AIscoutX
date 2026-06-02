import type { Metadata } from "next";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export const metadata: Metadata = {
  title: "Dashboard — AIscoutX",
  description: "Your intelligence feed for exploding opportunities.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#030308] text-foreground">
      {/* Background mesh — matches landing */}
      <div
        aria-hidden
        className="bg-grid-mesh pointer-events-none fixed inset-0 opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(67,56,202,0.12),transparent_50%)]"
      />

      <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        <DashboardSidebar />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
