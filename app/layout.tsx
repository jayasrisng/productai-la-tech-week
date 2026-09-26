import type { Metadata } from "next";
import { assetUrl } from "@/lib/assets";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product.ai Tech Week",
  description: "Find and plan the San Francisco and Los Angeles Tech Week events that fit your goals.",
  icons: { icon: assetUrl("/favicon.svg"), shortcut: assetUrl("/favicon.svg") },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
