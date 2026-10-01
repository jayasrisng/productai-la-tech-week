"use client";
import type { EventItem, EventMatch } from "@/types/event";

export function EventCard({event,match,added,onToggle,onRegistered,rank}:{event:EventItem;match:EventMatch;added:boolean;onToggle:()=>void;onRegistered:()=>void;rank?:number}){
  return <article className="event-card">
    <div className="event-score">{rank&&<b>#{String(rank).padStart(2,"0")}</b>}<strong>{match.score}%</strong><span>PREFERENCE FIT</span>{event.access.status!=="Open"&&<em>{event.access.status}</em>}</div>
    <div className="event-body"><div className="event-meta">{event.dateLabel} · {event.startTimeDisplay} · {event.neighborhood}</div><h2>{event.name}</h2><p>{event.summary}</p>
      <div className="why-block"><span>MATCH ANALYSIS</span><ul>{match.reasons.slice(0,3).map(reason=><li key={reason}>{reason}</li>)}</ul>{match.cautions.map(caution=><p key={caution}>Note: {caution}</p>)}<details className="match-details"><summary>See evidence and percentage breakdown</summary><p>Weighted preference coverage, not a probability of admission, attendance, or success. Title relevance does not verify who will attend.</p><div className="fit-breakdown">{match.breakdown.map(item=><div key={item.key}><span>{item.key==="role"?"Your role":item.key}</span><progress max={1} value={item.coverage} aria-label={`${item.key} coverage`}/><b>{item.points.toFixed(1)} / {item.weight.toFixed(1)}</b></div>)}</div><p>Total: {match.rawScore.toFixed(1)} points, rounded to {match.score}%. Genuine ties share a percentage; goal/format coverage and title evidence break ties, then availability, time, and ID.</p><ul>{match.reasons.slice(3).map(reason=><li key={reason}>{reason}</li>)}</ul><a href={event.rsvpUrl} target="_blank" rel="noreferrer">Check official listing ↗</a><p>Source snapshot: {event.source.snapshotGeneratedAt.slice(0,10)}. Audience and goal metadata are inferred; topics and formats come from the calendar.</p></details></div>
      <div className="event-tags">{event.formats.concat(event.topics).slice(0,5).map(tag=><span key={tag}>{tag}</span>)}</div>
      <div className="host-line"><span>HOSTED BY</span> {event.hostDisplay}</div>
    </div>
    <div className="event-actions"><button className={`button small ${added?"added":"primary"}`} onClick={onToggle}>{added?"Added ✓":"Add to my week"}</button><a href={event.rsvpUrl} target="_blank" rel="noreferrer" onClick={onRegistered}>Apply / RSVP ↗</a></div>
  </article>;
}
