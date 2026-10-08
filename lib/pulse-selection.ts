import { laDate, laTime, LA_ZONE } from "./pulse";
export const PULSE_MIN_MINUTES=360;
export const PULSE_MAX_MINUTES=1440;
export function pulseClockMinutes(time:number){
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:LA_ZONE,hour:"numeric",minute:"numeric",hourCycle:"h23"}).formatToParts(time);
  const get=(type:string)=>Number(parts.find(part=>part.type===type)!.value);
  return Math.max(PULSE_MIN_MINUTES,Math.min(1425,Math.floor((get("hour")*60+get("minute"))/15)*15));
}
export function pulseSelectionTime(date:string,minutes:number){
  if(minutes===1440)return laTime(laDate(laTime(date)+86_400_000));
  return laTime(date,`${String(Math.floor(minutes/60)).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`);
}
