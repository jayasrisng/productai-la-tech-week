"use client";
import { useState } from "react";
import { displayChoice } from "@/lib/display-copy";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocalStorage } from "@/lib/storage";
import type { Preferences } from "@/types/event";

type MultiKey="identity"|"goals"|"interests"|"formats"|"excludedFormats"|"locations";
type Step={key:MultiKey;title:string;note:string;options:string[];optional?:boolean};
const baseSteps:Step[] = [
  { key:"identity", title:"What describes you?", note:"Pick all that fit.", options:["Student","Founder","Engineer","Designer","Investor","Creator","Product","Recruiter","Operator"] },
  { key:"goals", title:"What do you want from Tech Week?", note:"Pick everything you’re hoping for.", options:["Find a job","Meet recruiters","Meet founders","Meet investors","Raise capital","Find collaborators","Build relationships","Learn","Explore new technology","Have fun"] },
  { key:"interests", title:"What are you interested in?", note:"Choose the topics you want to see.", options:["AI","B2B","Fintech","B2C / Consumer","Healthcare / Healthtech","Creators","Fundraising / Investing","Media / Entertainment","Deep Tech","Engineering","Hardware","SaaS","HR / Hiring","AR / VR","Climate","Defense","Cybersecurity","Gaming","Crypto / Web3","Infrastructure"] },
  { key:"formats", title:"What kinds of events fit you?", note:"Select the settings where you connect best.", options:["Networking","Founder dinners","Small gatherings","Panels","Workshops","Hackathons","Demos","Parties"] },
  { key:"excludedFormats", title:"Anything you’d rather skip?", note:"Optional. We’ll leave these out of your matches.", optional:true, options:["Workshops","Panels","Hackathons","Demos","Parties","Founder dinners"] }
];
const cityLocations={la:["Santa Monica","Venice","Downtown","Culver City","Beverly Hills","El Segundo","West Hollywood","Playa Vista","Anywhere if it’s worth it"]};
const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};

export default function PlanPage(){
  const router=useRouter(); const [step,setStep]=useState(0); const [prefs,setPrefs]=useLocalStorage<Preferences>("techWeekPreferences",empty);
  const city="la" as const;
  const steps:Step[]=[...baseSteps,{key:"locations",title:"Where do you want to go?",note:"Pick the areas you’d travel to. We’ll favor events there.",options:cityLocations[city]}];
  const current=steps[step]; const selected=prefs[current.key];
  const toggle=(option:string)=>setPrefs({...prefs,[current.key]:selected.includes(option)?selected.filter(x=>x!==option):[...selected,option]});
  const next=()=>{if(step<steps.length-1)return setStep(step+1);router.push("/events?recommended=1")};
  return <main><SiteHeader/><section className="planner wrap"><div className="planner-progress"><span>YOUR {city.toUpperCase()} WEEK</span><div>{steps.map((_,i)=><i className={i<=step?"done":""} key={i}/>)}</div></div><div className="planner-grid"><aside><p>We’re matching you with highly relevant LA Tech Week events.</p><span>Every match includes a reason.</span></aside><div><p className="mono-label">QUESTION {step+1} OF {steps.length}</p><h1>{current.title}</h1><p className="question-note">{current.note}</p><div className="choice-grid">{current.options.map(option=><button className={selected.includes(option)?"selected":""} aria-pressed={selected.includes(option)} onClick={()=>toggle(option)} key={option}><span>{displayChoice(option)}</span><b>{selected.includes(option)?"◆":"+"}</b></button>)}</div><div className="planner-actions"><button onClick={()=>step===0?router.push("/"):setStep(step-1)}>← Back</button><button className="button primary" disabled={!current.optional&&!selected.length} onClick={next}>{step===steps.length-1?"See my matches →":"Continue →"}</button></div>{!current.optional&&!selected.length&&<p className="question-note">Pick at least one to continue.</p>}</div></div></section></main>;
}
