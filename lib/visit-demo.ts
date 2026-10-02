import type { BookingSummary, VisitSlot } from "./visit-booking";

// Reviewer-only, in-memory simulation. Never used as a booking database.
export function demoVisitSlots(): VisitSlot[] {
  return Array.from({ length: 25 }, (_, i) => {
    const day = 12 + Math.floor(i / 5);
    const hour = 11 + i % 5;
    return { id: `la-2026-10-${day}-${hour}`, startsAt: `2026-10-${day}T${hour + 7}:00:00Z`, endsAt: `2026-10-${day}T${hour + 8}:00:00Z`, capacity: 20, remaining: 20 };
  });
}

export function demoReservation(slots: VisitSlot[], ids: string[], attendeeCount: number, code: string): BookingSummary {
  // Preview gate only; live access must be enforced by the Worker's secret.
  if (code !== "GoldenHour08") throw new Error("The registration code is incorrect.");
  const chosen = slots.filter(slot => ids.includes(slot.id));
  if (!chosen.length || chosen.length !== ids.length || chosen.some(slot => slot.remaining < attendeeCount)) throw new Error("Select available hours.");
  const createdAt = Math.floor(Date.now() / 1000);
  return { id: "demo-preview", createdAt, expiresAt: createdAt + 30 * 86400, attendeeCount, emailStatus: "unconfigured", slots: chosen.map(({ remaining: _remaining, ...slot }) => { void _remaining; return { ...slot, status: "confirmed" }; }) };
}
