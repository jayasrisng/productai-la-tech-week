import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';

const result=await build({stdin:{contents:'export {events} from "./lib/events"; export {downloadCalendar} from "./lib/calendar"; export {wrapPosterText} from "./lib/poster";',resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',alias:{'@':process.cwd()}});
const {events,downloadCalendar,wrapPosterText}=await import(`data:text/javascript,${encodeURIComponent(result.outputFiles[0].text)}`);
const mapping=JSON.parse(fs.readFileSync('data/la-event-links.json','utf8'));
assert.equal(Object.keys(mapping.links).length,mapping.matchedCount);
assert.equal(Object.keys(mapping.updates).length,mapping.matchedCount);
assert.equal(mapping.matchedCount+mapping.unmatchedIds.length,events.length);
assert(events.every(event=>event.rsvpUrl.startsWith('https://www.tech-week.com/calendar/la')));
assert(events.every(event=>!event.rsvpUrl.includes('/go/event/')));
assert.equal(events.find(event=>event.name==='T4BH HACKATHON').startTime,'18:00');
console.log(`PASS: ${mapping.matchedCount} permanent links, ${mapping.unmatchedIds.length} explicit calendar fallbacks, stable IDs and refreshed event times.`);

let calendarBlob, clicked=false;
const originalDocument=globalThis.document;
const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;
try{
  globalThis.document={createElement:()=>({click(){clicked=true;}})};
  URL.createObjectURL=blob=>{calendarBlob=blob;return 'blob:test';};
  URL.revokeObjectURL=()=>{};
  const selected=[events.find(event=>event.name==='T4BH HACKATHON'),...events.slice(2,8)];
  downloadCalendar(selected);
  const ics=await calendarBlob.text();
  assert(clicked);
  assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,selected.length);
  assert(ics.includes('DTEND;TZID=America/Los_Angeles:20261012T210000'));
  assert(!ics.includes('/go/event/'));
  for(const event of selected)assert(ics.includes(`UID:${event.id}@product.ai`));
  console.log('PASS: calendar export includes every selected event, permanent links and confirmed end times (no invented 90-minute duration).');
}finally{globalThis.document=originalDocument;URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;}

for(const text of [...events.map(event=>event.name),'W'.repeat(300),'🌴'.repeat(100)]){
  const measure=text=>[...text].reduce((sum,character)=>sum+(character==='W'?28:15),0);
  const lines=wrapPosterText(text,measure,1048);
  assert(lines.every(line=>measure(line)<=1048));
  assert.equal(lines.join('').replace(/\s/g,''),text.replace(/\s/g,''));
}
console.log('PASS: full event names wrap to measured poster width, including long single words and emoji.');
