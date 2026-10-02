"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { assetUrl } from "@/lib/assets";
import { EMPTY_ATTENDEE, PRIVACY_VERSION, REFERRAL_OPTIONS, SPACE_NOTICE, formatVisitSlot, validateBooking, type Attendee, type BookingSummary, type VisitSlot } from "@/lib/visit-booking";
import { bookingRequest, fetchAvailability, submissionKey } from "@/lib/visit-client";
import { downloadVisitCalendar } from "@/lib/visit-calendar";

const api = process.env.NEXT_PUBLIC_RESERVATIONS_API?.replace(/\/$/, "");
const emailNote = (status: BookingSummary["emailStatus"]) => status === "sent" ? "Confirmation email accepted by the provider; inbox delivery is not verified." : status === "unconfigured" ? "Email is not connected yet. Keep your private booking link." : "Confirmation email is pending delivery. Your booking is saved; keep your private management link while delivery retries.";

function formatVisitTime(slot: Pick<VisitSlot, "startsAt" | "endsAt">) {
  const clock = (value: string) => new Date(value).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" });
  return `${clock(slot.startsAt)}–${clock(slot.endsAt)}`;
}

function AttendeeFields({ title, value, onChange, disabled }: { title: string; value: Attendee; onChange: (next: Attendee) => void; disabled: boolean }) {
  return <fieldset className="attendee-fields" disabled={disabled}><legend>{title}</legend>
    <label>{title} name<input value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} autoComplete="name" maxLength={120} required /></label>
    <label>{title} email<input value={value.email} onChange={e => onChange({ ...value, email: e.target.value })} type="email" autoComplete="email" maxLength={254} required /></label>
    <label>{title} LinkedIn profile<span className="linkedin-input"><span aria-hidden="true">https://linkedin.com/in/</span><input aria-label={`${title} LinkedIn username`} value={value.linkedin.replace(/^https:\/\/(?:www\.)?linkedin\.com\/in\//i, "")} onChange={e => { const typed = e.target.value; onChange({ ...value, linkedin: typed ? (/^https:\/\//i.test(typed) ? typed : `https://linkedin.com/in/${typed}`) : "" }); }} autoComplete="off" spellCheck={false} maxLength={200} placeholder="Enter LinkedIn username" required /></span></label>
  </fieldset>;
}

