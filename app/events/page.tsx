"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { EventCard } from "@/components/EventCard";
import { MultiSelectFilter } from "@/components/MultiSelectFilter";
import { matchesEventFilters } from "@/lib/event-filters";
import { useLocalStorage } from "@/lib/storage";
import { catalogs,eventsByCity } from "@/lib/events";
import { rankEvents } from "@/lib/calculateEventMatch";
import type { Preferences } from "@/types/event";

const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
export default function EventsPage(){
  const [prefs]=useLocalStorage<Preferences>("techWeekPreferences",empty); const [lineup,setLineup]=useLocalStorage<string[]>("techWeekLineup",[]); const [pending,setPending]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationPending",{});
  const city="la" as const; const catalog=catalogs[city]; const events=eventsByCity[city];
  const [mode,setMode]=useState<"recommended"|"all">("recommended"); const [day,setDay]=useState("All days"); const [areas,setAreas]=useState<string[]>([]); const [topics,setTopics]=useState<string[]>([]); const [formats,setFormats]=useState<string[]>([]);
  const ranked=useMemo(()=>rankEvents(events,prefs),[events,prefs]);
  const results=useMemo(()=>ranked.filter(({event})=>matchesEventFilters(event,{day,areas,topics,formats})).sort((a,b)=>mode==="recommended"?0:a.event.date.localeCompare(b.event.date)||a.event.startTime.localeCompare(b.event.startTime)),[ranked,mode,day,areas,topics,formats]);
  const pageKey=JSON.stringify([prefs,mode,day,areas,topics,formats]);
  const [expanded,setExpanded]=useState({key:"",count:10});
  const limit=expanded.key===pageKey?expanded.count:10;
  const visible=mode==="recommended"?results.slice(0,limit):results;
  const toggle=(id:string)=>setLineup(lineup.includes(id)?lineup.filter(x=>x!==id):[...lineup,id]);
  const selectedCount=lineup.filter(id=>events.some(event=>event.id===id)).length;
  const profile=[...prefs.goals,...prefs.interests,...prefs.formats].slice(0,5);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const activeFilterCount=Number(day!=="All days")+areas.length+topics.length+formats.length;
  const filterOptions=useMemo(()=>({areas:[...new Set(events.map(e=>e.neighborhood))].sort(),topics:[...new Set(events.flatMap(e=>e.topics))].sort(),formats:[...new Set(events.flatMap(e=>e.formats))].sort()}),[events]);
  const toggleFilter=(selected:string[],option:string)=>selected.includes(option)?selected.filter(value=>value!==option):[...selected,option];
  return <main className="matches-page"><SiteHeader/><section className="events-head wrap"><div><p className="mono-label">LA TECH WEEK</p><h1>{mode === "recommended" ? (limit>10?"Your best matches.":"Your top ten.") : "Events by date."}</h1></div><Link className="button primary small matches-lineup-link" href="/lineup">Your lineup{selectedCount>0?<span> · {selectedCount}</span>:null} →</Link></section>
    <section className="events-toolbar wrap"><div className="events-controls"><div className="mode-toggle"><button className={mode==="recommended"?"active":""} aria-pressed={mode==="recommended"} onClick={()=>setMode("recommended")}>Best matches</button><button className={mode==="all"?"active":""} aria-pressed={mode==="all"} onClick={()=>setMode("all")}>Calendar order</button></div><button className="filter-toggle" aria-expanded={filtersOpen} aria-controls="event-filter-panel" onClick={()=>setFiltersOpen(!filtersOpen)}>Filters{activeFilterCount>0?<span>{activeFilterCount}</span>:null}<span aria-hidden="true">{filtersOpen?"−":"+"}</span></button></div><div className="event-filter-panel" id="event-filter-panel" hidden={!filtersOpen}><div className="filters"><label>Date<select value={day} onChange={e=>setDay(e.target.value)}><option>All days</option>{[...new Set(events.filter(e=>e.inOfficialWeek).map(e=>e.date))].map(x=><option key={x} value={x}>{new Date(`${x}T12:00:00`).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</option>)}</select></label><MultiSelectFilter label="Neighborhood" allLabel="All areas" options={filterOptions.areas} selected={areas} onToggle={option=>setAreas(current=>toggleFilter(current,option))} onClear={()=>setAreas([])}/><MultiSelectFilter label="Interest" allLabel="All topics" options={filterOptions.topics} selected={topics} onToggle={option=>setTopics(current=>toggleFilter(current,option))} onClear={()=>setTopics([])}/><MultiSelectFilter label="Event format" allLabel="All formats" options={filterOptions.formats} selected={formats} onToggle={option=>setFormats(current=>toggleFilter(current,option))} onClear={()=>setFormats([])}/></div>{activeFilterCount>0&&<button className="clear-filters" onClick={()=>{setDay("All days");setAreas([]);setTopics([]);setFormats([])}}>Clear filters</button>}</div></section>
    <section className="results-note wrap"><p>{mode==="recommended"?`${visible.length} of ${results.length} matches`:`${visible.length} events`}<span className="catalog-source" title={`Catalog snapshot: ${catalog.sourceSnapshotGeneratedAt.slice(0,10)}`}> · {catalog.eventCount.toLocaleString()} listings</span></p><Link href="/plan">Edit preferences</Link></section>

    <section className="event-list wrap">{!visible.length&&<div className="empty-week"><h2>{profile.length?"No suitable matches for these choices.":"Let’s find your fit."}</h2><p>{profile.length?"Try a different filter or revisit your preferences.":"Answer the questionnaire to see your top ten."}</p><Link className="button primary" href="/plan">Edit preferences →</Link></div>}{visible.map(({event,match},index)=><EventCard rank={mode==="recommended"?index+1:undefined} event={event} match={match} added={lineup.includes(event.id)} onToggle={()=>toggle(event.id)} onRegistered={()=>setPending({...pending,[event.id]:true})} key={event.id}/>)}{visible.length>0&&<div className="more-matches">{mode==="recommended"&&visible.length<results.length&&<button className="button primary build-week" onClick={()=>setExpanded({key:pageKey,count:limit+10})}>Show {Math.min(10,results.length-visible.length)} more matches<span> · {results.length-visible.length} remaining</span></button>}<Link className="button primary build-week" href="/lineup"><CalendarDays size={18} aria-hidden="true"/>Build my Tech Week{selectedCount>0&&<span> · {selectedCount} event{selectedCount===1?"":"s"}</span>} →</Link></div>}</section>
  </main>;
}
