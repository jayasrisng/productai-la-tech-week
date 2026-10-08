import type { EventItem } from "@/types/event";
function stamp(date:string,time:string){return `${date.replaceAll("-","")}T${time.replace(":","")}00`;}
function safe(value:string){return value.replaceAll("\\","\\\\").replaceAll("\n","\\n").replaceAll(",","\\,").replaceAll(";","\\;");}
export function downloadCalendar(events:EventItem[]){
  const body=events.map(event=>["BEGIN:VEVENT",`UID:${event.id}@product.ai`,`DTSTART;TZID=America/Los_Angeles:${stamp(event.date,event.startTime)}`,...(event.endTime?[`DTEND;TZID=America/Los_Angeles:${stamp(event.endDate||event.date,event.endTime)}`]:[]),`SUMMARY:${safe(event.name)}`,`LOCATION:${safe([event.venueName,event.address].filter(Boolean).join(", ")||event.neighborhood)}`,`DESCRIPTION:${safe(`${event.summary}${event.endTime?"":" End time is not listed; check the organizer’s page."} Confirm details: ${event.rsvpUrl}`)}`,`URL:${event.rsvpUrl}`,"END:VEVENT"].join("\r\n")).join("\r\n");
  const city="Los Angeles";const slug="la";
  const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Product.ai//${city} Tech Week//EN\r\nCALSCALE:GREGORIAN\r\n${body}\r\nEND:VCALENDAR`;
  const url=URL.createObjectURL(new Blob([ics],{type:"text/calendar"}));const a=document.createElement("a");a.href=url;a.download=`product-ai-${slug}-tech-week.ics`;a.click();URL.revokeObjectURL(url);
}
