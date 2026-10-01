import { formatVisitSlot, validateBooking, type BookingInput, type BookingSummary } from "../../../lib/visit-booking";

export interface Env {
  RESERVATIONS: D1Database;
  ALLOWED_ORIGIN: string;
  MANAGEMENT_PAGE_URL: string;
  REGISTRATION_CODE?: string;
  MANAGEMENT_TOKEN_SECRET?: string;
  PRIVACY_APPROVED?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}
type BookingRow = { id: string; attendee_count: number; created_at: number; expires_at: number; email_status: BookingSummary["emailStatus"]; request_hash: string; management_hash: string };
const encoder = new TextEncoder();
const hex = (value: ArrayBuffer) => [...new Uint8Array(value)].map(n => n.toString(16).padStart(2, "0")).join("");
const hash = async (value: string) => hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));

async function managementToken(env: Env, id: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(env.MANAGEMENT_TOKEN_SECRET!), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(`visit-management-v1:${id}`)));
}
const managementUrl = (env: Env, token: string) => `${env.MANAGEMENT_PAGE_URL.split("#")[0]}#manage=${token}`;

export async function cleanup(env: Env) {
  // FK cascades delete attendee details and cancelled/confirmed associations too.
  await env.RESERVATIONS.batch([
    env.RESERVATIONS.prepare("DELETE FROM bookings WHERE expires_at <= unixepoch()"),
    env.RESERVATIONS.prepare("DELETE FROM reservations WHERE unixepoch(created_at) <= unixepoch() - 2592000"),
  ]);
}

async function summary(env: Env, row: BookingRow): Promise<BookingSummary> {
  const { results } = await env.RESERVATIONS.prepare("SELECT s.id, s.starts_at AS startsAt, s.ends_at AS endsAt, s.capacity, h.status FROM booking_hours h JOIN booking_slots s ON s.id=h.slot_id WHERE h.booking_id=? ORDER BY s.starts_at").bind(row.id).all<BookingSummary["slots"][number]>();
  return { id: row.id, attendeeCount: row.attendee_count, createdAt: row.created_at, expiresAt: row.expires_at, emailStatus: row.email_status, slots: results };
}

// Only hashes are stored. The HMAC secret can re-derive a link for the durable email outbox.
// Keep the signing secret stable throughout retention; rotate only with a migration plan.
async function sendConfirmation(env: Env, row: BookingRow): Promise<BookingSummary["emailStatus"]> {
  if (row.email_status === "sent") return "sent";
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    await env.RESERVATIONS.prepare("UPDATE bookings SET email_status='unconfigured' WHERE id=?").bind(row.id).run();
    return "unconfigured";
  }
  if (!env.MANAGEMENT_TOKEN_SECRET) return "pending";
  const token = await managementToken(env, row.id);
  if (await hash(token) !== row.management_hash) return "pending";
  const attendee = await env.RESERVATIONS.prepare("SELECT name,email FROM booking_attendees WHERE booking_id=? AND ordinal=0").bind(row.id).first<{ name: string; email: string }>();
  if (!attendee) return "pending";
  const booking = await summary(env, row);
  const active = booking.slots.filter(s => s.status === "confirmed");
  if (!active.length) return "pending";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `visit-confirmation/${row.id}` },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [attendee.email], subject: "Your Product.ai office visit booking", text: `Hi ${attendee.name},\n\nYour booking for ${booking.attendeeCount} attendee(s) was automatically confirmed at creation. Originally selected hours:\n${booking.slots.map(formatVisitSlot).join("\n")}\n\nFor current status, including any later cancellations, use your private management link below.\n\nShared lounge access. Five phone booths are first come, first served. Your reservation does not reserve a phone booth. Please leave when your reserved hours end.\n\nManage or cancel individual hours or your entire booking:\n${managementUrl(env, token)}\n\nAnyone with this private link can manage the booking. It expires 30 days after collection.\n` }),
    });
    if (!response.ok) return "pending";
    await env.RESERVATIONS.prepare("UPDATE bookings SET email_status='sent' WHERE id=?").bind(row.id).run();
    return "sent"; // Accepted by provider, not proof of inbox delivery.
  } catch { return "pending"; } // Never log provider bodies, contacts, codes, or tokens.
}

