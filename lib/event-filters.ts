import type { EventItem } from "@/types/event";

export type EventFilters = { day: string; areas: string[]; topics: string[]; formats: string[] };

// OR within a category; AND across categories. Empty categories allow everything.
export function matchesEventFilters(event: Pick<EventItem, "date" | "neighborhood" | "topics" | "formats">, filters: EventFilters) {
  return (filters.day === "All days" || event.date === filters.day)
    && (!filters.areas.length || filters.areas.includes(event.neighborhood))
    && (!filters.topics.length || filters.topics.some(topic => event.topics.includes(topic)))
    && (!filters.formats.length || filters.formats.some(format => event.formats.includes(format)));
}
