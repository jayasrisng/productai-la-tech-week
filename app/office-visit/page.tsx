"use client";

import { HQ_ADDRESS } from "@/lib/hq";
import { bookingErrorCopy } from "@/lib/display-copy";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { assetUrl } from "@/lib/assets";
import { EMPTY_ATTENDEE, PRIVACY_VERSION, PRESENCE_CONSENT_VERSION, PRIVACY_NOTICE, REFERRAL_OPTIONS, SPACE_NOTICE, formatVisitSlot, validateBooking, type Attendee, type BookingSummary, type VisitSlot } from "@/lib/demo-visit-booking";
import { isBookableVisitHour } from "@/lib/visit-schedule";
import { bookingRequest, fetchAvailability, submissionKey } from "@/lib/visit-client";
import { downloadVisitCalendar } from "@/lib/visit-calendar";
import { demoVisitSlots, demoReservation } from "@/lib/visit-demo";
import { useAvatar } from "@/components/useAvatar";
import { usePulseName } from "@/components/usePulseName";
import Link from "next/link";
import { Lightning } from "@phosphor-icons/react";
import { OfficeSchedulePreview } from "@/components/OfficeSchedulePreview";

// Static Pages demo: backend access is intentionally disabled.
const api: string | undefined = undefined;
const demo = true;
const loadAvailability = async () => (demo ? demoVisitSlots() : await fetchAvailability(api)).filter(isBookableVisitHour);
const emailNote = (status: BookingSummary["emailStatus"]) => status === "sent" ? "Confirmation email accepted by the provider; inbox delivery is not verified." : status === "unconfigured" ? "We couldn’t send a confirmation email, so save your private link below. It’s how you view or cancel your hours." : "Confirmation email is pending delivery. Your booking is saved; keep your private management link while delivery retries.";

