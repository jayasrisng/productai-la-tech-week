import type { VisitSlot } from "./demo-visit-booking";

// LA Tech Week policy: new lounge visits stop at 3 p.m. Monday Oct 12.
// Existing reservation summaries are intentionally NOT filtered or cancelled.
export function isBookableVisitHour(slot:Pick<VisitSlot,"startsAt">) {
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date(slot.startsAt));
  const value=(type:string)=>parts.find(part=>part.type===type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`!=="2026-10-12"||Number(value("hour"))<15;
}
