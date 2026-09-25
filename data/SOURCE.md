# LA Tech Week catalog source

The committed catalog is derived from the public LA calendar published by Tech Week by a16z. The import snapshot comes from the open-source `abishakkodi/tech-week-mcp` project, which refreshes its bundled Tech Week calendar snapshot twice daily and preserves the official Tech Week RSVP redirect links.

- Official calendar: https://www.tech-week.com/calendar/la
- Snapshot project: https://github.com/abishakkodi/tech-week-mcp
- Snapshot file: https://github.com/abishakkodi/tech-week-mcp/blob/main/techlist.cleaned.json

Official listing fields—name, host, neighborhood, date, time, topics, formats, status labels, and RSVP URL—are preserved. Product.ai’s `audiences`, `goals`, `networkingStrength`, and `summary` fields are deterministic classifications derived from those fields. They are recommendation metadata, not claims made by the event organizer.

The source dataset is third-party material and is not covered by this project’s software license. Verify material event details through the linked official listing before attending.
