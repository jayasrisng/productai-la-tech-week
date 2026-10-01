# Mock planner matching

This is an inspectable heuristic, not Product.ai's proprietary algorithm or a calibrated success probability. Product.ai's public verification approach motivates showing evidence and uncertainty, but no Tech Week percentage specification has been provided.

Base weights: goals 40, event formats 25, interests 18, role 12, neighborhood 5. Unanswered dimensions and flexible location are excluded from the denominator. Coverage is averaged per questionnaire choice, never per expanded tag, so every dimension stays in [0,1].

Title signals support goal relevance at 1; weaker inferred goal metadata contributes 0.35. Job/recruiter goals require title evidence. A title mentioning hiring is still not confirmation of recruiter attendance. Format coverage is 1 for a matching family (0.7 for meal/party formats adjacent to a networking preference). Topic coverage is 1 for a catalog topic also named in the title, otherwise 0.8. Role relevance is 1 for a title mention, 0.3 for an inferred audience tag. Location contributes only for a selected neighborhood.

Format directness is multiplied by `0.65 + 0.35 × matching formats / all listed formats`, so a dedicated demo fits a demo preference more strongly than an event tagged with many other settings. A topic absent from the title gets `0.8 × (0.75 + 0.25 / topic count)`, giving modest preference to focused listings. These are explicit heuristic design choices, not a verified company formula.

The displayed percentage is the rounded weighted mean. Ranking uses its unrounded value, then goals, formats, interests, title evidence count, availability, date/time, and stable event ID. True ties are retained rather than adding artificial differences. Location alone and inferred role alone do not make an event suitable. Closed, out-of-week, and excluded formats never enter recommendations.

Brand reference inspected in demandio/mission-control: `src/pages/login.html` (DM Sans and zinc/violet tokens), `src/assets/octahedron-white.svg` (copied without changing geometry), and `src/assets/logo-white.png` (the original Product.ai wordmark used in the header). Only these brand assets were copied; no calendars, fixtures, contacts, or team data are included. The white wordmark is displayed black in the light theme using a CSS filter; its geometry is unchanged.
