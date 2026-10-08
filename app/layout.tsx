import type { Metadata } from "next";
import { DropdownBehavior } from "@/components/DropdownBehavior";
import { assetUrl } from "@/lib/assets";
import { Plus_Jakarta_Sans, Archivo, Roboto_Mono } from "next/font/google";
import "./globals.css";
import "./brand-tokens.css";
import "./v3.css";
import "./pulse.css";
import "./refinements.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-jakarta", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-archivo", display: "swap" });
const mono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-roboto-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Lineup by Product.ai · LA Tech Week, Oct 12–18",
  description: "Lineup by Product.ai: plan your LA Tech Week, Oct 12 to 18. Answer six quick questions, get events matched to your goals, and share your lineup. Free.",
  openGraph: { title: "Lineup by Product.ai · Curate your Tech Week", description: "Six quick questions, events matched to your goals, and a lineup poster to share. LA Tech Week, Oct 12 to 18." },
  twitter: { card: "summary", title: "Lineup by Product.ai · Curate your Tech Week", description: "Six quick questions, events matched to your goals, and a lineup poster to share. LA Tech Week, Oct 12 to 18." },
  icons: { icon: assetUrl("/favicon.svg?v=productai"), shortcut: assetUrl("/favicon.svg?v=productai") },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="light" suppressHydrationWarning data-scroll-behavior="smooth" className={`${jakarta.variable} ${archivo.variable} ${mono.variable}`}><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('techWeekThemeOverride');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:location.pathname.replace(/\\/$/,'')==='${process.env.NEXT_PUBLIC_BASE_PATH || ""}'?'dark':'light'}catch{}` }}/></head><body><DropdownBehavior/>{children}</body></html>;
}
