# Product.ai × Tech Week

A mobile-first SF and LA Tech Week planner that ranks 2,518 official calendar listings against a visitor’s goals, interests, role, preferred event formats, exclusions, and neighborhoods. Every recommendation exposes the signals behind its score.

## What works

- Progressive onboarding with device-local preferences
- Complete version-controlled SF and LA Tech Week catalogs
- Explainable ranking and hard format exclusions
- Day, neighborhood, topic, and format filters
- Personal lineup with estimated conflict and travel notes
- Manual RSVP tracking
- `.ics` calendar export and downloadable lineup image
- Mock Product.ai Mission HQ sign-in, reservations, activity, and local updates

This is a frontend prototype. Visitor data stays in `localStorage`; there is no authentication or production booking backend.

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
