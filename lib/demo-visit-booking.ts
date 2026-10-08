import type { AvatarConfig } from "./avatar";

// Shared syntax validation only. None of these checks establish identity or ownership.
export const VISIT_TIMEZONE = "America/Los_Angeles";
export const REFERRAL_OPTIONS = ["I’m part of Alpha team", "I attended Product AI Golden Hour"] as const;
export const PRIVACY_VERSION = "office-visits-2026-10-v3-month-end-draft";
export const PRESENCE_CONSENT_VERSION = "pulse-public-current-hour-display-name-v1";
export const BOOKING_RETENTION_END = Math.floor(Date.parse("2026-11-01T00:00:00-07:00") / 1000);
export const SPACE_NOTICE = "Shared lounge access. Five phone booths are first come, first served. Your reservation does not reserve a phone booth.";
export const PRIVACY_NOTICE = "Your details are used for booking, confirmation emails, and building check-in—not marketing. Active booking records expire at the end of October and are removed by scheduled cleanup, including cancelled bookings. Email, backup, and downloaded copies have separate retention. Email ownership and identity are not verified.";

export type Attendee = { name: string; email: string; linkedin: string };
export type BookingInput = { slotIds: string[]; attendees: Attendee[]; referral: string; registrationCode: string; disclosureVersion: string; publicPresence: boolean; presenceConsentVersion?: string; avatar?: AvatarConfig; displayName?: string };
export type VisitSlot = { id: string; startsAt: string; endsAt: string; capacity: number; remaining: number };
export type BookingSummary = { id: string; createdAt: number; expiresAt: number; attendeeCount: number; emailStatus: "pending" | "unconfigured" | "sent"; publicPresence: boolean; slots: (Omit<VisitSlot, "remaining"> & { status: "confirmed" | "cancelled" })[] };
export const EMPTY_ATTENDEE: Attendee = { name: "", email: "", linkedin: "" };

export function normalizeLinkedIn(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["linkedin.com", "www.linkedin.com"].includes(url.hostname.toLowerCase()) || url.username || url.password || url.port || url.search || url.hash) return null;
    if (!/^\/in\/[a-zA-Z0-9][a-zA-Z0-9_-]{1,99}\/?$/.test(url.pathname)) return null;
    return `https://www.linkedin.com${url.pathname.replace(/\/$/, "")}`;
  } catch { return null; }
}

export function validateBooking(value: unknown): { booking?: BookingInput; errors: string[] } {
  const errors: string[] = [];
  if (!value || typeof value !== "object") return { errors: ["Complete the booking details."] };
  const b = value as Partial<BookingInput>;
  const slotIds = Array.isArray(b.slotIds) ? b.slotIds : [];
  if (!slotIds.length || slotIds.length > 25 || slotIds.some(id => typeof id !== "string" || !/^la-2026-10-(12|13|14|15|16)-(11|12|13|14|15)$/.test(id)) || new Set(slotIds).size !== slotIds.length) errors.push("Select one or more distinct office hours from October 12–16.");
  const attendees = Array.isArray(b.attendees) ? b.attendees : [];
  if (![1, 2].includes(attendees.length)) errors.push("A booking needs one main attendee and at most one guest.");
  const normalized: Attendee[] = [];
  attendees.slice(0, 2).forEach((a, index) => {
    const label = index ? "Guest" : "Main attendee";
    if (!a || typeof a !== "object") { errors.push(`${label}: complete every field.`); return; }
    const name = typeof a.name === "string" ? a.name.trim() : "";
    const email = typeof a.email === "string" ? a.email.trim().toLowerCase() : "";
    const linkedin = typeof a.linkedin === "string" && a.linkedin.length <= 200 ? normalizeLinkedIn(a.linkedin) : null;
    if (name.length < 2 || name.length > 120 || /[\x00-\x1f\x7f]/.test(name)) errors.push(`${label}: enter a name (2–120 characters).`);
    if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email) || email.split("@")[0].length > 64 || email.includes("..") || email.startsWith(".") || email.split("@")[0].endsWith(".")) errors.push(`${label}: enter a valid email address (any domain).`);
    if (!linkedin) errors.push(`${label}: use an HTTPS LinkedIn personal profile URL, such as https://www.linkedin.com/in/your-name (no query or fragment).`);
    normalized.push({ name, email, linkedin: linkedin || "" });
  });
  if (normalized.length === 2 && normalized[0].email === normalized[1].email) errors.push("Main attendee and guest must use different email addresses.");
  if (!REFERRAL_OPTIONS.includes(b.referral as typeof REFERRAL_OPTIONS[number])) errors.push("Select how you heard about this.");
  // The browser only checks presence. The secret code is checked exclusively by the Worker.
  if (typeof b.registrationCode !== "string" || !b.registrationCode || b.registrationCode.length > 128 || /\s/.test(b.registrationCode)) errors.push("Enter the registration code exactly, with no spaces.");
  if (b.disclosureVersion !== PRIVACY_VERSION) errors.push("Refresh this page to read the current registration disclosure.");
  if (typeof b.publicPresence !== "boolean") errors.push("Choose whether to share your planned Product.ai presence.");
  const displayName=typeof b.displayName==="string"?b.displayName.trim():"";
  if(b.publicPresence && (typeof b.displayName!=="string" || !displayName || displayName.length>60 || /[\x00-\x1f\x7f]/.test(displayName))) errors.push("To share in Pulse, enter a display name of 1–60 characters on Lineup.");
  if(b.publicPresence && b.presenceConsentVersion!==PRESENCE_CONSENT_VERSION) errors.push("Refresh this page and confirm public Pulse sharing.");
  return errors.length ? { errors } : { errors, booking: { slotIds: [...slotIds].sort(), attendees: normalized, referral: b.referral!, registrationCode: b.registrationCode!, disclosureVersion: PRIVACY_VERSION, publicPresence: b.publicPresence!, ...(b.publicPresence ? {presenceConsentVersion:PRESENCE_CONSENT_VERSION} : {}), ...(b.publicPresence && b.avatar ? { avatar: b.avatar } : {}), ...(b.publicPresence && displayName ? {displayName} : {}) } };
}

export function formatVisitSlot(slot: Pick<VisitSlot, "startsAt" | "endsAt">): string {
  const date = new Date(slot.startsAt).toLocaleDateString("en-US", { timeZone: VISIT_TIMEZONE, weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const clock = (value: string) => new Date(value).toLocaleTimeString("en-US", { timeZone: VISIT_TIMEZONE, hour: "numeric", minute: "2-digit" });
  return `${date}, ${clock(slot.startsAt)}–${clock(slot.endsAt)} PDT (Los Angeles)`;
}
