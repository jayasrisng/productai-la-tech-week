import type { BookingSummary } from "./visit-booking";

function utcStamp(value: string | number) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// Fold by UTF-8 octets, not characters, without splitting a Unicode code point.
function fold(line: string) {
  const encoder = new TextEncoder();
  let result = "", width = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (width + size > 75) { result += "\r\n "; width = 1; }
    result += character; width += size;
  }
  return result;
}

export function visitCalendar(reservation: BookingSummary) {
  const hours = reservation.slots.filter(slot => slot.status === "confirmed");
  if (!hours.length) return null;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Product.ai//Office visits//EN", "CALSCALE:GREGORIAN"];
  for (const slot of hours) {
    lines.push("BEGIN:VEVENT", `UID:${reservation.id}-${slot.id}@product.ai`,
      `DTSTAMP:${utcStamp(reservation.createdAt * 1000)}`,
      `DTSTART:${utcStamp(slot.startsAt)}`, `DTEND:${utcStamp(slot.endsAt)}`,
      "SUMMARY:Product.ai lounge visit", "STATUS:CONFIRMED",
      `DESCRIPTION:Reserved for ${reservation.attendeeCount === 2 ? "you and one guest" : "you"}. Times display in your calendar's timezone. Leave when your reserved hour ends.`,
      "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

export function downloadVisitCalendar(reservation: BookingSummary) {
  const content = visitCalendar(reservation);
  if (!content) return;
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = "product-ai-office-visit.ics"; link.click();
  URL.revokeObjectURL(url);
}
