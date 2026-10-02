import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({entryPoints:['lib/visit-calendar.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const { visitCalendar, downloadVisitCalendar } = await import(`data:text/javascript,${encodeURIComponent(bundle.outputFiles[0].text)}`);
const booking = {id:'test-booking',createdAt:1790900000,attendeeCount:2,slots:[
  {id:'first',startsAt:'2026-10-12T11:00:00-07:00',endsAt:'2026-10-12T12:00:00-07:00',status:'confirmed'},
  {id:'cancelled',startsAt:'2026-10-12T12:00:00-07:00',endsAt:'2026-10-12T13:00:00-07:00',status:'cancelled'},
  {id:'later',startsAt:'2026-10-13T15:00:00-07:00',endsAt:'2026-10-13T16:00:00-07:00',status:'confirmed'},
]};
const content = visitCalendar(booking);
assert.equal((content.match(/BEGIN:VEVENT/g)||[]).length,2);
assert.ok(content.includes('DTSTART:20261012T180000Z'));
assert.ok(content.includes('DTEND:20261013T230000Z'));
assert.ok(!content.includes('cancelled@'));
assert.ok(content.includes('you and one guest'));
assert.ok(!content.includes('#manage=') && !content.includes('ATTENDEE:'));
assert.ok(content.split('\r\n').every(line => Buffer.byteLength(line)<=75));
assert.equal(content,visitCalendar(booking),'Stable UIDs and timestamps');
assert.equal(visitCalendar({...booking,slots:[]}),null);
assert.equal(visitCalendar({...booking,slots:booking.slots.map(s=>({...s,status:'cancelled'}))}),null);
assert.ok(visitCalendar({...booking,attendeeCount:1}).includes('Reserved for you.'));
let clicked=0, revoked=0, blob;
const link={click(){clicked++;}};
globalThis.document={createElement(tag){assert.equal(tag,'a');return link;}};
URL.createObjectURL=value=>{blob=value;return 'blob:test-calendar';};
URL.revokeObjectURL=value=>{assert.equal(value,'blob:test-calendar');revoked++;};
downloadVisitCalendar(booking);
assert.equal(clicked,1);assert.equal(revoked,1);
assert.equal(link.download,'product-ai-office-visit.ics');
assert.equal(await blob.text(),content);
downloadVisitCalendar({...booking,slots:[]});assert.equal(clicked,1);
console.log('PASS: confirmed hours only, multiple dates, exact UTC times, stable identifiers, plus-one copy, empty/cancelled bookings, privacy and ICS line folding.');
