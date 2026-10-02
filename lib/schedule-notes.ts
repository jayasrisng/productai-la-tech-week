import type { EventItem } from "@/types/event";

export type ScheduleNote = { kind:"overlap"|"travel"|"timing"; first:EventItem; second:EventItem; detail:string };
const minute=(date:string,time:string)=>Date.parse(`${date}T${time}:00Z`)/60000;
const start=(event:EventItem)=>minute(event.date,event.startTime);
function end(event:EventItem){
  if(!event.endTime)return null;
  const value=minute(event.endDate||event.date,event.endTime);
  return Number.isFinite(value)&&value>start(event)?value:null;
}
function location(event:EventItem){
  if(event.isVirtual)return null;
  const value=event.address||event.venueName||(!["Other","Location shared after RSVP"].includes(event.neighborhood)?event.neighborhood:null);
  return value?.trim().toLowerCase()||null;
}
export function eventTimeRange(event:EventItem){
  const clock=(value:string)=>{const [hour,minutes]=value.split(":").map(Number);return `${hour%12||12}:${String(minutes).padStart(2,"0")} ${hour<12?"a.m.":"p.m."}`;};
  const ending=end(event);
  return `${clock(event.startTime)}${ending!==null?`–${event.endDate&&event.endDate!==event.date?`${event.endDate.slice(5).replace("-","/")} `:""}${clock(event.endTime!)}`:" · end not listed"} PDT`;
}
export function scheduleNotes(events:EventItem[]):ScheduleNote[]{
  const sorted=[...events].sort((a,b)=>start(a)-start(b)||a.id.localeCompare(b.id));
  const notes:ScheduleNote[]=[];
  sorted.forEach((first,i)=>{
    const firstEnd=end(first);
    for(let j=i+1;j<sorted.length;j++){
      const second=sorted[j],secondStart=start(second),secondEnd=end(second);
      if(firstEnd!==null&&secondStart<firstEnd){
        const overlap=secondEnd!==null?Math.min(firstEnd,secondEnd)-secondStart:null;
        notes.push({kind:"overlap",first,second,detail:overlap!==null?`${overlap} minutes overlap. Choose one, or attend only part of each if the organizers allow.`:"The later event starts before the earlier event ends. Choose one, or attend only part of each if the organizers allow."});
        continue;
      }
      // Transfer prompts concern consecutive events, not every possible pair.
      if(j!==i+1)continue;
      const firstLocation=location(first),secondLocation=location(second);
      const different=firstLocation&&secondLocation&&firstLocation!==secondLocation;
      const gap=firstEnd!==null?secondStart-firstEnd:null;
      if(different&&gap!==null&&gap<=60){
        notes.push({kind:"travel",first,second,detail:`Two different locations with a ${gap}-minute gap between events. Check travel time; consider leaving the earlier event sooner or arriving at the later one late, if allowed.`});
      }else if(firstEnd===null&&first.date===second.date&&secondStart-start(first)<90){
        notes.push({kind:different?"travel":"timing",first,second,detail:`Starts are ${secondStart-start(first)} minutes apart${different?" at two different locations":""}. The earlier end time is not listed, so the gap and any overlap are unknown. Check the organizer’s timing${different?" and travel time":""} before choosing.`});
      }
    }
  });
  return notes;
}
