import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";
import { Miniflare, createFetchMock } from "miniflare";

const bundle = await build({ entryPoints: ["workers/reservations/src/index.ts"], bundle: true, write: false, format: "esm", platform: "browser", target: "es2022" });
const clientBundle = await build({ entryPoints: ["lib/visit-client.ts"], bundle: true, write: false, format: "esm", platform: "browser", target: "es2022" });
const validationBundle = await build({ entryPoints: ["lib/visit-booking.ts"], bundle: true, write: false, format: "esm", platform: "browser", target: "es2022" });
const { fetchAvailability, submissionKey } = await import(`data:text/javascript,${encodeURIComponent(clientBundle.outputFiles[0].text)}`);
const { validateBooking, PRIVACY_VERSION, formatVisitSlot } = await import(`data:text/javascript,${encodeURIComponent(validationBundle.outputFiles[0].text)}`);
const persist = await fs.mkdtemp(path.join(os.tmpdir(), "la-office-test-"));
const code = "LOCAL-test-code-only"; // Not the production registration secret.
const bindings = { ALLOWED_ORIGIN: "https://planner.test", MANAGEMENT_PAGE_URL: "https://planner.test/office-visit/", REGISTRATION_CODE: code, MANAGEMENT_TOKEN_SECRET: "local-test-signing-secret-not-production-000", PRIVACY_APPROVED: "true" };
const mock = createFetchMock();
mock.disableNetConnect();
let providerCalls = 0;
mock.get("https://api.resend.com").intercept({ path: "/emails", method: "POST" }).reply(200, () => { providerCalls++; return JSON.stringify({ id: "test-message" }); }).persist();
const options = { modules: true, script: bundle.outputFiles[0].text, compatibilityDate: "2026-05-22", d1Databases: { RESERVATIONS: "office-test" }, d1Persist: persist, bindings, fetchMock: mock };
let mf = new Miniflare(options);
let db = await mf.getD1Database("RESERVATIONS");

