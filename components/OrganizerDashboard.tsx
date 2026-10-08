"use client";
import { LockKey } from "@phosphor-icons/react";
import { SiteHeader } from "./SiteHeader";

export function OrganizerDashboard() {
  return <main className="organizer-page"><SiteHeader/><section className="wrap organizer-head"><p className="mono-label">PRODUCT.AI / ORGANIZER ACCESS</p><h1>Registrations</h1><p>Lounge bookings · Los Angeles time</p></section><section className="wrap"><div className="organizer-unlock"><LockKey size={28} className="recharge-icon" aria-hidden="true"/><h2>Private access</h2><button className="button" disabled>Organizer access disabled</button></div></section></main>;
}
