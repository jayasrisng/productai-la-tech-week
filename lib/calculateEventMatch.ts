import type { EventItem, EventMatch, Preferences } from "@/types/event";

const FORMAT_FAMILIES: Record<string,string[]> = {
  Networking:["Networking","Matchmaking","Happy Hour","Dinner","Breakfast, Brunch or Lunch"],
  Panels:["Panel / Fireside Chat"], Workshops:["Roundtable / Workshop"], Hackathons:["Hackathon"],
  Demos:["Pitch Event / Demo Day"], Parties:["Happy Hour","Experiential"], "Founder dinners":["Dinner"], "Small gatherings":["Dinner","Breakfast, Brunch or Lunch","Matchmaking"]
};
const ROLE_MAP:Record<string,string[]>={Student:["Students","Job seekers"],Founder:["Founders"],Engineer:["Engineers"],Designer:["Designers"],Investor:["Investors"],Creator:["Creators"],Product:["Product leaders"],Recruiter:["Recruiters"],Operator:["Operators"]};

function overlap(a:string[],b:string[]){return a.filter(value=>b.includes(value));}
function preferredFormats(preferences:Preferences){return [...new Set(preferences.formats.flatMap(format=>FORMAT_FAMILIES[format]||[format]))];}
function excludedFormats(preferences:Preferences){return [...new Set(preferences.excludedFormats.flatMap(format=>FORMAT_FAMILIES[format]||[format]))];}

export function calculateEventMatch(event:EventItem,p:Preferences):EventMatch {
  const reasons:string[]=[]; const cautions:string[]=[];
  const none={goals:0,formats:0,interests:0,role:0,location:0};
  if(event.access.status==="Closed"||!event.inOfficialWeek) return {score:0,reasons:[],cautions:[event.access.status==="Closed"?"Registration is closed":"Outside the official Tech Week dates"],matched:{goals:[],interests:[],audiences:[],formats:[],location:false},coverage:none};
  if(overlap(event.formats,excludedFormats(p)).length) return {score:0,reasons:[],cautions:["You asked to skip this event format"],matched:{goals:[],interests:[],audiences:[],formats:[],location:false},coverage:none};
  const goals=overlap(event.goals,p.goals); const interests=overlap(event.topics,p.interests);
  const desiredAudiences=[...new Set(p.identity.flatMap(role=>ROLE_MAP[role]||[role]))]; const audiences=overlap(event.audiences,desiredAudiences);
  const formats=overlap(event.formats,preferredFormats(p)); const location=p.locations.includes(event.neighborhood)||p.locations.includes("Anywhere if it’s worth it");
  // Coverage prevents an event with one matching tag from tying an event that answers more of a visitor's brief.
  const coverage={goals:p.goals.length?goals.length/p.goals.length:0,formats:p.formats.length?formats.length/p.formats.length:0,interests:p.interests.length?interests.length/p.interests.length:0,role:p.identity.length?audiences.length/p.identity.length:0,location:location?1:0};
  let score=coverage.goals*40+coverage.formats*25+coverage.interests*18+coverage.role*12+coverage.location*5;
  if(goals.length) reasons.push(`Catalog goal: ${goals.slice(0,2).join(" · ")}`);
  if(formats.length) reasons.push(`Catalog format: ${formats.slice(0,2).join(" · ")}`);
  if(interests.length) reasons.push(`Catalog topics: ${interests.slice(0,2).join(" · ")}`);
  if(audiences.length) reasons.push(`Listed audience: ${audiences.slice(0,2).join(" · ")}`);
  if(location) reasons.push(`In your ${event.neighborhood} plan`); else if(p.locations.length&&!p.locations.includes("Anywhere if it’s worth it")){score-=6;cautions.push("Outside your preferred neighborhoods");}
  if(event.access.status==="Waitlist"){score-=10;cautions.push("Catalog status: waitlist");}
  return {score:Math.max(0,Math.round(score)),reasons:reasons.slice(0,4),cautions,matched:{goals,interests,audiences,formats,location},coverage};
}

export function rankEvents(allEvents:EventItem[],preferences:Preferences){
  return allEvents.map(event=>({event,match:calculateEventMatch(event,preferences)})).filter(result=>result.match.score>0).sort((a,b)=>
    b.match.score-a.match.score || b.match.coverage.goals-a.match.coverage.goals || b.match.coverage.formats-a.match.coverage.formats || b.match.coverage.interests-a.match.coverage.interests || b.match.coverage.role-a.match.coverage.role ||
    (b.event.networkingStrength-a.event.networkingStrength) || (a.event.access.status==="Open"?0:1)-(b.event.access.status==="Open"?0:1) || a.event.date.localeCompare(b.event.date) || a.event.startTime.localeCompare(b.event.startTime) || a.event.id.localeCompare(b.event.id));
}
