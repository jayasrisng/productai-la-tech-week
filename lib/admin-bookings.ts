import type { Attendee, BookingSummary } from "./visit-booking";

export type AdminBooking = {
  id:string; createdAt:number; expiresAt:number; referral:string;
  emailStatus:BookingSummary["emailStatus"];
  attendees:(Attendee & {ordinal:number})[];
  hours:{id:string;startsAt:string;endsAt:string;status:"confirmed"|"cancelled"}[];
};
// Quoting alone does not prevent spreadsheet formula injection.
export function csvCell(value:string){return `"${(/^[\s]*[=+@-]/.test(value)?"'":"")+value.replaceAll('"','""')}"`;}
export function securityCsv(bookings:AdminBooking[]){
  const rows=[["Name","Guest of","Date","Start (LA)","End (LA)","Status"]];
  const date=(value:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
  const clock=(value:string)=>new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit"}).format(new Date(value));
  for(const booking of bookings)for(const hour of booking.hours.filter(h=>h.status==="confirmed"))for(const person of booking.attendees)rows.push([person.name,person.ordinal?booking.attendees.find(a=>a.ordinal===0)?.name||"":"",date(hour.startsAt),clock(hour.startsAt),clock(hour.endsAt),hour.status]);
  return rows.map(row=>row.map(csvCell).join(",")).join("\r\n");
}
