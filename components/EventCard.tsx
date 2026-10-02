"use client";
import type { EventItem, EventMatch } from "@/types/event";

export function EventCard({event,match,added,onToggle,onRegistered,rank}:{event:EventItem;match:EventMatch;added:boolean;onToggle:()=>void;onRegistered:()=>void;rank?:number}){
  const hasListing = event.rsvpUrl.includes("/events/");
  const percentile=match.percentile??50;
  const ordinal=percentile%100>=11&&percentile%100<=13?"th":({1:"st",2:"nd",3:"rd"} as Record<number,string>)[percentile%10]||"th";
  return <article className="event-card">
    <div className="event-score">{rank!==undefined?<strong aria-label={`Rank ${rank}`}>{rank}</strong>:null}{event.access.status!=="Open"&&<em>{event.access.status}</em>}</div>
    <div className="event-body"><div className="event-meta">{event.dateLabel} · {event.startTimeDisplay} · {event.neighborhood}</div><h2>{event.name}</h2>
      <details className="match-details"><summary>Match analysis <span>{percentile}{ordinal} percentile for you</span></summary><div className="match-analysis-content"><h3>Catalog summary</h3><p>{event.summary}</p><h3>Why this matches</h3><ul>{match.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>{match.cautions.map(caution=><p key={caution}>{caution}</p>)}<h3>Preference signals</h3><div className="fit-breakdown">{match.breakdown.map(item=><div key={item.key}><span>{item.key==="role"?"Your role":item.key}</span><progress max={1} value={item.coverage} aria-label={item.key + " coverage"}/><b>{item.points.toFixed(1)} / {item.weight.toFixed(1)} pts</b></div>)}</div><p>This percentile compares weighted preference evidence across {match.comparisonCount??1} eligible events for your answers, before filters. Higher means a stronger relative match, not a guaranteed good fit or an attendance probability. Equal underlying scores share a percentile.</p><p>Audience and goal tags are inferred, not organizer-confirmed.</p><a href={event.rsvpUrl} target="_blank" rel="noreferrer">{hasListing ? "Read the official listing" : "Find this event on the official calendar"} ↗</a></div></details>
      <div className="event-tags">{event.formats.concat(event.topics).slice(0,5).map(tag=><span key={tag}>{tag}</span>)}</div><div className="host-line"><span>HOSTED BY</span> {event.hostDisplay}</div>
    </div>
    <div className="event-actions"><button className={"button small " + (added?"added":"primary")} onClick={onToggle}>{added?"Added ✓":"Add to my week"}</button><a href={event.rsvpUrl} target="_blank" rel="noreferrer" onClick={hasListing?onRegistered:undefined}>{hasListing?"View event / RSVP":"Find on calendar"} ↗</a></div>
  </article>;
}
