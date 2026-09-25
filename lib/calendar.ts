import type { EventItem } from "@/types/event";
function stamp(date:string,time:string){return `${date.replaceAll("-","")}T${time.replace(":","")}00`;}
function plusMinutes(time:string,minutes:number){const [h,m]=time.split(":").map(Number);const total=h*60+m+minutes;return `${String(Math.floor(total/60)%24).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;}
function safe(value:string){return value.replaceAll("\\","\\\\").replaceAll("\n","\\n").replaceAll(",","\\,").replaceAll(";","\\;");}
export function downloadCalendar(events:EventItem[]){
  const body=events.map(event=>["BEGIN:VEVENT",`UID:${event.id}@product.ai`,`DTSTART;TZID=America/Los_Angeles:${stamp(event.date,event.startTime)}`,`DTEND;TZID=America/Los_Angeles:${stamp(event.date,plusMinutes(event.startTime,90))}`,`SUMMARY:${safe(event.name)}`,`LOCATION:${safe(event.neighborhood)}`,`DESCRIPTION:${safe(`${event.summary} Confirm details: ${event.rsvpUrl}`)}`,`URL:${event.rsvpUrl}`,"END:VEVENT"].join("\r\n")).join("\r\n");
  const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Product.ai//LA Tech Week//EN\r\nCALSCALE:GREGORIAN\r\n${body}\r\nEND:VCALENDAR`;
  const url=URL.createObjectURL(new Blob([ics],{type:"text/calendar"}));const a=document.createElement("a");a.href=url;a.download="product-ai-la-tech-week.ics";a.click();URL.revokeObjectURL(url);
}
