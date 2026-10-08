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
- Pulse map with public event times and device-local avatars

The GitHub Pages demo mirrors the frontend at `jayasrisng/lineup` branch `jayasri/v3`, commit `97f068b8a22091371810adac94e53af8aa171215`. It includes the v3 brand fonts, featured artwork, avatar picker, Matches, Lineup poster tools, Recharge and Pulse screens. Home defaults to dark; the other screens default to light, with a saved theme override.

This repository’s demo is frontend-only. Preferences, avatars, saved lineups and RSVP tracking stay on the device. Recharge uses 24 mock lounge hours (Monday 11 a.m.–3 p.m.; Tuesday–Friday 11 a.m.–4 p.m.) and a labeled, in-memory confirmation/cancellation preview. Use fictional details and any sample code without spaces. Refreshing clears the booking preview. Its calendar is labeled PREVIEW and tentative. No reservation, email, public presence, or management link is created. Live booking requests are blocked even if an API URL is supplied. Organizer access is disabled.

The existing GitHub Pages workflow, static export configuration and `/productai-la-tech-week/` base path are preserved. Worker code, shared backend booking validation, databases, secrets, migrations and Cloudflare settings are unchanged. Frontend preview validation is isolated in `lib/demo-visit-booking.ts`.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
NEXT_PUBLIC_BASE_PATH=/productai-la-tech-week NEXT_PUBLIC_RESERVATIONS_DEMO=true npm run build
node scripts/verify-pages-demo.mjs
```

The static export is written to `.next-build/` and can be hosted on GitHub Pages, Cloudflare Pages, Vercel, Netlify, or any static host. The Pages workflow checks this folder before uploading it.

## Event catalog

The committed databases are [`data/la-tech-week-events.json`](data/la-tech-week-events.json) and [`data/sf-tech-week-events.json`](data/sf-tech-week-events.json). See [`data/README.md`](data/README.md) and [`data/SOURCE.md`](data/SOURCE.md) for their schema, provenance, and refresh workflow.

Expired RSVP redirect tokens are no longer rendered or exported. [`data/la-event-links.json`](data/la-event-links.json) matches 704 catalog IDs to permanent official event pages and current times/status; 103 unmatched listings have a labeled official-calendar fallback. IDs remain stable for saved lineups. `node scripts/refresh-rsvp-links.mjs` reads the public official API and prints a patch for review. Apply the complete patch without truncating it; verify with `node scripts/verify-frontend.mjs`.

## Verification

```bash
npm run lint
NEXT_PUBLIC_BASE_PATH=/productai-la-tech-week NEXT_PUBLIC_RESERVATIONS_DEMO=true npm run build
node scripts/verify-pages-demo.mjs
node scripts/verify-matching.mjs
node scripts/verify-filters.mjs
node scripts/verify-frontend.mjs
node scripts/verify-visit-demo.mjs
node scripts/verify-visit-calendar.mjs
```

`scripts/verify-pages-browser.mjs` checks onboarding, filters, exports, avatars, reservation previews, disabled organizer access and six screens in both themes at desktop/mobile widths. Supply `TEST_URL` pointing to a static server mounted at the Pages base path, `PLAYWRIGHT_MODULE` pointing to an available Playwright module, and `CHROME_EXECUTABLE` when using an existing Chrome installation. It records screenshots and asserts that no backend requests occur.

## GitHub Pages

The included workflow builds and deploys `main` automatically. In the GitHub repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
