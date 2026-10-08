"use client";
import { displayTime } from "@/lib/display-copy";
import { WOMEN_AI_ID } from "@/lib/product-experiences";
import { events } from "@/lib/events";
import type { LineupSelection } from "@/types/lineup-selection";
// Only supplied activity is rendered. No invented members, projects or speakers.
const activities=[{category:"Alpha Team event",eventId:WOMEN_AI_ID}];
export function PulseCommunity({showcase=false,selection}:{showcase?:boolean;selection:LineupSelection}) {
  const lineup=selection.ids;
  const available=activities.flatMap(activity=>{const event=events.find(event=>event.id===activity.eventId);return event?[{...activity,event}]:[];});
  if(!available.length)return null;
  return <section className="pulse-v3 wrap"><section className="spotlight-panel"><h2>{showcase?"Hosted by our Alpha Team":"Alpha Team Spotlight"}</h2><p>Events our Alpha Team members are bringing to life across LA.</p><div className="spotlight-grid">{available.map(({category,event})=><article className="spotlight-activity" key={event.id}><p className="mono-label">{category}</p><h3>{event.name}</h3><p>{event.dateLabel} · {displayTime(event.startTimeDisplay)}</p><p>{event.venueName} · {event.neighborhood}</p><button className="button small" onClick={()=>selection.toggle(event.id)}>{lineup.includes(event.id)?"Added ✓":"Add to my lineup"}</button></article>)}</div></section></section>;
}
