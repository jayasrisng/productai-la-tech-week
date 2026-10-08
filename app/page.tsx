"use client";
import Image from "next/image";
import Link from "next/link";
import { PulseCommunity } from "@/components/PulseCommunity";
import { useRouter } from "next/navigation";
import { assetUrl } from "@/lib/assets";
import { useLocalStorage } from "@/lib/storage";
import type { Preferences } from "@/types/event";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductExperiences } from "@/components/ProductExperiences";
import { productExperiences } from "@/lib/product-experiences";

const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
const posterExperiences=productExperiences;

export default function Home(){
  const router=useRouter();
  const [prefs,setPrefs,ready]=useLocalStorage<Preferences>("techWeekPreferences",empty);
  const [lineup,setLineup]=useLocalStorage<string[]>("techWeekLineup",[]);
  const selection={ids:lineup,toggle:(id:string)=>setLineup(lineup.includes(id)?lineup.filter(value=>value!==id):[...lineup,id])};
  const choose=()=>{setPrefs({...prefs,city:"la",locations:prefs.city==="la"?prefs.locations:[]});router.push("/plan")};
  if(!ready)return <main className="welcome-shell"><SiteHeader/><p className="wrap loading-note" role="status">Loading your lineup…</p></main>;
  return <main className="welcome-shell">
    <SiteHeader/>
    <section className="v3-hero wrap"><div className="v3-hero-copy"><p className="v3-eyebrow">LA TECH WEEK OCT 12–18</p><h1>Curate your Tech Week Lineup</h1><p>Answer six quick questions. Get the events that fit you, each with a reason why. Then share your lineup so your people know where to find you.</p><button className="button primary" onClick={choose}>Build my lineup</button><p><Link href="/office-visit">Have a Recharge code? Book your time at Product.ai HQ →</Link></p></div><aside className="example-poster home-lineup-poster" aria-label="Sample Tech Week lineup poster"><h2>MY LA TECH WEEK LINEUP</h2><ol>{posterExperiences.map(experience=><li key={experience.id}><div><span>{experience.posterDate}</span><strong>{experience.id==="headshots"?"Headshot Experience":experience.name}</strong></div></li>)}</ol><footer><span>Curated by</span><Image src={assetUrl("/brand/productai-logo-light.svg")} width={119} height={15} alt="Product.ai"/></footer></aside></section>
    <ProductExperiences selection={selection}/><PulseCommunity showcase selection={selection}/>
  </main>;
}