function splitStatements(sql) {
  let buffer = "", trigger = false;
  const statements = [];
  for (const line of sql.split("\n")) {
    if (line.trim().startsWith("--") || !line.trim()) continue;
    if (line.startsWith("CREATE TRIGGER")) trigger = true;
    buffer += `${line}\n`;
    if ((!trigger && line.trim().endsWith(";")) || (trigger && line.trim() === "END;")) { statements.push(buffer); buffer = ""; trigger = false; }
  }
  assert.equal(buffer.trim(), "");
  return statements;
}
const call = async (route, method = "GET", body, headers = {}) => {
  const response = await mf.dispatchFetch(`https://api.test${route}`, { method, headers: { Origin: bindings.ALLOWED_ORIGIN, ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json(), headers: response.headers };
};
const slot = (day, hour) => `la-2026-10-${day}-${hour}`;
let sequence = 0;
const attendee = (id) => ({ name: `Test Visitor ${id}`, email: `test-visitor-${id}@example.net`, linkedin: `https://www.linkedin.com/in/test-visitor-${id}` });
const body = (slots, count = 1) => ({ slotIds: slots, attendees: Array.from({ length: count }, () => attendee(++sequence)), referral: "I’m part of Alpha team", registrationCode: code, disclosureVersion: PRIVACY_VERSION });
const post = (value, key = crypto.randomUUID()) => call("/reservations", "POST", value, { "Idempotency-Key": key });
const tokenOf = response => new URL(response.data.managementUrl).hash.slice("#manage=".length);
const manage = (token, method = "GET", body) => call("/management", method, body, { Authorization: `Bearer ${token}` });
const count = async table => (await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first()).n;
const remaining = async id => (await call("/slots")).data.slots.find(s => s.id === id).remaining;

try {
  for (const file of (await fs.readdir("workers/reservations/migrations")).sort()) for (const statement of splitStatements(await fs.readFile(`workers/reservations/migrations/${file}`, "utf8"))) await db.prepare(statement).run();
  const availability = await call("/slots");
  assert.equal(availability.status, 200);
  assert.equal(availability.data.slots.length, 25);
  assert(availability.data.slots.every(s => s.capacity === 20 && s.remaining === 20 && !s.startsAt.startsWith("2026-10-07")));
  assert.equal(availability.data.slots.at(-1).endsAt, "2026-10-16T16:00:00-07:00");
  assert.equal(availability.headers.get("cache-control"), "no-store");
  assert(!JSON.stringify(availability.data).includes("@"));
  console.log("PASS: 25 real slots, 20-person limit, explicit LA times, availability only.");

  const selected = [slot(12,11), slot(12,12), slot(14,15)];
  const request = body(selected,2), key = crypto.randomUUID();
  const created = await post(request,key);
  assert.equal(created.status,201);
  assert.equal(created.data.reservation.attendeeCount,2);
  assert.equal(created.data.reservation.slots.length,3);
  assert.equal(created.data.reservation.emailStatus,"unconfigured");
  for(const id of selected) assert.equal(await remaining(id),18);
  const stored = await db.prepare("SELECT * FROM bookings WHERE id=?").bind(created.data.reservation.id).first();
  assert.equal(stored.management_hash.length,64);
  assert.notEqual(stored.management_hash,tokenOf(created));
  assert(!JSON.stringify(stored).includes(key));
  const people = (await db.prepare("SELECT * FROM booking_attendees WHERE booking_id=?").bind(created.data.reservation.id).all()).results;
  assert.equal(people.length,2); assert(people.every(p=>p.phone===""));
  const replay = await post(request,key); assert.equal(replay.status,200); assert.equal(replay.data.managementUrl,created.data.managementUrl);
  assert.equal(await count("bookings"),1);
  assert.equal((await post({...request,slotIds:[slot(12,13)]},key)).status,409);
  assert.equal((await post(request)).status,409);
  assert.equal(await count("bookings"),1);
  assert.equal((await post({...request,attendees:[request.attendees[1]],slotIds:[slot(12,11)]})).status,409);
  assert.equal((await post({...request,slotIds:[slot(12,13)]})).status,201); // Non-overlapping hours allowed.
  console.log("PASS: plus-one in every hour, normalized private records, same-key recovery, repeat/guest-overlap protection.");

  const fresh = body([slot(15,11)]), concurrentKey = crypto.randomUUID();
  const retries = await Promise.all([post(fresh,concurrentKey),post(fresh,concurrentKey)]);
  assert.deepEqual(retries.map(r=>r.status).sort(),[200,201]);
  assert.equal(retries[0].data.reservation.id,retries[1].data.reservation.id);
  assert.equal(await remaining(slot(15,11)),19);

  const full = slot(13,15);
  for(let n=0;n<10;n++) assert.equal((await post(body([full],2))).status,201);
  assert.equal(await remaining(full),0);
  const before = await count("bookings"), beforePeople=await count("booking_attendees");
  const atomic = await post(body([slot(12,14),full],2));
  assert.equal(atomic.status,409);
  assert.equal(await remaining(slot(12,14)),20);
  assert.equal(await count("bookings"),before); assert.equal(await count("booking_attendees"),beforePeople);
  const last = slot(16,11);
  for(let n=0;n<9;n++) assert.equal((await post(body([last],2))).status,201);
  assert.equal((await post(body([last]))).status,201);
  assert.equal(await remaining(last),1);
  assert.equal((await post(body([last],2))).status,409);
  const final = await Promise.all([post(body([last])),post(body([last]))]);
  assert.deepEqual(final.map(r=>r.status).sort(),[201,409]);
  assert.equal(await remaining(last),0);
  console.log("PASS: multi-slot rollback, exact capacity, plus-one final-space rejection, concurrent final-space attempts.");

  for (const edit of [
    b=>b.registrationCode=code.toLowerCase(), b=>b.registrationCode=` ${code}`, b=>b.registrationCode="incorrect",
    b=>b.attendees[0].email="bad@email", b=>b.attendees[0].linkedin="https://linkedin.com/company/product-ai",
    b=>b.attendees[0].linkedin="https://linkedin.com.evil.test/in/name",
    b=>b.slotIds=["demo-oct-7-1600"], b=>b.slotIds=[slot(12,11),slot(12,11)],
    b=>b.referral="invented", b=>b.disclosureVersion="old", b=>b.attendees[1].email="",
  ]) { const invalid=body([slot(15,12)],2); edit(invalid); const result=await post(invalid); assert([400,403].includes(result.status)); }
  assert(validateBooking(body([slot(15,12)])).booking);
  const legacyInput = body([slot(15,12)], 2);
  legacyInput.attendees.forEach(a => { a.phone = "ignored legacy input"; });
  const normalizedLegacy = validateBooking(legacyInput).booking;
  assert(normalizedLegacy && normalizedLegacy.attendees.every(a => !("phone" in a)));
  assert.equal((await call("/reservations","POST",body([slot(15,12)]))).status,400);
  assert.equal((await call("/slots","GET",undefined,{Origin:"https://unapproved.test"})).status,403);
  assert.equal((await call(`/reservations/${created.data.reservation.id}`,"DELETE",{})).status,404);
  assert.equal((await call("/management")).status,401);
  assert.equal((await manage("0".repeat(64))).status,401);
  assert.equal((await manage(created.data.reservation.id)).status,401);
  const token=tokenOf(created);
  assert.equal((await manage(token)).status,200);
  assert.equal((await manage(token,"DELETE",{slotIds:[slot(16,15)]})).status,400);
  const partial=await manage(token,"DELETE",{slotIds:[slot(12,11)]}); assert.equal(partial.status,200);
  assert.equal(partial.data.reservation.slots.filter(s=>s.status==="confirmed").length,2);
  assert.equal(await remaining(slot(12,11)),20); assert.equal(await remaining(slot(12,12)),18);
  assert.equal((await manage(token,"DELETE",{slotIds:[slot(12,11)]})).status,200); // Retry cancellation safely.
  const cancelled=await manage(token,"DELETE",{}); assert(cancelled.data.reservation.slots.every(s=>s.status==="cancelled"));
  assert.equal(await remaining(slot(14,15)),20);
  assert.equal((await post(request,key)).data.reservation.slots.filter(s=>s.status==="confirmed").length,0); // Replay does not rebook.
  console.log("PASS: server validation, secret code, restricted CORS, token-only authorization, partial/full cancellation and retries.");

  // Restart the emulator with the same on-disk D1 and prove summary/cancellations persist.
  await mf.dispose(); mf=new Miniflare(options); db=await mf.getD1Database("RESERVATIONS");
  assert.equal((await manage(token)).status,200); assert.equal(await remaining(slot(13,15)),0);
  await db.prepare("UPDATE bookings SET created_at=unixepoch()-2592001,expires_at=unixepoch()-1 WHERE id=?").bind(created.data.reservation.id).run();
  await db.prepare("INSERT INTO visit_slots(id,starts_at,capacity) VALUES('old-demo','2026-10-07T16:00:00-07:00',12)").run();
  await db.prepare("INSERT INTO reservations(id,slot_id,member_name,member_email,attendee_count,idempotency_key,created_at) VALUES('old-record','old-demo','Test legacy','old@example.net',1,'legacy-key',datetime('now','-31 days'))").run();
  // Run the exact scheduled handler through a test-only export adapter, not a public production route.
  const handlerBundle=await build({ stdin:{contents:'import worker from "./workers/reservations/src/index.ts"; export default { async fetch(request,env){ const waits=[]; await worker.scheduled({scheduledTime:Date.now(),cron:"test",noRetry(){}},env,{waitUntil(p){waits.push(p)},passThroughOnException(){},props:{}}); await Promise.all(waits); return new Response("done"); }};',resolveDir:process.cwd()},bundle:true,write:false,format:"esm",platform:"browser",target:"es2022" });
  await mf.setOptions({...options,script:handlerBundle.outputFiles[0].text});
  assert.equal((await mf.dispatchFetch("https://api.test/test-schedule")).status,200);
  await mf.setOptions(options); db=await mf.getD1Database("RESERVATIONS");
  assert.equal((await manage(token)).status,401);
  assert.equal((await db.prepare("SELECT COUNT(*) n FROM booking_attendees WHERE booking_id=?").bind(created.data.reservation.id).first()).n,0);
  assert.equal((await db.prepare("SELECT COUNT(*) n FROM booking_hours WHERE booking_id=?").bind(created.data.reservation.id).first()).n,0);
  assert.equal(await count("reservations"),0);
  console.log("PASS: restart persistence, scheduled 30-day cascade cleanup (including cancelled data/token hashes and legacy records).");

  await mf.setOptions({...options,bindings:{...bindings,PRIVACY_APPROVED:"false"}});
  assert.equal((await post(body([slot(15,13)]))).status,503);
  await mf.setOptions({...options,bindings:{...bindings,RESEND_API_KEY:"test-only",EMAIL_FROM:"Office <office@example.net>"}});
  const emailed=await post(body([slot(15,13)])); assert.equal(emailed.status,201); assert.equal(emailed.data.reservation.emailStatus,"sent");
  assert.equal(providerCalls,1);
  // No real email is sent: provider is fully intercepted by Miniflare's network mock.
  console.log("PASS: privacy launch gate and configurable email adapter (mock provider acceptance only).");

  const failingProvider=createFetchMock(); failingProvider.disableNetConnect();
  failingProvider.get("https://api.resend.com").intercept({path:"/emails",method:"POST"}).reply(503,{}).persist();
  const emailBindings={...bindings,RESEND_API_KEY:"test-only",EMAIL_FROM:"Office <office@example.net>"};
  await mf.setOptions({...options,bindings:emailBindings,fetchMock:failingProvider});
  const delayed=await post(body([slot(15,14)])); assert.equal(delayed.status,201); assert.equal(delayed.data.reservation.emailStatus,"pending");
  const delayedToken=tokenOf(delayed);
  assert.equal((await manage(delayedToken,"DELETE",{slotIds:[slot(15,14)]})).status,200);
  const toRetry=await post(body([slot(15,15)])); assert.equal(toRetry.data.reservation.emailStatus,"pending");
  await mf.setOptions({...options,script:handlerBundle.outputFiles[0].text,bindings:emailBindings});
  assert.equal((await mf.dispatchFetch("https://api.test/test-schedule")).status,200);
  await mf.setOptions({...options,bindings:emailBindings}); db=await mf.getD1Database("RESERVATIONS");
  assert.equal((await manage(tokenOf(toRetry))).data.reservation.emailStatus,"sent");
  assert.equal((await manage(delayedToken)).data.reservation.emailStatus,"pending"); // Fully cancelled booking is not emailed later.
  await failingProvider.close();
  console.log("PASS: provider failure keeps saved bookings; cron retries pending email and skips fully cancelled bookings.");

  const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
  const clientBooking=validateBooking(body([slot(15,14)])).booking;
  assert.equal(await submissionKey(clientBooking,storage),await submissionKey(clientBooking,storage));
  assert.notEqual(await submissionKey(clientBooking,storage),await submissionKey({...clientBooking,slotIds:[slot(15,15)]},storage));
  assert(!JSON.stringify([...memory.values()]).includes("@")); assert(!JSON.stringify([...memory.values()]).includes(code));
  const savedFetch=globalThis.fetch;
  try { globalThis.fetch=async()=>new Response('{}',{status:503}); await assert.rejects(fetchAvailability("https://unavailable.test")); await assert.rejects(fetchAvailability(undefined)); globalThis.fetch=async()=>{throw new Error("offline")}; await assert.rejects(fetchAvailability("https://unavailable.test")); } finally {globalThis.fetch=savedFetch;}
  const text=formatVisitSlot({startsAt:"2026-10-12T11:00:00-07:00",endsAt:"2026-10-12T12:00:00-07:00"});
  assert(text.includes("11:00 AM")&&text.includes("12:00 PM")&&text.includes("Los Angeles"));
  console.log("PASS: stable browser retry keys, no contact/code storage, API failure is non-bookable, timezone-independent summary.");
  console.log("ALL RESERVATION TESTS PASSED. No production system or real email was used.");
} finally { await mf.dispose(); await mock.close(); await fs.rm(persist,{recursive:true,force:true}); }
