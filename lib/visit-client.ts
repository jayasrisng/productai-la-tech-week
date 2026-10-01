import { type BookingInput, type BookingSummary, type VisitSlot } from "./visit-booking";

export async function fetchAvailability(api: string | undefined): Promise<VisitSlot[]> {
  if (!api) throw new Error("Booking service is not connected. No hours are bookable until live availability is available.");
  let response: Response;
  try { response = await fetch(`${api}/slots`, { cache: "no-store", signal: AbortSignal.timeout(15000) }); }
  catch { throw new Error("Live availability is unavailable. Please try again; no hours can be booked while the API is offline."); }
  if (!response.ok) throw new Error("Live availability is unavailable. Please try again; no demo hours can be booked.");
  const data = await response.json() as { slots?: VisitSlot[] };
  if (!Array.isArray(data.slots) || data.slots.length !== 25 || data.slots.some(s => !s.id || !s.startsAt || !s.endsAt || s.capacity !== 20 || !Number.isInteger(s.remaining) || s.remaining < 0 || s.remaining > 20)) throw new Error("Availability could not be verified. Please try again.");
  return data.slots;
}

export async function submissionKey(booking: BookingInput, storage: Pick<Storage, "getItem" | "setItem">): Promise<string> {
  const { registrationCode: _code, ...canonical } = booking;
  void _code;
  // Store no attendee details or registration code. Preserve only a request digest and random key.
  const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(canonical))))].map(n => n.toString(16).padStart(2, "0")).join("");
  let previous: { digest: string; key: string } | undefined;
  try { previous = JSON.parse(storage.getItem("officeVisitSubmission") || "null"); } catch { /* Invalid session state starts a new submission. */ }
  if (previous?.digest === digest && /^[a-f0-9-]{36}$/i.test(previous.key)) return previous.key;
  const key = crypto.randomUUID();
  storage.setItem("officeVisitSubmission", JSON.stringify({ digest, key }));
  return key;
}

export async function bookingRequest(api: string, path: string, options: RequestInit): Promise<{ reservation: BookingSummary; managementUrl?: string }> {
  const response = await fetch(`${api}${path}`, { ...options, cache: "no-store", signal: AbortSignal.timeout(20000) });
  const data = await response.json() as { reservation: BookingSummary; managementUrl?: string; error?: string };
  if (!response.ok) throw new Error(data.error || "Booking service could not complete the request.");
  return data;
}
