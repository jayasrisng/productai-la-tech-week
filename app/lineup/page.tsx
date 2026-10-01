"use client";
import type { DragEvent } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocalStorage } from "@/lib/storage";
import { downloadCalendar } from "@/lib/calendar";
import { eventsByCity } from "@/lib/events";
import type { Preferences } from "@/types/event";

type Decoration={id:string;glyph:string;color:string;x:number;y:number;rotation:number};
const empty:Preferences={name:"",city:"la",identity:[],goals:[],interests:[],formats:[],excludedFormats:[],locations:[]};
const stickerOptions=[{glyph:"◆",color:"#8b5cf6"},{glyph:"★",color:"#ff5ec4"},{glyph:"⚡",color:"#5ee7ff"},{glyph:"♡",color:"#ff8a3d"},{glyph:"AI",color:"#8b5cf6"},{glyph:":)",color:"#5ee7ff"},{glyph:"↗",color:"#ff5ec4"}];
const mins=(value:string)=>{const [h,m]=value.split(":").map(Number);return h*60+m};
const dayName=(date:string,short=false)=>new Date(`${date}T12:00:00`).toLocaleDateString("en-US",short?{weekday:"short"}:{weekday:"long",month:"long",day:"numeric"});
const posterLines=(value:string,maxLength=58)=>{const lines:string[]=[];let line="";for(const word of value.trim().split(/\s+/)){if(word.length>maxLength){if(line){lines.push(line);line=""}for(let start=0;start<word.length;start+=maxLength)lines.push(word.slice(start,start+maxLength));continue}if(!line)line=word;else if(`${line} ${word}`.length<=maxLength)line+=` ${word}`;else{lines.push(line);line=word}}if(line)lines.push(line);return lines};

