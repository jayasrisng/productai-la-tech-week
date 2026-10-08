// Public scheduled presence is restricted to the published LA Tech Week window.
export const PRESENCE_WEEK_START = Date.parse("2026-10-12T00:00:00-07:00");
export const PRESENCE_WEEK_END = Date.parse("2026-10-19T00:00:00-07:00");
export function selectedPresenceTime(value: string): number | null {
  if (!/^2026-10-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= PRESENCE_WEEK_START && time < PRESENCE_WEEK_END ? time : null;
}
