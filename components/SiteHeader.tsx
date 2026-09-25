"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function SiteHeader() {
  const pathname = usePathname();
  const nav = [["/events", "Explore"], ["/lineup", "My week"], ["/mission-hq", "Mission HQ"]];
  return <header className="site-header"><Link href="/" className="wordmark"><span className="mark">◆</span><strong>product.ai</strong><em>LA TECH WEEK</em></Link><nav>{nav.map(([href,label]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}>{label}</Link>)}</nav><Link href="/plan" className="header-cta">Build my week</Link></header>;
}
