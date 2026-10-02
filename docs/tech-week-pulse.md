# Tech Week Pulse

Current status: frontend sample feed, not a live social aggregator. The existing /mission-hq route stays compatible with saved links. No private calendars, team updates or social credentials are connected. Device-only preview posts remain device-only. Fictional attendance counts are no longer displayed.

## Proposed first release

Start with public posts from approved Alpha team and organizer accounts, plus manually submitted public links. Account handles and permission to republish are still needed; do not infer approval from access to internal Mission Control. Anonymous visitors may read the feed without signing in; publishing or moderation requires server-side authorization.

Use an external Worker ingestion service, not Next.js API routes on the static export. Scheduled polling or supported webhooks collect permitted sources; normalize posts, deduplicate by platform + source ID, filter for LA Tech Week/date relevance, and send unknown authors to a moderation queue. Store approved feed records in the chosen shared database and expose a paginated read endpoint to the static frontend. Keep tokens on the server. Add source name, original link, author and real publication time to each card; display freshness/errors honestly. Respect edits/deletions, retention, platform display requirements and rate limits. Avoid downloading/rehosting entire posts or images without permission.

X supports filtered streams by keywords, hashtags and authors, with developer credentials and pay-per-use/enterprise access. Start with periodic recent-search polling if enabled for the chosen account; do not promise instant delivery or complete coverage. LinkedIn post reading is permission-restricted, so do not assume general personal-post search; prefer approved organization access or submitted links. Public RSS/Atom feeds can support publishers that offer them. Bluesky provides public APIs and streaming options, subject to its policies. Each source needs its own adapter; there is no universal every-medium feed.

Before enabling ingestion: approved public account/feed URLs, platform/API budget and credentials, chosen backend owner, and a moderation owner/publication rule. A compact request to the team: “For Pulse, can we show your public Tech Week posts? Please send the account/feed links, nominate a moderation owner, and confirm the API/backend budget. Private channels stay excluded.”

References: [X filtered stream](https://docs.x.com/x-api/posts/filtered-stream/introduction), [LinkedIn Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api), [Bluesky firehose](https://github.com/bluesky-social/bsky-docs/blob/main/docs/advanced-guides/firehose.mdx).
