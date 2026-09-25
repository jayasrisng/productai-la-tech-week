# Event catalog

`events.json` is the MVP database. It is version-controlled with the application and bundled as read-only data at build time. Every pull request that changes an event therefore creates a reviewable audit trail.

## Editing the catalog

1. Add or update an event in `events.json`.
2. Use a unique sequential `event-###` ID.
3. Keep categories, audiences, goals, formats, and neighborhoods consistent with the values already used by the planner.
4. Record the original listing in `source.url` and update `source.verifiedAt` whenever the schedule, access, or registration status is checked.
5. Run `npm run build`. The build fails when an event violates the runtime schema in `lib/events.ts`.

The seed records are deliberately labeled `Prototype seed` and use example URLs. Replace them with verified event records before calling the catalog production-ready.

## How ranking works

The browser loads the validated catalog and scores every open event against the user’s locally stored preferences. Goals receive the highest weight, followed by interests, audience, room format, and neighborhood. Closed events receive a score of zero. Location mismatch lowers a score but does not hide an unusually strong event.

No visitor preferences are committed to GitHub. They remain in that visitor’s browser via `localStorage`.
