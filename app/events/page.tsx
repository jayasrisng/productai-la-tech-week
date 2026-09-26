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
  const city=prefs.city||"la"; const catalog=catalogs[city]; const events=eventsByCity[city];
  const [mode,setMode]=useState<"recommended"|"all">("recommended"); const [day,setDay]=useState("All days"); const [area,setArea]=useState("All areas"); const [topic,setTopic]=useState("All topics"); const [format,setFormat]=useState("All formats"); const [shown,setShown]=useState(30);
  const ranked=useMemo(()=>rankEvents(events,prefs),[prefs]);
  const results=useMemo(()=>ranked.filter(({event})=>(day==="All days"||event.date===day)&&(area==="All areas"||event.neighborhood===area)&&(topic==="All topics"||event.topics.includes(topic))&&(format==="All formats"||event.formats.includes(format))).sort((a,b)=>mode==="recommended"?b.match.score-a.match.score:a.event.date.localeCompare(b.event.date)||a.event.startTime.localeCompare(b.event.startTime)),[ranked,mode,day,area,topic,format]);
  const toggle=(id:string)=>setLineup(lineup.includes(id)?lineup.filter(x=>x!==id):[...lineup,id]);
  const profile=[...prefs.goals,...prefs.interests,...prefs.formats].slice(0,5);
  return <main><SiteHeader/><section className="events-head wrap"><div><p className="mono-label">{catalog.eventCount.toLocaleString()} {city.toUpperCase()} LISTINGS / SNAPSHOT {catalog.sourceSnapshotGeneratedAt.slice(0,10)}</p><h1>{prefs.name?`${prefs.name}’s best rooms.`:"Worth your time."}</h1><p>{profile.length?`Ranked around ${profile.join(" · ")}`:"Complete the planner for personal recommendations."}</p></div><div className="event-count"><strong>{results.length}</strong><span>ELIGIBLE<br/>MATCHES</span></div></section>
    <section className="events-toolbar wrap"><div className="mode-toggle"><button className={mode==="recommended"?"active":""} onClick={()=>setMode("recommended")}>Best matches</button><button className={mode==="all"?"active":""} onClick={()=>setMode("all")}>Calendar order</button></div><div className="filters"><select value={day} onChange={e=>{setDay(e.target.value);setShown(30)}}><option>All days</option>{[...new Set(events.filter(e=>e.inOfficialWeek).map(e=>e.date))].map(x=><option key={x}>{x}</option>)}</select><select value={area} onChange={e=>{setArea(e.target.value);setShown(30)}}><option>All areas</option>{[...new Set(events.map(e=>e.neighborhood))].sort().map(x=><option key={x}>{x}</option>)}</select><select value={topic} onChange={e=>{setTopic(e.target.value);setShown(30)}}><option>All topics</option>{[...new Set(events.flatMap(e=>e.topics))].sort().map(x=><option key={x}>{x}</option>)}</select><select value={format} onChange={e=>{setFormat(e.target.value);setShown(30)}}><option>All formats</option>{[...new Set(events.flatMap(e=>e.formats))].sort().map(x=><option key={x}>{x}</option>)}</select></div></section>
    <section className="results-note wrap"><p>Showing {Math.min(shown,results.length)} of {results.length}. Scores are relative fit signals—not guarantees of admission or event quality.</p><Link href="/plan">Adjust preferences →</Link></section>
    <section className="event-list wrap">{results.slice(0,shown).map(({event,match})=><EventCard event={event} match={match} added={lineup.includes(event.id)} onToggle={()=>toggle(event.id)} onRegistered={()=>setPending({...pending,[event.id]:true})} key={event.id}/>)}{shown<results.length&&<button className="load-more" onClick={()=>setShown(shown+20)}>Show 20 more <span>{results.length-shown} remaining</span></button>}</section>
  </main>;
}