function formatVisitTime(slot: Pick<VisitSlot, "startsAt" | "endsAt">) {
  const clock = (value: string) => { const date=new Date(value); const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit",hourCycle:"h23"}).formatToParts(date); const hour=Number(parts.find(part=>part.type==="hour")!.value),minute=Number(parts.find(part=>part.type==="minute")!.value); return hour===12&&minute===0?"Noon":`${hour%12||12}${minute?`:${String(minute).padStart(2,"0")}`:""} ${hour<12?"AM":"PM"}`; };
  return `${clock(slot.startsAt)}–${clock(slot.endsAt)}`;
}

function AttendeeFields({ title, value, onChange, disabled }: { title: string; value: Attendee; onChange: (next: Attendee) => void; disabled: boolean }) {
  return <fieldset className="attendee-fields" disabled={disabled}><legend>{title}</legend>
    <label>Name<input value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} autoComplete="name" maxLength={120} required /></label>
    <label>Email<input value={value.email} onChange={e => onChange({ ...value, email: e.target.value })} type="email" autoComplete="email" maxLength={254} required /></label>
    <label>LinkedIn profile<span className="linkedin-input"><span aria-hidden="true">https://linkedin.com/in/</span><input aria-label="LinkedIn username" value={value.linkedin.replace(/^https:\/\/(?:www\.)?linkedin\.com\/in\//i, "")} onChange={e => { const typed = e.target.value; onChange({ ...value, linkedin: typed ? (/^https:\/\//i.test(typed) ? typed : `https://linkedin.com/in/${typed}`) : "" }); }} autoComplete="off" spellCheck={false} maxLength={200} placeholder="your-name" required /></span><small>Just the part after linkedin.com/in/</small></label>
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
  const [socialOptIn,setSocialOptIn]=useState(false);
  const [avatar,,hasSavedAvatar]=useAvatar();
  const [displayName]=usePulseName();
  const locked = useRef(false);
  const party = plusOne ? 2 : 1;
  const savedBookingId = reservation?.id;
  useEffect(() => { if (savedBookingId) window.scrollTo({ top: 0, behavior: "instant" }); }, [savedBookingId]);

  const refresh = useCallback(async () => {
    setFetching(true);
    try { setSlots(await loadAvailability()); setAvailabilityError(""); }
    catch (error) { setSlots([]); setAvailabilityError(error instanceof Error ? error.message : "Live availability is unavailable. No hours can be booked."); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => {
    let alive = true;
    loadAvailability().then(data => { if (alive) { setSlots(data); setAvailabilityError(""); } }).catch(error => { if (alive) { setSlots([]); setAvailabilityError(error instanceof Error ? error.message : "Live availability is unavailable."); } }).finally(() => { if (alive) setFetching(false); });
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
    if ((!api && !demo) || availabilityError || !slots.length) { setMessage("Live availability is required. No booking was submitted."); return; }
    const validation = validateBooking({ slotIds: selected, attendees: plusOne ? [main, guest] : [main], referral, registrationCode: code, disclosureVersion: PRIVACY_VERSION, publicPresence: socialOptIn, ...(socialOptIn ? {presenceConsentVersion:PRESENCE_CONSENT_VERSION} : {}), ...(socialOptIn && hasSavedAvatar ? { avatar } : {}), ...(socialOptIn && displayName ? { displayName } : {}) });
    if (!validation.booking) { setMessage(validation.errors.map(bookingErrorCopy).join(" ")); return; }
    if (demo) {
      try { setReservation(demoReservation(slots, selected, party, code)); }
      catch (error) { setMessage(error instanceof Error ? bookingErrorCopy(error.message) : "Check your registration details."); return; }
      setMain({ ...EMPTY_ATTENDEE }); setGuest({ ...EMPTY_ATTENDEE }); setCode("");
      setMessage("Confirmation preview. No visit has been reserved.");
      return;
    }
    if (!api) return;
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
      setMessage(socialOptIn ? "You’re booked. Your Pulse name and avatar show only during your confirmed planned hours." : "You’re booked. We can’t wait to see you at Product.ai HQ.");
    } catch (error) { setMessage(error instanceof Error ? bookingErrorCopy(error.message) : "Booking response is unavailable. Retry the same details; do not start a different submission."); }
    finally { locked.current = false; setLoading(false); await refresh(); }
  };

  const cancel = async () => {
    if (demo && reservation && confirmCancel) {
      setReservation({ ...reservation, slots: reservation.slots.map(slot => cancelIds.includes(slot.id) ? { ...slot, status: "cancelled" } : slot) });
      setCancelIds([]); setConfirmCancel(null); setMessage("Selected preview hours cancelled. No real booking was changed.");
      return;
    }
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

  return <main className="visit-page"><SiteHeader /><section className="visit-head wrap"><h1 className="recharge-label"><Lightning className="recharge-icon" size={40} weight="fill" aria-hidden="true"/> Recharge at Product.ai HQ</h1><p>October 12–16 · Monday 11 a.m.–3 p.m. · Tuesday–Friday 11 a.m.–4 p.m. · Los Angeles time (PDT)</p><p>Product.ai HQ · {HQ_ADDRESS} (Brentwood)</p><details className="visit-guidance" open><summary>Good to know</summary><div className="disclosure-popover"><p>Recharge between events with quiet rooms, lounges, snacks and drinks.</p><p>{SPACE_NOTICE}</p><p>Book one hour or several. When your last hour ends, please head out so the next group has room. Monday lounge visits end by 3 p.m.</p><p>We can’t validate parking, so check the <a href="https://product.ai/parking-map/" target="_blank" rel="noreferrer">Product.ai parking map ↗</a> before you come.</p></div></details></section>
    <section className="visit-grid wrap">
      {reservation ? <div className="visit-management"><p className="mono-label">{demo ? "YOUR VISIT PREVIEW" : "YOUR SAVED BOOKING"}</p><h2>{demo ? active.length ? "Confirmation preview" : "Preview cancelled" : active.length ? "Your Recharge hours" : "Booking cancelled"}</h2><p>{reservation.attendeeCount === 2 ? "You + one guest" : "Just you"} · Los Angeles time (PDT)</p>{active.length>0&&<p>Find us at Product.ai HQ, {HQ_ADDRESS}. <a href="https://product.ai/parking-map/" target="_blank" rel="noreferrer">Parking map ↗</a> (we can’t validate parking).</p>}<ul className="booking-hours">{reservation.slots.map(slot => <li key={slot.id}><label><input type="checkbox" disabled={slot.status === "cancelled" || loading} checked={cancelIds.includes(slot.id)} onChange={() => setCancelIds(cancelIds.includes(slot.id) ? cancelIds.filter(id => id !== slot.id) : [...cancelIds, slot.id])} /><span>{formatVisitSlot(slot)}<small>{slot.status.toUpperCase()}</small></span></label></li>)}</ul><div className="booking-actions"><button className="button" disabled={!cancelIds.length || loading} onClick={() => setConfirmCancel("selected")}>Cancel selected hours</button><button className="button" disabled={!active.length || loading} onClick={() => downloadVisitCalendar(reservation)}>Add to calendar</button></div>{confirmCancel && <div className="cancel-confirm" role="alert"><p>Cancel {`${cancelIds.length} selected hour(s)`}? This changes only your in-memory preview.</p><button className="button primary" disabled={loading} onClick={cancel}>Confirm cancellation</button><button className="button" disabled={loading} onClick={() => setConfirmCancel(null)}>Keep booking</button></div>}{!demo && <><p>{emailNote(reservation.emailStatus)}</p><p>Your record and management access expire {new Date(reservation.expiresAt * 1000).toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" })} Los Angeles time.</p></>}</div> : token ? <div className="visit-management"><h2>Retrieve your booking</h2><p>Keep your private link. If retrieval failed, refresh this page to retry. No new reservation has been submitted.</p><button className="button" onClick={() => window.location.reload()}>Retry retrieval</button></div> : <form className="visit-form" onSubmit={submit}>
        <fieldset disabled={loading}><legend>Who’s coming?</legend><div className="party-toggle"><button type="button" aria-pressed={!plusOne} className={!plusOne ? "selected" : ""} onClick={() => setPlusOne(false)}>Just me</button><button type="button" aria-pressed={plusOne} className={plusOne ? "selected" : ""} onClick={() => setPlusOne(true)}>Me + one</button></div></fieldset>
        <fieldset disabled={loading}><legend>Choose your hours</legend><p>Pick one or more hours. Each hour holds {party} {party === 1 ? "spot" : "spots, one for you and one for your guest"}.</p>{fetching && <p role="status">Loading live availability…</p>}{availabilityError && <p className="availability-error" role="alert">{availabilityError}</p>}<button className="button small" type="button" disabled={fetching} onClick={refresh}>Refresh availability</button>{availabilityError&&!slots.length&&<OfficeSchedulePreview/>}<div className="visit-day-tabs" role="group" aria-label="Visit date">{days.map(day=><button key={day} type="button" aria-pressed={shownDay===day} onClick={()=>setActiveDay(day)}>{new Date(`${day}T12:00:00-07:00`).toLocaleDateString("en-US",{timeZone:"America/Los_Angeles",weekday:"short"})} {day.slice(-2)}{selected.filter(id=>id.startsWith(`la-${day}`)).length>0&&<small>{selected.filter(id=>id.startsWith(`la-${day}`)).length} selected</small>}</button>)}</div>{days.filter(day=>day===shownDay).map(day => <div className="visit-day" key={day}><h3>{new Date(`${day}T12:00:00-07:00`).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "long", month: "long", day: "numeric" })}</h3>{slots.filter(s => s.startsAt.startsWith(day)).map(slot => <label className={`slot-option ${selected.includes(slot.id) ? "selected" : ""}`} key={slot.id}><input type="checkbox" value={slot.id} aria-label={formatVisitSlot(slot)} checked={selected.includes(slot.id)} disabled={slot.remaining < party && !selected.includes(slot.id)} onChange={() => setSelected(selected.includes(slot.id) ? selected.filter(id => id !== slot.id) : [...selected, slot.id])} /><span>{formatVisitTime(slot)}</span><em>{slot.remaining===0?"Full":slot.remaining<party?"Only 1 spot left":`${slot.remaining} spots left`}</em></label>)}</div>)}</fieldset>

        <AttendeeFields title="You" value={main} onChange={setMain} disabled={loading} />{plusOne && <AttendeeFields title="Your guest" value={guest} onChange={setGuest} disabled={loading} />}
        <fieldset disabled={loading}><legend>Registration</legend><label>How did you hear about Recharge?<select value={referral} onChange={e => setReferral(e.target.value)} required><option value="">Select one</option>{REFERRAL_OPTIONS.map(option => <option key={option} value={option}>{option===REFERRAL_OPTIONS[0]?"I’m on the Alpha Team":"I came to Golden Hour"}</option>)}</select></label><label>Registration code<input type="text" value={code} onChange={e => setCode(e.target.value)} autoComplete="off" spellCheck={false} maxLength={128} required /><small>Demo: enter a sample code without spaces. No access is verified.</small><small>Use fictional attendee details for this preview.</small></label></fieldset>
        <label className="social-opt-in"><input type="checkbox" checked={socialOptIn} onChange={event=>setSocialOptIn(event.target.checked)}/><span>Preview sharing my Pulse name and avatar<small>Demo only. Your name and avatar will not be published.</small></span></label><p className="sample-label"><Link href="/lineup">{displayName ? `Edit Pulse name (${displayName}) and avatar →` : "Add a Pulse display name and avatar on Lineup →"}</Link></p>
        <details className="registration-disclosure"><summary>Booking data disclosure</summary><div className="disclosure-popover"><p>{demo ? "Demo only: use sample details. This form stays in browser memory; no booking details are sent, no email is sent, and no public presence is published." : PRIVACY_NOTICE}</p><p>Social presence is separate and remains off by default.</p></div></details>
        <button className="button primary" disabled={loading || fetching || !!availabilityError || !selected.length}>{loading ? "Saving all hours…" : demo ? "Preview confirmation" : "Book my hours"}</button>
      </form>}
      <aside className="visit-summary"><p className="mono-label">YOUR VISIT</p><h2>{reservation ? active.length ? "Confirmed" : "Cancelled" : selected.length ? "Ready to book" : "Choose your hours"}</h2>{!reservation && <p className="visit-summary-note">{demo ? "Preview only. No hours will be reserved." : "Nothing is booked until you tap Book my hours."}</p>}<dl><div><dt>People</dt><dd>{reservation ? reservation.attendeeCount : party}</dd></div><div><dt>Hours</dt><dd>{reservation ? `${active.length} confirmed` : `${selected.length} selected`}</dd></div><div><dt>Timezone</dt><dd>Los Angeles · PDT</dd></div></dl>{!reservation && selected.map(id => { const slot = slots.find(s => s.id === id); return slot ? <p key={id}>{formatVisitSlot(slot)}</p> : null; })}{managementLink && <div className="management-link"><h3>Keep your private link</h3><a href={managementLink} referrerPolicy="no-referrer">Open saved booking</a><button className="button small" onClick={async () => { try { await navigator.clipboard.writeText(managementLink); setCopiedLink(managementLink); setMessage("Private management link copied."); } catch { setCopiedLink(""); setMessage("Copy the private link from your browser address bar."); } }}><span role="status" aria-live="polite">{copiedLink === managementLink ? "Copied!" : "Copy private link"}</span></button><small>Anyone with this link can cancel your hours, so keep it to yourself.</small></div>}</aside>
    </section>{reservation && <section className="wrap"><a className="button" href={assetUrl("/office-visit/")} onClick={() => sessionStorage.removeItem("officeVisitSubmission")}>Start another booking</a><p>Refreshing resets this preview. No booking or private management link is created.</p></section>}{message && <section className="visit-status wrap" role="status">{message}</section>}
  </main>;
}
