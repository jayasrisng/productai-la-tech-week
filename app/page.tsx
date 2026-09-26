"use client";
import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/lib/storage";
import type { Preferences, TechWeekCity } from "@/types/event";

const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
const cities:{id:TechWeekCity;name:string;dates:string;events:string;image:string}[]=[
  {id:"sf",name:"San Francisco",dates:"OCT 05—11",events:"1,711 EVENTS",image:"/brand/sf-tech-week.jpg"},
  {id:"la",name:"Los Angeles",dates:"OCT 12—18",events:"807 EVENTS",image:"/brand/la-tech-week.jpg"}
];

export default function Home(){
  const router=useRouter();
  const [prefs,setPrefs,ready]=useLocalStorage<Preferences>("techWeekPreferences",empty);
  const [draft,setDraft]=useState("");
  const [asked,setAsked]=useState(false);
  useEffect(()=>{if(ready)setDraft(prefs.name||"")},[ready,prefs.name]);
  const showCities=asked||Boolean(prefs.name?.trim());
  const submit=(event:FormEvent)=>{event.preventDefault();if(!draft.trim())return;setPrefs({...prefs,name:draft.trim(),city:prefs.city||"la"});setAsked(true)};
  const choose=(city:TechWeekCity)=>{setPrefs({...prefs,name:(draft||prefs.name).trim(),city,locations:prefs.city===city?prefs.locations:[]});router.push("/plan")};
  if(!ready)return <main className="welcome-shell"/>;
  return <main className="welcome-shell">
    <header className="welcome-top"><span className="product-mark">◆ product.ai tech week</span><span>SF + LA / 2026</span></header>
    {!showCities?<section className="hello-screen wrap"><p className="hello-index">HELLO / 001</p><h1>Hello—<br/><span>oh, wait.</span></h1><p>I didn’t ask your name.</p><form onSubmit={submit}><label htmlFor="welcome-name">What should I call you?</label><div><input id="welcome-name" autoFocus autoComplete="given-name" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Enter your first name"/><button type="submit" disabled={!draft.trim()} aria-label="Continue">→</button></div></form></section>:
    <section className="city-screen wrap"><div className="city-intro"><p className="hello-index">NICE TO MEET YOU / {String((draft||prefs.name).length).padStart(3,"0")}</p><h1>Okay, {(draft||prefs.name).trim()}.<br/><span>Where are we going?</span></h1><p>Choose your Tech Week. We’ll rank the entire city calendar around what you want from the week.</p></div><div className="city-grid">{cities.map(city=><button className="city-card" onClick={()=>choose(city.id)} key={city.id}><Image className="city-photo" src={city.image} alt={`${city.name} Tech Week artwork`} fill sizes="(max-width: 760px) 100vw, 50vw" priority/><span className="city-overlay"/><span className="city-meta"><b>{city.dates}</b><em>{city.events}</em></span><span className="city-enter">PLAN {city.id.toUpperCase()} <b>↗</b></span></button>)}</div><button className="change-name" onClick={()=>{setPrefs({...prefs,name:""});setAsked(false)}}>Not {(draft||prefs.name).trim()}? Change name</button></section>}
  </main>;
}
