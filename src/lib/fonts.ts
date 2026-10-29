import { Inter, Plus_Jakarta_Sans } from "next/font/google";

/** Primary UI sans — body, dashboards, pricing, forms */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

/** Display sans — headings inherit via shared `font-sans` stack */
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const rootFontVariables = `${inter.variable} ${plusJakarta.variable}`;
