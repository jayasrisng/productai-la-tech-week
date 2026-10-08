// Presentation only: persisted preference values and matching weights stay unchanged.
export function displayChoice(value: string): string {
  return ({ Product: "Product manager", "Founder dinners": "Dinners", Parties: "Parties and happy hours", "Anywhere if it’s worth it": "Anywhere, if it’s worth it", GTM: "Go-to-market", Virtual: "Online" } as Record<string, string>)[value] ?? value;
}

export const displayTime = (value:string) => value.replace(/(\d)(am|pm)$/i,"$1 $2").toUpperCase();

const sentenceCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
export function matchReasonCopy(reason: string): string {
  let match = reason.match(/^For “(.+)”: related terms in /);
  if (match) return `The title fits your goal: ${match[1]}.`;
  match = reason.match(/^Possible (.+) fit, not confirmed by the organizer\.$/);
  if (match) return `May fit your goal: ${sentenceCase(match[1])}.`;
  match = reason.match(/^Possible (.+) relevance, audience not confirmed by the organizer\.$/);
  if (match) return `May suit your role: ${sentenceCase(displayChoice(sentenceCase(match[1])))}.`;
  match = reason.match(/^The title mentions your (.+) role; attendance is unverified\.$/);
  if (match) return `The title mentions your role: ${sentenceCase(displayChoice(sentenceCase(match[1])))}.`;
  match = reason.match(/^Your (.+) choice matches (.+)\.$/);
  if (match) return `You picked ${displayChoice(match[1])}, and it’s listed as ${match[2].split(" · ").map(displayChoice).join(" and ")}.`;
  match = reason.match(/^Listed topic: ([^;]+);/);
  if (match) return `Covers ${displayChoice(match[1])}, one of your topics.`;
  match = reason.match(/^Listed neighborhood: (.+), one of your choices\.$/);
  if (match) return `In ${displayChoice(match[1])}, one of your neighborhoods.`;
  return reason;
}

export function matchCautionCopy(value: string): string {
  if (value === "Catalog status: waitlist. Check the official RSVP page.") return "Waitlist when we last checked. See the RSVP page for the latest.";
  if (value === "Recruiter attendance is not verified.") return "We can’t confirm recruiters will be there.";
  return value;
}

export function bookingErrorCopy(value: string): string {
  if (value.startsWith("To share in Pulse, enter a display name")) return "To show up on Pulse, add a display name on your Lineup page first (1–60 characters).";
  if (value === "Select one or more distinct office hours from October 12–16.") return "Pick at least one valid, distinct hour from October 12–16.";
  if (value === "Main attendee and guest must use different email addresses.") return "You and your guest need different email addresses.";
  return value.replace(/^Main attendee:/, "You:").replace(/^Guest:/, "Your guest:")
    .replace(/enter a valid email address \(any domain\)\./, "check your email address.")
    .replace(/use an HTTPS LinkedIn personal profile URL, such as https:\/\/www\.linkedin\.com\/in\/your-name \(no query or fragment\)\./, "check your LinkedIn link. It should look like linkedin.com/in/your-name.");
}

export function scheduleNoteCopy(value: string): string {
  let match = value.match(/^(\d+) minutes overlap\./);
  if (match) return `These overlap by ${match[1]} minutes. Pick one, or split your time.`;
  match = value.match(/^Two different locations with a (\d+)-minute gap/);
  if (match) return `Only ${match[1]} minutes between these, in different places. Check travel time before you commit.`;
  match = value.match(/^Starts are (\d+) minutes apart at two different locations\./);
  if (match) return `These start ${match[1]} minutes apart in different places. The first has no listed end time, so check its event page and your travel time.`;
  return value;
}

export function activityCopy(value: string | null): string | null {
  return value === "Live at selected time" ? "On at this time" : value === "Live at selected time · estimated end" ? "On at this time · end time not listed" : value;
}