export default function LineupPage(){
  const [prefs]=useLocalStorage<Preferences>("techWeekPreferences",empty); const [ids,setIds]=useLocalStorage<string[]>("techWeekLineup",[]); const [registered,setRegistered]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationStatus",{}); const [pending,setPending]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationPending",{}); const [decorations,setDecorations]=useLocalStorage<Decoration[]>("techWeekLineupDecorations",[]);
  const city=prefs.city||"la"; const cityName=city==="sf"?"San Francisco":"Los Angeles"; const cityShort=city.toUpperCase(); const cityEvents=eventsByCity[city];
  const selected=cityEvents.filter(event=>ids.includes(event.id)).sort((a,b)=>a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime));
  const days=[...new Set(selected.map(e=>e.date))];
  const warnings=selected.flatMap((event,index)=>{const next=selected[index+1];if(!next||next.date!==event.date)return[];const gap=mins(next.startTime)-mins(event.startTime);const list:string[]=[];if(gap<90)list.push(`Potential schedule conflict: ${event.name} and ${next.name} start ${gap} minutes apart.`);else if(event.neighborhood!==next.neighborhood&&gap<150)list.push(`${event.neighborhood} → ${next.neighborhood}: leave real travel time between these events.`);return list;});
  const addSticker=(glyph:string,color:string,x=82,y=14,id?:string)=>{const nextId=id??crypto.randomUUID();const rotation=[...nextId].reduce((sum,char)=>sum+char.charCodeAt(0),0)%19-9;setDecorations([...decorations,{id:nextId,glyph,color,x,y,rotation}])};
  const dragStart=(event:DragEvent,glyph:string,color:string,id?:string)=>event.dataTransfer.setData("application/product-ai-decoration",JSON.stringify({glyph,color,id}));
  const dropSticker=(event:DragEvent<HTMLElement>)=>{event.preventDefault();const raw=event.dataTransfer.getData("application/product-ai-decoration");if(!raw)return;const item=JSON.parse(raw) as {glyph:string;color:string;id?:string};const rect=event.currentTarget.getBoundingClientRect();const x=Math.max(3,Math.min(93,((event.clientX-rect.left)/rect.width)*100));const y=Math.max(2,Math.min(94,((event.clientY-rect.top)/rect.height)*100));if(item.id)setDecorations(decorations.map(d=>d.id===item.id?{...d,x,y}:d));else addSticker(item.glyph,item.color,x,y)};
  function savePoster(){
    const grouped=days.map(day=>({day,events:selected.filter(event=>event.date===day).map(event=>({event,lines:posterLines(event.name)}))}));
    const eventLineCount=grouped.reduce((total,group)=>total+group.events.reduce((sum,item)=>sum+item.lines.length,0),0);
    const canvas=document.createElement("canvas");
    canvas.width=1200;
    canvas.height=Math.max(1500,390+(days.length*58)+(selected.length*12)+(eventLineCount*38)+90);
    const c=canvas.getContext("2d")!;
    c.fillStyle="#09090b";c.fillRect(0,0,canvas.width,canvas.height);
    c.strokeStyle="#29292f";
    for(let x=60;x<canvas.width;x+=60){c.beginPath();c.moveTo(x,0);c.lineTo(x,canvas.height);c.stroke()}
    for(let y=60;y<canvas.height;y+=60){c.beginPath();c.moveTo(0,y);c.lineTo(canvas.width,y);c.stroke()}
    c.fillStyle="#8b5cf6";c.fillRect(54,54,1092,10);
    c.font="700 24px monospace";c.fillText(`PRODUCT.AI TECH WEEK / ${cityShort}`,76,108);
    c.fillStyle="#ffffff";c.font="800 82px Arial";c.fillText("YOUR",72,205);c.fillText("TECH WEEK LINEUP",72,290);
    c.fillStyle="#a78bfa";c.font="22px monospace";c.fillText(`${cityName.toUpperCase()} / ${selected.length} EVENTS`,76,338);
    let y=405;
    for(const group of grouped){
      c.fillStyle="#8b5cf6";c.font="700 22px monospace";c.fillText(dayName(group.day).toUpperCase(),76,y);y+=42;
      for(const item of group.events){c.fillStyle="#ffffff";c.font="700 28px Arial";for(const line of item.lines){c.fillText(line,76,y);y+=38}y+=12}
      y+=16;
    }
    for(const item of decorations){c.save();c.translate(item.x*12,item.y*canvas.height/100);c.rotate(item.rotation*Math.PI/180);c.fillStyle=item.color;c.font="800 42px Arial";c.fillText(item.glyph,0,0);c.restore()}
    const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download=`${city}-tech-week-lineup.png`;a.click();
  }
  return <main><SiteHeader/><section className="lineup-head wrap"><p className="mono-label">YOUR LINEUP / {selected.length} EVENTS / {cityShort}</p><div><h1>Your<br/>Tech Week lineup.</h1><div className="lineup-actions"><button className="button" disabled={!selected.length} onClick={()=>downloadCalendar(selected)}>Add to calendar</button><button className="button primary" disabled={!selected.length} onClick={savePoster}>Save poster</button></div></div></section>
    {!selected.length?<section className="empty-week wrap"><h2>Your lineup is still open.</h2><p>Choose the rooms that earn a place in it.</p><Link className="button primary" href="/events">See my matches</Link></section>:<>
      {warnings.length>0&&<section className="warning-stack wrap">{warnings.map(w=><p key={w}><span>PLAN NOTE</span>{w}</p>)}</section>}
      <section className="lineup-console wrap"><div className="console-titlebar"><span><i/><i/><i/></span><b>product.ai / tech-week-lineup</b><em>DRAG TO DECORATE</em></div><div className="console-layout"><aside className="sticker-tray"><div className="lineup-stats"><span>{cityShort}</span><b>{String(selected.length).padStart(2,"0")}</b><small>EVENTS</small></div><p>DRAG A STICKER ONTO YOUR POSTER</p><div className="sticker-grid">{stickerOptions.map(item=><button draggable onDragStart={event=>dragStart(event,item.glyph,item.color)} onClick={()=>addSticker(item.glyph,item.color)} style={{color:item.color}} aria-label={`Add ${item.glyph} decoration`} key={item.glyph}>{item.glyph}</button>)}</div>{decorations.length>0&&<button className="clear-stickers" onClick={()=>setDecorations([])}>Clear decorations</button>}</aside><section className="console-poster" onDragOver={event=>event.preventDefault()} onDrop={dropSticker}><div className="console-grid"/><div className="poster-decorations">{decorations.map(item=><button draggable onDragStart={event=>dragStart(event,item.glyph,item.color,item.id)} onDoubleClick={()=>setDecorations(decorations.filter(d=>d.id!==item.id))} style={{left:`${item.x}%`,top:`${item.y}%`,color:item.color,transform:`rotate(${item.rotation}deg)`}} title="Drag to move · double-click to remove" key={item.id}>{item.glyph}</button>)}</div><header><div><span>PRODUCT.AI TECH WEEK</span><h2>{cityName}<br/>Lineup</h2></div><p>{city==="sf"?"OCT 05—11":"OCT 12—18"}<br/>2026</p></header><div className="console-days">{days.map(day=><section className="console-day" key={day}><div className="console-day-label"><b>{dayName(day,true).toUpperCase()}</b><span>{day.slice(-2)}</span></div><div className="console-event-stack">{selected.filter(e=>e.date===day).map((event,index)=><article className={index===0?"headliner":""} key={event.id}><div><h3>{event.name}</h3><p>{event.startTimeDisplay} · {event.neighborhood} · {event.hostDisplay}</p>{pending[event.id]&&!registered[event.id]&&<div className="registration-check"><span>RSVP done?</span><button onClick={()=>setRegistered({...registered,[event.id]:true})}>Yes</button><button onClick={()=>setPending({...pending,[event.id]:false})}>Later</button></div>}{registered[event.id]&&<strong className="registered">RSVP LOCKED ✓</strong>}</div><button className="remove-event" onClick={()=>setIds(ids.filter(id=>id!==event.id))} aria-label={`Remove ${event.name}`}>×</button></article>)}</div></section>)}</div><footer><span>BUILD LESS FOMO.</span><span>{(prefs.name||"MY").toUpperCase()}’S TECH WEEK / {cityShort}</span></footer></section></div></section>
      <section className="hq-invite wrap"><p>NEXT / MISSION HQ MOCKUP</p><div><h2>See your week on the map.</h2><p>Preview the Mission HQ concept with demo data. It is not connected to an internal calendar.</p><Link className="button primary" href="/mission-hq">Open HQ mockup →</Link></div></section>
    </>}
  </main>;
}
