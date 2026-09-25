"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocalStorage } from "@/lib/storage";
import type { Preferences } from "@/types/event";

const steps = [
  { key:"identity", title:"Who are you?", note:"Choose the closest fit. More than one is fine.", options:["Founder","Engineer","Designer","Investor","Student","Creator","Product","Other"] },
  { key:"goals", title:"What would make Tech Week worth it?", note:"Pick the outcomes you want to leave with.", options:["Find a job","Find talent","Meet founders","Meet investors","Learn","Find collaborators","Build relationships","Explore new technology","Have fun"] },
  { key:"interests", title:"What are you interested in?", note:"We’ll use these as the strongest ranking signal.", options:["AI","XR / Spatial Computing","Robotics","Consumer","Design","Health","Fintech","Climate","Creative Technology","Developer Tools","Commerce","Media"] },
  { key:"formats", title:"What kind of rooms do you want?", note:"No judgment. The room changes the experience.", options:["Small gatherings","Networking","Panels","Workshops","Hackathons","Demos","Parties","Founder dinners"] },
  { key:"locations", title:"How far are you willing to move?", note:"LA miles are not regular miles.", options:["Santa Monica","Venice","West LA","Culver City","Hollywood","DTLA","Anywhere if it’s worth it"] }
] as const;
const empty: Preferences = { identity:[], goals:[], interests:[], formats:[], locations:[] };

export default function PlanPage() {
  const router = useRouter(); const [step, setStep] = useState(0); const [prefs, setPrefs] = useLocalStorage<Preferences>("techWeekPreferences", empty); const current = steps[step];
  const selected = prefs[current.key];
  function toggle(option:string){ setPrefs({ ...prefs, [current.key]: selected.includes(option) ? selected.filter(x=>x!==option) : [...selected, option] }); }
  function next(){ if(step < steps.length - 1) setStep(step+1); else router.push("/events?recommended=1"); }
  return <main><SiteHeader/><section className="planner wrap"><div className="planner-progress"><span>YOUR WEEK / {String(step+1).padStart(2,"0")}</span><div>{steps.map((_,i)=><i className={i<=step?"done":""} key={i}/>)}</div></div>
    <div className="planner-grid"><aside><p>One minute now.<br/>Much less wandering later.</p><span>Your answers stay on this device.</span></aside><div><p className="mono-label">QUESTION {step+1} OF {steps.length}</p><h1>{current.title}</h1><p className="question-note">{current.note}</p><div className="choice-grid">{current.options.map(option=><button className={selected.includes(option)?"selected":""} onClick={()=>toggle(option)} key={option}><span>{option}</span><b>{selected.includes(option)?"◆":"+"}</b></button>)}</div><div className="planner-actions"><button disabled={step===0} onClick={()=>setStep(step-1)}>← Back</button><button className="button primary" disabled={!selected.length} onClick={next}>{step===steps.length-1?"Show my week":"Continue →"}</button></div></div></div>
  </section></main>;
}
