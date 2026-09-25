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
  if(event.access.status==="Closed"||!event.inOfficialWeek) return {score:0,reasons:[],cautions:[event.access.status==="Closed"?"Registration is closed":"Outside the official LA week"],matched:{goals:[],interests:[],audiences:[],formats:[],location:false}};
  if(overlap(event.formats,excludedFormats(p)).length) return {score:0,reasons:[],cautions:["You asked to skip this event format"],matched:{goals:[],interests:[],audiences:[],formats:[],location:false}};
  const goals=overlap(event.goals,p.goals); const interests=overlap(event.topics,p.interests);
  const desiredAudiences=[...new Set(p.identity.flatMap(role=>ROLE_MAP[role]||[role]))]; const audiences=overlap(event.audiences,desiredAudiences);
  const formats=overlap(event.formats,preferredFormats(p)); const location=p.locations.includes(event.neighborhood)||p.locations.includes("Anywhere if it’s worth it");
  let score=5;
  if(goals.length){score+=Math.min(30,12+goals.length*6);reasons.push(`${goals[0]} is a strong outcome match`);}
  if(interests.length){score+=Math.min(20,8+interests.length*5);reasons.push(`Focused on ${interests.slice(0,2).join(" + ")}`);}
  if(audiences.length){score+=15;reasons.push(`Built for ${audiences.slice(0,2).join(" and ").toLowerCase()}`);}
  if(formats.length){score+=14;reasons.push(`${formats[0]} matches the kind of room you want`);}
  if(location){score+=8;reasons.push(`Inside your ${event.neighborhood} plan`);} else if(p.locations.length){score-=7;cautions.push("Outside your preferred neighborhoods");}
  if((p.goals.includes("Find a job")||p.goals.includes("Meet recruiters")||p.goals.includes("Build relationships"))&&event.networkingStrength>=4){score+=8;reasons.push("High opportunity for person-to-person networking");}
  if(event.access.status==="Waitlist"){score-=8;cautions.push("Currently marked waitlist");}
  return {score:Math.max(0,Math.min(99,score)),reasons:reasons.slice(0,4),cautions,matched:{goals,interests,audiences,formats,location}};
}

export function rankEvents(allEvents:EventItem[],preferences:Preferences){
  return allEvents.map(event=>({event,match:calculateEventMatch(event,preferences)})).filter(result=>result.match.score>0).sort((a,b)=>b.match.score-a.match.score||a.event.date.localeCompare(b.event.date)||a.event.startTime.localeCompare(b.event.startTime));
}
