import type { BookingInput, BookingSummary, VisitSlot } from "./demo-visit-booking";
import type { AvatarConfig } from "./avatar";
import { demoVisitSlots } from "./visit-demo";

export type PublicPresence = { displayName: string; avatarConfig: AvatarConfig | null; location: "Product.ai"; startsAt: string; endsAt: string };

// GitHub Pages is a frontend-only demo, even if an API URL is supplied at build time.
export async function fetchAvailability(_api?: string): Promise<VisitSlot[]> {
  void _api;
  return demoVisitSlots();
}

export async function submissionKey(_booking: BookingInput, _storage: Pick<Storage, "getItem" | "setItem">): Promise<string> {
  void _booking; void _storage;
  throw new Error("Reservations are unavailable.");
}

export async function bookingRequest(_api: string, _path: string, _options: RequestInit): Promise<{ reservation: BookingSummary; managementUrl?: string }> {
  void _api; void _path; void _options;
  throw new Error("Booking management is unavailable.");
}

export async function fetchPublicPresence(_api?: string, _time?: number, _signal?: AbortSignal): Promise<PublicPresence[]> {
  void _api; void _time; void _signal;
  return [];
}

// The organizer screen retains v3 copy but never sends credentials or loads attendees.
export async function unavailableOrganizerRequest(_url: string, _options: RequestInit): Promise<Response> {
  void _url; void _options;
  throw new Error("Organizer service is unavailable.");
}
