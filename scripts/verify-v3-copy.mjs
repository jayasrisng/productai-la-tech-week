import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
const source=path.resolve(process.env.V3_SOURCE_ROOT||'../lineup');
const files=execFileSync('git',['-C',source,'ls-files','app','components','types'],{encoding:'utf8'}).trim().split('\n');
let checked=0;
function jsx(text,file){
 const root=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const result=[];
 const visit=node=>{if(ts.isJsxElement(node)||ts.isJsxSelfClosingElement(node)||ts.isJsxFragment(node)){result.push(node.getText(root));return;}ts.forEachChild(node,visit);};
 visit(root);return result;
}
for(const file of files){
 if(file==='app/chatgpt-auth.ts')continue;
 assert(fs.existsSync(file),`${file}: v3 frontend file missing from the demo`);
 const original=fs.readFileSync(path.join(source,file),'utf8'),demo=fs.readFileSync(file,'utf8');
 if(file.endsWith('.tsx')){assert.deepEqual(jsx(demo,file),jsx(original,file),`${file}: visible v3 JSX/copy differs`);checked++;}
 if(file.endsWith('.css'))assert.equal(demo.split('\n').map(line=>line.trimEnd()).join('\n'),original.split('\n').map(line=>line.trimEnd()).join('\n'),`${file}: source styles differ`);
}
for(const file of ['lib/display-copy.ts','lib/events.ts','lib/product-experiences.ts','lib/calculateEventMatch.ts','lib/event-filters.ts','lib/storage.ts','lib/avatar.ts','lib/poster.ts','lib/poster-stickers.ts'])assert.equal(fs.readFileSync(file,'utf8'),fs.readFileSync(path.join(source,file),'utf8'),`${file}: frontend content differs`);
console.log(`PASS: ${checked} frontend TSX files have word-for-word identical JSX, all styles match, and displayed content helpers match current v3.`);
