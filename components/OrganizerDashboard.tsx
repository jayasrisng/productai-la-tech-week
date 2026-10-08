"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { LockKey, DownloadSimple } from "@phosphor-icons/react";
import { SiteHeader } from "./SiteHeader";
import { unavailableOrganizerRequest } from "@/lib/visit-client";
import { securityCsv, type AdminBooking } from "@/lib/admin-bookings";

const api=process.env.NEXT_PUBLIC_RESERVATIONS_API?.replace(/\/$/,"")||(process.env.NODE_ENV==="production"?"/api":undefined);
const clock=(time:string)=>new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit"}).format(new Date(time));
const date=(time:string)=>new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"short",month:"short",day:"numeric"}).format(new Date(time));

export function OrganizerDashboard(){
  const [code,setCode]=useState("");
  const [bookings,setBookings]=useState<AdminBooking[]|null>(null);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [day,setDay]=useState("");
  const [status,setStatus]=useState("confirmed");
  const [query,setQuery]=useState("");
  const [nextCursor,setNextCursor]=useState<string|null>(null);
  const generation=useRef(0);
  const sessionTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{generation.current++;if(sessionTimer.current)clearTimeout(sessionTimer.current);},[]);
  const clear=()=>{generation.current++;setBookings(null);setCode("");setNextCursor(null);setQuery("");setMessage("");if(sessionTimer.current)clearTimeout(sessionTimer.current);};
  const request=async(path:string,options:RequestInit={})=>{
    if(!api)throw new Error("Organizer access isn’t connected in this preview.");
    const response=await unavailableOrganizerRequest(`${api}/admin${path}`,{...options,credentials:"same-origin",cache:"no-store",signal:AbortSignal.timeout(15000)});
    if(!response.headers.get("Content-Type")?.includes("application/json"))throw new Error("Organizer service is unavailable.");
    const data=await response.json() as {error?:string;bookings?:AdminBooking[];nextCursor?:string|null};
    if(!response.ok){if(response.status===401)clear();throw new Error(data.error||"Organizer service is unavailable.");}
    return data;
  };
  const load=async(more=false)=>{
    const current=generation.current;setBusy(true);setMessage("");
    try{const data=await request(`/bookings${more&&nextCursor?`?before=${encodeURIComponent(nextCursor)}`:""}`);const rows=data.bookings;if(!Array.isArray(rows))throw new Error("Registration data could not be verified.");if(current===generation.current){setBookings(previous=>more?[...(previous||[]),...rows]:rows);setNextCursor(data.nextCursor||null);}}
    catch(error){setMessage(error instanceof Error?error.message:"Unable to load registrations.");}finally{setBusy(false);}
  };
  const unlock=async(event:FormEvent)=>{
    event.preventDefault();setBusy(true);setMessage("");const submitted=code;setCode("");
    try{await request("/session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:submitted})});generation.current++;await load();sessionTimer.current=setTimeout(clear,30*60*1000);}
    catch(error){clear();setMessage(error instanceof Error?error.message:"Unable to unlock.");}finally{setBusy(false);}
  };
  const lock=async()=>{clear();try{await request("/session",{method:"DELETE"});}catch{setMessage("Display locked. Close this browser window if the service is unavailable.");}};
  const filtered=(bookings||[]).flatMap(booking=>{
    const hours=booking.hours.filter(hour=>(!day||hour.startsAt.slice(0,10)===day)&&(status==="all"||hour.status===status));
    const matches=!query||booking.attendees.some(a=>`${a.name} ${a.email} ${a.linkedin}`.toLowerCase().includes(query.toLowerCase()));
    return hours.length&&matches?[{...booking,hours}]:[];
  });
  const exportList=()=>{
    const url=URL.createObjectURL(new Blob([securityCsv(filtered)],{type:"text/csv;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download=`productai-entry-list-${day||"week"}.csv`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <main className="organizer-page"><SiteHeader/><section className="wrap organizer-head"><p className="mono-label">PRODUCT.AI / ORGANIZER ACCESS</p><h1>Registrations</h1><p>Lounge bookings · Los Angeles time</p></section><section className="wrap">
    {bookings===null?<form className="organizer-unlock" onSubmit={unlock}><LockKey size={28} className="recharge-icon" aria-hidden="true"/><h2>Private access</h2><p>Your organizer code is separate from the booking code.</p><label>Access code<input type="password" value={code} onChange={e=>setCode(e.target.value)} required maxLength={256} autoComplete="off" disabled={busy}/></label><button className="button" disabled={busy}>{busy?"Unlocking…":"Unlock dashboard"}</button>{!api&&<p>Live organizer access isn’t connected in this preview.</p>}</form>:<>
      <div className="organizer-toolbar"><label>Date<select value={day} onChange={e=>setDay(e.target.value)}><option value="">All days</option>{[12,13,14,15,16].map(d=><option value={`2026-10-${d}`} key={d}>Oct {d}</option>)}</select></label><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option><option value="all">All</option></select></label><label>Find attendee<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, email or LinkedIn"/></label><button className="button small" onClick={()=>void load()} disabled={busy}>Refresh</button><button className="button small" onClick={()=>void lock()}>Lock</button></div>
      <div className="organizer-summary"><p>{filtered.length} bookings shown{nextCursor?" · more available":""}</p><button className="button small recharge-label" disabled={!filtered.length} onClick={exportList}><DownloadSimple size={16}/> Security entry list</button></div><p className="organizer-note">Entry list includes confirmed names and hours only. Delete downloaded copies after October. External event RSVPs aren’t included.</p>
      {!filtered.length&&<p className="organizer-empty">No registrations for these filters.</p>}
      <div className="organizer-bookings">{filtered.map(booking=><article className="organizer-booking" key={booking.id}><div className="organizer-booking-heading"><h2>{booking.attendees.find(a=>a.ordinal===0)?.name}</h2><span>Confirmation email: {booking.emailStatus==="sent"?"accepted by provider":booking.emailStatus}</span></div><div className="organizer-attendees">{booking.attendees.map(person=><div key={person.ordinal}><p className="mono-label">{person.ordinal?"GUEST":"ATTENDEE"}</p><strong>{person.name}</strong><p>{person.email}</p><a href={person.linkedin} target="_blank" rel="noreferrer">{person.linkedin} ↗</a></div>)}</div><ul className="organizer-hours">{booking.hours.map(hour=><li key={hour.id}><span>{date(hour.startsAt)} · {clock(hour.startsAt)}–{clock(hour.endsAt)}</span><span className={`booking-status ${hour.status}`}>{hour.status}</span></li>)}</ul><p className="organizer-note">{booking.referral} · Booked {date(new Date(booking.createdAt*1000).toISOString())}</p></article>)}</div>{nextCursor&&<button className="button" onClick={()=>void load(true)} disabled={busy}>Load more registrations</button>}
    </>}{message&&<p role="status" className="organizer-message">{message}</p>}
  </section></main>;
}
