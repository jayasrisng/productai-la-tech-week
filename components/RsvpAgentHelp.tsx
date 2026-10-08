"use client";
import { useState } from "react";

export const RSVP_PROMPT="Hi! Please help me RSVP to my LA Tech Week lineup (events and links below), one event at a time.\n1. First, check my Luma and Partiful accounts. Tell me which of these events I’m already registered for, and whether each one is approved, pending or waitlisted.\n2. For each event I haven’t registered for, open its link and fill in the RSVP form. If a question needs an answer you don’t know, ask me. Don’t guess.\n3. Before you submit, show me a screenshot of my answers. Only submit after I say yes.\n4. When you’re done, send me a list: approved, pending, waitlisted and not registered. Add approved events to my calendar, label the rest as pending, and never tell me to go to an event that isn’t approved.";

export function RsvpAgentHelp({ events }: { events:{name:string;rsvpUrl:string}[] }) {
  const [message,setMessage]=useState("");
  const copy=async()=>{try{await navigator.clipboard.writeText(RSVP_PROMPT+"\n\nMy lineup:\n"+events.map(event=>`${event.name}\n${event.rsvpUrl}`).join("\n\n"));setMessage("Prompt and lineup links copied.");}catch{setMessage("Copy the prompt below and your event links manually.");}};
  return <section className="rsvp-helper wrap"><details><summary>RSVP to your whole lineup with an AI agent</summary><div className="disclosure-popover"><p>Try Wajo with your lineup. Check every answer before approving a submission. Lineup does not register you automatically, and event approval is still up to the organizer.</p><blockquote>{RSVP_PROMPT}</blockquote><div className="dialog-actions"><button className="button" onClick={copy}>Copy prompt + lineup</button><a className="button" href="https://wajo.ai/" target="_blank" rel="noreferrer">Open Wajo ↗</a></div>{message&&<p role="status">{message}</p>}</div></details></section>;
}
