import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:8767/productai-la-tech-week';
const out=process.env.TEST_OUTPUT||'/private/tmp/productai-pages-v3-evidence';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,timezoneId:'America/Los_Angeles'});
const page=await context.newPage();
const errors=[],failures=[],backend=[],checks=[];
page.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')errors.push(`${r.url()}: ${r.failure()?.errorText}`)});
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`)});
page.on('request',r=>{if(/\/api(?:\/|\?|$)|\/signin-with-chatgpt|\/signout-with-chatgpt/.test(r.url()))backend.push(r.url())});
const pass=name=>{checks.push(name);console.log('PASS:',name)};
async function go(route){await page.goto(base+route);await page.locator('h1').first().waitFor();await page.waitForLoadState('networkidle');}
async function shot(name){assert(!/Demo only|Demo:|fictional|sample code|Preview only|in-memory|No access is verified|No real booking|No visit has been reserved|YOUR VISIT PREVIEW|Confirmation preview|Preview cancelled|frontend demo/.test(await page.locator('body').innerText()),name+' contains demo filler');await page.evaluate(()=>document.fonts.ready);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' overflow');await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});}
async function download(button,name){const wait=page.waitForEvent('download');await page.getByRole('button',{name:button,exact:true}).click();const item=await wait;await item.saveAs(path.join(out,name));return fs.readFile(path.join(out,name));}
try {
 await go('/');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('.experience-card').count(),2);await shot('1440-dark-home');
 await page.getByRole('button',{name:'Build my lineup',exact:true}).click();
 for(let i=0;i<6;i++){await page.getByText(`QUESTION ${i+1} OF 6`,{exact:true}).waitFor();if(i!==4)await page.locator('.choice-grid button').first().click();await page.getByRole('button',{name:/Continue →|See my matches →/}).click();}
 await page.waitForURL('**/events/**');await page.locator('section[aria-label="Event matches"] .event-card').first().waitFor();await page.waitForLoadState('networkidle');assert.equal(await page.locator('section[aria-label="Event matches"] .event-card').count(),10);assert.equal(await page.locator('html').getAttribute('data-theme'),'light');pass('Six-question onboarding and navigation preserve the Pages prefix and theme defaults');
 const names=await page.locator('section[aria-label="Event matches"] .event-card h2').allTextContents();await page.getByRole('button',{name:'Grid',exact:true}).click();assert.deepEqual(await page.locator('section[aria-label="Event matches"] .event-card h2').allTextContents(),names);await shot('1440-light-matches-grid');await page.getByRole('button',{name:'List',exact:true}).click();
 await page.getByRole('button',{name:/Show 10 more matches/}).click();assert.equal(await page.locator('section[aria-label="Event matches"] .event-card').count(),20);
 await page.getByRole('button',{name:/^Filters/}).click();await page.locator('#event-filter-panel select').selectOption('2026-10-12');assert(await page.locator('section[aria-label="Event matches"] .event-card').count()>0);assert((await page.locator('section[aria-label="Event matches"] .event-meta').allTextContents()).every(text=>text.includes('Oct 12')));await page.getByRole('button',{name:'Clear filters',exact:true}).click();await page.getByRole('button',{name:/^Filters/}).click();
 for(let i=0;i<3;i++)await page.locator('section[aria-label="Event matches"] .event-card').nth(i).getByRole('button',{name:'Add to my lineup',exact:true}).click();pass('List/grid, expanded matches, date filters and adding three events work');
 await page.getByRole('link',{name:/See my lineup/}).click();await page.locator('.console-poster').waitFor();await page.waitForLoadState('networkidle');
 const calendar=await download('Add all to calendar','lineup.ics');assert.equal((calendar.toString().match(/BEGIN:VEVENT/g)||[]).length,3);
 await page.getByRole('button',{name:'Share poster',exact:true}).click();await page.getByRole('dialog').waitFor();await page.locator('.poster-preview-image').evaluate(image=>image.decode());const png=await download('Download','lineup.png');assert.equal(png.subarray(1,4).toString(),'PNG');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Customize your avatar',exact:true}).click();await page.getByRole('button',{name:'Face 5',exact:true}).click();await page.getByRole('button',{name:'Sky',exact:true}).click();await page.getByRole('button',{name:'Done',exact:true}).click();pass('Lineup calendar/PNG exports and avatar face/color selection work');
 await go('/office-visit/');await page.locator('.slot-option').first().waitFor();assert(!/Demo:|fictional|sample code|Preview only|in-memory|No access is verified/.test(await page.locator('body').innerText()));assert(await page.locator('.social-opt-in input').isEnabled());await page.locator('.visit-guidance summary').click();await page.getByRole('button',{name:'Me + one',exact:true}).click();await page.locator('.slot-option input').nth(0).check();await page.locator('.slot-option input').nth(1).check();
 for(const [index,prefix] of [[0,'Demo'],[1,'Guest']]){const form=page.locator('.attendee-fields').nth(index);await form.getByLabel('Name',{exact:true}).fill(prefix+' Reviewer');await form.getByLabel('Email',{exact:true}).fill(prefix.toLowerCase()+'@example.net');await form.getByLabel('LinkedIn username',{exact:true}).fill(prefix.toLowerCase()+'-review');}
 await page.getByRole('combobox',{name:/How did you hear about Recharge/}).selectOption({index:1});await page.getByRole('textbox',{name:/^Registration code/}).fill('DemoCode');await page.getByRole('button',{name:'Book my hours',exact:true}).click();await page.locator('.visit-status').filter({hasText:'Reservations are unavailable.'}).waitFor();assert.equal(await page.locator('.visit-management').count(),0);assert(!page.url().includes('#manage='));await shot('recharge-booking-blocked');assert(!(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}))).includes('demo@example.net'));pass('v3 Recharge wording and multi-hour/plus-one selection match; booking is blocked without storing details or creating a confirmation');
 await go('/admin/registrations/');await page.getByLabel('Access code',{exact:true}).fill('synthetic-review-only');await page.getByRole('button',{name:'Unlock dashboard',exact:true}).click();await page.locator('.organizer-message').filter({hasText:'Organizer service is unavailable.'}).waitFor();assert.equal(await page.locator('.organizer-booking').count(),0);pass('v3 organizer form copy matches; access is blocked without sending a code or loading attendees');
 for(const width of [1440,390])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:1000});await page.evaluate(theme=>localStorage.setItem('techWeekThemeOverride',theme),theme);
  for(const [route,name] of [['/','home'],['/plan/','plan'],['/events/','matches'],['/lineup/','lineup'],['/office-visit/','recharge'],['/mission-hq/','pulse']]){
   await go(route);assert.equal(await page.locator('html').getAttribute('data-theme'),theme);await shot(`${width}-${theme}-${name}`);assert.equal(await page.locator('img').evaluateAll(images=>images.filter(image=>image.complete&&image.naturalWidth===0).length),0);
   if(name==='pulse'){assert.equal(await page.locator('.map-tiles img').count(),12);await page.getByRole('button',{name:'Product.ai HQ',exact:true}).click();await page.locator('#productai-planned-presence').waitFor();}
  }
 }
 pass('Six screens × two themes × desktop/mobile render with loaded images and no horizontal overflow; Pulse map and HQ control work');
 assert.deepEqual(backend,[]);assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);pass('No backend requests, runtime/console errors or failed HTTP responses');
 await fs.writeFile(path.join(out,'results.json'),JSON.stringify({base,checks,errors,failures,backend},null,2));
} catch(error){await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});await fs.writeFile(path.join(out,'failure.json'),JSON.stringify({error:error.stack,url:page.url(),body:await page.locator('body').innerText(),errors,failures,backend,checks},null,2));throw error;} finally {await browser.close();}
