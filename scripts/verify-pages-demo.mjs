import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';

const result = await build({stdin:{contents:'export * from "./lib/visit-client"; export * from "./lib/visit-demo"; export {visitCalendar} from "./lib/visit-calendar";',resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',alias:{'@':process.cwd()}});
const demo = await import(`data:text/javascript,${encodeURIComponent(result.outputFiles[0].text)}`);
const originalFetch = globalThis.fetch;
globalThis.fetch = () => { throw new Error('The Pages demo must never contact a backend.'); };
try {
  const slots = await demo.fetchAvailability('https://unused.invalid/api');
  assert.equal(slots.length,24);
  assert(!slots.some(slot=>slot.id==='la-2026-10-12-15'));
  assert(slots.every(slot=>slot.capacity===20&&slot.remaining===20));
  assert.deepEqual(await demo.fetchPublicPresence('https://unused.invalid/api'),[]);
  for(const method of ['POST','GET','DELETE'])await assert.rejects(demo.bookingRequest('https://unused.invalid/api','/reservations',{method}),/unavailable/);
  await assert.rejects(demo.submissionKey({},{}),/unavailable/);
  const booking = demo.demoReservation(slots,[slots[0].id],2,'DemoCode');
  assert.equal(booking.id,'demo-preview');
  assert.equal(booking.publicPresence,false);
  const calendar=demo.visitCalendar(booking);
  assert(calendar.includes('STATUS:TENTATIVE'));
  assert(calendar.includes('SUMMARY:PREVIEW'));
  assert(calendar.includes('No hours are reserved'));
} finally { globalThis.fetch = originalFetch; }
console.log('PASS: 24 mock hours, in-memory confirmation, tentative calendar, empty public presence, and blocked booking/management requests even when given an API URL.');

const out='.next-build';
const prefix='/productai-la-tech-week/';
for(const route of ['', 'plan/', 'events/', 'lineup/', 'office-visit/', 'mission-hq/', 'admin/registrations/']) {
  const html=fs.readFileSync(`${out}/${route}index.html`,'utf8');
  assert(html.includes(prefix+'_next/'),`${route} missing Pages assets`);
  for(const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[^" ]*)"/g)) {
    const url=match[1];
    assert(url.startsWith(prefix),`${route}: URL escapes Pages base path: ${url}`);
    const local=decodeURIComponent(url.slice(prefix.length));
    assert(fs.existsSync(`${out}/${local}`),`${route}: missing exported asset ${local}`);
  }
}
for(const manifest of ['data/event-artwork.json']) {
  for(const entry of Object.values(JSON.parse(fs.readFileSync(manifest,'utf8'))))assert(fs.existsSync(`public${entry.src}`),`Missing artwork ${entry.src}`);
}
console.log('PASS: all seven demo routes export under the existing Pages path, all initial local links/assets resolve, and all event posters exist.');
