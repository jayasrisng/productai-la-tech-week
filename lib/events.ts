import { z } from "zod";
import rawEvents from "@/data/events.json";

const eventSchema = z.object({
  id: z.string().regex(/^event-[0-9]{3}$/), name: z.string().min(3), organizer: z.string().min(2),
  shortDescription: z.string().min(10), description: z.string().min(20), date: z.string().date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  location: z.enum(["Santa Monica","Venice","West LA","Culver City","Hollywood","DTLA"]),
  venue: z.string().min(2), address: z.string().min(3), categories: z.array(z.string()).min(1),
  eventType: z.enum(["Small gatherings","Networking","Panels","Workshops","Hackathons","Demos","Parties","Founder dinners"]),
  audience: z.array(z.string()).min(1), companies: z.array(z.string()), goals: z.array(z.string()).min(1),
  roomSize: z.enum(["Small","Medium","Large"]), access: z.enum(["Open","Approval","Invite only"]),
  status: z.enum(["Open","Waitlist","Closed"]), rsvpType: z.string(), rsvpUrl: z.string().url(),
  featured: z.boolean(), productAIEvent: z.boolean(),
  source: z.object({ name: z.string(), url: z.string().url(), verifiedAt: z.string().datetime() })
});

const catalogSchema = z.array(eventSchema).superRefine((events, ctx) => {
  const seen = new Set<string>();
  for (const [index, event] of events.entries()) {
    if (seen.has(event.id)) ctx.addIssue({ code:"custom", path:[index,"id"], message:"Event IDs must be unique" });
    seen.add(event.id);
    if (`${event.date}T${event.endTime}` <= `${event.date}T${event.startTime}`) ctx.addIssue({ code:"custom", path:[index,"endTime"], message:"Event must end after it starts" });
  }
});

export const events = catalogSchema.parse(rawEvents);
export type CatalogEvent = z.infer<typeof eventSchema>;
