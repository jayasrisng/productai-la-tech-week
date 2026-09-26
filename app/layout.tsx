import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product.ai × Tech Week",
  description: "Find the San Francisco and Los Angeles Tech Week events actually worth your time.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
