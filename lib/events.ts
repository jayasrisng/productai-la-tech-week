import { z } from "zod";
import rawLaCatalog from "@/data/la-tech-week-events.json";
import rawSfCatalog from "@/data/sf-tech-week-events.json";

const eventSchema = z.object({
  id:z.string().regex(/^(latw|sftw)-[a-f0-9]{16}$/), name:z.string().min(3), city:z.enum(["Los Angeles","San Francisco"]),
  date:z.string().date(), dateLabel:z.string(), startTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), startTimeDisplay:z.string(), timezone:z.literal("America/Los_Angeles"),
  neighborhood:z.string().min(1), venueName:z.string().nullable(), address:z.string().nullable(), isVirtual:z.boolean(),
  organizers:z.array(z.string()).min(1), hostDisplay:z.string().min(1), topics:z.array(z.string()), formats:z.array(z.string()), audiences:z.array(z.string()).min(1), goals:z.array(z.string()).min(1),
  networkingStrength:z.number().int().min(1).max(5), summary:z.string().min(20), descriptionSource:z.string(),
  access:z.object({status:z.enum(["Open","Waitlist","Closed"]),method:z.string(),requiresApproval:z.boolean().nullable()}),
  rsvpUrl:z.string().url().refine(url=>url.startsWith("https://www.tech-week.com/go/event/"),"Must use an official Tech Week event link"),
  featured:z.boolean(), inOfficialWeek:z.boolean(),
  source:z.object({provider:z.string(),cityCalendar:z.string().url(),sourceRow:z.number().int().positive(),snapshotGeneratedAt:z.string().datetime()})
});

const catalogSchema = z.object({
  schemaVersion:z.string(), city:z.enum(["Los Angeles","San Francisco"]), timezone:z.literal("America/Los_Angeles"),
  week:z.object({startsOn:z.string().date(),endsOn:z.string().date()}), generatedAt:z.string().datetime(), sourceSnapshotGeneratedAt:z.string().datetime(),
  sourceUrl:z.string().url(), officialCalendarUrl:z.string().url(), eventCount:z.number().int().positive(), inWeekEventCount:z.number().int().positive(), notes:z.string(), events:z.array(eventSchema).min(800)
}).superRefine((catalog,ctx)=>{
  if(catalog.eventCount!==catalog.events.length) ctx.addIssue({code:"custom",path:["eventCount"],message:"eventCount must match events.length"});
  const ids=new Set<string>(); catalog.events.forEach((event,index)=>{if(ids.has(event.id))ctx.addIssue({code:"custom",path:["events",index,"id"],message:"Duplicate event id"});ids.add(event.id);});
});

export const catalogs = {
  la: catalogSchema.parse(rawLaCatalog),
  sf: catalogSchema.parse(rawSfCatalog)
};
export const catalog = catalogs.la;
export const events = catalogs.la.events;
export const eventsByCity = { la:catalogs.la.events, sf:catalogs.sf.events };
