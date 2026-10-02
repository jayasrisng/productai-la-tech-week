import type { Metadata } from "next";
import { assetUrl } from "@/lib/assets";
import "./globals.css";

export const metadata: Metadata = {
  title: "LA Tech Week Lineup · by Product.ai",
  description: "Build your LA Tech Week calendar with Product.ai. Find Los Angeles events that fit your goals, October 12–18, 2026.",
  icons: { icon: assetUrl("/favicon.svg?v=productai"), shortcut: assetUrl("/favicon.svg?v=productai") },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // App Router's root layout persists across every route; the Pages Router font rule is inapplicable here.
  // eslint-disable-next-line @next/next/no-page-custom-font
  return <html lang="en" data-theme="dark" data-scroll-behavior="smooth"><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"/></head><body>{children}</body></html>;
}
