# Public office booking: Worker + D1

The Next.js site remains a static export. This separate Worker handles availability, booking, management and retention; no Next.js API route is assumed to run on that deployment. The planner/matching algorithm is unchanged.

## Confirmed configuration

25 one-hour lounge slots, October 12–16, 2026, 11 a.m.–4 p.m. America/Los_Angeles (UTC−07:00). Last hour is 3–4 p.m. Capacity is 20 attendees per hour. One main attendee, optionally one guest, applies to all selected hours. Consecutive/separate hours and dates are supported. October 7 is not bookable. Phone booths are first come, first served and never reserved; attendees must leave at the end of their hours.

`migrations/0001_legacy_foundation.sql` reconciles the original example schema without reseeding demo slots. `0002_public_multi_hour_bookings.sql` disables legacy slots and creates `booking_slots`, `bookings`, `booking_attendees`, and `booking_hours`, plus all 25 confirmed slots. Existing legacy records are not silently destroyed by migration and are never returned by the new API; the retention task deletes them once 30 days old. Inspect and reconcile any unexpected legacy production records privately before applying migrations. `schema.sql` is now a pointer, not a demo seed.

## Atomicity and duplicate handling

All booking, attendee, and hour inserts run in one D1 `batch`. A database trigger checks capacity and attendee-email overlap at EACH hour insert. Failure raises an exception, rolling back the whole batch, including earlier hours and personal rows. There is no read-availability-then-unconditionally-insert race. One guest consumes two spaces at every selected hour.

The browser stores a request digest and UUID in sessionStorage, not attendee data or the registration code. Identical normalized submissions reuse that key, including network retries. The Worker stores only its hash and the request digest. Same key/different payload is 409; simultaneous identical requests recover the one saved booking. Cancellation never rebooks hours on a later retry. Different keys with ANY overlapping submitted attendee email are rejected atomically (including guest/main swaps); no additional space is consumed. Non-overlapping hours may be booked separately. After a saved booking, “Start another booking” explicitly starts a new submission key; save the old management link first. This is a duplicate guard on submitted email syntax, not verified email ownership or identity. If the first response is lost, retry exactly the same details. The client synchronously locks double clicks. If session storage is disabled, submission fails safely instead of issuing an unstable key.

## API and security

- `GET /slots`: public availability only; no attendee lists, credentials or management links. All responses are `no-store`.
- `POST /reservations`: body `{slotIds, attendees:[{name,email,linkedin}], referral, registrationCode, disclosureVersion}` plus `Idempotency-Key` UUID. Returns saved summary, email status, and private management URL. The registration code is compared EXACTLY with `REGISTRATION_CODE`, a deployment secret. It is not embedded in the frontend or committed as a production value.
- `GET /management`: `Authorization: Bearer <token>` retrieves hour/status summary.
- `DELETE /management`: same bearer header; `{slotIds:[...]}` cancels individual hours atomically; `{}` cancels all. Repeated cancellation is safe. Reservation ID alone never authorizes access. Unknown/expired links return 401. There are no public attendee/admin/export endpoints.

Management tokens are 256-bit HMAC outputs under a high-entropy deployment signing secret. Only token hashes are stored. The server can re-derive a token for email retries, without putting it in database rows. Keep `MANAGEMENT_TOKEN_SECRET` stable for the retention window; changing it without a migration makes email/idempotent link recovery unavailable. URLs use a fragment (`#manage=...`), never query parameters; the fragment is not sent to the static host or HTTP referrer. Frontend management fetches use an authorization header. Anyone with a link can cancel: treat it as a private capability. Never share/log tokens, bodies, codes, contact fields or provider response bodies. Configure the host/edge to redact Authorization and disable request-body capture. CORS allows only the explicit frontend origin; CORS is not authentication. Configure production edge rate limits on booking/code attempts before launch, since this deliberately has no account or email verification. No account, member verification, manual approval or insecure admin placeholder is implemented.

Both client and Worker validate names, email syntax (not Gmail-only), and LinkedIn `/in/` profile URL structure. Phone numbers are not collected or required; any legacy phone input is discarded during validation. The existing database phone column is retained for schema compatibility and receives an empty string for new bookings. Existing records are unchanged. LinkedIn must be HTTPS, linkedin.com/www.linkedin.com, without credentials/query/fragment. These checks do NOT verify profile existence, email ownership, membership or identity. Referral options are the two specified choices only. No promotional opt-in checkbox or verified-consent flag is generated.

## Email outbox

