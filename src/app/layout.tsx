import type { Metadata } from "next";
import { Urbanist } from "next/font/google";

import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AIscoutX — Discover the next big thing first",
  description:
    "We filter internet noise into profitable signals for creators and founders. Join early access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${urbanist.variable} min-h-screen bg-[#030308] font-sans antialiased`}
      >
        <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#030308]">
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 bg-[#030308]"
          />
          <div
            aria-hidden
            className="bg-grid-mesh pointer-events-none fixed inset-0 -z-10 opacity-60"
          />
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(67,56,202,0.18),transparent_50%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(51,65,85,0.35),transparent_55%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(30,27,75,0.2),transparent_50%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_50%_40%_at_0%_100%,rgba(15,23,42,0.5),transparent_45%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-black"
          />
          {children}
        </div>
      </body>
    </html>
  );
}
