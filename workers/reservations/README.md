# Office visit Worker + D1

This Worker is intentionally independent of the static Next export. Deploy it to a Worker route such as `https://reservations.lineup.product.ai`, set `NEXT_PUBLIC_RESERVATIONS_API` during the static build, create the D1 database, replace the placeholder ID in `wrangler.toml`, and apply `schema.sql` using `wrangler d1 execute`.

The conditional `INSERT` is the capacity gate: it counts confirmed attendee rows, so `Me + one` consumes two spaces. The `Idempotency-Key` prevents retry duplicates. Validate the deployment with two simultaneous requests for the final space before enabling it. Do not use the demo seed configuration in production.
