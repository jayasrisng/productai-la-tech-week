"use client";
import type { EventItem, EventMatch } from "@/types/event";

export function EventCard({event,match,added,onToggle,onRegistered}:{event:EventItem;match:EventMatch;added:boolean;onToggle:()=>void;onRegistered:()=>void}){
  return <article className="event-card">
    <div className="event-score"><strong>{match.score}%</strong><span>MATCH</span>{event.access.status!=="Open"&&<em>{event.access.status}</em>}</div>
    <div className="event-body"><div className="event-meta">{event.dateLabel} · {event.startTimeDisplay} · {event.neighborhood}</div><h2>{event.name}</h2><p>{event.summary}</p>
      <div className="why-block"><span>WHY IT MATCHES</span><ul>{match.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>{match.cautions.map(caution=><p key={caution}>Note: {caution}</p>)}</div>
      <div className="event-tags">{event.formats.concat(event.topics).slice(0,5).map(tag=><span key={tag}>{tag}</span>)}</div>
      <div className="host-line"><span>HOSTED BY</span> {event.hostDisplay}</div>
    </div>
    <div className="event-actions"><button className={`button small ${added?"added":"primary"}`} onClick={onToggle}>{added?"Added ✓":"Add to my week"}</button><a href={event.rsvpUrl} target="_blank" rel="noreferrer" onClick={onRegistered}>Apply / RSVP ↗</a></div>
  </article>;
}
