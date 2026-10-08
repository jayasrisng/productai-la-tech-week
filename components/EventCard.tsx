"use client";
import type { EventItem, EventMatch } from "@/types/event";
import { EventArtwork } from "./EventArtwork";
import { isProductAiEvent } from "@/lib/product-experiences";
import { displayChoice, displayTime, matchReasonCopy, matchCautionCopy } from "@/lib/display-copy";
import { matchBucket } from "@/lib/match-bucket";

export function EventCard({event,match,added,onToggle,onRegistered,rank}:{event:EventItem;match:EventMatch;added:boolean;onToggle:()=>void;onRegistered:()=>void;rank?:number}){
  const isDirectRsvp = /^https:\/\/(?:[a-z0-9-]+\.)?(?:partiful\.com|lu\.ma|luma\.com)\//i.test(event.rsvpUrl);
  const hasListing = event.rsvpUrl.includes("/events/") || isDirectRsvp;
  const rsvpLabel = /partiful\.com\//i.test(event.rsvpUrl) ? "RSVP on Partiful" : isDirectRsvp ? "RSVP on Luma" : "View and RSVP";
  const productListing=event.source.provider==="Product.ai";
  return <article className="event-card" tabIndex={-1} data-product-event={isProductAiEvent(event.id)}>
    <div className="event-score">{rank!==undefined?<strong aria-label={`Rank ${rank}`}>{rank}</strong>:null}{event.access.status!=="Open"&&<em>{event.access.status}</em>}</div>
    <EventArtwork eventId={event.id} title={event.name}/>
    <div className="event-body"><div className="event-meta">{event.dateLabel} · {displayTime(event.startTimeDisplay)} · {displayChoice(event.neighborhood)}</div><h2>{event.name}</h2>
      <details className="match-details"><summary>See why <span>{matchBucket(match)}</span></summary><div className="match-analysis-content"><h3>About the event</h3><p>{event.summary}</p><h3>Why it fits you</h3>{match.reasons.length?<ul>{match.reasons.map(reason=><li key={reason}>{matchReasonCopy(reason)}</li>)}</ul>:<p>No preference evidence yet. Change your answers to see how this event fits.</p>}{match.cautions.map(caution=><p key={caution}>{matchCautionCopy(caution)}</p>)}<h3>How it fits your answers</h3><div className="fit-breakdown">{match.breakdown.map(item=><div key={item.key}><span>{{goals:"Goals",formats:"Formats",interests:"Topics",role:"Your role",location:"Neighborhoods"}[item.key]}</span><progress max={1} value={item.coverage} aria-label={item.key + " coverage"}/></div>)}</div><p>Match labels compare your preferences before filters. They describe relative fit—not guaranteed enjoyment or attendance probability.</p><p>We match on the public listing, not the guest list, so we can’t promise who will be there.</p><a href={event.rsvpUrl} target="_blank" rel="noreferrer">{productListing ? "Visit Product.ai · event RSVP link coming soon" : hasListing ? "Read the official listing" : "Find this event on the official calendar"} ↗</a></div></details>
      <div className="event-tags">{event.formats.concat(event.topics).slice(0,5).map(tag=><span key={tag}>{displayChoice(tag)}</span>)}</div><div className="host-line"><span>HOSTED BY</span> {event.hostDisplay}</div>
    </div>
    <div className="event-actions"><button className={"button small " + (added?"added":"")} onClick={onToggle}>{added?"Added ✓":"Add to my lineup"}</button><a href={event.rsvpUrl} target="_blank" rel="noreferrer" onClick={hasListing?onRegistered:undefined}>{productListing?"Visit Product.ai · RSVP link coming soon":hasListing?rsvpLabel:"Find on calendar"} ↗</a></div>
  </article>;
}
