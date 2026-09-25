import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product.ai × LA Tech Week",
  description: "Find the LA Tech Week events actually worth your time.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
