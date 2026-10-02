import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({entryPoints:['lib/event-filters.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {matchesEventFilters}=await import(`data:text/javascript,${encodeURIComponent(bundle.outputFiles[0].text)}`);
const empty={day:'All days',areas:[],topics:[],formats:[]};
const events=[
  {date:'2026-10-12',neighborhood:'Downtown',topics:['AI'],formats:['Hackathon']},
  {date:'2026-10-13',neighborhood:'Venice',topics:['Hardware','AI'],formats:['Networking']},
  {date:'2026-10-12',neighborhood:'Santa Monica',topics:['Hardware'],formats:['Dinner']},
];
const count=filters=>events.filter(e=>matchesEventFilters(e,{...empty,...filters})).length;
assert.equal(count({}),3);
assert.equal(count({areas:['Downtown','Venice']}),2);
assert.equal(count({topics:['AI','Hardware']}),3);
assert.equal(count({formats:['Hackathon','Networking']}),2);
assert.equal(count({areas:['Downtown','Venice'],topics:['Hardware'],formats:['Networking','Hackathon']}),1);
assert.equal(count({areas:['Downtown'],topics:['Hardware']}),0);
assert.equal(count({day:'2026-10-12',topics:['Hardware']}),1);
assert.equal(count({formats:['Unknown']}),0);
const filtered=events.filter(e=>matchesEventFilters(e,{...empty,topics:['AI']}));
assert.deepEqual(filtered,[events[0],events[1]],'Filtering preserves incoming preference order');
assert.deepEqual(events[0].topics,['AI'],'No catalog mutation');
console.log('PASS: multi-selection unions, cross-category intersections, date restriction, empty/reset filters, no-match case and stable input order.');
