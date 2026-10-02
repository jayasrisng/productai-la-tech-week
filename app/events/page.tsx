"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { EventCard } from "@/components/EventCard";
import { useLocalStorage } from "@/lib/storage";
import { catalogs,eventsByCity } from "@/lib/events";
import { rankEvents } from "@/lib/calculateEventMatch";
import type { Preferences } from "@/types/event";

const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
export default function EventsPage(){
  const [prefs]=useLocalStorage<Preferences>("techWeekPreferences",empty); const [lineup,setLineup]=useLocalStorage<string[]>("techWeekLineup",[]); const [pending,setPending]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationPending",{});
  const city="la" as const; const catalog=catalogs[city]; const events=eventsByCity[city];
  const [mode,setMode]=useState<"recommended"|"all">("recommended"); const [day,setDay]=useState("All days"); const [area,setArea]=useState("All areas"); const [topic,setTopic]=useState("All topics"); const [format,setFormat]=useState("All formats");
  const ranked=useMemo(()=>rankEvents(events,prefs),[events,prefs]);
  const results=useMemo(()=>ranked.filter(({event})=>(day==="All days"||event.date===day)&&(area==="All areas"||event.neighborhood===area)&&(topic==="All topics"||event.topics.includes(topic))&&(format==="All formats"||event.formats.includes(format))).sort((a,b)=>mode==="recommended"?0:a.event.date.localeCompare(b.event.date)||a.event.startTime.localeCompare(b.event.startTime)),[ranked,mode,day,area,topic,format]);
  const visible=mode==="recommended"?results.slice(0,10):results;
  const toggle=(id:string)=>setLineup(lineup.includes(id)?lineup.filter(x=>x!==id):[...lineup,id]);
  const selectedCount=lineup.filter(id=>events.some(event=>event.id===id)).length;
  const profile=[...prefs.goals,...prefs.interests,...prefs.formats].slice(0,5);
  return <main><SiteHeader/><section className="events-head wrap"><div><p className="mono-label">{catalog.eventCount.toLocaleString()} {city.toUpperCase()} LISTINGS / SNAPSHOT {catalog.sourceSnapshotGeneratedAt.slice(0,10)}</p><h1>{mode === "recommended" ? "Your top ten." : "Events by date."}</h1><p>{profile.length?`Based on ${profile.join(" · ")}`:"Complete the planner for personal recommendations."}</p></div><div className="event-count"><strong>{visible.length}</strong><span>{mode==="recommended"?"TOP\nMATCHES":"ELIGIBLE\nMATCHES"}</span></div></section>
    <section className="events-toolbar wrap"><div className="mode-toggle"><button className={mode==="recommended"?"active":""} aria-pressed={mode==="recommended"} onClick={()=>setMode("recommended")}>Best matches</button><button className={mode==="all"?"active":""} aria-pressed={mode==="all"} onClick={()=>setMode("all")}>Calendar order</button></div><div className="filters"><label>Date<select value={day} onChange={e=>setDay(e.target.value)}><option>All days</option>{[...new Set(events.filter(e=>e.inOfficialWeek).map(e=>e.date))].map(x=><option key={x} value={x}>{new Date(`${x}T12:00:00`).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</option>)}</select></label><label>Neighborhood<select value={area} onChange={e=>setArea(e.target.value)}><option>All areas</option>{[...new Set(events.map(e=>e.neighborhood))].sort().map(x=><option key={x}>{x}</option>)}</select></label><label>Interest<select value={topic} onChange={e=>setTopic(e.target.value)}><option>All topics</option>{[...new Set(events.flatMap(e=>e.topics))].sort().map(x=><option key={x}>{x}</option>)}</select></label><label>Event format<select value={format} onChange={e=>setFormat(e.target.value)}><option>All formats</option>{[...new Set(events.flatMap(e=>e.formats))].sort().map(x=><option key={x}>{x}</option>)}</select></label></div>{[day,area,topic,format].some(x=>!x.startsWith("All "))&&<button className="clear-filters" onClick={()=>{setDay("All days");setArea("All areas");setTopic("All topics");setFormat("All formats")}}>Clear filters</button>}</section>
    <section className="results-note wrap"><p>{mode==="recommended"?`Showing ${visible.length} strongest suitable matches.`:`Showing ${visible.length} eligible events.`} Percentages reflect your preferences, not attendance odds.</p><Link href="/plan">Edit preferences →</Link></section>
    {selectedCount>0&&<section className="journey-continue wrap"><span><b>{selectedCount}</b> event{selectedCount===1?"":"s"} selected</span><Link className="button primary small" href="/lineup">Build my lineup →</Link></section>}
    <section className="event-list wrap">{!visible.length&&<div className="empty-week"><h2>{profile.length?"No suitable matches for these choices.":"Let’s find your fit."}</h2><p>{profile.length?"Try a different filter or revisit your preferences.":"Answer the questionnaire to see your top ten."}</p><Link className="button primary" href="/plan">Edit preferences →</Link></div>}{visible.map(({event,match},index)=><EventCard rank={mode==="recommended"?index+1:undefined} event={event} match={match} added={lineup.includes(event.id)} onToggle={()=>toggle(event.id)} onRegistered={()=>setPending({...pending,[event.id]:true})} key={event.id}/>)}</section>
  </main>;
}
