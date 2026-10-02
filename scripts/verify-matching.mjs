import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { build } from "esbuild";

const catalogBundle=await build({entryPoints:["lib/events.ts"],bundle:true,write:false,format:"esm",platform:"node",alias:{"@":process.cwd()}});
const {events:currentLaEvents}=await import(`data:text/javascript,${encodeURIComponent(catalogBundle.outputFiles[0].text)}`);

const js = ts.transpileModule(fs.readFileSync("lib/calculateEventMatch.ts", "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { calculateEventMatch, rankEvents } = await import(`data:text/javascript,${encodeURIComponent(js)}`);
const base = { name: "", city: "la", identity: [], goals: [], interests: [], formats: [], excludedFormats: [], locations: [] };
const profiles = {
  student: { ...base, identity: ["Student"], goals: ["Find a job", "Meet recruiters"], interests: ["AI", "HR / Hiring"], formats: ["Networking", "Panels"], locations: ["Anywhere if it’s worth it"] },
  founder: { ...base, identity: ["Founder"], goals: ["Meet investors", "Raise capital"], interests: ["Fundraising / Investing", "AI"], formats: ["Founder dinners", "Networking"], locations: ["Anywhere if it’s worth it"] },
  engineer: { ...base, identity: ["Engineer"], goals: ["Learn", "Find collaborators"], interests: ["Engineering", "Infrastructure"], formats: ["Hackathons", "Workshops"], locations: ["Anywhere if it’s worth it"] },
};
for (const city of ["la", "sf"]) {
  const events = city==="la"?currentLaEvents:JSON.parse(fs.readFileSync(`data/${city}-tech-week-events.json`, "utf8")).events;
  const tops = [];
  for (const [label, preferences] of Object.entries(profiles)) {
    const ranked = rankEvents(events, preferences);
    assert(ranked.length > 0);
    assert(ranked.every(({match})=>Number.isFinite(match.percentile)&&match.percentile>=0&&match.percentile<=99.9&&match.comparisonCount===ranked.length));
    for(let i=1;i<ranked.length;i++){
      assert(ranked[i-1].match.percentile>=ranked[i].match.percentile);
      if(ranked[i-1].match.rawScore===ranked[i].match.rawScore)assert.equal(ranked[i-1].match.percentile,ranked[i].match.percentile);
    }
    for (const { event, match } of ranked) {
      assert(event.inOfficialWeek && event.access.status !== "Closed");
      assert(match.score >= 0 && match.score <= 100);
      assert(Object.values(match.coverage).every(value => value >= 0 && value <= 1));
      assert(Math.abs(match.breakdown.reduce((sum, item) => sum + item.points, 0) - match.rawScore) < 1e-8);
    }
    assert.deepEqual(rankEvents([...events].reverse(), preferences).map(x => x.event.id), ranked.map(x => x.event.id));
    tops.push(ranked.slice(0,10).map(x => x.event.id).join(","));
    console.log(city, label, ranked.slice(0,3).map(x => `${x.match.score}% ${x.event.name}`).join(" | "));
  }
  assert.equal(new Set(tops).size, 3, "Changing the brief changes recommendations");
  const exclusions = rankEvents(events, { ...profiles.engineer, excludedFormats: ["Hackathons", "Workshops"] });
  assert(exclusions.every(x => !x.event.formats.includes("Hackathon") && !x.event.formats.includes("Roundtable / Workshop")));
  assert.equal(rankEvents(events, { ...base, locations: ["Anywhere if it’s worth it"] }).length, 0);
  const sample = { ...events[0], name: "Community Dinner", inOfficialWeek: true, access: { status: "Open" }, formats: ["Networking", "Dinner", "Happy Hour"], audiences: ["Students", "Job seekers"], goals: ["Find a job", "Meet recruiters"], topics: ["AI"] };
  const overflow = calculateEventMatch(sample, { ...profiles.student, formats: ["Networking"] });
  assert.equal(overflow.coverage.formats, 1);
  assert.equal(overflow.coverage.goals, 0, "Inferred student tags must not imply recruiter evidence");
  assert(overflow.coverage.role <= 1);
  const clearer = calculateEventMatch({ ...sample, name: "Student Hiring & Recruiter Networking Night" }, profiles.student);
  assert(clearer.rawScore > calculateEventMatch(sample, profiles.student).rawScore);
}
const tied=rankEvents([1,2,3].map(n=>({...currentLaEvents[0],id:`tie-${n}`,name:"AI Workshop",inOfficialWeek:true,access:{status:"Open"},formats:["Roundtable / Workshop"],topics:["AI"]})),{...base,formats:["Workshops"]});
assert(tied.every(({match})=>match.percentile===50));
assert.equal(rankEvents([tied[0].event],{...base,formats:["Workshops"]})[0].match.percentile,50);
console.log("PASS: score bounds, evidence rules, exclusions, deterministic ordering, profile sensitivity, user-relative percentiles and tied/single-event pools.");
