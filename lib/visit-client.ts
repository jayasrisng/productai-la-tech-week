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
  throw new Error("Live reservations are disabled in this demo. No details were submitted.");
}

export async function bookingRequest(_api: string, _path: string, _options: RequestInit): Promise<{ reservation: BookingSummary; managementUrl?: string }> {
  void _api; void _path; void _options;
  throw new Error("Live reservations and management links are disabled in this demo.");
}

export async function fetchPublicPresence(_api?: string, _time?: number, _signal?: AbortSignal): Promise<PublicPresence[]> {
  void _api; void _time; void _signal;
  return [];
}
