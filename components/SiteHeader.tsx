"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lightning } from "@phosphor-icons/react";


import { ThemeToggle, usePageTheme } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";

export function SiteHeader() {
  usePageTheme();
  const pathname = usePathname();

  const nav = [["/events", "Matches"], ["/lineup", "Lineup"], ["/office-visit", "Recharge at HQ"], ["/mission-hq", "Pulse"]];
  return <header className="site-header" data-theme="dark"><Link href="/" className="wordmark" aria-label="Product.ai Tech Week Lineup home"><BrandMark/></Link><nav aria-label="Planning journey">{nav.map(([href,label]) => <Link className={pathname.replace(/\/$/,"") === href ? "active" : ""} href={href} key={href}>{href==="/office-visit"&&<Lightning className="recharge-icon" size={16} weight="fill" aria-hidden="true"/>}{label}</Link>)}</nav><div className="header-controls"><ThemeToggle/></div></header>;
}
