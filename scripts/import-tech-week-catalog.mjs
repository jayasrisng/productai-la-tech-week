import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = resolve(process.argv[2] || "/tmp/techlist.cleaned.json");
const outputPath = resolve(process.argv[3] || "data/la-tech-week-events.json");
const source = JSON.parse(readFileSync(sourcePath, "utf8"));

const NETWORKING_TYPES = new Set(["Networking", "Matchmaking", "Happy Hour", "Dinner", "Breakfast, Brunch or Lunch"]);
const monthNumbers = { Jan:"01", Feb:"02", Mar:"03", Apr:"04", May:"05", Jun:"06", Jul:"07", Aug:"08", Sep:"09", Oct:"10", Nov:"11", Dec:"12" };

function dateFromLabel(label) {
  const match = label.match(/([A-Z][a-z]{2})\s+(\d{1,2})$/);
  if (!match) throw new Error(`Unsupported date: ${label}`);
  return `2026-${monthNumbers[match[1]]}-${match[2].padStart(2,"0")}`;
}

function time24(value) {
  const match = value.trim().toLowerCase().match(/^(\d{1,2}):(\d{2})(am|pm)$/);
  if (!match) throw new Error(`Unsupported time: ${value}`);
  let hour = Number(match[1]);
  if (match[3] === "pm" && hour !== 12) hour += 12;
  if (match[3] === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2,"0")}:${match[2]}`;
}

function unique(values) { return [...new Set(values.filter(Boolean))]; }
function contains(text, words) { return words.some(word => text.includes(word)); }

function inferAudience(event) {
  const text = `${event.title} ${event.host} ${(event.topics || []).join(" ")}`.toLowerCase();
  const audiences = [];
  if (contains(text,["student","university","college","career","job","intern","hackathon"])) audiences.push("Students", "Job seekers");
  if (contains(text,["founder","startup","pitch","fundraising","venture","vc ","entrepreneur"])) audiences.push("Founders");
  if (contains(text,["invest","venture","capital","vc ","angel","fundraising"])) audiences.push("Investors");
  if (contains(text,["engineer","developer","devtools","infrastructure","cyber","hardware","hackathon"])) audiences.push("Engineers");
  if (contains(text,["design","creative","creator","media","entertainment","gaming"])) audiences.push("Designers", "Creators");
  if (contains(text,["recruit","hiring","talent","people","hr "])) audiences.push("Recruiters", "Job seekers");
  if (contains(text,["product","operator","gtm","sales","marketing","b2b","saas"])) audiences.push("Product leaders", "Operators");
  if (!audiences.length || NETWORKING_TYPES.has((event.types || [])[0])) audiences.push("Founders", "Operators");
  return unique(audiences);
}

function inferGoals(event, audiences) {
  const text = `${event.title} ${event.host} ${(event.topics || []).join(" ")} ${(event.types || []).join(" ")}`.toLowerCase();
  const goals = [];
  if (audiences.includes("Job seekers") || contains(text,["career","job fair","recruit","hiring","talent"])) goals.push("Find a job", "Meet recruiters");
  if (audiences.includes("Founders")) goals.push("Meet founders");
  if (audiences.includes("Investors")) goals.push("Meet investors", "Raise capital");
  if (NETWORKING_TYPES.has((event.types || [])[0])) goals.push("Build relationships");
  if (contains(text,["workshop","panel","fireside","roundtable","learn","talk"])) goals.push("Learn");
  if (contains(text,["hackathon","build","matchmaking"])) goals.push("Find collaborators");
  if ((event.topics || []).length) goals.push("Explore new technology");
  if (contains(text,["party","happy hour","dinner","brunch","breakfast","social"])) goals.push("Have fun");
  return unique(goals.length ? goals : ["Build relationships"]);
}

function networkingStrength(types) {
  const scores = { Networking:5, Matchmaking:5, "Happy Hour":5, Dinner:4, "Breakfast, Brunch or Lunch":4, Experiential:3, "Pitch Event / Demo Day":3, Hackathon:3, "Panel / Fireside Chat":2, "Roundtable / Workshop":2 };
  return Math.max(1, ...types.map(type => scores[type] || 1));
}

function buildSummary(event) {
  const type = (event.types || [])[0] || "Tech Week event";
  const focus = (event.topics || []).slice(0,3).join(", ");
  return `${event.title} is a ${type.toLowerCase()} hosted by ${event.host}${event.neighborhood ? ` in ${event.neighborhood}` : ""}${focus ? `, focused on ${focus}` : ""}.`;
}

const events = source.events.filter(event => event.city === "la").map(event => {
  const date = dateFromLabel(event.date_label);
  const startTime = time24(event.start_time_display);
  const identity = `${date}|${startTime}|${event.title}|${event.host}|${event.neighborhood}|la`;
  const audiences = inferAudience(event);
  const goals = inferGoals(event, audiences);
  const status = event.labels?.includes("Closed") ? "Closed" : event.labels?.includes("Waitlist") ? "Waitlist" : "Open";
  return {
    id: `latw-${createHash("sha256").update(identity).digest("hex").slice(0,16)}`,
    name: event.title,
    city: "Los Angeles",
    date,
    dateLabel: event.date_label,
    startTime,
    startTimeDisplay: event.start_time_display,
    timezone: "America/Los_Angeles",
    neighborhood: event.neighborhood || "Location shared after RSVP",
    venueName: null,
    address: null,
    isVirtual: (event.neighborhood || "").toLowerCase() === "virtual",
    organizers: unique((event.host || "").split(",").map(value => value.trim())),
    hostDisplay: event.host,
    topics: unique(event.topics || []),
    formats: unique(event.types || []),
    audiences,
    goals,
    networkingStrength: networkingStrength(event.types || []),
    summary: buildSummary(event),
    descriptionSource: "Derived from official calendar listing",
    access: { status, method: "Apply or RSVP through the official event link", requiresApproval: null },
    rsvpUrl: event.event_url,
    featured: event.labels?.includes("Featured") || false,
    inOfficialWeek: date >= "2026-10-12" && date <= "2026-10-18",
    source: { provider:"Tech Week by a16z", cityCalendar:"https://www.tech-week.com/calendar/la", sourceRow:event.source_row, snapshotGeneratedAt:source.snapshot_generated_at }
  };
}).sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.name.localeCompare(b.name));

const catalog = {
  schemaVersion: "1.0.0",
  city: "Los Angeles",
  timezone: "America/Los_Angeles",
  week: { startsOn:"2026-10-12", endsOn:"2026-10-18" },
  generatedAt: new Date().toISOString(),
  sourceSnapshotGeneratedAt: source.snapshot_generated_at,
  sourceUrl: "https://github.com/abishakkodi/tech-week-mcp/blob/main/techlist.cleaned.json",
  officialCalendarUrl: "https://www.tech-week.com/calendar/la",
  eventCount: events.length,
  inWeekEventCount: events.filter(event => event.inOfficialWeek).length,
  notes: "Official listing fields are preserved. Audience, goal, networking strength, and summary fields are deterministic classifications derived from listing metadata.",
  events
};

writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, eventCount:catalog.eventCount, inWeekEventCount:catalog.inWeekEventCount, snapshot:catalog.sourceSnapshotGeneratedAt }));
