"use client";
import type { DragEvent } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocalStorage } from "@/lib/storage";
import { downloadCalendar } from "@/lib/calendar";
import { eventsByCity } from "@/lib/events";
import { fitPosterLayout, POSTER_SIZE } from "@/lib/poster";
import { eventTimeRange, scheduleNotes } from "@/lib/schedule-notes";


type Decoration={id:string;glyph:string;color:string;x:number;y:number;rotation:number};

const stickerOptions=[{glyph:"◆",color:"#8b5cf6"},{glyph:"★",color:"#ff5ec4"},{glyph:"⚡",color:"#5ee7ff"},{glyph:"♡",color:"#ff8a3d"},{glyph:"AI",color:"#8b5cf6"},{glyph:":)",color:"#5ee7ff"},{glyph:"↗",color:"#ff5ec4"}];
const dayName=(date:string,short=false)=>new Date(`${date}T12:00:00`).toLocaleDateString("en-US",short?{weekday:"short"}:{weekday:"long",month:"long",day:"numeric"});
const eventAnchor=(id:string)=>`lineup-event-${id}`;

export default function LineupPage(){
  const [ids,setIds]=useLocalStorage<string[]>("techWeekLineup",[]); const [registered,setRegistered]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationStatus",{}); const [pending,setPending]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationPending",{}); const [decorations,setDecorations]=useLocalStorage<Decoration[]>("techWeekLineupDecorations",[]);
  const city="la" as const; const cityShort=city.toUpperCase(); const cityEvents=eventsByCity[city];
  const selected=cityEvents.filter(event=>ids.includes(event.id)).sort((a,b)=>a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime));
  const days=[...new Set(selected.map(e=>e.date))];
  const notes=scheduleNotes(selected);
  const noteGroups=[{kind:"overlap",title:"Overlaps"},{kind:"travel",title:"Distances"},{kind:"timing",title:"Check timing"}] as const;
  const addSticker=(glyph:string,color:string,x=82,y=14,id?:string)=>{const nextId=id??crypto.randomUUID();const rotation=[...nextId].reduce((sum,char)=>sum+char.charCodeAt(0),0)%19-9;setDecorations([...decorations,{id:nextId,glyph,color,x,y,rotation}])};
  const dragStart=(event:DragEvent,glyph:string,color:string,id?:string)=>event.dataTransfer.setData("application/product-ai-decoration",JSON.stringify({glyph,color,id}));
  const dropSticker=(event:DragEvent<HTMLElement>)=>{event.preventDefault();const raw=event.dataTransfer.getData("application/product-ai-decoration");if(!raw)return;const item=JSON.parse(raw) as {glyph:string;color:string;id?:string};const rect=event.currentTarget.getBoundingClientRect();const x=Math.max(3,Math.min(93,((event.clientX-rect.left)/rect.width)*100));const y=Math.max(2,Math.min(94,((event.clientY-rect.top)/rect.height)*100));if(item.id)setDecorations(decorations.map(d=>d.id===item.id?{...d,x,y}:d));else addSticker(item.glyph,item.color,x,y)};
  function savePoster(){
    const canvas=document.createElement("canvas");
    const c=canvas.getContext("2d")!;
    canvas.width=POSTER_SIZE.width;
    canvas.height=POSTER_SIZE.height;
    const layout=fitPosterLayout(days.map(day=>({day,names:selected.filter(event=>event.date===day).map(event=>event.name)})),(text,fontSize)=>{c.font=`700 ${fontSize}px Arial`;return c.measureText(text).width});
    c.fillStyle="#09090b";c.fillRect(0,0,canvas.width,canvas.height);
    c.strokeStyle="#29292f";
    for(let x=60;x<canvas.width;x+=60){c.beginPath();c.moveTo(x,0);c.lineTo(x,canvas.height);c.stroke()}
    for(let y=60;y<canvas.height;y+=60){c.beginPath();c.moveTo(0,y);c.lineTo(canvas.width,y);c.stroke()}
    const title="MY LA TECH WEEK LINEUP";
    c.font="800 64px Arial";
    const titleSize=Math.min(64,64*(canvas.width-POSTER_SIZE.margin*2)/c.measureText(title).width);
    c.fillStyle="#ffffff";c.font=`800 ${titleSize}px Arial`;c.fillText(title,72,132);
    c.fillStyle="#a1a1aa";c.font="22px Arial";c.fillText(`designed by product.ai · ${selected.length} events`,72,178);
    let y=POSTER_SIZE.contentTop;
    for(const group of layout.groups){
      y+=layout.dateFontSize;
      c.fillStyle="#f4f4f5";c.font=`700 ${layout.dateFontSize}px Arial`;c.fillText(dayName(group.day).toUpperCase(),72,y);y+=layout.dateGap;
      c.font=`700 ${layout.fontSize}px Arial`;
      for(const run of group.runs){c.fillStyle=run.eventIndex===null?"#71717a":run.eventIndex%2===0?"#c4b5fd":"#ffffff";c.fillText(run.text,72+run.x,y+(run.line+1)*layout.lineHeight);}
      y+=group.lineCount*layout.lineHeight;
      y+=layout.groupGap;
    }
    for(const item of decorations){c.save();c.translate(item.x*canvas.width/100,item.y*canvas.height/100);c.rotate(item.rotation*Math.PI/180);c.fillStyle=item.color;c.font="800 42px Arial";c.fillText(item.glyph,0,0);c.restore()}
    const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download=`${city}-tech-week-lineup.png`;a.click();
  }
  return <main><SiteHeader/><section className="lineup-head wrap"><p className="mono-label">YOUR LINEUP / {selected.length} EVENTS / {cityShort}</p><div><h1>Your<br/>Tech Week lineup.</h1><div className="lineup-actions"><button className="button primary" disabled={!selected.length} onClick={()=>downloadCalendar(selected)}>Add to calendar</button><button className="button primary" disabled={!selected.length} onClick={savePoster}>Save poster</button></div></div></section>
    {!selected.length?<section className="empty-week wrap"><h2>Your lineup is still open.</h2><p>Add events from your matches.</p><Link className="button primary" href="/events">See my matches</Link></section>:<>
      <div className={`lineup-workspace wrap${notes.length?" has-notes":""}`}>
      {notes.length>0&&<aside className="schedule-sidebar" aria-label="Schedule checks"><h2>Schedule checks <span>{notes.length}</span></h2>{noteGroups.map(group=>{
        const items=notes.filter(note=>note.kind===group.kind);
        if(group.kind==="timing"&&!items.length)return null;
        return <details className="schedule-note-group" key={group.kind}><summary><span>{group.title}</span><span className="schedule-group-count">{items.length}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div className="schedule-group-content">{!items.length&&<p className="schedule-clear">{group.kind==="overlap"?"No overlaps found.":"No short transfers flagged."}</p>}{items.map(note=>{
          const sharedTime=note.first.date===note.second.date&&eventTimeRange(note.first)===eventTimeRange(note.second);
          return <article className="schedule-note" key={`${note.first.id}-${note.second.id}`}><p className="note-date">{dayName(note.first.date)}{note.second.date!==note.first.date?` → ${dayName(note.second.date)}`:""}</p>{sharedTime&&<time className="note-shared-time">{eventTimeRange(note.first)}</time>}<ol>{[note.first,note.second].map(event=><li key={event.id}><a href={`#${encodeURIComponent(eventAnchor(event.id))}`}>{event.name}<span aria-hidden="true">↗</span></a>{!sharedTime&&<time>{eventTimeRange(event)}</time>}<span className="note-location">{event.venueName?`${event.venueName} · `:""}{event.neighborhood}</span></li>)}</ol><details><summary>What to consider</summary><p className="note-detail">{note.detail}</p></details></article>;
        })}</div></details>;
      })}</aside>}
      <section className="lineup-console"><div className="console-titlebar"><span><i/><i/><i/></span><b>product.ai / tech-week-lineup</b><em>DRAG TO DECORATE</em></div><div className="console-layout"><aside className="sticker-tray"><div className="lineup-stats"><span>{cityShort}</span><b>{selected.length}</b><small>EVENTS</small></div><p>DRAG A STICKER ONTO YOUR POSTER</p><div className="sticker-grid">{stickerOptions.map(item=><button draggable onDragStart={event=>dragStart(event,item.glyph,item.color)} onClick={()=>addSticker(item.glyph,item.color)} style={{color:item.color}} aria-label={`Add ${item.glyph} decoration`} key={item.glyph}>{item.glyph}</button>)}</div>{decorations.length>0&&<button className="clear-stickers" onClick={()=>setDecorations([])}>Clear decorations</button>}</aside><section className="console-poster" onDragOver={event=>event.preventDefault()} onDrop={dropSticker}><div className="console-grid"/><div className="poster-decorations">{decorations.map(item=><button draggable onDragStart={event=>dragStart(event,item.glyph,item.color,item.id)} onDoubleClick={()=>setDecorations(decorations.filter(d=>d.id!==item.id))} style={{left:`${item.x}%`,top:`${item.y}%`,color:item.color,transform:`rotate(${item.rotation}deg)`}} title="Drag to move · double-click to remove" key={item.id}>{item.glyph}</button>)}</div><header><div><h2>MY LA TECH WEEK LINEUP</h2><span>designed by product.ai · {selected.length} events</span></div></header><div className="console-days">{days.map(day=><section className="console-day" key={day}><div className="console-day-label"><b>{dayName(day,true).toUpperCase()}</b><span>{day.slice(-2)}</span></div><div className="console-event-stack">{selected.filter(e=>e.date===day).map((event,index)=><article id={eventAnchor(event.id)} tabIndex={-1} className={index===0?"headliner":""} key={event.id}><div><h3>{event.name}</h3><p>{event.startTimeDisplay} · {event.neighborhood} · {event.hostDisplay}</p>{pending[event.id]&&!registered[event.id]&&<div className="registration-check"><span>RSVP done?</span><button onClick={()=>setRegistered({...registered,[event.id]:true})}>Yes</button><button onClick={()=>setPending({...pending,[event.id]:false})}>Later</button></div>}{registered[event.id]&&<strong className="registered">RSVP marked done ✓</strong>}</div><button className="remove-event" onClick={()=>setIds(ids.filter(id=>id!==event.id))} aria-label={`Remove ${event.name}`}>×</button></article>)}</div></section>)}</div></section></div></section>
      </div>
      <section className="hq-invite wrap"><p>NEXT / TECH WEEK PULSE</p><div><h2>Around Tech Week.</h2><p>Explore the map and sample feed. Live sources aren’t connected yet.</p><Link className="button primary" href="/mission-hq">Explore Pulse →</Link></div></section>
    </>}
  </main>;
}
