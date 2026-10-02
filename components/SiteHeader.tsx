"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";


import { ThemeToggle, usePageTheme } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";

export function SiteHeader() {
  usePageTheme();
  const pathname = usePathname();

  const nav = [["/events", "Matches"], ["/lineup", "Lineup"], ["/office-visit", "Visit"], ["/mission-hq", "Pulse"]];
  return <header className="site-header"><Link href="/" className="wordmark"><BrandMark/></Link><nav aria-label="Planning journey">{nav.map(([href,label]) => <Link className={pathname.replace(/\/$/,"") === href ? "active" : ""} href={href} key={href}>{label}</Link>)}</nav><div className="header-controls"><ThemeToggle/><Link href="/plan" className="header-cta">Edit preferences</Link></div></header>;
}
