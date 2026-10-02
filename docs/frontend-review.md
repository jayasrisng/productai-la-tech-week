# Frontend review — October 1, 2026

## Implemented

- One persistent sun/moon theme control, dark by default. Removed Auto and the home sign-in sentence.
- Labeled date/neighborhood/interest/format filters, clear-filter action and distinct selected mode styling. Calendar view has its own heading. Saved count only includes LA events; archived SF IDs are not deleted.
- One initially collapsed Match analysis panel holds the catalog summary, reasons, cautions and weighted signal breakdown. Cards display a plain rank; analysis displays a user-relative, tie-aware percentile. Scoring weights/coverage calculations are unchanged. Show more reveals successive batches of ten suitable events.
- Booking date tabs retain multiple selections across the week. Just me / Me + one controls main/guest fields and summary. Name, email and LinkedIn only; phone collection removed. Neutral input borders, fixed LinkedIn prefix and disappearing username placeholder. Privacy notice removed from the visit UI at the user's request. Requested internal implementation/date copy removed.
- HQ remains an explicitly labeled mockup, with sample updates rather than claims of live people or recruiter presence. Original Product.ai brand assets remain unchanged.
- 699 catalog records now use permanent event pages from the public official Tech Week MCP API; 108 unmatched records use a labeled calendar fallback. Existing saved IDs remain stable. Matched start/end times and registration statuses were refreshed; closed/full events are excluded by the existing scorer.
- Calendar export uses confirmed end times, not an assumed 90-minute duration. Poster wraps names using measured font width and grows for the entire selected lineup.

## Verified

- Home, questionnaire, matches, lineup, office visits and HQ rendered in desktop light mode and 390px mobile light/dark modes. No horizontal overflow, broken rendered images or framework error overlay in final checks. Matches and booking form also checked at 320px.
- Theme persistence, one control, all ten analysis panels closed on entry, analysis expansion, date filtering/reset and chronological ordering.
- Multi-day selections, plus-one guest fields and LinkedIn username entry. No new reservation submitted through the form during this pass.
- Actual poster and calendar downloads inspected: both include the two saved LA events. All catalog titles plus very long words and emoji passed width-wrapping checks.
- Student/job-search, founder/investor and engineer matching regressions: score bounds, evidence rules, hard exclusions, deterministic ordering and changed answers.
- Isolated reservation regressions: persistence, duplicate retries, plus-one capacity, concurrent last-space submissions, cancellation, token access, retention and privacy launch gate. Email is mocked.
- Lint and static production build pass. Temporary rebuild errors during replacing the generated link mapping are absent in the final browser check.

## Not claimed ready

- Production reservations, production email, D1 provisioning or deployment credentials. The existing Worker API remains the local integration; the frontend can connect to another database through the same server-side API contract.
- Product.ai's proprietary matching algorithm. The current heuristic is not calibrated probability. The requirements/alternatives proposal is in `preference-fit-proposal.md`.
- All organizer RSVP destinations checked end to end. Permanent page mapping was validated; T4BH's repaired page and its RSVP button were inspected. 108 listings still need reconciliation with the current calendar.
- Final approval of promotional use/privacy wording and its placement before production launch. The visit UI notice was removed at the user's request; the production privacy gate has not been bypassed. No disclosure acceptance is established by the version field sent by the client.
- Any integration of private Mission Control calendars, contacts or team data. Nothing was deployed or pushed to production.
