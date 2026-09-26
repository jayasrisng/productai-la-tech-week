"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocalStorage } from "@/lib/storage";
import type { Preferences } from "@/types/event";
const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
export function SiteHeader() {
  const pathname = usePathname();
  const [prefs]=useLocalStorage<Preferences>("techWeekPreferences",empty);
  const city=(prefs.city||"la").toUpperCase();
  const nav = [["/events", "Explore"], ["/lineup", "My week"], ["/mission-hq", "Mission HQ"]];
  return <header className="site-header"><Link href="/" className="wordmark"><span className="mark">◆</span><strong>product.ai</strong><em>{city} TECH WEEK</em></Link><nav>{nav.map(([href,label]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}>{label}</Link>)}</nav><Link href="/plan" className="header-cta">Tune my plan</Link></header>;
}
