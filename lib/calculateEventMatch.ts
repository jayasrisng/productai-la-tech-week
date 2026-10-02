import type { EventItem, EventMatch, Preferences } from "@/types/event";

const FORMAT_FAMILIES: Record<string,string[]> = {
  Networking:["Networking","Matchmaking","Happy Hour","Dinner","Breakfast, Brunch or Lunch"],
  Panels:["Panel / Fireside Chat"], Workshops:["Roundtable / Workshop"], Hackathons:["Hackathon"],
  Demos:["Pitch Event / Demo Day"], Parties:["Happy Hour","Experiential"], "Founder dinners":["Dinner"], "Small gatherings":["Dinner","Breakfast, Brunch or Lunch","Matchmaking"]
};
const ROLE_MAP:Record<string,string[]>={Student:["Students","Job seekers"],Founder:["Founders"],Engineer:["Engineers"],Designer:["Designers"],Investor:["Investors"],Creator:["Creators"],Product:["Product leaders"],Recruiter:["Recruiters"],Operator:["Operators"]};

function overlap(a:string[],b:string[]){return a.filter(value=>b.includes(value));}
function excludedFormats(preferences:Preferences){return [...new Set(preferences.excludedFormats.flatMap(format=>FORMAT_FAMILIES[format]||[format]))];}
const GOAL_EVIDENCE:Record<string,RegExp>={
  "Find a job":/\b(job|jobs|career\w*|hiring|recruit\w*|intern\w*|talent)\b/i,
  "Meet recruiters":/\b(recruit\w*|hiring|talent acquisition|job fair)\b/i,
  "Meet founders":/\b(founder\w*|startup\w*|entrepreneur\w*|cofounder\w*)\b/i,
  "Meet investors":/\b(investor\w*|venture|vc\w*|angel\w*|capital|fundrais\w*)\b/i,
  "Raise capital":/\b(fundrais\w*|pitch\w*|investor\w*|venture|capital)\b/i,
  "Find collaborators":/\b(cofounder\w*|collaborat\w*|hackathon|buildathon|matchmaking|builders)\b/i,
  "Learn":/\b(workshop|panel|fireside|learn\w*|roundtable|lab|clinic|summit|talk)\b/i,
  "Explore new technology":/\b(ai|tech\w*|demo\w*|hardware|robot\w*|infra\w*|engineer\w*|software|agent\w*|build\w*|biotech|science)\b/i,
  "Have fun":/\b(party|social|happy hour|dinner|brunch|run|games?|music|drinks)\b/i,
  "Build relationships":/\b(network\w*|mixer|meetup|social|happy hour|dinner|connect|coffee)\b/i
};
const ROLE_EVIDENCE:Record<string,RegExp>={Student:/\b(student\w*|university|college|campus)\b/i,Founder:/\b(founder\w*|startup\w*|entrepreneur\w*)\b/i,Engineer:/\b(engineer\w*|developer\w*|infra\w*|hackathon|software|technical)\b/i,Designer:/\b(design\w*|creative)\b/i,Investor:/\b(investor\w*|venture|vc\w*|angel\w*)\b/i,Creator:/\b(creator\w*|creative|filmmak\w*)\b/i,Product:/\b(product)\b/i,Recruiter:/\b(recruit\w*|hiring|talent)\b/i,Operator:/\b(operator\w*|operations|gtm)\b/i};
export const MATCH_WEIGHTS={goals:40,formats:25,interests:18,role:12,location:5};
const average=(values:number[])=>values.length?values.reduce((sum,n)=>sum+n,0)/values.length:0;

