"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assetUrl } from "@/lib/assets";
import { useLocalStorage } from "@/lib/storage";
import type { Preferences } from "@/types/event";
import { ThemeToggle, usePageTheme } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";

const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};

export default function Home(){
  usePageTheme();
  const router=useRouter();
  const [prefs,setPrefs,ready]=useLocalStorage<Preferences>("techWeekPreferences",empty);
  const choose=()=>{setPrefs({...prefs,city:"la",locations:prefs.city==="la"?prefs.locations:[]});router.push("/plan")};
  if(!ready)return <main className="welcome-shell"/>;
  return <main className="welcome-shell">
    <header className="welcome-top"><BrandMark/><div className="header-controls"><span>LA / 2026</span><ThemeToggle/></div></header>
    <section className="city-screen wrap"><div className="city-intro"><p className="hello-index">LA TECH WEEK / OCT 12—18, 2026</p><h1>Your LA<br/>Tech Week.</h1><p>A calendar planner by Product.ai. Find the Los Angeles events that fit you and build your lineup. No sign-in needed.</p></div><div className="city-grid la-only"><button className="city-card" onClick={choose} aria-label="Build my LA lineup"><Image className="city-photo" src={assetUrl("/brand/la-tech-week.jpg")} alt="LA Tech Week artwork" fill sizes="(max-width: 760px) 100vw, 700px" priority/><span className="city-overlay"/><span className="city-meta"><b>OCT 12—18</b><em>807 LISTINGS</em></span><span className="city-enter">BUILD MY LA LINEUP <b>↗</b></span></button></div></section>
  </main>;
}