async function retryEmails(env: Env) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !env.MANAGEMENT_TOKEN_SECRET) return;
  const { results } = await env.RESERVATIONS.prepare("SELECT * FROM bookings WHERE email_status<>'sent' AND expires_at>unixepoch() AND EXISTS (SELECT 1 FROM booking_hours h WHERE h.booking_id=bookings.id AND h.status='confirmed') ORDER BY created_at LIMIT 25").all<BookingRow>();
  for (const row of results) await sendConfirmation(env, row);
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil((async () => { await cleanup(env); await retryEmails(env); })());
  },
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const cors: Record<string, string> = origin === env.ALLOWED_ORIGIN ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", ...cors } });
    if (origin && origin !== env.ALLOWED_ORIGIN) return json({ error: "Origin not allowed." }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS", "Access-Control-Allow-Headers": "content-type,idempotency-key,authorization" } });
    const url = new URL(request.url);
    try {
      await cleanup(env);
      if (request.method === "GET" && url.pathname === "/slots") {
        const { results } = await env.RESERVATIONS.prepare("SELECT s.id,s.starts_at AS startsAt,s.ends_at AS endsAt,s.capacity,s.capacity-(SELECT COALESCE(SUM(b.attendee_count),0) FROM booking_hours h JOIN bookings b ON b.id=h.booking_id WHERE h.slot_id=s.id AND h.status='confirmed') AS remaining FROM booking_slots s WHERE s.active=1 ORDER BY s.starts_at").all();
        return json({ slots: results });
      }
      if (url.pathname === "/management" && ["GET", "DELETE"].includes(request.method)) {
        const token = request.headers.get("Authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
        if (!token) return json({ error: "A valid private management link is required." }, 401);
        const row = await env.RESERVATIONS.prepare("SELECT * FROM bookings WHERE management_hash=? AND expires_at>unixepoch()").bind(await hash(token)).first<BookingRow>();
        if (!row) return json({ error: "Management link is invalid or expired." }, 401);
        if (request.method === "DELETE") {
          const body = await readBody(request) as { slotIds?: unknown };
          const slotIds = body.slotIds;
          if (slotIds !== undefined && (!Array.isArray(slotIds) || !slotIds.length || slotIds.length > 25 || slotIds.some(id => typeof id !== "string") || new Set(slotIds).size !== slotIds.length)) return json({ error: "Select valid hours to cancel." }, 400);
          const current = await summary(env, row);
          const ids = slotIds === undefined ? current.slots.map(s => s.id) : slotIds as string[];
          if (ids.some(id => !current.slots.some(s => s.id === id))) return json({ error: "That hour is not in this booking." }, 400);
          await env.RESERVATIONS.batch(ids.map(id => env.RESERVATIONS.prepare("UPDATE booking_hours SET status='cancelled',cancelled_at=unixepoch() WHERE booking_id=? AND slot_id=? AND status='confirmed'").bind(row.id, id)));
        }
        return json({ reservation: await summary(env, row) });
      }
      if (request.method === "POST" && url.pathname === "/reservations") {
        if (env.PRIVACY_APPROVED !== "true") return json({ error: "Registration is unavailable pending Product.ai privacy approval." }, 503);
        if (!env.REGISTRATION_CODE || !env.MANAGEMENT_TOKEN_SECRET || env.MANAGEMENT_TOKEN_SECRET.length < 32 || !env.MANAGEMENT_PAGE_URL) return json({ error: "Booking configuration is incomplete." }, 503);
        const key = request.headers.get("Idempotency-Key");
        if (!key || !/^[a-f0-9-]{36}$/i.test(key)) return json({ error: "A stable submission key is required." }, 400);
        const validation = validateBooking(await readBody(request));
        if (!validation.booking) return json({ error: validation.errors.join(" ") }, 400);
        const booking: BookingInput = validation.booking;
        // Hash equality avoids length-dependent direct comparisons. No normalization of this secret.
        if (await hash(booking.registrationCode) !== await hash(env.REGISTRATION_CODE)) return json({ error: "The registration code is incorrect." }, 403);
        const { registrationCode: _code, ...canonical } = booking;
        void _code;
        const requestHash = await hash(JSON.stringify(canonical));
        const keyHash = await hash(key);
        const findExisting = () => env.RESERVATIONS.prepare("SELECT * FROM bookings WHERE idempotency_hash=?").bind(keyHash).first<BookingRow>();
        const replay = async (row: BookingRow) => {
          if (row.request_hash !== requestHash) return json({ error: "This submission key belongs to different booking details. Start a new submission." }, 409);
          const token = await managementToken(env, row.id);
          if (await hash(token) !== row.management_hash) return json({ error: "Management configuration changed. Contact Product.ai." }, 503);
          row.email_status = await sendConfirmation(env, row);
          return json({ reservation: await summary(env, row), managementUrl: managementUrl(env, token) });
        };
        const existing = await findExisting();
        if (existing) return replay(existing);
        const id = crypto.randomUUID();
        const token = await managementToken(env, id);
        const statements = [env.RESERVATIONS.prepare("INSERT INTO bookings(id,attendee_count,referral,disclosure_version,idempotency_hash,request_hash,management_hash) VALUES(?,?,?,?,?,?,?)").bind(id, booking.attendees.length, booking.referral, booking.disclosureVersion, keyHash, requestHash, await hash(token))];
        booking.attendees.forEach((a, index) => statements.push(env.RESERVATIONS.prepare("INSERT INTO booking_attendees(booking_id,ordinal,name,email,phone,linkedin) VALUES(?,?,?,?,?,?)").bind(id, index, a.name, a.email, a.phone, a.linkedin)));
        booking.slotIds.forEach(slot => statements.push(env.RESERVATIONS.prepare("INSERT INTO booking_hours(booking_id,slot_id) VALUES(?,?)").bind(id, slot)));
        try { await env.RESERVATIONS.batch(statements); }
        catch (error) {
          // A simultaneous same-key request may have won the UNIQUE constraint.
          const won = await findExisting();
          if (won) return replay(won);
          const internal = error instanceof Error ? error.message : "";
          if (internal.includes("ATTENDEE_OVERLAP")) return json({ error: "One of these email addresses already has a booking in a selected hour. Use the original management link to review it; no extra spaces were reserved." }, 409);
          if (internal.includes("SLOT_CAPACITY")) return json({ error: "One or more hours no longer have enough space. Nothing was reserved. Refresh availability and choose again." }, 409);
          return json({ error: "Booking could not be saved. Retry with the same submission details." }, 503);
        }
        const row = await findExisting();
        if (!row) return json({ error: "Booking status is unavailable. Retry with the same submission details." }, 503);
        row.email_status = await sendConfirmation(env, row);
        return json({ reservation: await summary(env, row), managementUrl: managementUrl(env, token) }, 201);
      }
      return json({ error: "Not found." }, 404);
    } catch (error) {
      if (error instanceof InvalidBody) return json({ error: "Send a valid JSON booking body no larger than 16 KB." }, 400);
      return json({ error: "Booking service is temporarily unavailable. Nothing new is shown as confirmed; retry the same submission." }, 503);
    }
  },
} satisfies ExportedHandler<Env>;

class InvalidBody extends Error {}
async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get("Content-Type")?.includes("application/json") || Number(request.headers.get("Content-Length")) > 16384) throw new InvalidBody();
  const text = await request.text();
  if (encoder.encode(text).byteLength > 16384) throw new InvalidBody();
  try { const body = JSON.parse(text); if (!body || typeof body !== "object" || Array.isArray(body)) throw new InvalidBody(); return body; } catch { throw new InvalidBody(); }
}