Resend is the configured adapter: set deployment secret `RESEND_API_KEY` and `EMAIL_FROM` (verified provider sender). A synchronous send is attempted after the database commit; provider failure never rolls back a confirmed booking. `pending` means delivery will retry; `unconfigured` explicitly means production email delivery is pending setup; `sent` means provider accepted the message, not verified inbox delivery. The scheduled handler retries up to 25 pending/unconfigured active bookings per run. The provider idempotency key is tied to booking ID. No real provider email is sent by automated tests. The main attendee receives the private management link; it manages the whole attendee group.

If email is unavailable, the saved in-page summary and private URL remain usable across refresh and another browser. Keep/copy the URL; there is deliberately no public email-lookup recovery endpoint. Email provider credentials, verified sender, provider acceptance/inbox tests and failure-monitoring remain external launch work.

## Retention and privacy approval

Every booking expires 30 days from collection (`created_at`, `expires_at` UNIX seconds). The scheduled handler runs every 15 minutes, deleting expired bookings; FK cascades remove BOTH attendees, hour/cancellation rows, submission hashes and management-token hashes. Cleanup also runs before every API request, including management, so expired links stop working immediately on access. Cancellation does not reset retention. Actual idle database deletion may lag expiry by up to the cron interval; alert on cron failures. There is no durable attendee list elsewhere in this application.

D1 Time Travel/backup copies can outlive active-row deletion (Cloudflare documents up to 30 days of restore history on paid plans, 7 on free). Thus an active record collected on day 0 and deleted on day 30 could still be in recoverable backups afterward. Do not claim physical erasure from all systems on day 30. Document the actual account backup policy, access restrictions and eventual purge before launch. Any restored database MUST run cleanup before serving traffic. Email providers, recipients' inboxes, exports or external marketing systems have separate retention; do not export attendee data into a longer-lived marketing list without an approved retention/legal basis. Admin exports are deferred.

The form discloses building/check-in use, Product.ai promotional use, active-database 30-day retention and backup/provider limitations for both attendees. **Product.ai must approve this wording, the legal basis for promotional use without opt-in, and submitting guest details before production.** This is not a determination of legal compliance. `PRIVACY_APPROVED` defaults to `false`; POST returns 503 until explicitly enabled after approval. Local synthetic verification uses a local override only; it does not constitute production approval.

## Local setup (no deployment)

Use Node 22.13+ and the repository's installed Wrangler. From the repo root:

```sh
npm run test:reservations
npx wrangler d1 migrations apply productai-visit-reservations --local --config workers/reservations/wrangler.toml
npx wrangler dev --local --port 8787 --config workers/reservations/wrangler.toml
```

Create an ignored `workers/reservations/.dev.vars` with local-only secrets: `REGISTRATION_CODE`, high-entropy `MANAGEMENT_TOKEN_SECRET` (at least 32 characters), `ALLOWED_ORIGIN=http://localhost:3000`, `MANAGEMENT_PAGE_URL=http://localhost:3000/office-visit/`, and `PRIVACY_APPROVED=true` **only for synthetic local testing**. Do not commit this file. Create ignored `.env.local` with `NEXT_PUBLIC_RESERVATIONS_API=http://localhost:8787`, then run/restart `npm run dev`. No provider credentials are needed to test saved booking/cancellation; the UI explicitly reports email unconfigured. Do not use real attendee details on a local test instance. Without a configured/working API, there are zero bookable slots and a retry notice, never demo availability.

Tests run the actual bundled Worker and D1 emulator with temporary on-disk storage, then restart it to verify persistence. They exercise all-or-nothing multi-hour writes, 20-person capacity, plus-one counting, concurrent final-space and same-key attempts, overlap handling, code/field validation, restricted origin, token-only cancellation, partial/full cancellation, cleanup (including old demo records), the launch gate, client failure/retry helpers and mocked email-provider acceptance. UI/API local tests are not production validation.

## External launch checklist — not performed here

1. Provision production D1, replace placeholder database ID, privately audit legacy data, apply versioned migrations. Do not store attendee rows or database dumps in GitHub.
2. Set `REGISTRATION_CODE` through `wrangler secret put` to the exact team-approved code; set a high-entropy `MANAGEMENT_TOKEN_SECRET`. Never prefix these with `NEXT_PUBLIC_` or put them in `[vars]`.
3. Set frontend origin and management URL (HTTPS); configure static build API URL. Enable edge abuse protection/redacted logs and cron monitoring. Verify deployed D1 atomicity again with concurrent final-space attempts.
4. Configure the email provider/verified sender and validate real delivery with approved test recipients. Finalize privacy/legal/backup retention approvals, then enable `PRIVACY_APPROVED=true`.
5. Deploy only after authorized review. No deployment, push or PR is part of this change. Secure admin/dashboard/attendance/removal/undo/export work is deferred.

References: [D1 batch transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email).
