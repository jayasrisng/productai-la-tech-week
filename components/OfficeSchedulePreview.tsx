"use client";
import { useState } from "react";
import { Lightning } from "@phosphor-icons/react";
import { LOUNGE_HOURS } from "@/lib/pulse";
export function OfficeSchedulePreview(){
  const days=[...new Set(LOUNGE_HOURS.map(slot=>slot.day))];
  const [day,setDay]=useState(days[0]);
  const clock=(value:number)=>new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric"}).format(value);
  return <section className="office-schedule-preview" aria-label="Lounge schedule"><p>Opening hours · booking availability unavailable</p><div className="visit-day-tabs" role="group" aria-label="Lounge schedule date">{days.map(value=><button type="button" aria-pressed={day===value} key={value} onClick={()=>setDay(value)}>{new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",weekday:"short",day:"numeric"}).format(LOUNGE_HOURS.find(slot=>slot.day===value)!.start)}</button>)}</div><div className="product-lounge-track">{LOUNGE_HOURS.filter(slot=>slot.day===day).map(slot=><span className="lounge-hour-recharge" key={slot.id}><Lightning size={32} weight="fill" aria-hidden="true"/><span>{clock(slot.start)}–{clock(slot.end)}</span></span>)}</div></section>;
}
