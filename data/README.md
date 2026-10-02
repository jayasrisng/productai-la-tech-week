# Event catalog

`la-tech-week-events.json` and `sf-tech-week-events.json` are the MVP databases. They contain 807 LA listings and 1,711 SF listings, are version-controlled with the application, and are bundled as read-only data at build time. Every pull request that changes an event creates a reviewable audit trail.

## Editing the catalog

1. Download the maintained `techlist.cleaned.json` snapshot described in `SOURCE.md`.
2. Save the snapshot to `/tmp/techlist.cleaned.json` and run `npm run data:import`.
3. Review the catalog diff, especially additions, removals, and registration-status changes.
4. Run the production build. It fails when the catalog violates the runtime schema in `lib/events.ts`.

The import preserves official listing data and links. Audience, goal, networking-strength, and summary fields are deterministic classifications used for recommendations; their provenance is declared on every record.

## How ranking works

The browser scores eligible events against locally saved preferences. Goals receive the highest weight, followed by event formats, interests, role and neighborhood. Closed, out-of-week and excluded-format events never enter recommendations. Flexible location removes that dimension from the denominator. See `docs/matching.md` for the implemented formula and `docs/preference-fit-proposal.md` for the proposed alternative.

The original RSVP redirect tokens expired. `la-event-links.json` supplements the snapshot with permanent official event-page URLs, current start/end times and registration status from the public Tech Week MCP API. Unmatched events use a clearly labeled official-calendar fallback, not a purported RSVP URL. Refresh with `scripts/refresh-rsvp-links.mjs`, review its printed patch and run `scripts/verify-frontend.mjs` to check mapping completeness. Saved event IDs are unchanged.

No visitor preferences are committed to GitHub. They remain in that visitor’s browser via `localStorage`.
