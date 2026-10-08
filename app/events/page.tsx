"use client";
import currentLinks from "@/data/la-event-links.json";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Calendar, List, SquaresFour } from "@phosphor-icons/react";
import { SiteHeader } from "@/components/SiteHeader";
import { EventCard } from "@/components/EventCard";
import { isProductAiEvent, isSpotlightEvent } from "@/lib/product-experiences";
import { PulseCommunity } from "@/components/PulseCommunity";
import { ProductExperiences } from "@/components/ProductExperiences";
import { MultiSelectFilter } from "@/components/MultiSelectFilter";
import { matchesEventFilters } from "@/lib/event-filters";
import { useLocalStorage } from "@/lib/storage";
import { catalogs,eventsByCity } from "@/lib/events";
import { rankEvents } from "@/lib/calculateEventMatch";
import type { Preferences } from "@/types/event";

const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
export default function EventsPage(){
  const headingRef=useRef<HTMLHeadingElement>(null);
  const [showBackToTop,setShowBackToTop]=useState(false);
  useEffect(()=>{
    const update=()=>setShowBackToTop(window.scrollY>400);
    update();
    window.addEventListener("scroll",update,{passive:true});
    return()=>window.removeEventListener("scroll",update);
  },[]);
  const backToTop=()=>{
    headingRef.current?.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  };
  const [prefs]=useLocalStorage<Preferences>("techWeekPreferences",empty); const [lineup,setLineup]=useLocalStorage<string[]>("techWeekLineup",[]); const [pending,setPending]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationPending",{});
  const city="la" as const; const catalog=catalogs[city]; const events=eventsByCity[city];
  const [mode,setMode]=useState<"recommended"|"all">("recommended"); const [day,setDay]=useState("All days"); const [areas,setAreas]=useState<string[]>([]); const [topics,setTopics]=useState<string[]>([]); const [formats,setFormats]=useState<string[]>([]);
  const ranked=useMemo(()=>rankEvents(events,prefs),[events,prefs]);
  const results=useMemo(()=>ranked.filter(({event})=>!isProductAiEvent(event.id)&&!isSpotlightEvent(event.id)&&matchesEventFilters(event,{day,areas,topics,formats})).sort((a,b)=>mode==="recommended"?0:a.event.date.localeCompare(b.event.date)||a.event.startTime.localeCompare(b.event.startTime)),[ranked,mode,day,areas,topics,formats]);
  const pageKey=JSON.stringify([prefs,mode,day,areas,topics,formats]);
  const [expanded,setExpanded]=useState({key:"",count:10});
  const limit=expanded.key===pageKey?expanded.count:10;
  const visible=mode==="recommended"?results.slice(0,limit):results;
  const listRef=useRef<HTMLElement>(null);
  const revealNext=useRef<{key:string;index:number}|null>(null);
  const showMore=()=>{
    revealNext.current={key:pageKey,index:visible.length};
    setExpanded({key:pageKey,count:limit+10});
  };
  useEffect(()=>{
    const target=revealNext.current;
    if(!target)return;
    revealNext.current=null;
    if(target.key!==pageKey)return;
    const firstNew=listRef.current?.querySelectorAll<HTMLElement>(":scope > .event-card")[target.index];
    firstNew?.focus({preventScroll:true});
    firstNew?.scrollIntoView({behavior:"instant",block:"start"});
  },[pageKey,visible.length]);
  const toggle=(id:string)=>setLineup(lineup.includes(id)?lineup.filter(x=>x!==id):[...lineup,id]);
  const selectedCount=lineup.filter(id=>events.some(event=>event.id===id)).length;
  const profile=[...prefs.goals,...prefs.interests,...prefs.formats].slice(0,5);
  const [filtersOpen,setFiltersOpen]=useState(false);
  useEffect(()=>{
    if(!filtersOpen)return;
    const outside=(event:PointerEvent)=>{if(event.target instanceof Element&&!event.target.closest(".events-toolbar"))setFiltersOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setFiltersOpen(false);document.querySelector<HTMLButtonElement>(".filter-toggle")?.focus();}};
    document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);
    return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};
  },[filtersOpen]);
  const [view,setView]=useState<"list"|"grid">("list");
  const activeFilterCount=Number(day!=="All days")+areas.length+topics.length+formats.length;
  const filterOptions=useMemo(()=>({areas:[...new Set(events.map(e=>e.neighborhood))].sort(),topics:[...new Set(events.flatMap(e=>e.topics))].sort(),formats:[...new Set(events.flatMap(e=>e.formats))].sort()}),[events]);
  const toggleFilter=(selected:string[],option:string)=>selected.includes(option)?selected.filter(value=>value!==option):[...selected,option];
  return <main className="matches-page"><SiteHeader/><section className="events-head wrap"><div><h1 ref={headingRef} tabIndex={-1}>{mode === "recommended" ? (limit>10?"Your best matches.":"Your top ten.") : "Events by date."}</h1>{mode==="recommended"&&<p>We’re matching you with highly relevant LA Tech Week events.</p>}</div><Link className="button primary small matches-lineup-link" href="/lineup">My lineup{selectedCount>0?<span> · {selectedCount}</span>:null} →</Link></section>
    <section className="events-toolbar wrap"><div className="events-controls"><div className="event-view-toggle" role="group" aria-label="Event layout"><button aria-pressed={view==="list"} onClick={()=>setView("list")}><List size={20} weight={view==="list"?"fill":"regular"}/>List</button><button aria-pressed={view==="grid"} onClick={()=>setView("grid")}><SquaresFour size={20} weight={view==="grid"?"fill":"regular"}/>Grid</button></div><div className="mode-toggle"><button className={mode==="recommended"?"active":""} aria-pressed={mode==="recommended"} onClick={()=>setMode("recommended")}>Best matches</button><button className={mode==="all"?"active":""} aria-pressed={mode==="all"} onClick={()=>setMode("all")}>By date</button></div><button className="filter-toggle" aria-expanded={filtersOpen} aria-controls="event-filter-panel" onClick={()=>setFiltersOpen(!filtersOpen)}>Filters{activeFilterCount>0?<span>{activeFilterCount}</span>:null}<span aria-hidden="true">{filtersOpen?"−":"+"}</span></button></div><div className="event-filter-panel" id="event-filter-panel" hidden={!filtersOpen}><div className="filters"><label>Date<select value={day} onChange={e=>setDay(e.target.value)}><option>All days</option>{[...new Set(events.filter(e=>e.inOfficialWeek).map(e=>e.date))].map(x=><option key={x} value={x}>{new Date(`${x}T12:00:00`).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</option>)}</select></label><MultiSelectFilter label="Neighborhood" allLabel="All neighborhoods" options={filterOptions.areas} selected={areas} onToggle={option=>setAreas(current=>toggleFilter(current,option))} onClear={()=>setAreas([])}/><MultiSelectFilter label="Topic" allLabel="All topics" options={filterOptions.topics} selected={topics} onToggle={option=>setTopics(current=>toggleFilter(current,option))} onClear={()=>setTopics([])}/><MultiSelectFilter label="Event format" allLabel="All formats" options={filterOptions.formats} selected={formats} onToggle={option=>setFormats(current=>toggleFilter(current,option))} onClear={()=>setFormats([])}/></div>{activeFilterCount>0&&<button className="clear-filters" onClick={()=>{setDay("All days");setAreas([]);setTopics([]);setFormats([])}}>Clear filters</button>}</div></section>
    <section className="results-note wrap"><p>{mode==="recommended"?`Showing ${visible.length} of ${results.length} matches`:`${visible.length} events`}</p><p className="catalog-source">Official LA Tech Week listings · catalog {catalog.sourceSnapshotGeneratedAt.slice(0,10)} · {currentLinks.verifiedMatchedCount} links/times checked {currentLinks.checkedAt.slice(0,10)}</p><Link href="/plan">Change my answers</Link></section>

    <section ref={listRef} aria-label="Event matches" className={`event-list wrap${view==="grid"?" grid-view":""}`}>{!visible.length&&<div className="empty-week"><h2>{profile.length?"No matches with these filters.":"Let’s find your fit."}</h2><p>{profile.length?"Clear a filter or change your answers.":"Answer six quick questions to see your top ten."}</p><Link className="button primary" href="/plan">{profile.length?"Change my answers":"Start the questions"} →</Link></div>}{visible.map(({event,match},index)=><EventCard rank={mode==="recommended"?index+1:undefined} event={event} match={match} added={lineup.includes(event.id)} onToggle={()=>toggle(event.id)} onRegistered={()=>setPending({...pending,[event.id]:true})} key={event.id}/>)}</section>
    {visible.length>0&&<div className="more-matches wrap">{mode==="recommended"&&visible.length<results.length&&<button className="button build-week" onClick={showMore}>Show {Math.min(10,results.length-visible.length)} more matches<span> · {results.length-visible.length} remaining</span></button>}<Link className="button build-week" href="/lineup"><Calendar size={18} aria-hidden="true"/>See my lineup{selectedCount>0&&<span> · {selectedCount} event{selectedCount===1?"":"s"}</span>} →</Link></div>}
    <ProductExperiences compact view={view} selection={{ids:lineup,toggle}} onRegistered={id=>setPending({...pending,[id]:true})}/><PulseCommunity showcase selection={{ids:lineup,toggle}}/>
    {showBackToTop&&<button type="button" className="button matches-back-to-top" aria-label="Back to top" title="Back to top" onClick={backToTop}><ArrowUp size={22} weight="bold" aria-hidden="true"/></button>}
  </main>;
}
