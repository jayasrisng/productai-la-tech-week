"use client";
import type { EventItem, Preferences } from "@/types/event";
import { calculateEventMatch } from "@/lib/calculateEventMatch";

export function EventCard({ event, preferences, added, onToggle }: { event: EventItem; preferences: Preferences; added: boolean; onToggle: () => void }) {
  const match = calculateEventMatch(event, preferences);
  const when = new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric" });
  return <article className="event-card">
    <div className="event-score"><strong>{match.score}%</strong><span>MATCH</span></div>
    <div className="event-body"><div className="event-meta">{when} · {event.startTime}—{event.endTime} · {event.location}</div><h2>{event.name}</h2><p>{event.shortDescription}</p>
      <details><summary>Why it matches</summary><ul>{match.reasons.length ? match.reasons.map(r => <li key={r}>{r}</li>) : <li>A broad Tech Week fit—add preferences for a sharper read.</li>}</ul></details>
      <div className="event-tags">{event.categories.map(c => <span key={c}>{c}</span>)}</div>
    </div>
    <div className="event-actions"><button className={`button small ${added ? "added" : "primary"}`} onClick={onToggle}>{added ? "Added ✓" : "Add to lineup"}</button><a href={event.rsvpUrl} target="_blank" rel="noreferrer">Register ↗</a></div>
  </article>;
}
