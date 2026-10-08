"use client";
import { displayChoice, displayTime, scheduleNoteCopy } from "@/lib/display-copy";
import { useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { useLocalStorage } from "@/lib/storage";
import { downloadCalendar } from "@/lib/calendar";
import { eventsByCity } from "@/lib/events";
import { fitPosterLayout, POSTER_SIZE } from "@/lib/poster";
import { eventTimeRange, scheduleNotes } from "@/lib/schedule-notes";
import { assetUrl } from "@/lib/assets";
import { PosterPreviewModal } from "@/components/PosterPreviewModal";
import { RsvpAgentHelp } from "@/components/RsvpAgentHelp";
import { PulseIdentity } from "@/components/PulseIdentity";
import { Avatar } from "@/components/Avatar";
import { useAvatar } from "@/components/useAvatar";
import { usePulseName } from "@/components/usePulseName";
import { posterStickers as stickerOptions, posterStickerColor } from "@/lib/poster-stickers";


type Decoration={id:string;glyph:string;color:string;x:number;y:number;rotation:number};

const dayName=(date:string,short=false)=>new Date(`${date}T12:00:00`).toLocaleDateString("en-US",short?{weekday:"short"}:{weekday:"long",month:"long",day:"numeric"});
const eventAnchor=(id:string)=>`lineup-event-${id}`;

export default function LineupPage(){
  const [poster,setPoster]=useState<Blob>();
  const posterButton=useRef<HTMLButtonElement>(null);
  const [posterStatus,setPosterStatus]=useState("");
  const [avatar,,hasSavedAvatar]=useAvatar();
  const [name]=usePulseName();
  const avatarRef=useRef<HTMLDivElement>(null);
  const posterTitle=name?`${name}’s LA TECH WEEK LINEUP`:"MY LA TECH WEEK LINEUP";
  const [ids,setIds]=useLocalStorage<string[]>("techWeekLineup",[]); const [registered,setRegistered]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationStatus",{}); const [pending,setPending]=useLocalStorage<Record<string,boolean>>("techWeekRegistrationPending",{}); const [decorations,setDecorations]=useLocalStorage<Decoration[]>("techWeekLineupDecorations",[]);
  const city="la" as const; const cityShort=city.toUpperCase(); const cityEvents=eventsByCity[city];
  const selected=cityEvents.filter(event=>ids.includes(event.id)).sort((a,b)=>a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime));
  const days=[...new Set(selected.map(e=>e.date))];
  const notes=scheduleNotes(selected);
  const noteGroups=[{kind:"overlap",title:"Overlaps"},{kind:"travel",title:"Travel time"},{kind:"timing",title:"Check timing"}] as const;
  const addSticker=(glyph:string,color:string,x=82,y=14,id?:string)=>{const nextId=id??crypto.randomUUID();const rotation=[...nextId].reduce((sum,char)=>sum+char.charCodeAt(0),0)%19-9;setDecorations([...decorations,{id:nextId,glyph,color,x,y,rotation}])};
  const dragStart=(event:DragEvent,glyph:string,color:string,id?:string)=>event.dataTransfer.setData("application/product-ai-decoration",JSON.stringify({glyph,color,id}));
  const dropSticker=(event:DragEvent<HTMLElement>)=>{event.preventDefault();const raw=event.dataTransfer.getData("application/product-ai-decoration");if(!raw)return;const item=JSON.parse(raw) as {glyph:string;color:string;id?:string};const rect=event.currentTarget.getBoundingClientRect();const x=Math.max(3,Math.min(93,((event.clientX-rect.left)/rect.width)*100));const y=Math.max(2,Math.min(94,((event.clientY-rect.top)/rect.height)*100));if(item.id)setDecorations(decorations.map(d=>d.id===item.id?{...d,x,y}:d));else addSticker(item.glyph,item.color,x,y)};
  async function createPoster(){
    await document.fonts.ready;
    const sans=getComputedStyle(document.body).fontFamily;
    const display=getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim()||sans;
    // Canvas does not trigger a repaint when a newly requested font finishes.
    // Explicitly load its weights before measuring/drawing, not just CSS text fonts.
    await Promise.all([document.fonts.load(`700 40px ${sans}`),document.fonts.load(`800 64px ${display}`)]);
    await document.fonts.ready;
    const logo=new window.Image();logo.src=assetUrl("/brand/productai-logo-light.svg");await logo.decode();
    const canvas=document.createElement("canvas");
    const c=canvas.getContext("2d")!;
    canvas.width=POSTER_SIZE.width;
    canvas.height=POSTER_SIZE.height;
    const layout=fitPosterLayout(days.map(day=>({day,names:selected.filter(event=>event.date===day).map(event=>event.name)})),(text,fontSize)=>{c.font=`700 ${fontSize}px ${sans}`;return c.measureText(text).width});
    c.fillStyle="#09090b";c.fillRect(0,0,canvas.width,canvas.height);
    c.strokeStyle="#29292f";
    for(let x=60;x<canvas.width;x+=60){c.beginPath();c.moveTo(x,0);c.lineTo(x,canvas.height);c.stroke()}
    for(let y=60;y<canvas.height;y+=60){c.beginPath();c.moveTo(0,y);c.lineTo(canvas.width,y);c.stroke()}
    const title="LA TECH WEEK LINEUP";
    c.font=`800 64px ${display}`;
    const titleSize=Math.min(64,64*(canvas.width-POSTER_SIZE.margin*2-110)/c.measureText(title).width);
    c.fillStyle="#D4D4D8";c.font=`700 28px ${sans}`;
    const owner=name?`${name}’s`:"MY";
    const ownerSize=Math.min(28,28*780/c.measureText(owner).width);
    c.font=`700 ${ownerSize}px ${sans}`;c.fillText(owner,72,90);
    c.fillStyle="#FAFAFA";c.font=`800 ${titleSize}px ${display}`;c.fillText(title,72,154);
    c.fillStyle="#D4D4D8";c.font=`22px ${sans}`;c.fillText(`Oct 12–18, 2026 · ${selected.length} events`,72,200);
    const avatarSvg=avatarRef.current?.querySelector("svg");
    if(hasSavedAvatar&&avatarSvg){
      const svg=avatarSvg.cloneNode(true) as SVGElement;
      svg.setAttribute("xmlns","http://www.w3.org/2000/svg");svg.setAttribute("width","328");svg.setAttribute("height","328");
      const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:"image/svg+xml"}));
      try{const image=new window.Image();image.src=url;await image.decode();c.drawImage(image,908,82,100,100);}finally{URL.revokeObjectURL(url);}
    }
    let y=POSTER_SIZE.contentTop;
    let eventOffset=0;
    for(const group of layout.groups){
      y+=layout.dateFontSize;
      c.fillStyle="#FAFAFA";c.font=`700 ${layout.dateFontSize}px ${sans}`;c.fillText(dayName(group.day).toUpperCase(),72,y);y+=layout.dateGap;
      c.font=`700 ${layout.fontSize}px ${sans}`;
      for(const run of group.runs){c.fillStyle=run.eventIndex===null?"#B5A2FE":(eventOffset+run.eventIndex)%2?"#B5A2FE":"#FAFAFA";if(run.eventIndex===null){const size=layout.fontSize*.18,x=72+run.x+layout.fontSize*.25,cy=y+(run.line+.7)*layout.lineHeight;c.save();c.translate(x,cy);c.rotate(Math.PI/4);c.fillRect(-size/2,-size/2,size,size);c.restore();}else c.fillText(run.text,72+run.x,y+(run.line+1)*layout.lineHeight);}
      y+=group.lineCount*layout.lineHeight;
      y+=layout.groupGap;
      eventOffset+=group.names.length;
    }
    for(const item of decorations.filter(item=>item.glyph!=="◆")){c.save();c.translate(item.x*canvas.width/100,item.y*canvas.height/100);c.rotate(item.rotation*Math.PI/180);c.fillStyle=posterStickerColor(item.glyph,item.color);c.font=`700 42px ${sans}`;c.fillText(item.glyph,0,0);c.restore()}
    c.fillStyle="#D4D4D8";c.font=`20px ${sans}`;c.fillText("Curated by",canvas.width-72-200-122,canvas.height-40);
    c.drawImage(logo,canvas.width-72-200,canvas.height-60,200,24);
    return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Poster could not be generated.")),"image/png"));
  }
  const savePoster=async()=>{setPosterStatus("Preparing your poster…");try{setPoster(await createPoster());setPosterStatus("");}catch{setPosterStatus("Poster preview failed. Please try again.");}};
  return <main><SiteHeader/>{poster&&<PosterPreviewModal blob={poster} name={name} onClose={()=>{setPoster(undefined);requestAnimationFrame(()=>posterButton.current?.focus());}}/>}<section className="lineup-head wrap"><div><div className="lineup-heading"><h1>Your Tech Week lineup.</h1><p>Adding an event isn’t an RSVP. Register on its event page and check for host approval.</p></div><div className="lineup-actions"><button className="button" disabled={!selected.length} onClick={()=>downloadCalendar(selected)}>Add all to calendar</button><button ref={posterButton} className="button primary" disabled={!selected.length||posterStatus==="Preparing your poster…"} onClick={savePoster}>Share poster</button></div></div>{posterStatus&&<p role="status">{posterStatus}</p>}</section>
    <PulseIdentity/>
    {!selected.length?<section className="empty-week wrap"><h2>No events yet.</h2><p>Add a few from your matches and they’ll show up here.</p><Link className="button primary" href="/events">See my matches</Link></section>:<>
      <div className={`lineup-workspace wrap${notes.length?" has-notes":""}`}>
      {notes.length>0&&<aside className="schedule-sidebar" aria-label="Schedule checks"><h2>Schedule checks <span>{notes.length}</span></h2>{noteGroups.map(group=>{
        const items=notes.filter(note=>note.kind===group.kind);
        if(group.kind==="timing"&&!items.length)return null;
        return <details className="schedule-note-group" key={group.kind}><summary><span>{group.title}</span><span className="schedule-group-count">{items.length}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div className="schedule-group-content">{!items.length&&<p className="schedule-clear">{group.kind==="overlap"?"No overlaps found.":"No tight travel between events."}</p>}{items.map(note=>{
          const sharedTime=note.first.date===note.second.date&&eventTimeRange(note.first)===eventTimeRange(note.second);
          return <article className="schedule-note" key={`${note.first.id}-${note.second.id}`}><p className="note-date">{dayName(note.first.date)}{note.second.date!==note.first.date?` → ${dayName(note.second.date)}`:""}</p>{sharedTime&&<time className="note-shared-time">{eventTimeRange(note.first)}</time>}<ol>{[note.first,note.second].map(event=><li key={event.id}><a href={`#${encodeURIComponent(eventAnchor(event.id))}`}>{event.name}<span aria-hidden="true">↗</span></a>{!sharedTime&&<time>{eventTimeRange(event)}</time>}<span className="note-location">{event.venueName?`${event.venueName} · `:""}{event.neighborhood}</span></li>)}</ol><details><summary>What to consider</summary><p className="note-detail">{scheduleNoteCopy(note.detail)}</p></details></article>;
        })}</div></details>;
      })}</aside>}
      <section className="lineup-console" data-theme="dark"><div className="console-titlebar"><span><i/><i/><i/></span><b>lineup.product.ai</b><em>TAP OR DRAG TO DECORATE</em></div><div className="console-layout"><aside className="sticker-tray"><div className="lineup-stats"><span>{cityShort}</span><b>{selected.length}</b><small>EVENTS</small></div><p>ADD A STICKER</p><div className="sticker-grid">{stickerOptions.map(item=><button draggable onDragStart={event=>dragStart(event,item.glyph,item.color)} onClick={()=>addSticker(item.glyph,item.color)} style={{color:item.color}} aria-label={`Add ${item.glyph} sticker`} key={item.glyph}>{item.glyph}</button>)}</div>{decorations.length>0&&<button className="clear-stickers" onClick={()=>setDecorations([])}>Clear stickers</button>}</aside><section className="console-poster" onDragOver={event=>event.preventDefault()} onDrop={dropSticker}><div className="console-grid"/><div className="poster-decorations">{decorations.filter(item=>item.glyph!=="◆").map(item=><button draggable onDragStart={event=>dragStart(event,item.glyph,item.color,item.id)} onDoubleClick={()=>setDecorations(decorations.filter(d=>d.id!==item.id))} style={{left:`${item.x}%`,top:`${item.y}%`,color:posterStickerColor(item.glyph,item.color),transform:`rotate(${item.rotation}deg)`}} title="Drag to move · double-click to remove" key={item.id}>{item.glyph}</button>)}</div><header><div><h2>{posterTitle}</h2><span>Oct 12–18, 2026 · {selected.length} events</span></div>{hasSavedAvatar&&<div className="poster-identity-avatar" ref={avatarRef}><Avatar config={avatar} label={`${name||"Your"} avatar`}/></div>}</header><div className="console-days">{days.map(day=><section className="console-day" key={day}><div className="console-day-label"><b>{dayName(day,true).toUpperCase()}</b><span>{day.slice(-2)}</span></div><div className="console-event-stack">{selected.filter(e=>e.date===day).map((event,index)=><article id={eventAnchor(event.id)} tabIndex={-1} className={index===0?"headliner":""} key={event.id}><div><h3>{event.name}</h3><p>{displayTime(event.startTimeDisplay)} · {displayChoice(event.neighborhood)} · {event.hostDisplay}</p>{pending[event.id]&&!registered[event.id]&&<div className="registration-check"><span>Did you RSVP?</span><button onClick={()=>setRegistered({...registered,[event.id]:true})}>Yes</button><button onClick={()=>setPending({...pending,[event.id]:false})}>Not yet</button></div>}{registered[event.id]&&<strong className="registered">RSVP sent ✓ Watch for host approval</strong>}</div><button className="remove-event" onClick={()=>setIds(ids.filter(id=>id!==event.id))} aria-label={`Remove ${event.name}`}>×</button></article>)}</div></section>)}</div><footer className="poster-curation"><span>Curated by</span><Image src={assetUrl("/brand/productai-logo-light.svg")} width={140} height={17} alt="Product.ai"/></footer></section></div></section>
      </div>
      <RsvpAgentHelp events={selected}/><section className="hq-invite wrap"><p>NEXT / TECH WEEK PULSE</p><div><h2>See what’s on, hour by hour.</h2><p>Map the week by neighborhood, find events near you, and see where to recharge between them.</p><Link className="button" href="/mission-hq">Explore Pulse →</Link></div></section>
    </>}
  </main>;
}
