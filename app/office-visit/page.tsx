"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { assetUrl } from "@/lib/assets";
import { EMPTY_ATTENDEE, PRIVACY_NOTICE, PRIVACY_VERSION, REFERRAL_OPTIONS, SPACE_NOTICE, formatVisitSlot, validateBooking, type Attendee, type BookingSummary, type VisitSlot } from "@/lib/visit-booking";
import { bookingRequest, fetchAvailability, submissionKey } from "@/lib/visit-client";

const api = process.env.NEXT_PUBLIC_RESERVATIONS_API?.replace(/\/$/, "");
const emailNote = (status: BookingSummary["emailStatus"]) => status === "sent" ? "Confirmation email accepted by the provider; inbox delivery is not verified." : status === "unconfigured" ? "Production email delivery is pending: no email provider is configured. Save your private management link now." : "Confirmation email is pending delivery. Your booking is saved; keep your private management link while delivery retries.";

function AttendeeFields({ title, value, onChange, disabled }: { title: string; value: Attendee; onChange: (next: Attendee) => void; disabled: boolean }) {
  return <fieldset className="attendee-fields" disabled={disabled}><legend>{title}</legend>
    <label>{title} name<input value={value.name} onChange={e => onChange({ ...value, name: e.target.value })} autoComplete="name" maxLength={120} required /></label>
    <label>{title} email<input value={value.email} onChange={e => onChange({ ...value, email: e.target.value })} type="email" autoComplete="email" maxLength={254} required /></label>
    <label>{title} phone<input value={value.phone} onChange={e => onChange({ ...value, phone: e.target.value })} type="tel" autoComplete="tel" maxLength={80} placeholder="US number or +country code" required /></label>
    <label>{title} LinkedIn profile<input value={value.linkedin} onChange={e => onChange({ ...value, linkedin: e.target.value })} type="url" maxLength={200} placeholder="https://www.linkedin.com/in/your-name" required /></label>
  </fieldset>;
}

