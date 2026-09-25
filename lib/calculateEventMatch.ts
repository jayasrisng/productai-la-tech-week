import type { EventItem, Preferences } from "@/types/event";

export function calculateEventMatch(event: EventItem, p: Preferences) {
  const reasons: string[] = [];
  let score = 10;
  if (event.status === "Closed") return { score: 0, reasons: ["Registration is closed"] };
  if (event.status === "Waitlist") score -= 4;
  const interests = event.categories.filter(x => p.interests.includes(x));
  if (interests.length) { score += Math.min(30, interests.length * 18); reasons.push(`Strong ${interests.join(" + ")} match`); }
  const audience = event.audience.filter(x => p.identity.includes(x));
  if (audience.length) { score += 15; reasons.push(`Built for ${audience.join(" and ").toLowerCase()}s`); }
  const goalFits = event.goals.filter(g => p.goals.includes(g));
  if (goalFits.length) { score += Math.min(35, 20 + goalFits.length * 8); reasons.push(`Supports your goal to ${goalFits[0].toLowerCase()}`); }
  if (p.formats.includes(event.eventType)) { score += 10; reasons.push(`Your kind of room: ${event.eventType.toLowerCase()}`); }
  if (p.formats.includes("Small gatherings") && event.roomSize === "Small") { score += 10; reasons.push("A smaller room with time for real conversation"); }
  if (p.locations.includes(event.location) || p.locations.includes("Anywhere if it’s worth it")) { score += 10; reasons.push(`Inside your ${event.location} plan`); }
  else if (p.locations.length) score -= 8;
  return { score: Math.min(99, score), reasons: reasons.slice(0, 3) };
}
