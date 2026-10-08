"use client";
import { activityCopy, displayChoice } from "@/lib/display-copy";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lightning } from "@phosphor-icons/react";
import { mapPosition, loungeAtTime } from "@/lib/pulse";
import { PulseCommunity } from "@/components/PulseCommunity";
import { PulseMap } from "@/components/PulseMap";
import { ProductAiLounge } from "@/components/ProductAiLounge";
import { EventCard } from "@/components/EventCard";
import { SiteHeader } from "@/components/SiteHeader";
import { events } from "@/lib/events";
import { rankEvents, calculateEventMatch } from "@/lib/calculateEventMatch";
import { useLocalStorage } from "@/lib/storage";
import { isProductAiEvent, isSpotlightEvent } from "@/lib/product-experiences";
import { WEEK_START, WEEK_END, STEP, MAX_STEP, pulseDefault, pulseLabel, formatPulseTime, eventActivity, eventWindow, onSelectedDay, reliableLocation, distanceKm, PRODUCTAI_LOCATION, laDate, pulseNeighborhoods } from "@/lib/pulse";
import type { Coordinates } from "@/lib/pulse";
import type { Preferences } from "@/types/event";
import { fetchPublicPresence, type PublicPresence } from "@/lib/visit-client";
import type { SharedLoungePlan } from "@/components/ProductAiLounge";
import { isExtendedEvent } from "@/lib/pulse";
import { pulseClockMinutes, pulseSelectionTime } from "@/lib/pulse-selection";

// Static Pages demo: backend access is intentionally disabled.
const reservationsApi: string | undefined = undefined;

