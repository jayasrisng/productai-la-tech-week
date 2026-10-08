import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({entryPoints:['lib/visit-demo.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {demoVisitSlots,demoReservation} = await import(`data:text/javascript,${encodeURIComponent(bundle.outputFiles[0].text)}`);
const slots = demoVisitSlots();
assert.equal(slots.length,24);
assert.equal(new Set(slots.map(s=>s.id)).size,24);
assert(!slots.some(s=>s.id==='la-2026-10-12-15'));
assert.ok(slots.every(s=>Date.parse(s.endsAt)-Date.parse(s.startsAt)===3600000));
const preview = demoReservation(slots,[slots[0].id,slots[6].id],2,'synthetic-preview-only');
assert.equal(preview.attendeeCount,2);
assert.equal(preview.slots.length,2);
assert.equal(preview.id,'demo-preview');
assert.ok(!('attendees' in preview));
assert.equal(slots[0].remaining,20,'No shared capacity is reserved by the preview');
assert.throws(()=>demoReservation(slots,[],1,'synthetic-preview-only'));
assert.throws(()=>demoReservation([{...slots[0],remaining:1}],[slots[0].id],2,'synthetic-preview-only'));
// Demo performs syntax checks, never a secret/access check.
for (const code of ['', 'with spaces', ' trailing', 'trailing ', 'x'.repeat(129)]) {
  assert.throws(()=>demoReservation(slots,[slots[0].id],1,code),/registration code without spaces/);
}
for (const code of ['any-valid-synthetic-input','LOCAL-test-only']) {
  assert.equal(demoReservation(slots,[slots[0].id],1,code).id,'demo-preview');
}
console.log('PASS: demo hours, plus-one preview, no contact retention or shared capacity mutation.');