export default function OfficeVisitPage() {
  const [slots, setSlots] = useState<VisitSlot[]>([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeDay, setActiveDay] = useState("");
  const [plusOne, setPlusOne] = useState(false);
  const [main, setMain] = useState<Attendee>({ ...EMPTY_ATTENDEE });
  const [guest, setGuest] = useState<Attendee>({ ...EMPTY_ATTENDEE });
  const [referral, setReferral] = useState("");
  const [code, setCode] = useState("");
  const [reservation, setReservation] = useState<BookingSummary>();
  const [token, setToken] = useState("");
  const [managementLink, setManagementLink] = useState("");
  const [copiedLink, setCopiedLink] = useState("");
  const [cancelIds, setCancelIds] = useState<string[]>([]);
  const [confirmCancel, setConfirmCancel] = useState<"selected" | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const locked = useRef(false);
  const party = plusOne ? 2 : 1;
  const savedBookingId = reservation?.id;
  useEffect(() => { if (savedBookingId) window.scrollTo({ top: 0, behavior: "instant" }); }, [savedBookingId]);

  const refresh = useCallback(async () => {
    setFetching(true);
    try { setSlots(await fetchAvailability(api)); setAvailabilityError(""); }
    catch (error) { setSlots([]); setAvailabilityError(error instanceof Error ? error.message : "Live availability is unavailable. No hours can be booked."); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => {
    let alive = true;
    fetchAvailability(api).then(data => { if (alive) { setSlots(data); setAvailabilityError(""); } }).catch(error => { if (alive) { setSlots([]); setAvailabilityError(error instanceof Error ? error.message : "Live availability is unavailable."); } }).finally(() => { if (alive) setFetching(false); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    let alive = true;
    const restore = async () => {
      const t = new URLSearchParams(window.location.hash.slice(1)).get("manage");
      if (!t) return;
      if (!/^[a-f0-9]{64}$/.test(t)) { setMessage("This management link is invalid."); return; }
      setToken(t); setManagementLink(window.location.href);
      if (!api) { setMessage("Management service is not connected. Keep this link and try again when service is available."); return; }
      try { const data = await bookingRequest(api, "/management", { headers: { Authorization: `Bearer ${t}` } }); if (alive) { setReservation(data.reservation); setMessage(""); } }
      catch (error) { if (alive) setMessage(error instanceof Error ? error.message : "Booking could not be retrieved. Keep your private link."); }
    };
    void restore();
    window.addEventListener("hashchange", restore);
    return () => { alive = false; window.removeEventListener("hashchange", restore); };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (locked.current) return;
    setMessage("");
    if (!api || availabilityError || !slots.length) { setMessage("Live availability is required. No booking was submitted."); return; }
    const validation = validateBooking({ slotIds: selected, attendees: plusOne ? [main, guest] : [main], referral, registrationCode: code, disclosureVersion: PRIVACY_VERSION });
    if (!validation.booking) { setMessage(validation.errors.join(" ")); return; }
    locked.current = true; setLoading(true);
    try {
      const key = await submissionKey(validation.booking, sessionStorage);
      const data = await bookingRequest(api, "/reservations", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(validation.booking) });
      if (!data.managementUrl) throw new Error("Booking response is incomplete. Retry the same details to recover it.");
      const t = new URL(data.managementUrl).hash.slice("#manage=".length);
      setToken(t); setManagementLink(data.managementUrl); setReservation(data.reservation);
      // Fragment is never sent to the static host or HTTP referrer. The API uses a bearer header.
      window.history.replaceState(null, "", `#manage=${t}`);
      setMain({ ...EMPTY_ATTENDEE }); setGuest({ ...EMPTY_ATTENDEE }); setCode("");
      setMessage("Your selected hours are confirmed and saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Booking response is unavailable. Retry the same details; do not start a different submission."); }
    finally { locked.current = false; setLoading(false); await refresh(); }
  };

  const cancel = async () => {
    if (!api || !token || locked.current || !confirmCancel) return;
    locked.current = true; setLoading(true);
    try {
      const data = await bookingRequest(api, "/management", { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ slotIds: cancelIds }) });
      setReservation(data.reservation); setCancelIds([]); setConfirmCancel(null); setMessage("Your selected hours have been cancelled.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Cancellation response is unavailable. Retry using your private link."); }
    finally { locked.current = false; setLoading(false); await refresh(); }
  };
  const active = reservation?.slots.filter(s => s.status === "confirmed") || [];
  const days = [...new Set(slots.map(s => s.startsAt.slice(0, 10)))];
  const shownDay = days.includes(activeDay) ? activeDay : days[0];

  return <main className="visit-page"><SiteHeader /><section className="visit-head wrap"><h1>Visit Product.ai</h1><p>October 12–16 · 11 a.m.–4 p.m. · Los Angeles time (PDT)</p><details className="visit-guidance"><summary>About your visit</summary><p>{SPACE_NOTICE}</p><p>Choose one or more one-hour visits across the week. You and your guest must leave when your reserved hours end.</p></details></section>
    <section className="visit-grid wrap">
      {reservation ? <div className="visit-management"><p className="mono-label">YOUR SAVED BOOKING</p><h2>{active.length ? "Confirmed lounge hours" : "Booking cancelled"}</h2><p>{reservation.attendeeCount === 2 ? "You + one guest" : "Just you"} · Los Angeles time (PDT)</p><ul className="booking-hours">{reservation.slots.map(slot => <li key={slot.id}><label><input type="checkbox" disabled={slot.status === "cancelled" || loading} checked={cancelIds.includes(slot.id)} onChange={() => setCancelIds(cancelIds.includes(slot.id) ? cancelIds.filter(id => id !== slot.id) : [...cancelIds, slot.id])} /><span>{formatVisitSlot(slot)}<small>{slot.status.toUpperCase()}</small></span></label></li>)}</ul><div className="booking-actions"><button className="button" disabled={!cancelIds.length || loading} onClick={() => setConfirmCancel("selected")}>Cancel selected hours</button><button className="button" disabled={!active.length || loading} onClick={() => downloadVisitCalendar(reservation)}>Add to calendar</button></div>{confirmCancel && <div className="cancel-confirm" role="alert"><p>Cancel {`${cancelIds.length} selected hour(s)`}? This releases your spaces; it cannot be undone.</p><button className="button primary" disabled={loading} onClick={cancel}>Confirm cancellation</button><button className="button" disabled={loading} onClick={() => setConfirmCancel(null)}>Keep booking</button></div>}<p>{emailNote(reservation.emailStatus)}</p><p>Your record and management access expire {new Date(reservation.expiresAt * 1000).toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" })} Los Angeles time (30 days from collection).</p></div> : token ? <div className="visit-management"><h2>Retrieve your booking</h2><p>Keep your private link. If retrieval failed, refresh this page to retry. No new reservation has been submitted.</p><button className="button" onClick={() => window.location.reload()}>Retry retrieval</button></div> : <form className="visit-form" onSubmit={submit}>
        <fieldset disabled={loading}><legend>Choose your hours</legend><p>Select one or more hours. Each reserves {party} {party === 1 ? "space" : "spaces"} for your group.</p>{fetching && <p role="status">Loading live availability…</p>}{availabilityError && <p className="availability-error" role="alert">{availabilityError}</p>}<button className="button small" type="button" disabled={fetching} onClick={refresh}>Refresh availability</button><div className="visit-day-tabs" role="group" aria-label="Visit date">{days.map(day=><button key={day} type="button" aria-pressed={shownDay===day} onClick={()=>setActiveDay(day)}>{new Date(`${day}T12:00:00-07:00`).toLocaleDateString("en-US",{timeZone:"America/Los_Angeles",weekday:"short",day:"numeric"})}{selected.filter(id=>id.startsWith(`la-${day}`)).length>0&&<small>{selected.filter(id=>id.startsWith(`la-${day}`)).length} selected</small>}</button>)}</div>{days.filter(day=>day===shownDay).map(day => <div className="visit-day" key={day}><h3>{new Date(`${day}T12:00:00-07:00`).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "long", month: "long", day: "numeric" })}</h3>{slots.filter(s => s.startsAt.startsWith(day)).map(slot => <label className={`slot-option ${selected.includes(slot.id) ? "selected" : ""}`} key={slot.id}><input type="checkbox" value={slot.id} aria-label={formatVisitSlot(slot)} checked={selected.includes(slot.id)} disabled={slot.remaining < party && !selected.includes(slot.id)} onChange={() => setSelected(selected.includes(slot.id) ? selected.filter(id => id !== slot.id) : [...selected, slot.id])} /><span>{formatVisitTime(slot)}</span><em>{slot.remaining} of {slot.capacity} spaces left{slot.remaining < party ? " · Not enough space" : ""}</em></label>)}</div>)}</fieldset>
        <fieldset disabled={loading}><legend>Who’s coming?</legend><div className="party-toggle"><button type="button" aria-pressed={!plusOne} className={!plusOne ? "selected" : ""} onClick={() => setPlusOne(false)}>Just me</button><button type="button" aria-pressed={plusOne} className={plusOne ? "selected" : ""} onClick={() => setPlusOne(true)}>Me + one</button></div></fieldset>
        <AttendeeFields title="Main attendee" value={main} onChange={setMain} disabled={loading} />{plusOne && <AttendeeFields title="Guest" value={guest} onChange={setGuest} disabled={loading} />}
        <fieldset disabled={loading}><legend>Registration</legend><label>How did you hear about this?<select value={referral} onChange={e => setReferral(e.target.value)} required><option value="">Select one</option>{REFERRAL_OPTIONS.map(option => <option key={option}>{option}</option>)}</select></label><label>Registration code<input type="password" value={code} onChange={e => setCode(e.target.value)} autoComplete="off" spellCheck={false} maxLength={128} required /><small>Case-sensitive. Enter without spaces.</small></label></fieldset>
        <button className="button primary" disabled={loading || fetching || !!availabilityError || !selected.length}>{loading ? "Saving all hours…" : "Confirm selected hours"}</button>
      </form>}
      <aside className="visit-summary"><p className="mono-label">YOUR VISIT</p><h2>{reservation ? active.length ? "Confirmed" : "Cancelled" : selected.length ? "Ready to book" : "Choose your hours"}</h2>{!reservation && <p className="visit-summary-note">Your hours are not reserved until you confirm.</p>}<dl><div><dt>People</dt><dd>{reservation ? reservation.attendeeCount : party}</dd></div><div><dt>Hours</dt><dd>{reservation ? `${active.length} confirmed` : `${selected.length} selected`}</dd></div><div><dt>Timezone</dt><dd>Los Angeles · PDT</dd></div></dl>{!reservation && selected.map(id => { const slot = slots.find(s => s.id === id); return slot ? <p key={id}>{formatVisitSlot(slot)}</p> : null; })}{managementLink && <div className="management-link"><h3>Keep your private link</h3><a href={managementLink} referrerPolicy="no-referrer">Open saved booking</a><button className="button small" onClick={async () => { try { await navigator.clipboard.writeText(managementLink); setCopiedLink(managementLink); setMessage("Private management link copied."); } catch { setCopiedLink(""); setMessage("Copy the private link from your browser address bar."); } }}><span role="status" aria-live="polite">{copiedLink === managementLink ? "Copied!" : "Copy private link"}</span></button><small>Anyone with this link can cancel hours. Do not share it publicly.</small></div>}</aside>
    </section>{reservation && <section className="wrap"><a className="button" href={assetUrl("/office-visit/")} onClick={() => sessionStorage.removeItem("officeVisitSubmission")}>Start another booking</a><p>Keep your current private link first. A new booking still cannot overlap an existing confirmed hour for the same attendee email.</p></section>}{message && <section className="visit-status wrap" role="status">{message}</section>}
  </main>;
}
