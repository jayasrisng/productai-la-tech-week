"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocalStorage } from "@/lib/storage";
import type { Preferences } from "@/types/event";

const steps = [
  { key:"identity", title:"What best describes you?", note:"Choose every role that feels relevant.", options:["Student","Founder","Engineer","Designer","Investor","Creator","Product","Recruiter","Operator"] },
  { key:"goals", title:"What would make the week worth it?", note:"Outcomes matter more than buzzwords.", options:["Find a job","Meet recruiters","Meet founders","Meet investors","Raise capital","Find collaborators","Build relationships","Learn","Explore new technology","Have fun"] },
  { key:"interests", title:"What are you interested in?", note:"These come directly from the official calendar taxonomy.", options:["AI","B2B","Fintech","B2C / Consumer","Healthcare / Healthtech","Creators","Fundraising / Investing","Media / Entertainment","Deep Tech","Engineering","Hardware","SaaS","HR / Hiring","AR / VR","Climate","Defense","Cybersecurity","Gaming","Crypto / Web3","Infrastructure"] },
  { key:"formats", title:"What kind of rooms do you want?", note:"For job-seeking, networking and matchmaking usually carry more signal.", options:["Networking","Founder dinners","Small gatherings","Panels","Workshops","Hackathons","Demos","Parties"] },
  { key:"excludedFormats", title:"Anything you want to skip?", note:"These become hard exclusions, not soft preferences.", optional:true, options:["Workshops","Panels","Hackathons","Demos","Parties","Founder dinners"] },
  { key:"locations", title:"Where are you willing to go?", note:"Choose a few neighborhoods, or let a strong match pull you across town.", options:["Santa Monica","Venice","West LA","Culver City","Hollywood","Downtown","Beverly Hills","Playa Vista","Anywhere if it’s worth it"] }
] as const;
const empty:Preferences={name:"",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};

export default function PlanPage(){
  const router=useRouter(); const [step,setStep]=useState(-1); const [prefs,setPrefs]=useLocalStorage<Preferences>("techWeekPreferences",empty);
  if(step===-1) return <main><SiteHeader/><section className="planner wrap"><div className="planner-progress"><span>YOUR WEEK / START</span><div>{steps.map((_,i)=><i key={i}/>)}</div></div><div className="planner-grid"><aside><p>One minute now.<br/>Much less wandering later.</p><span>Your answers stay on this device.</span></aside><div><p className="mono-label">LET’S MAKE THIS YOURS</p><h1>What should we call you?</h1><p className="question-note">No account required. This is only used to personalize your plan.</p><input className="name-input" autoFocus value={prefs.name} onChange={e=>setPrefs({...prefs,name:e.target.value})} onKeyDown={e=>{if(e.key==="Enter"&&prefs.name.trim())setStep(0)}} placeholder="Your first name" aria-label="Your first name"/><div className="planner-actions"><span/><button className="button primary" disabled={!prefs.name.trim()} onClick={()=>setStep(0)}>Start planning →</button></div></div></div></section></main>;
  const current=steps[step]; const selected=prefs[current.key];
  const toggle=(option:string)=>setPrefs({...prefs,[current.key]:selected.includes(option)?selected.filter(x=>x!==option):[...selected,option]});
  const next=()=>step<steps.length-1?setStep(step+1):router.push("/events?recommended=1");
  return <main><SiteHeader/><section className="planner wrap"><div className="planner-progress"><span>{prefs.name.toUpperCase()}’S WEEK / {String(step+1).padStart(2,"0")}</span><div>{steps.map((_,i)=><i className={i<=step?"done":""} key={i}/>)}</div></div><div className="planner-grid"><aside><p>We’re narrowing 807 events around what you actually want.</p><span>Every result will explain its ranking.</span></aside><div><p className="mono-label">QUESTION {step+1} OF {steps.length}</p><h1>{current.title}</h1><p className="question-note">{current.note}</p><div className="choice-grid">{current.options.map(option=><button className={selected.includes(option)?"selected":""} onClick={()=>toggle(option)} key={option}><span>{option}</span><b>{selected.includes(option)?"◆":"+"}</b></button>)}</div><div className="planner-actions"><button onClick={()=>step===0?setStep(-1):setStep(step-1)}>← Back</button><button className="button primary" disabled={!(("optional" in current)&&current.optional)&&!selected.length} onClick={next}>{step===steps.length-1?"Find my events":"Continue →"}</button></div></div></div></section></main>;
}
