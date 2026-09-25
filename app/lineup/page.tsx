"use client";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocalStorage } from "@/lib/storage";
import { downloadCalendar } from "@/lib/calendar";
import { events } from "@/lib/events";
import type { Preferences } from "@/types/event";

const empty:Preferences={name:"",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
const mins=(value:string)=>{const [h,m]=value.split(":").map(Number);return h*60+m};
export default function LineupPage(){
  const [prefs]=useLocalStorage<Preferences>("techWeekPreferences",empty); const [ids,setIds]=useLocalStorage<string[]>("techWeekLineup",[]); const [registered,setRegistered]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationStatus",{}); const [pending,setPending]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationPending",{});
  const selected=events.filter(event=>ids.includes(event.id)).sort((a,b)=>a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime));
  const days=[...new Set(selected.map(e=>e.date))];
  const warnings=selected.flatMap((event,index)=>{const next=selected[index+1];if(!next||next.date!==event.date)return[];const gap=mins(next.startTime)-mins(event.startTime);const list:string[]=[];if(gap<90)list.push(`Potential schedule conflict: ${event.name} and ${next.name} start ${gap} minutes apart.`);else if(event.neighborhood!==next.neighborhood&&gap<150)list.push(`${event.neighborhood} → ${next.neighborhood}: leave real travel time between these events.`);return list;});
  function savePoster(){const canvas=document.createElement("canvas");canvas.width=1200;canvas.height=1500;const c=canvas.getContext("2d")!;c.fillStyle="#fafafa";c.fillRect(0,0,1200,1500);c.fillStyle="#8b5cf6";c.fillRect(70,70,18,18);c.fillStyle="#18181b";c.font="600 32px Arial";c.fillText("PRODUCT.AI × LA TECH WEEK",110,88);c.font="600 82px Arial";c.fillText(`${(prefs.name||"MY").toUpperCase()}’S`,70,210);c.fillText("LA TECH WEEK",70,300);c.font="24px monospace";c.fillText("OCT 12—18 / LOS ANGELES",74,350);let y=440;for(const day of days){c.fillStyle="#8b5cf6";c.font="600 22px monospace";c.fillText(new Date(`${day}T12:00:00`).toLocaleDateString("en-US",{weekday:"long"}).toUpperCase(),74,y);y+=50;for(const event of selected.filter(e=>e.date===day).slice(0,6)){c.fillStyle="#18181b";c.font="500 29px Arial";c.fillText(event.name.slice(0,58),74,y);c.fillStyle="#71717a";c.font="19px monospace";c.fillText(`${event.startTimeDisplay}  /  ${event.neighborhood}`,74,y+28);y+=82;}y+=25;if(y>1400)break;}const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="my-la-tech-week.png";a.click();}
  return <main><SiteHeader/><section className="lineup-head wrap"><p className="mono-label">MY WEEK / {selected.length} EVENTS</p><div><h1>{(prefs.name||"My")}’s<br/>LA Tech Week.</h1><div className="lineup-actions"><button className="button" disabled={!selected.length} onClick={()=>downloadCalendar(selected)}>Add lineup to calendar</button><button className="button ghost" disabled={!selected.length} onClick={savePoster}>Save lineup image</button></div></div></section>
    {!selected.length?<section className="empty-week wrap"><h2>Your week is still open.</h2><p>Choose the events that earn a place in it.</p><Link className="button primary" href="/events">See my matches</Link></section>:<>
      {warnings.length>0&&<section className="warning-stack wrap">{warnings.map(w=><p key={w}><span>PLAN NOTE</span>{w}</p>)}</section>}
      <section className="lineup wrap">{days.map(day=><div className="lineup-day" key={day}><h2>{new Date(`${day}T12:00:00`).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</h2><div>{selected.filter(e=>e.date===day).map(event=><article key={event.id}><time>{event.startTimeDisplay}</time><div><h3>{event.name}</h3><p>{event.neighborhood} · {event.hostDisplay}</p>{pending[event.id]&&!registered[event.id]&&<div className="registration-check"><span>Did you register?</span><button onClick={()=>setRegistered({...registered,[event.id]:true})}>Yes, registered</button><button onClick={()=>setPending({...pending,[event.id]:false})}>Not yet</button></div>}{registered[event.id]&&<strong className="registered">REGISTERED ✓</strong>}</div><button className="remove-event" onClick={()=>setIds(ids.filter(id=>id!==event.id))}>Remove</button></article>)}</div></div>)}</section>
      <section className="hq-invite wrap"><p>YOUR WEEK IS PLANNED.</p><div><h2>Now find your home base.</h2><p>Recharge. Work. Meet people. Head back out.</p><Link className="button primary" href="/mission-hq">Enter Mission HQ →</Link></div></section>
    </>}
  </main>;
}
