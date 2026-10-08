import { catalog } from "./events";
import type { EventItem } from "@/types/event";
import neighborhoodLocations from "@/data/pulse-neighborhoods.json";
import { CLAYDATE_ID, HEADSHOTS_ID } from "./product-experiences";
export const LA_ZONE = "America/Los_Angeles";
export const STEP = 15 * 60_000;
const wallTimes = new Map<string,number>();
export function laTime(date: string, time = "00:00") {
  const key=`${date}T${time}`;
  if(wallTimes.has(key))return wallTimes.get(key)!;
  const wall = Date.parse(`${date}T${time}:00Z`);
  let result = wall;
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: LA_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(result);
    const get = (type: string) => parts.find(p => p.type === type)!.value;
    const rendered = Date.parse(`${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`);
    result += wall - rendered;
  }
  wallTimes.set(key,result);
  return result;
}
export function laDate(time: number) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: LA_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(time);
  return ["year", "month", "day"].map(key => parts.find(p => p.type === key)!.value).join("-");
}
export const WEEK_START = laTime(catalog.week.startsOn);
export const WEEK_END = laTime(catalog.week.endsOn) + 86_400_000;
export const MAX_STEP = Math.floor((WEEK_END - WEEK_START) / STEP) - 1;
export function pulseDefault(now: number) { return now < WEEK_START ? WEEK_START : now < WEEK_END ? now : WEEK_END - STEP; }
export function pulseLabel(now: number, selected: boolean) { return selected ? "Selected time" : now < WEEK_START ? "Upcoming Tech Week" : now < WEEK_END ? "Live · Now" : "Tech Week recap"; }
export function formatPulseTime(time: number) { return new Intl.DateTimeFormat("en-US", { timeZone: LA_ZONE, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(time); }
export function eventWindow(event: EventItem) {
  const start = laTime(event.date, event.startTime);
  let end = event.endTime ? laTime(event.endDate || event.date, event.endTime) : null;
  if (end !== null && end <= start && !event.endDate) end += 86_400_000;
  return { start, end };
}
// A published multi-day span is not evidence of repeated daily sessions.
export function isExtendedEvent(event: EventItem) {
  return Boolean(event.endDate && laTime(event.endDate) - laTime(event.date) >= 2 * 86_400_000);
}
export function eventActivity(event: EventItem, time: number) {
  const { start, end } = eventWindow(event);
  // Product-approved Pulse-only estimate. Never used by lineup/calendar/conflicts.
  const mapEnd = end ?? start + 3 * 60 * 60_000;
  return time >= start && time < mapEnd ? end === null ? "Live at selected time · estimated end" : "Live at selected time" : null;
}
export function onSelectedDay(event: EventItem, time: number) {
  const day = laDate(time), { start, end } = eventWindow(event);
  return event.date === day || (start < laTime(day) + 86_400_000 && (end ?? start + 3 * 60 * 60_000) > laTime(day));
}
export function pulseNeighborhoods(items: {event:EventItem}[], time:number) {
  const counts=new Map<string,{active:number;rank:number}>();
  items.forEach(({event},rank)=>{if(event.isVirtual||/^(Other|Virtual|Unknown|TBA|TBD|Location shared after RSVP)$/i.test(event.neighborhood)||!eventActivity(event,time))return;const old=counts.get(event.neighborhood);counts.set(event.neighborhood,{active:(old?.active??0)+1,rank:old?.rank??rank});});
  return [...counts].sort((a,b)=>b[1].active-a[1].active||a[1].rank-b[1].rank).slice(0,5).map(([name,info])=>[name,{...info,count:`${info.active} event${info.active===1?"":"s"} live`}] as const);
}
export type Coordinates = { latitude: number; longitude: number };
export type VenueLocation = Coordinates & { address: string; source: string };
export const NEIGHBORHOOD_LOCATIONS = neighborhoodLocations as Readonly<Record<string, Coordinates & {source:string;label:string}>>;
export const LOUNGE_HOURS = Array.from({length:5},(_,dayIndex)=>{
  const day=laDate(WEEK_START+dayIndex*86_400_000);
  return Array.from({length:dayIndex===0?4:5},(_,index)=>({id:`${day}-${11+index}`,day,hour:11+index,start:laTime(day,`${11+index}:00`),end:laTime(day,`${12+index}:00`)}));
}).flat();
export function loungeAtTime(time:number){return LOUNGE_HOURS.find(slot=>slot.start<=time&&time<slot.end);}
export function loungeDefault(now:number){const active=LOUNGE_HOURS.findIndex(slot=>slot.start<=now&&now<slot.end);if(active>=0)return active;const upcoming=LOUNGE_HOURS.findIndex(slot=>slot.start>now);return upcoming>=0?upcoming:LOUNGE_HOURS.length-1;}
// Published HQ address matched to OSM building way/425432681, not a centroid.
export const PRODUCTAI_LOCATION: VenueLocation = { latitude: 34.0434918, longitude: -118.4676737, address: "12100 Wilshire Blvd, Suite 950, Los Angeles, CA 90025", source: "https://product.ai/parking-map/" };
// The catalog has no precise public venues. Only verified ID-keyed venues go here.
export const EVENT_LOCATIONS: Readonly<Record<string, VenueLocation>> = {[CLAYDATE_ID]:PRODUCTAI_LOCATION,[HEADSHOTS_ID]:PRODUCTAI_LOCATION};
export function reliableLocation(event: EventItem, locations = EVENT_LOCATIONS) {
  const location = locations[event.id];
  return !event.isVirtual && location && location.address && location.source && Number.isFinite(location.latitude) && Number.isFinite(location.longitude) && Math.abs(location.latitude) <= 90 && Math.abs(location.longitude) <= 180 ? location : null;
}
export function distanceKm(a: Coordinates, b: Coordinates) {
  const radians = (n: number) => n * Math.PI / 180;
  const lat = radians(b.latitude - a.latitude), lng = radians(b.longitude - a.longitude);
  const h = Math.sin(lat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(lng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function mapPosition(point: Coordinates, includeOutside = false) {
  if(!Number.isFinite(point.latitude)||!Number.isFinite(point.longitude)||Math.abs(point.latitude)>=90||Math.abs(point.longitude)>180)return null;
  const lat = point.latitude * Math.PI / 180;
  const x = (point.longitude + 180) / 360 * 2048;
  const y = (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2 * 2048;
  const left = (x - 349) / 4 * 100, top = (y - 816) / 3 * 100;
  return includeOutside || left >= 0 && left <= 100 && top >= 0 && top <= 100 ? { left: `${left}%`, top: `${top}%` } : null;
}
