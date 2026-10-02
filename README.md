# LA Tech Week Lineup · by Product.ai

A mobile-first LA Tech Week planner that ranks 807 official calendar listings against a visitor’s goals, interests, role, preferred event formats, exclusions, and neighborhoods. Every recommendation exposes the signals behind its score. SF data remains archived but is not used by the app.

## What works

- Progressive onboarding with device-local preferences
- Complete version-controlled SF and LA Tech Week catalogs
- Explainable ranking and hard format exclusions
- Day, neighborhood, topic, and format filters
- Personal lineup with estimated conflict and travel notes
- Manual RSVP tracking
- `.ics` calendar export and downloadable lineup image
- Mission HQ mockup with demo updates and device-local image attachments

The theme control is one sun/moon button, with dark as the default and a saved user override. Event descriptions and percentage breakdowns share one collapsed Match analysis panel. Percentages are heuristic preference coverage, not Product.ai's proprietary matching formula or attendance odds. See [`docs/preference-fit-proposal.md`](docs/preference-fit-proposal.md) for the proposed requirements/alternatives model.

This is a static frontend planner. Visitor preferences, saved lineups, RSVP tracking, and map demo posts stay in `localStorage`. Office visits are different: bookings persist in the separate Worker + D1 backend in [`workers/reservations`](workers/reservations/). Configure `NEXT_PUBLIC_RESERVATIONS_API` to connect it. Without working live availability, no hours are bookable; demo slots are not offered. The confirmed office hours are October 12–16, 2026, 11 a.m.–4 p.m. Los Angeles time. See the Worker README for migrations, secure management links, email setup, privacy approval and retention requirements.

Mission HQ is a public mockup and is not connected to an internal calendar or team data.

The GitHub Pages review site sets `NEXT_PUBLIC_RESERVATIONS_DEMO=true`. When no reservation API is configured, this enables a labeled, in-memory reservation preview: slots, guest details, confirmation and cancellation. Use fictional details. Only the exact case-sensitive code `GoldenHour08` is accepted by the preview; this browser gate is not authentication. Configure the live Worker's `REGISTRATION_CODE` secret separately before launch. Nothing is submitted, stored or reserved, and refreshing resets the preview. A configured API always takes precedence; API failures never fall back to fake confirmations. Pulse's Live feed is marked Preview until live sources are connected.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
```

The static export is written to `.next-build/` and can be hosted on GitHub Pages, Cloudflare Pages, Vercel, Netlify, or any static host. The Pages workflow checks this folder before uploading it.

## Event catalog

The committed databases are [`data/la-tech-week-events.json`](data/la-tech-week-events.json) and [`data/sf-tech-week-events.json`](data/sf-tech-week-events.json). See [`data/README.md`](data/README.md) and [`data/SOURCE.md`](data/SOURCE.md) for their schema, provenance, and refresh workflow.

Expired RSVP redirect tokens are no longer rendered or exported. [`data/la-event-links.json`](data/la-event-links.json) matches 699 catalog IDs to permanent official event pages and current times/status; 108 unmatched listings have a labeled official-calendar fallback. IDs remain stable for saved lineups. `node scripts/refresh-rsvp-links.mjs` reads the public official API and prints a patch for review. Apply the complete patch without truncating it; verify with `node scripts/verify-frontend.mjs`.

## Verification

```bash
npm run lint
npm run build
node scripts/verify-matching.mjs
node scripts/verify-frontend.mjs
npm run test:reservations
```

Reservation tests use isolated local storage and mocked email, never production. Frontend review readiness does not mean production bookings or email are launched. The static frontend can use the team's preferred database through an implementation of the existing booking API contract; no database secret belongs in the browser.

## GitHub Pages

The included workflow builds and deploys `main` automatically. In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
