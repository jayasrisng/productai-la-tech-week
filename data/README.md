# Event catalog

`la-tech-week-events.json` and `sf-tech-week-events.json` are the MVP databases. They contain 807 LA listings and 1,711 SF listings, are version-controlled with the application, and are bundled as read-only data at build time. Every pull request that changes an event creates a reviewable audit trail.

## Editing the catalog

1. Download the maintained `techlist.cleaned.json` snapshot described in `SOURCE.md`.
2. Save the snapshot to `/tmp/techlist.cleaned.json` and run `npm run data:import`.
3. Review the catalog diff, especially additions, removals, and registration-status changes.
4. Run the production build. It fails when the catalog violates the runtime schema in `lib/events.ts`.

The import preserves official listing data and links. Audience, goal, networking-strength, and summary fields are deterministic classifications used for recommendations; their provenance is declared on every record.

## How ranking works

The browser loads the validated catalog and scores every open event against the user’s locally stored preferences. Goals receive the highest weight, followed by interests, audience, room format, and neighborhood. Closed events receive a score of zero. Location mismatch lowers a score but does not hide an unusually strong event.

No visitor preferences are committed to GitHub. They remain in that visitor’s browser via `localStorage`.