export function calculateEventMatch(event:EventItem,p:Preferences):EventMatch {
  const reasons:string[]=[],cautions:string[]=[];
  const coverage={goals:0,formats:0,interests:0,role:0,location:0};
  const matched:EventMatch["matched"]={goals:[],interests:[],audiences:[],formats:[],location:false};
  const reject=(reason:string):EventMatch=>({score:0,rawScore:0,eligible:false,evidenceStrength:0,reasons:[],cautions:[reason],matched,coverage,breakdown:[]});
  if(event.access.status==="Closed"||!event.inOfficialWeek)return reject(event.access.status==="Closed"?"Registration is closed":"Outside official Tech Week dates");
  if(overlap(event.formats,excludedFormats(p)).length)return reject("You asked to skip this event format");
  let evidenceStrength=0;
  const goals=[...new Set(p.goals)],formats=[...new Set(p.formats)],interests=[...new Set(p.interests)],roles=[...new Set(p.identity)];
  // Title relevance is evidence of the subject, never proof of attendees or outcomes.
  coverage.goals=average(goals.map(goal=>{if(GOAL_EVIDENCE[goal]?.test(event.name)){matched.goals.push(goal);evidenceStrength++;reasons.push(`For “${goal}”: related terms in “${event.name}”. Attendees are not confirmed.`);return 1}if(goal==="Find a job"||goal==="Meet recruiters")return 0;if(event.goals.includes(goal)){matched.goals.push(goal);reasons.push(`Possible ${goal.toLowerCase()} fit, not confirmed by the organizer.`);return .35}return 0}));
  coverage.formats=average(formats.map(format=>{const values=overlap(event.formats,FORMAT_FAMILIES[format]||[format]);if(!values.length)return 0;matched.formats.push(...values);evidenceStrength++;reasons.push(`Your ${format} choice matches ${values.join(" · ")}.`);const directness=format==="Networking"&&!values.some(value=>["Networking","Matchmaking"].includes(value))?.7:1;return directness*(.65+.35*values.length/event.formats.length)}));
  coverage.interests=average(interests.map(interest=>{if(!event.topics.includes(interest))return 0;matched.interests.push(interest);const direct=event.name.toLowerCase().includes(interest.toLowerCase());if(direct)evidenceStrength++;reasons.push(`Listed topic: ${interest}${direct?"; also named in the title":`; one of ${event.topics.length} listed topics`}.`);return direct?1:.8*(.75+.25/event.topics.length)}));
  coverage.role=average(roles.map(role=>{if(ROLE_EVIDENCE[role]?.test(event.name)){matched.audiences.push(role);evidenceStrength++;reasons.push(`The title mentions your ${role.toLowerCase()} role; attendance is unverified.`);return 1}if(overlap(event.audiences,ROLE_MAP[role]||[role]).length){matched.audiences.push(role);reasons.push(`Possible ${role.toLowerCase()} relevance, audience not confirmed by the organizer.`);return .3}return 0}));
  matched.formats=[...new Set(matched.formats)];
  const flexible=p.locations.includes("Anywhere if it’s worth it");matched.location=p.locations.includes(event.neighborhood);coverage.location=matched.location?1:0;
  if(matched.location)reasons.push(`Listed neighborhood: ${event.neighborhood}, one of your choices.`);else if(p.locations.length&&!flexible)cautions.push(`Outside your preferred neighborhoods: ${event.neighborhood}.`);
  if(goals.includes("Meet recruiters"))cautions.push("Recruiter attendance is not verified.");
  if(event.access.status==="Waitlist")cautions.push("Catalog status: waitlist. Check the official RSVP page.");
  const active={goals:goals.length>0,formats:formats.length>0,interests:interests.length>0,role:roles.length>0,location:p.locations.length>0&&!flexible};
  const keys=Object.keys(MATCH_WEIGHTS) as (keyof typeof coverage)[];
  const totalWeight=keys.reduce((sum,key)=>sum+(active[key]?MATCH_WEIGHTS[key]:0),0);
  const breakdown=keys.filter(key=>active[key]).map(key=>({key,weight:MATCH_WEIGHTS[key]/totalWeight*100,coverage:coverage[key],points:coverage[key]*MATCH_WEIGHTS[key]/totalWeight*100}));
  const rawScore=breakdown.reduce((sum,item)=>sum+item.points,0);
  const eligible=coverage.goals>0||coverage.formats>0||coverage.interests>0||coverage.role===1;
  return {score:Math.round(rawScore),rawScore,eligible,evidenceStrength,reasons,cautions,matched,coverage,breakdown};
}

export function rankEvents(allEvents:EventItem[],preferences:Preferences){
  return allEvents.map(event=>({event,match:calculateEventMatch(event,preferences)})).filter(result=>result.match.eligible).sort((a,b)=>
    b.match.rawScore-a.match.rawScore || b.match.coverage.goals-a.match.coverage.goals || b.match.coverage.formats-a.match.coverage.formats || b.match.coverage.interests-a.match.coverage.interests || b.match.evidenceStrength-a.match.evidenceStrength ||
    Number(a.event.access.status==="Waitlist")-Number(b.event.access.status==="Waitlist") || a.event.date.localeCompare(b.event.date) || a.event.startTime.localeCompare(b.event.startTime) || a.event.id.localeCompare(b.event.id));
}
