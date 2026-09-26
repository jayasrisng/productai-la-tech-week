"use client";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocalStorage } from "@/lib/storage";
import { eventsByCity } from "@/lib/events";
import type { Preferences, TechWeekCity } from "@/types/event";

type Area={name:string;x:number;y:number;people:number};
type Update={id:string;name:string;area:string;eventName:string;note:string;time:string;image?:string};
const emptyPrefs:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
const areas:Record<TechWeekCity,Area[]>={
  la:[{name:"Santa Monica",x:13,y:28,people:42},{name:"Venice",x:18,y:68,people:31},{name:"Culver City",x:42,y:63,people:27},{name:"West Hollywood",x:57,y:28,people:36},{name:"Downtown",x:81,y:55,people:54}],
  sf:[{name:"Marina",x:32,y:15,people:29},{name:"FiDi",x:77,y:31,people:61},{name:"SOMA",x:66,y:61,people:73},{name:"Mission",x:42,y:76,people:48},{name:"Dogpatch",x:82,y:78,people:22}]
};
const sampleUpdates:Record<TechWeekCity,Update[]>={
  la:[
    {id:"la-1",name:"Maya",area:"Culver City",eventName:"AI Founders & Operators Mixer",note:"The patio has space and the founder-to-recruiter mix is surprisingly good. Walk-ins are moving quickly.",time:"4m"},
    {id:"la-2",name:"Dev",area:"Venice",eventName:"Consumer Tech Sunset Social",note:"Door line is about 15 minutes. The event is already louder than the calendar description suggests.",time:"8m"},
    {id:"la-3",name:"Sara",area:"Santa Monica",eventName:"Women Building AI Breakfast",note:"Great small-group conversations near the back tables. Coffee line is short right now.",time:"12m",image:"/brand/la-tech-week.jpg"},
    {id:"la-4",name:"Noah",area:"West Hollywood",eventName:"Future of Media Dinner",note:"Mostly founders and creative operators so far. Valet is much easier than street parking.",time:"16m"},
    {id:"la-5",name:"Lena",area:"Downtown",eventName:"Deep Tech Demo Night",note:"First demos started. The hardware area on the east side is the most active part of the room.",time:"21m"}
  ],
  sf:[
    {id:"sf-1",name:"Arjun",area:"SOMA",eventName:"AI Infrastructure Founders",note:"Strong technical crowd and plenty of room near the demo tables. Entry is moving fast.",time:"3m"},
    {id:"sf-2",name:"Tess",area:"FiDi",eventName:"Fintech Operator Exchange",note:"Second floor is quieter and better for conversations. Coat check has no line.",time:"7m",image:"/brand/sf-tech-week.jpg"},
    {id:"sf-3",name:"Iris",area:"Mission",eventName:"Creative AI After Hours",note:"The room is full but the courtyard just opened. More creators than investors right now.",time:"11m"},
    {id:"sf-4",name:"Leo",area:"Marina",eventName:"Founder Breakfast Club",note:"Small tables are turning into useful intros. Come before the next panel lets out.",time:"18m"},
    {id:"sf-5",name:"Sam",area:"Dogpatch",eventName:"Hardware & Robotics Night",note:"Live demos are running at the back. Transit is easier than rideshare at the moment.",time:"24m"}
  ]
};

