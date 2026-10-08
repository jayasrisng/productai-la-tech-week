import { BOOKING_RETENTION_END, type BookingSummary, type VisitSlot } from "./demo-visit-booking";
import { isBookableVisitHour } from "./visit-schedule";

// Reviewer-only, in-memory simulation. Never used as a booking database.
export function demoVisitSlots(): VisitSlot[] {
  return Array.from({ length: 25 }, (_, i) => {
    const day = 12 + Math.floor(i / 5);
    const hour = 11 + i % 5;
    return { id: `la-2026-10-${day}-${hour}`, startsAt: `2026-10-${day}T${hour + 7}:00:00Z`, endsAt: `2026-10-${day}T${hour + 8}:00:00Z`, capacity: 20, remaining: 20 };
  }).filter(isBookableVisitHour);
}

export function demoReservation(slots: VisitSlot[], ids: string[], attendeeCount: number, code: string): BookingSummary {
  // Syntax only, like validateBooking. This simulation never authenticates access.
  // Real access is checked exclusively against the Worker’s secret, not a browser constant.
  if (!code || code.length > 128 || /\s/.test(code)) throw new Error("Enter a preview code without spaces. No live access is verified.");
  const chosen = slots.filter(slot => ids.includes(slot.id));
  if (!chosen.length || chosen.length !== ids.length || chosen.some(slot => slot.remaining < attendeeCount)) throw new Error("Select available hours.");
  const createdAt = Math.floor(Date.now() / 1000);
  return { id: "demo-preview", createdAt, expiresAt: Math.min(createdAt + 30 * 86400,BOOKING_RETENTION_END), attendeeCount, emailStatus: "unconfigured", publicPresence: false, slots: chosen.map(({ remaining: _remaining, ...slot }) => { void _remaining; return { ...slot, status: "confirmed" }; }) };
}
