"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalStorage } from "@/lib/storage";
import type { Preferences } from "@/types/event";
import { ThemeToggle, usePageTheme } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";
const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
export function SiteHeader() {
  usePageTheme();
  const pathname = usePathname();
  const [prefs]=useLocalStorage<Preferences>("techWeekPreferences",empty);
  const city=(prefs.city||"la").toUpperCase();
  const nav = [["/events", "01 Matches"], ["/lineup", "02 Lineup"], ["/office-visit", "03 Visit"], ["/mission-hq", "HQ mockup"]];
  return <header className="site-header"><Link href="/" className="wordmark"><BrandMark/><em>{city}</em></Link><nav aria-label="Planning journey">{nav.map(([href,label]) => <Link className={pathname.replace(/\/$/,"") === href ? "active" : ""} href={href} key={href}>{label}</Link>)}</nav><div className="header-controls"><ThemeToggle/><Link href="/plan" className="header-cta">Edit preferences</Link></div></header>;
}
