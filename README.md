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
- Neighborhood Live map with location-filtered, event-tagged community updates and local image attachments

This is a static frontend planner. Visitor preferences, saved lineups, RSVP tracking, and map demo posts stay in `localStorage`. Office visits are different: bookings persist in the separate Worker + D1 backend in [`workers/reservations`](workers/reservations/). Configure `NEXT_PUBLIC_RESERVATIONS_API` to connect it. Without working live availability, no hours are bookable; demo slots are not offered. The confirmed office hours are October 12–16, 2026, 11 a.m.–4 p.m. Los Angeles time. See the Worker README for migrations, secure management links, email setup, privacy approval and retention requirements.

Mission HQ is a public mockup and is not connected to an internal calendar or team data.

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

The static export is written to `out/` and can be hosted on GitHub Pages, Cloudflare Pages, Vercel, Netlify, or any static host.

## Event catalog

The committed databases are [`data/la-tech-week-events.json`](data/la-tech-week-events.json) and [`data/sf-tech-week-events.json`](data/sf-tech-week-events.json). See [`data/README.md`](data/README.md) and [`data/SOURCE.md`](data/SOURCE.md) for their schema, provenance, and refresh workflow.

## GitHub Pages

The included workflow builds and deploys `main` automatically. In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
