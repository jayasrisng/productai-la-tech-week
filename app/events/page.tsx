"use client";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { EventCard } from "@/components/EventCard";
import { useLocalStorage } from "@/lib/storage";
import { calculateEventMatch } from "@/lib/calculateEventMatch";
import { events } from "@/lib/events";
import type { EventItem, Preferences } from "@/types/event";

const empty: Preferences = { identity:[], goals:[], interests:[], formats:[], locations:[] };
export default function EventsPage(){
  const catalog = events as EventItem[]; const [prefs] = useLocalStorage<Preferences>("techWeekPreferences", empty); const [lineup,setLineup]=useLocalStorage<string[]>("techWeekLineup",[]); const [mode,setMode]=useState<"recommended"|"all">("recommended"); const [day,setDay]=useState("All days"); const [area,setArea]=useState("All areas");
  const filtered=useMemo(()=>catalog.filter(e=>(day==="All days"||e.date===day)&&(area==="All areas"||e.location===area)).sort((a,b)=>mode==="recommended"?calculateEventMatch(b,prefs).score-calculateEventMatch(a,prefs).score:a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime)),[catalog,prefs,mode,day,area]);
  const toggle=(id:string)=>setLineup(lineup.includes(id)?lineup.filter(x=>x!==id):[...lineup,id]);
  return <main><SiteHeader/><section className="events-head wrap"><div><p className="mono-label">YOUR TECH WEEK / LA 2026</p><h1>{mode==="recommended"?"Worth your time.":"Every room, one view."}</h1><p>{prefs.interests.length?`Built around ${[...prefs.interests,...prefs.identity].slice(0,4).join(" · ")}`:"Browse the whole week, or build a plan for personal matches."}</p></div><div className="event-count"><strong>{filtered.length}</strong><span>EVENTS<br/>IN VIEW</span></div></section>
    <section className="events-toolbar wrap"><div className="mode-toggle"><button className={mode==="recommended"?"active":""} onClick={()=>setMode("recommended")}>Recommended for you</button><button className={mode==="all"?"active":""} onClick={()=>setMode("all")}>All events</button></div><div className="filters"><select value={day} onChange={e=>setDay(e.target.value)} aria-label="Filter by day"><option>All days</option>{[...new Set(catalog.map(e=>e.date))].map(x=><option key={x}>{x}</option>)}</select><select value={area} onChange={e=>setArea(e.target.value)} aria-label="Filter by area"><option>All areas</option>{[...new Set(catalog.map(e=>e.location))].map(x=><option key={x}>{x}</option>)}</select></div></section>
    <section className="event-list wrap">{filtered.map(e=><EventCard event={e} preferences={prefs} added={lineup.includes(e.id)} onToggle={()=>toggle(e.id)} key={e.id}/>)}</section>
  </main>;
}