export default function OfficeVisitPage() {
  const [slots, setSlots] = useState<VisitSlot[]>([]);
  const [availabilityError, setAvailabilityError] = useState("");
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [plusOne, setPlusOne] = useState(false);
  const [main, setMain] = useState<Attendee>({ ...EMPTY_ATTENDEE });
  const [guest, setGuest] = useState<Attendee>({ ...EMPTY_ATTENDEE });
  const [referral, setReferral] = useState("");
  const [code, setCode] = useState("");
  const [reservation, setReservation] = useState<BookingSummary>();
  const [token, setToken] = useState("");
  const [managementLink, setManagementLink] = useState("");
  const [cancelIds, setCancelIds] = useState<string[]>([]);
  const [confirmCancel, setConfirmCancel] = useState<"selected" | "all" | null>(null);
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
      const data = await bookingRequest(api, "/management", { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(confirmCancel === "all" ? {} : { slotIds: cancelIds }) });
      setReservation(data.reservation); setCancelIds([]); setConfirmCancel(null); setMessage("Cancellation saved. Cancelled hours no longer consume capacity.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Cancellation response is unavailable. Retry using your private link."); }
    finally { locked.current = false; setLoading(false); await refresh(); }
  };
  const active = reservation?.slots.filter(s => s.status === "confirmed") || [];
  const days = [...new Set(slots.map(s => s.startsAt.slice(0, 10)))];

  return <main><SiteHeader /><section className="visit-head wrap"><p className="mono-label">PRODUCT.AI OFFICE / LA TECH WEEK</p><h1>Reserve your lounge hours.</h1><p>October 12–16, 2026 · 11 a.m.–4 p.m. Los Angeles time (PDT). Choose one or more one-hour visits, consecutive or separate, across the week. No account, sign-in, email verification, or manual approval.</p><p>{SPACE_NOTICE}</p><p>You and your guest must leave when your reserved hours end. October 7 Golden Hour is not a booking date.</p></section>
    <section className="visit-grid wrap">
      {reservation ? <div className="visit-management"><p className="mono-label">YOUR SAVED BOOKING</p><h2>{active.length ? "Confirmed lounge hours" : "Booking cancelled"}</h2><p>Same attendee group: {reservation.attendeeCount === 2 ? "main attendee + one guest" : "main attendee only"}. All times below are Los Angeles time, regardless of your device timezone.</p><ul className="booking-hours">{reservation.slots.map(slot => <li key={slot.id}><label><input type="checkbox" disabled={slot.status === "cancelled" || loading} checked={cancelIds.includes(slot.id)} onChange={() => setCancelIds(cancelIds.includes(slot.id) ? cancelIds.filter(id => id !== slot.id) : [...cancelIds, slot.id])} /><span>{formatVisitSlot(slot)}<small>{slot.status.toUpperCase()}</small></span></label></li>)}</ul><div className="booking-actions"><button className="button" disabled={!cancelIds.length || loading} onClick={() => setConfirmCancel("selected")}>Cancel selected hours</button><button className="button" disabled={!active.length || loading} onClick={() => setConfirmCancel("all")}>Cancel entire booking</button></div>{confirmCancel && <div className="cancel-confirm" role="alert"><p>Cancel {confirmCancel === "all" ? "all remaining hours" : `${cancelIds.length} selected hour(s)`}? This releases your spaces; it cannot be undone.</p><button className="button primary" disabled={loading} onClick={cancel}>Confirm cancellation</button><button className="button" disabled={loading} onClick={() => setConfirmCancel(null)}>Keep booking</button></div>}<p>{emailNote(reservation.emailStatus)}</p><p>Your record and management access expire {new Date(reservation.expiresAt * 1000).toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" })} Los Angeles time (30 days from collection).</p><p>{SPACE_NOTICE}</p><p>Guests must leave when their reserved hours end.</p></div> : token ? <div className="visit-management"><h2>Retrieve your booking</h2><p>Keep your private link. If retrieval failed, refresh this page to retry. No new reservation has been submitted.</p><button className="button" onClick={() => window.location.reload()}>Retry retrieval</button></div> : <form className="visit-form" onSubmit={submit}>
        <fieldset disabled={loading}><legend>1 / Choose your hours · 20 people per hour</legend><p>Each selected hour reserves {party} {party === 1 ? "space" : "spaces"} for the same attendee group. The last hour is 3–4 p.m.</p>{fetching && <p role="status">Loading live availability…</p>}{availabilityError && <p className="availability-error" role="alert">{availabilityError}</p>}<button className="button small" type="button" disabled={fetching} onClick={refresh}>Refresh availability</button>{days.map(day => <div className="visit-day" key={day}><h3>{new Date(`${day}T12:00:00-07:00`).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "long", month: "long", day: "numeric" })}</h3>{slots.filter(s => s.startsAt.startsWith(day)).map(slot => <label className={`slot-option ${selected.includes(slot.id) ? "selected" : ""}`} key={slot.id}><input type="checkbox" value={slot.id} checked={selected.includes(slot.id)} disabled={slot.remaining < party && !selected.includes(slot.id)} onChange={() => setSelected(selected.includes(slot.id) ? selected.filter(id => id !== slot.id) : [...selected, slot.id])} /><span>{formatVisitSlot(slot)}</span><em>{slot.remaining} of 20 spaces left{slot.remaining < party ? " · Not enough space" : ""}</em></label>)}</div>)}</fieldset>
        <fieldset disabled={loading}><legend>2 / Your attendee group</legend><div className="party-toggle"><button type="button" aria-pressed={!plusOne} className={!plusOne ? "selected" : ""} onClick={() => setPlusOne(false)}>Just me</button><button type="button" aria-pressed={plusOne} className={plusOne ? "selected" : ""} onClick={() => setPlusOne(true)}>Me + one</button></div></fieldset>
        <AttendeeFields title="Main attendee" value={main} onChange={setMain} disabled={loading} />{plusOne && <AttendeeFields title="Guest" value={guest} onChange={setGuest} disabled={loading} />}
        <fieldset disabled={loading}><legend>3 / Registration</legend><label>How did you hear about this?<select value={referral} onChange={e => setReferral(e.target.value)} required><option value="">Select one</option>{REFERRAL_OPTIONS.map(option => <option key={option}>{option}</option>)}</select></label><label>Registration code<input type="password" value={code} onChange={e => setCode(e.target.value)} autoComplete="off" spellCheck={false} maxLength={128} required /><small>Case-sensitive, no spaces. The code is checked by the booking service.</small></label></fieldset>
        <section className="registration-disclosure" aria-label="Registration privacy disclosure"><h3>How your information is used</h3><p>{PRIVACY_NOTICE}</p><p>No separate promotional opt-in is collected. Submitting does not mark consent, membership, identity, or email ownership as verified.</p></section>
        <button className="button primary" disabled={loading || fetching || !!availabilityError || !selected.length}>{loading ? "Saving all hours…" : "Confirm selected hours"}</button>
      </form>}
      <aside className="visit-summary"><p>YOUR VISIT</p><h2>{reservation ? active.length ? "Confirmed" : "Cancelled" : "Not reserved yet"}</h2><dl><div><dt>Attendees per hour</dt><dd>{reservation ? reservation.attendeeCount : party}</dd></div><div><dt>Hours</dt><dd>{reservation ? `${active.length} confirmed` : `${selected.length} selected`}</dd></div><div><dt>Timezone</dt><dd>America/Los_Angeles · PDT</dd></div></dl>{!reservation && selected.map(id => { const slot = slots.find(s => s.id === id); return slot ? <p key={id}>{formatVisitSlot(slot)}</p> : null; })}{managementLink && <div className="management-link"><h3>Keep your private link</h3><a href={managementLink} referrerPolicy="no-referrer">Open saved booking</a><button className="button small" onClick={async () => { try { await navigator.clipboard.writeText(managementLink); setMessage("Private management link copied."); } catch { setMessage("Copy the private link from your browser address bar."); } }}>Copy private link</button><small>Anyone with this link can cancel hours. Do not share it publicly.</small></div>}<small>Bookings are stored by the Worker + D1, not in your browser. No phone booth is reserved.</small></aside>
    </section>{reservation && <section className="wrap"><a className="button" href={assetUrl("/office-visit/")} onClick={() => sessionStorage.removeItem("officeVisitSubmission")}>Start another booking</a><p>Keep your current private link first. A new booking still cannot overlap an existing confirmed hour for the same attendee email.</p></section>}{message && <section className="visit-status wrap" role="status">{message}</section>}
  </main>;
}
