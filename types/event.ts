export type EventItem = {
  id: string; name: string; organizer: string; shortDescription: string; description: string;
  date: string; startTime: string; endTime: string; location: string; venue: string; address: string;
  categories: string[]; eventType: string; audience: string[]; companies: string[];
  goals: string[]; roomSize: "Small" | "Medium" | "Large"; access: "Open" | "Approval" | "Invite only";
  status: "Open" | "Waitlist" | "Closed"; rsvpType: string; rsvpUrl: string;
  featured: boolean; productAIEvent: boolean; source: { name: string; url: string; verifiedAt: string };
};
export type Preferences = { identity: string[]; goals: string[]; interests: string[]; formats: string[]; locations: string[] };
