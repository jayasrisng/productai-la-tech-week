"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assetUrl } from "@/lib/assets";
import { useLocalStorage } from "@/lib/storage";
import type { Preferences, TechWeekCity } from "@/types/event";
import { usePageTheme } from "@/components/ThemeToggle";

const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
const cities:{id:TechWeekCity;name:string;dates:string;events:string;image:string}[]=[
  {id:"sf",name:"San Francisco",dates:"OCT 05—11",events:"1,711 EVENTS",image:assetUrl("/brand/sf-tech-week.jpg")},
  {id:"la",name:"Los Angeles",dates:"OCT 12—18",events:"807 EVENTS",image:assetUrl("/brand/la-tech-week.jpg")}
];

export default function Home(){
  usePageTheme();
  const router=useRouter();
  const [prefs,setPrefs,ready]=useLocalStorage<Preferences>("techWeekPreferences",empty);
  const choose=(city:TechWeekCity)=>{setPrefs({...prefs,city,locations:prefs.city===city?prefs.locations:[]});router.push("/plan")};
  if(!ready)return <main className="welcome-shell"/>;
  return <main className="welcome-shell">
    <header className="welcome-top"><span className="product-mark">◆ product.ai tech week</span><span>SF + LA / 2026</span></header>
    <section className="city-screen wrap"><div className="city-intro"><p className="hello-index">TECH WEEK / 2026</p><h1>Pick your city.</h1><p>Choose a Tech Week. We’ll rank its events around your goals.</p></div><div className="city-grid">{cities.map(city=><button className="city-card" onClick={()=>choose(city.id)} key={city.id}><Image className="city-photo" src={city.image} alt={`${city.name} Tech Week artwork`} fill sizes="(max-width: 760px) 100vw, 50vw" priority/><span className="city-overlay"/><span className="city-meta"><b>{city.dates}</b><em>{city.events}</em></span><span className="city-enter">PLAN {city.id.toUpperCase()} <b>↗</b></span></button>)}</div></section>
  </main>;
}
