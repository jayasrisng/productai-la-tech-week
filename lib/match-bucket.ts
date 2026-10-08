import type { EventMatch } from "@/types/event";

// Presentation only: the scoring engine, exclusions, ties and ordering stay intact.
export function matchBucket(match: Pick<EventMatch,"percentile">) {
  const value=match.percentile;
  if(value===undefined)return "Based on your preferences";
  if(value>=80)return "Excellent";
  if(value>=60)return "Strong";
  return "Good";
}
