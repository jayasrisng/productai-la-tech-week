"use client";
import Link from "next/link";
import { Lightning } from "@phosphor-icons/react";
import { Avatar } from "./Avatar";
import type { AvatarConfig } from "@/lib/avatar";
import { loungeAtTime, formatPulseTime, PRODUCTAI_LOCATION } from "@/lib/pulse";
export type SharedLoungePlan = { name:string; avatar:AvatarConfig|null; start:number; end:number; consent:boolean };
const NO_SHARED_PLANS: readonly SharedLoungePlan[] = [];
export function ProductAiLounge({now, plans=NO_SHARED_PLANS}:{now:number;plans?:readonly SharedLoungePlan[]}){
  const slot=loungeAtTime(now);
  if(!slot)return null;
  const members=plans.filter(plan=>plan.consent&&plan.start<=now&&plan.end>now);
  const clock=(time:number)=>new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric"}).format(time);
  return <article className="event-card recharge-card" id="product-ai-lounge" aria-label="Recharge at Product.ai HQ"><div className="recharge-symbol-art"><Lightning size={60} weight="fill" aria-hidden="true"/></div><div className="event-body"><p className="mono-label">LOUNGE HOUR · {clock(slot.start)}–{clock(slot.end)}</p><h2>Recharge at Product.ai HQ</h2><p>Brentwood · 12100 Wilshire Blvd</p><p>Quiet rooms, lounges, snacks & drinks.</p></div><div className="event-actions"><span data-testid="lounge-time">{formatPulseTime(now)}</span><Link className="button small" href="/office-visit">Book your Recharge time →</Link></div>{members.length>0&&<div className="lounge-presence"><p>Planning to be here</p><ul>{members.map(member=><li key={`${member.name}-${member.start}-${member.end}`}>{member.avatar?<Avatar config={member.avatar}/>:<span className="avatar avatar-empty" aria-label="No shared avatar"/>}<span>{member.name}</span></li>)}</ul></div>}<span className="sr-only">{PRODUCTAI_LOCATION.address}</span></article>;
}