export default function NeighborhoodLivePage(){
  const [prefs]=useLocalStorage<Preferences>("techWeekPreferences",emptyPrefs); const [lineupIds]=useLocalStorage<string[]>("techWeekLineup",[]); const [updates,setUpdates]=useLocalStorage<Update[]>("neighborhoodUpdatesV2",[]);
  const city=prefs.city||"la"; const cityName=city==="sf"?"San Francisco":"Los Angeles"; const cityAreas=areas[city]; const cityEvents=eventsByCity[city];
  const [selectedArea,setSelectedArea]=useState(cityAreas[0].name); const [eventName,setEventName]=useState(""); const [note,setNote]=useState(""); const [imageData,setImageData]=useState<string|undefined>();
  useEffect(()=>{if(!cityAreas.some(area=>area.name===selectedArea))setSelectedArea(cityAreas[0].name)},[city,cityAreas,selectedArea]);
  const eventOptions=useMemo(()=>{const selected=cityEvents.filter(event=>lineupIds.includes(event.id)&&event.neighborhood===selectedArea);const nearby=cityEvents.filter(event=>event.neighborhood===selectedArea&&event.access.status!=="Closed");return [...selected,...nearby.filter(event=>!selected.some(item=>item.id===event.id))].slice(0,18)},[cityEvents,lineupIds,selectedArea]);
  useEffect(()=>setEventName(eventOptions[0]?.name||"General neighborhood update"),[selectedArea,eventOptions]);
  const visibleUpdates=[...updates,...sampleUpdates[city]].filter(update=>update.area===selectedArea);
  const selected=cityAreas.find(area=>area.name===selectedArea)||cityAreas[0];
  const post=()=>{if(!note.trim())return;setUpdates([{id:crypto.randomUUID(),name:prefs.name||"You",area:selectedArea,eventName:eventName||"General neighborhood update",note:note.trim(),time:"Now",image:imageData},...updates]);setNote("");setImageData(undefined)};
  const chooseImage=(event:ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const photo=new window.Image();photo.onload=()=>{const scale=Math.min(1,1000/photo.width);const canvas=document.createElement("canvas");canvas.width=Math.round(photo.width*scale);canvas.height=Math.round(photo.height*scale);canvas.getContext("2d")!.drawImage(photo,0,0,canvas.width,canvas.height);setImageData(canvas.toDataURL("image/jpeg",.78))};photo.src=String(reader.result)};reader.readAsDataURL(file)};
  return <main><SiteHeader/><section className="live-head wrap"><div><p className="mono-label">NEIGHBORHOOD LIVE / {city.toUpperCase()}</p><h1>{cityName}<br/>field map.</h1><p>Select a neighborhood to see who’s there and what people are reporting from actual events.</p></div><div className="live-count"><strong>{cityAreas.reduce((sum,area)=>sum+area.people,0)}</strong><span>PEOPLE<br/>ACTIVE NOW</span></div></section>
    <section className="live-dashboard wrap"><div className="city-map"><div className="map-topline"><span>{cityName.toUpperCase()} / LIVE NEIGHBORHOODS</span><b>DEMO COMMUNITY SIGNALS</b></div><div className="map-surface"><i className="map-road road-one"/><i className="map-road road-two"/><i className="map-road road-three"/>{cityAreas.map(area=><button className={`neighborhood-pin ${selectedArea===area.name?"selected":""}`} style={{left:`${area.x}%`,top:`${area.y}%`}} onClick={()=>setSelectedArea(area.name)} key={area.name}><span>{area.people}</span><b>{area.name}</b></button>)}<div className="map-coast">PACIFIC</div></div><div className="area-strip">{cityAreas.map(area=><button className={selectedArea===area.name?"active":""} onClick={()=>setSelectedArea(area.name)} key={area.name}><span>{area.name}</span><b>{area.people}</b></button>)}</div></div>
      <aside className="area-panel"><p className="panel-title">SELECTED AREA</p><h2>{selectedArea}</h2><div className="people-stack"><span>MG</span><span>DK</span><span>SL</span><span>+{Math.max(0,selected.people-3)}</span></div><p>{selected.people} people sharing activity across {Math.max(1,eventOptions.length)} listed events nearby.</p><div className="nearby-events"><span>EVENTS NEARBY</span>{eventOptions.slice(0,4).map(event=><button onClick={()=>setEventName(event.name)} key={event.id}>{event.name}<small>{event.startTimeDisplay}</small></button>)}</div></aside>
    </section>
    <section className="neighborhood-feed wrap"><div className="feed-heading"><div><p className="mono-label">{selectedArea.toUpperCase()} / LIVE UPDATES</p><h2>What people are seeing.</h2></div><span>{visibleUpdates.length} REPORTS</span></div><div className="feed-layout"><div className="update-composer location-composer"><div className="composer-route"><b>{prefs.name||"YOU"}</b><span>posting in</span><strong>{selectedArea}</strong></div><label>Tag an event<select value={eventName} onChange={event=>setEventName(event.target.value)}><option>General neighborhood update</option>{eventOptions.map(event=><option value={event.name} key={event.id}>{event.name}</option>)}</select></label><textarea value={note} onChange={event=>setNote(event.target.value)} placeholder={`What should people heading to ${selectedArea} know?`}/>{imageData&&<div className="upload-preview"><Image src={imageData} alt="Update attachment preview" width={160} height={100} unoptimized/><button onClick={()=>setImageData(undefined)}>Remove</button></div>}<div className="composer-actions"><label className="image-action" htmlFor="update-image">＋ Add image<input id="update-image" type="file" accept="image/*" onChange={chooseImage}/></label><button className="button primary small" disabled={!note.trim()} onClick={post}>Post to {selectedArea}</button></div><small>Prototype: updates and images stay in this browser.</small></div><div className="location-updates">{visibleUpdates.length?visibleUpdates.map(update=><article key={update.id}><header><div className="update-avatar">{update.name.slice(0,2).toUpperCase()}</div><div><strong>{update.name}</strong><span>{update.area} · {update.time}</span></div></header><button className="event-tag" onClick={()=>setEventName(update.eventName)}>↳ {update.eventName}</button><p>{update.note}</p>{update.image&&<Image className="update-image" src={update.image} alt={`Update from ${update.eventName}`} width={720} height={420} unoptimized/>}</article>):<div className="quiet-feed"><b>No reports yet.</b><p>Be the first person to share an update from {selectedArea}.</p></div>}</div></div></section>
  </main>;
}