const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
export default function MissionHQPage() {
  const [prefs]=useLocalStorage<Preferences>("techWeekPreferences",empty);
  const [lineup,setLineup]=useLocalStorage<string[]>("techWeekLineup",[]);
  const [pending,setPending]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationPending",{});
  const [now,setNow]=useState<number|null>(null);
  const [selection,setSelection]=useState<{date:string;minutes:number}|null>(null);
  const [area,setArea]=useState("All places");
  const [showProduct,setShowProduct]=useState(false);
  const [location,setLocation]=useState<Coordinates|null>(null);
  const [geoStatus,setGeoStatus]=useState("");
  const [nearby,setNearby]=useState(false);
  const [finding,setFinding]=useState(false);
  const [presence,setPresence]=useState<{time:number;people:PublicPresence[]}|null>(null);
  useEffect(()=>{const update=()=>setNow(Date.now());update();const timer=setInterval(update,30_000);return ()=>clearInterval(timer);},[]);
  const defaultTime=now!==null&&now>=WEEK_START?pulseDefault(now):WEEK_START+18*60*60_000;
  const time=selection?pulseSelectionTime(selection.date,selection.minutes):defaultTime;
  useEffect(()=>{
    const controller=new AbortController();
    void fetchPublicPresence(reservationsApi,time,controller.signal).then(people=>{
      if(!controller.signal.aborted)setPresence({time,people});
    });
    return()=>controller.abort();
  },[time,now]);
  // Hide old responses immediately when scrubbing; both surfaces use this list.
  const selectedPresence=presence?.time===time?presence.people:[];
  const step=Math.min(MAX_STEP,Math.max(0,Math.floor((time-WEEK_START)/STEP)));
  const label=!selection&&(now===null||now<WEEK_START)?"Preview · Tech Week starts Mon, Oct 12":pulseLabel(now??WEEK_START-1,selection!==null);
  const selectedDate=selection?.date??laDate(time);
  const selectedMinutes=selection?.minutes??pulseClockMinutes(time);
  const hasPreferences=Boolean(prefs.identity.length||prefs.goals.length||prefs.interests.length||prefs.formats.length);
  // Pulse covers the actual catalog, not just eligible Matches. Existing ranked
  // results lead the feed; other events have no invented user percentile.
  const pool=useMemo(()=>{
    const ranked=rankEvents(events,prefs);
    const matched=new Set(ranked.map(item=>item.event.id));
    return [...ranked,...events.filter(event=>event.inOfficialWeek&&!matched.has(event.id)).map(event=>({event,match:calculateEventMatch(event,prefs)}))].filter(({event})=>!isSpotlightEvent(event.id));
  },[prefs]);
  const active=useMemo(()=>pool.filter(({event})=>eventActivity(event,time)).sort((a,b)=>Number(isProductAiEvent(b.event.id))-Number(isProductAiEvent(a.event.id))||(hasPreferences?0:eventWindow(b.event).start-eventWindow(a.event).start)),[pool,time,hasPreferences]);
  const today=useMemo(()=>pool.filter(({event})=>onSelectedDay(event,time)),[pool,time]);
  const neighborhoods=useMemo(()=>pulseNeighborhoods(pool,time),[pool,time]);
  const near=useMemo(()=>!location?[]:today.flatMap(item=>{const point=reliableLocation(item.event);return point?[{...item,distance:distanceKm(location,point)}]:[];}).sort((a,b)=>Math.floor(a.distance/2)-Math.floor(b.distance/2)||b.match.score-a.match.score||a.distance-b.distance),[today,location]);
  const extended=active.filter(({event})=>isExtendedEvent(event)&&(area==="All places"||event.neighborhood===area));
  const filtered=active.filter(({event})=>!isExtendedEvent(event)&&(area==="All places"||event.neighborhood===area));
  const visible=(nearby?near.filter(({event})=>!isExtendedEvent(event)&&(!isProductAiEvent(event.id)||eventActivity(event,time))):filtered).slice(0,8);
  const showRecharge=Boolean(loungeAtTime(time))&&(area==="All places"||area==="Brentwood");
  const toggle=(id:string)=>setLineup(lineup.includes(id)?lineup.filter(x=>x!==id):[...lineup,id]);
  const chooseArea=(value:string)=>{setArea(value);setNearby(false);};
  const findMe=()=>{
    if(finding)return;
    if(!navigator.geolocation){setGeoStatus("Location is unavailable in this browser. Explore All places instead.");return;}
    setFinding(true);setGeoStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(position=>{
      const point={latitude:position.coords.latitude,longitude:position.coords.longitude};setLocation(point);setNearby(Boolean(mapPosition(point)));setArea("All places");setFinding(false);setGeoStatus(mapPosition(point)?"Found you. Your location stays on this page.":`You’re outside the LA map · ${Math.round(distanceKm(point,PRODUCTAI_LOCATION)/1.609344)} miles from Product.ai HQ.`);
    },error=>{setFinding(false);setGeoStatus(error.code===1?"Location access is off. Allow it in your browser to use Find me.":error.code===3?"Location timed out. Check browser location access and try again.":"Your browser couldn’t provide a location. LA browsing still works.");},{enableHighAccuracy:false,timeout:10_000,maximumAge:0});
  };
  const productNow=events.filter(event=>isProductAiEvent(event.id)&&eventActivity(event,time));
  const loungePlans:SharedLoungePlan[]=selectedPresence.map(item=>({name:item.displayName,avatar:item.avatarConfig,start:Date.parse(item.startsAt),end:Date.parse(item.endsAt),consent:true}));
  return <main className="pulse-page" data-personalized={hasPreferences}>
    <SiteHeader/>
    <section className="live-head wrap"><div><p className="mono-label">LA TECH WEEK / PULSE</p><h1>Around Tech Week.</h1><p>Your people. Your places. Your week.</p></div><button className="button" onClick={findMe} disabled={finding}>{finding?"Finding…":"Find me"}</button></section>
    <section className="pulse-timeline wrap" aria-label="Tech Week timeline">
      <div className="pulse-time-heading"><div><span className="pulse-status">{label}</span><strong data-testid="pulse-time">{formatPulseTime(time)}</strong></div><button className="button small" onClick={()=>setSelection(null)}>{now!==null&&now>=WEEK_START&&now<WEEK_END?"Now":now!==null&&now>=WEEK_END?"Week recap":"Preview week"}</button></div>
      <label className="pulse-date-picker">Date<input type="date" aria-label="Tech Week date" min={laDate(WEEK_START)} max={laDate(WEEK_END-1)} value={selectedDate} onInput={event=>{const date=event.currentTarget.value;if(date>=laDate(WEEK_START)&&date<=laDate(WEEK_END-1))setSelection({date,minutes:selectedMinutes});}} onChange={event=>{const date=event.target.value;if(date>=laDate(WEEK_START)&&date<=laDate(WEEK_END-1))setSelection({date,minutes:selectedMinutes});}}/></label>
      <div className="pulse-days" role="group" aria-label="Tech Week day">{Array.from({length:7},(_,i)=>{const day=WEEK_START+i*86400000,date=laDate(day);return <button key={date} aria-pressed={selectedDate===date} onClick={()=>setSelection({date,minutes:selectedMinutes})}>{new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"short",day:"numeric"}).format(day)}</button>;})}</div>
      <label className="pulse-time-slider">Time<input type="range" aria-label="Time of day" aria-valuetext={selectedMinutes===1440?"Midnight":new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit"}).format(time)} min={360} max={1440} step={15} value={selectedMinutes} onChange={event=>setSelection({date:selectedDate,minutes:Number(event.target.value)})}/></label>
      <div className="pulse-ticks"><span>6 AM</span><span>Noon</span><span>6 PM</span><span>Midnight</span></div><p>Los Angeles time</p>
    </section>
    <section className="pulse-explore wrap">
      <nav className="pulse-neighborhoods" aria-label="Explore neighborhoods"><button aria-pressed={!nearby&&area==="All places"} onClick={()=>chooseArea("All places")}>All places</button>{neighborhoods.map(([name,info])=><button key={name} aria-pressed={!nearby&&area===name} onClick={()=>chooseArea(name)}>{name}<small>{info.count.replace(/ live$/, " on")}</small></button>)}{area!=="All places"&&!neighborhoods.some(([name])=>name===area)&&<button aria-pressed onClick={()=>chooseArea(area)}>{area}</button>}<button className="pulse-product-shortcut" aria-pressed={showProduct} onClick={()=>setShowProduct(!showProduct)}>Product.ai HQ</button>{location&&mapPosition(location)&&<button aria-pressed={nearby} onClick={()=>setNearby(!nearby)}>Near me</button>}</nav>
      {geoStatus&&<div className="pulse-geo-status" role="status">{geoStatus}{location&&<button onClick={()=>{setLocation(null);setNearby(false);setGeoStatus("");}}>Clear location</button>}</div>}
      <div className="pulse-dashboard">
        <div className="pulse-map-column">
          <PulseMap key={step} neighborhoods={neighborhoods} active={active.map(item=>item.event)} visible={visible.map(item=>item.event)} area={area} onArea={chooseArea} showProduct={showProduct} onProduct={()=>setShowProduct(!showProduct)} location={location} presence={selectedPresence}/>
          <p className="pulse-map-note">LA neighborhood map · most venue locations aren’t published.</p>
          {showProduct&&<section className="pulse-destination" id="productai-planned-presence"><h2>Product.ai HQ</h2><p>{PRODUCTAI_LOCATION.address}</p><p>{formatPulseTime(time)}</p>{productNow.map(event=><p key={event.id}><a href={event.rsvpUrl} target="_blank" rel="noreferrer">{event.name} · {event.neighborhood} ↗</a></p>)}<Link className="button primary small recharge-label" href="/office-visit"><Lightning size={18} weight="fill" aria-hidden="true"/> Book your Recharge time →</Link></section>}
        </div>
        <section className="pulse-feed" aria-label="Selected-time event feed">
          <div className="pulse-feed-heading"><span className="pulse-status">{label}</span><h2>{nearby?"Events near me today":"What’s on"}</h2><h3>{area==="All places"?"Across Los Angeles":area}</h3><p>{formatPulseTime(time)}</p>{(nearby||filtered.length>0)&&<small>{nearby?`Selected day · ${laDate(time)}`:`Showing ${visible.length} of ${filtered.length} events on at this time`}</small>}</div>
          {showRecharge&&<ProductAiLounge now={time} plans={loungePlans}/>}
          {visible.map(({event,match})=><div className="pulse-event-entry" data-personalized={match.percentile!==undefined} id={`pulse-${event.id}`} key={event.id}><p className="pulse-activity">{nearby?`${(near.find(item=>item.event.id===event.id)!.distance/1.609344).toFixed(1)} mi away`:activityCopy(eventActivity(event,time))}</p><EventCard event={event} match={match} added={lineup.includes(event.id)} onToggle={()=>toggle(event.id)} onRegistered={()=>setPending({...pending,[event.id]:true})}/></div>)}
          {!visible.length&&!showRecharge&&<div className="pulse-empty"><strong>{nearby?"Hosts haven’t shared exact addresses yet.":"Nothing on at this hour."}</strong><p>{nearby?"Most share them after you RSVP. Browse everything on at this time instead.":"Try another time or day, or browse your matches."}</p>{nearby&&<button className="button small" onClick={()=>setNearby(false)}>All places</button>}<Link href="/events">See my matches →</Link></div>}
          {!nearby&&extended.length>0&&<section className="recurring-events" aria-label="Across the week"><h3>Across the week</h3><p>Ongoing experiences · explore once, return when it suits you</p>{extended.map(({event})=><article className="recurring-event" key={event.id}><a href={event.rsvpUrl} target="_blank" rel="noreferrer">{event.name} ↗</a><time>{new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",timeZone:"America/Los_Angeles"}).format(new Date(`${event.date}T12:00:00-07:00`))}–{new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",timeZone:"America/Los_Angeles"}).format(new Date(`${event.endDate}T12:00:00-07:00`))} · {displayChoice(event.neighborhood)}</time><button className="button small" onClick={()=>toggle(event.id)}>{lineup.includes(event.id)?"Added ✓":"Add to my lineup"}</button></article>)}</section>}
        </section>
      </div>
    </section>
    <PulseCommunity selection={{ids:lineup,toggle}}/>
    <footer className="mission-footer wrap"><Link href="/lineup">← Back to lineup</Link><Link href="/events">Add more events →</Link></footer>
  </main>;
}
