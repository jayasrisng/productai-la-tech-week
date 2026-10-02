# Preference fit: proposed next matching model

Status: proposal, not the implemented algorithm. Current weights remain goals 40, formats 25, interests 18, role 12, location 5; percentages represent weighted coverage, not probabilities.

The intended model should distinguish requirements from alternatives:

- Hard exclusions, dates and closed registration are eligibility gates.
- Within a category, selected interests and acceptable formats are alternatives (OR), not a checklist that every event must satisfy. One strongly evidenced acceptable option can fully satisfy that category.
- Across required categories, satisfy the whole brief (AND). Separate must-have goals from nice-to-haves in the questionnaire rather than assuming all goals are interchangeable.
- “Any location” satisfies location without a penalty. An attendee's role is context, not a requirement that an event title contain “student.” A general-public event can be appropriate for students; an explicit founder-only restriction cannot.
- Use the full organizer description for factual evidence. An event called a hackathon establishes the format. “Founders judging” needs organizer text naming those judges or their roles. An inferred audience tag does not establish attendance or eligibility.
- Show 100% only when all applicable requirements are satisfied with sufficient evidence. Missing information is “not confirmed,” not a made-up fact. Display evidence completeness separately from preference fit.
- Within the same displayed fit, order by required-goal coverage, format relevance, strength of evidence, optional interests, registration status, date/time and stable event ID. Do not add random variation to percentages.

Example: a student wants hackathons, to meet founders, any LA neighborhood, and AI or engineering. A student-eligible engineering hackathon with explicitly listed founder judges can be 100% preference fit. Merely inferring founders from a startup-themed title cannot.

Before implementing, confirm which goals are must-haves and which are alternatives. The official Tech Week public MCP `get_event` tool supplies full organizer descriptions; collect that evidence before replacing the title-based scorer.
