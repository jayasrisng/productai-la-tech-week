import type { Metadata } from "next";
import { assetUrl } from "@/lib/assets";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product.ai Tech Week",
  description: "Find and plan the San Francisco and Los Angeles Tech Week events that fit your goals.",
  icons: { icon: assetUrl("/favicon.svg"), shortcut: assetUrl("/favicon.svg") },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // App Router's root layout persists across every route; the Pages Router font rule is inapplicable here.
  // eslint-disable-next-line @next/next/no-page-custom-font
  return <html lang="en" data-scroll-behavior="smooth"><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"/></head><body>{children}</body></html>;
}
