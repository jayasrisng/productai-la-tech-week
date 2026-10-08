"use client";
import Image from "next/image";
import Link from "next/link";
import { productExperiences, CLAYDATE_ID } from "@/lib/product-experiences";
import { events } from "@/lib/events";
import { assetUrl } from "@/lib/assets";
import artwork from "@/data/event-artwork.json";
import { EventCard } from "./EventCard";
import { useLocalStorage } from "@/lib/storage";
import { rankEvents, calculateEventMatch } from "@/lib/calculateEventMatch";
import type { Preferences } from "@/types/event";
import type { LineupSelection } from "@/types/lineup-selection";
const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
export function SampleArtwork({ title, index }: { title:string; index?:number }) {
  return <div className="sample-art" aria-label={`LA Tech Week: ${title}`}><span className="art-index" aria-hidden="true">{index?.toString().padStart(2,"0")}</span><strong>{title}</strong><small>LA Tech Week</small></div>;
}
export function ProductExperiences({ compact = false, excludeIds = [], view = "grid", selection, onRegistered }: { compact?:boolean; excludeIds?:string[]; view?:"list"|"grid";selection:LineupSelection;onRegistered?:(id:string)=>void }) {
  const clayArt = artwork[CLAYDATE_ID];
  const experiences = productExperiences.filter(item=>!item.catalogId || !excludeIds.includes(item.catalogId));
  const [prefs]=useLocalStorage<Preferences>("techWeekPreferences",empty);
  const lineup=selection.ids;
  const ranked=rankEvents(events,prefs);
  if(compact)return <section className="product-discovery wrap" aria-label="At Product.ai HQ"><div className="section-topline"><h2>At Product.ai HQ</h2><p>Make something with your hands, get a fresh headshot, and meet the team at our office in Brentwood.</p></div><div className={`event-list${view==="grid"?" grid-view":""}`}>{experiences.map(item=>{const event=events.find(event=>event.id===item.catalogId)!;const match=ranked.find(item=>item.event.id===event.id)?.match??calculateEventMatch(event,prefs);return <EventCard key={event.id} event={event} match={match} added={lineup.includes(event.id)} onToggle={()=>selection.toggle(event.id)} onRegistered={()=>onRegistered?.(event.id)}/>;})}</div></section>;
  return <section className={`${compact?"product-discovery":"product-experiences"} wrap`} aria-label="At Product.ai HQ"><div className="section-topline"><h2>At Product.ai HQ</h2><p>Make something with your hands, get a fresh headshot, and meet the team at our office in Brentwood.</p></div><div className={compact?`event-list${view==="grid"?" grid-view":""}`:"experience-grid"}>{experiences.map(experience=><article className={compact?"event-card featured-event":"experience-card"} key={experience.id}>
    {compact&&<div className="event-score"/>}
    <figure className={compact?"event-artwork":"experience-artwork"}><div className="poster-thumbnail"><Image className="experience-poster" src={assetUrl(experience.artwork??clayArt.src)} alt={experience.name} fill sizes="(max-width: 760px) 100vw, 33vw"/></div></figure>
    <div className={compact?"event-body":undefined}>{compact&&<div className="event-meta">{experience.note}</div>}{compact?<h2>{experience.name}</h2>:<h3>{experience.name}</h3>}{!compact&&<p>{experience.note}</p>}</div>
    <div className={compact?"event-actions":undefined}>{experience.catalogId?<a href={events.find(event=>event.id===experience.catalogId)?.rsvpUrl??"https://product.ai"} target="_blank" rel="noreferrer">{experience.catalogId&&events.find(event=>event.id===experience.catalogId)?.rsvpUrl==="https://product.ai"?"Visit Product.ai · RSVP link coming soon":"View and RSVP"} ↗</a>:<Link href="/office-visit">Explore Product.ai →</Link>}</div>
  </article>)}</div></section>;
}
