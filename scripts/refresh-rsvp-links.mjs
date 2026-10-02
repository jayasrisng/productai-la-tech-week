// Public, read-only Tech Week MCP API. Print a patch; never overwrite the catalog.
import fs from 'node:fs';
const catalog = JSON.parse(fs.readFileSync('data/la-tech-week-events.json', 'utf8'));
const official = [];
for (let page = 1; ; page++) {
  const response = await fetch('https://www.tech-week.com/api/mcp', {
    method: 'POST', headers: {'Content-Type':'application/json', Accept:'application/json, text/event-stream'},
    body: JSON.stringify({jsonrpc:'2.0', id:page, method:'tools/call', params:{name:'search_events', arguments:{city:['la'],limit:75,page}}})
  });
  if (!response.ok) throw Error(`Official API: ${response.status}`);
  const result = (await response.json()).result;
  if (result?.isError || !Array.isArray(result?.structuredContent?.events)) throw Error('Unexpected official API response');
  official.push(...result.structuredContent.events);
  if (!result.structuredContent.hasMore) break;
  if (page > 30) throw Error('Unexpected page count');
}
const normalize = value => value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,'');
const links = {};
const updates = {};
const unmatched = [];
for (const event of catalog.events) {
  const candidates = official.filter(current => current.date === event.date && normalize(current.name) === normalize(event.name));
  const exact = candidates.filter(current => current.startTime === event.startTime);
  const matches = exact.length ? exact : candidates;
  if (matches.length !== 1) { unmatched.push(event.id); continue; }
  const match = matches[0];
  const url = new URL(match.eventUrl);
  if (url.origin !== 'https://www.tech-week.com' || !url.pathname.startsWith('/calendar/la/events/')) throw Error('Unexpected link domain');
  url.search = '';
  links[event.id] = url.href;
  updates[event.id] = [match.startTime, match.endTime, match.endDate, match.registration];
}
const output = JSON.stringify({source:'https://www.tech-week.com/api/mcp',checkedAt:new Date().toISOString(),officialEventCount:official.length,matchedCount:Object.keys(links).length,unmatchedIds:unmatched,links,updates},null,2);
console.error(`Matched ${Object.keys(links).length}/${catalog.events.length}; ${unmatched.length} require calendar fallback.`);
const file=`${process.cwd()}/data/la-event-links.json`;
const previous=fs.existsSync(file)?fs.readFileSync(file,'utf8').trimEnd():null;
const header=previous===null?`*** Add File: ${file}`:`*** Update File: ${file}\n@@\n${previous.split('\n').map(line=>'-'+line).join('\n')}`;
console.log(`*** Begin Patch\n${header}\n${output.split('\n').map(line=>'+'+line).join('\n')}\n*** End Patch`);
