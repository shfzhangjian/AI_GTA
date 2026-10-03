import {puppeteer,executablePath,gpuArgs,baseURL} from './browser.mjs';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../artifacts/',import.meta.url));await fs.mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath,headless:true,args:gpuArgs,defaultViewport:{width:1440,height:960,deviceScaleFactor:1}});
const page=await browser.newPage();const errors=[],report={};page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log('ERROR',m.text())});
const wait=ms=>new Promise(r=>setTimeout(r,ms));const shot=name=>page.screenshot({path:out+name+'.png'});
try{
 await page.goto(baseURL);await page.waitForFunction(()=>window.jelly?.ready,{timeout:20000});await wait(1800);await shot('desktop');report.initial=await page.evaluate(()=>({stats:jelly.stats(),fps:jelly.fps,fonts:[document.fonts.check('16px "Instrument Serif"'),document.fonts.check('16px "Instrument Sans"')]}));
 await page.click('#settings-button');await shot('settings');await page.click('#settings-button');
 const center=await page.evaluate(()=>jelly.project([jelly.dice[0].center[0],jelly.dice[0].center[1]+.45,jelly.dice[0].center[2]]));await page.mouse.click(...center);await wait(150);report.poke=await page.evaluate(()=>jelly.stats());
 await page.evaluate(()=>jelly.resetDice());await wait(200);await page.mouse.move(...center);await page.mouse.down();for(let i=1;i<=12;i++){await page.mouse.move(center[0]-i*4,center[1]-i*13);await wait(40)}await wait(250);await shot('stretch');report.stretch=await page.evaluate(()=>jelly.stats());await page.mouse.up();await wait(250);report.release=await page.evaluate(()=>jelly.stats());
 await page.click('#more');await page.click('#more');await page.click('#roll');await wait(2000);report.rolling=await page.evaluate(()=>({fps:jelly.fps,stats:jelly.stats()}));await shot('rolling-five');
 const perf=await page.evaluate(()=>{jelly.options.pause=true;const start=performance.now();for(let i=0;i<20;i++)jelly.step(1/120);return{ms:performance.now()-start,stats:jelly.stats()}});report.physicsBenchmark=perf;console.log('BENCHMARK',JSON.stringify(perf));
 let maxStrain=0,minVolume=10;for(let chunk=0;chunk<16;chunk++){const stats=await page.evaluate(()=>{for(let i=0;i<120;i++)jelly.step(1/120);return jelly.stats()});maxStrain=Math.max(maxStrain,...stats.map(s=>s.maxStrain));minVolume=Math.min(minVolume,...stats.map(s=>s.minVolume));if(stats.every(d=>d.sleep)){report.settledAt=chunk+1;break}console.log('SETTLING',chunk,JSON.stringify(stats.map(s=>({sleep:s.sleep,y:s.center[1],volume:s.minVolume,strain:s.maxStrain}))));}
 report.settled=await page.evaluate(()=>jelly.stats());report.maxStrain=maxStrain;report.minVolume=minVolume;await shot('five-settled');
 report.sleepStable=await page.evaluate(()=>{const before=jelly.dice.map(d=>Array.from(d.x));for(let i=0;i<60;i++)jelly.step(1/120);return before.every((v,d)=>v.every((p,i)=>p===jelly.dice[d].x[i]))});
 await page.click('[data-color="4"]');await shot('raspberry');
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});await wait(1200);await shot('mobile');report.mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 await page.click('#settings-button');await shot('mobile-settings');await page.click('#settings-button');
 report.errors=await page.evaluate(()=>jelly.errors);report.pageErrors=errors;
 const fallback=await browser.newPage();await fallback.setViewport({width:390,height:844});await fallback.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'gpu',{value:undefined}));await fallback.goto(baseURL);await wait(200);report.fallback=await fallback.evaluate(()=>({visible:!document.querySelector('#fallback').hidden,reason:document.querySelector('#fallback-reason').textContent}));await fallback.screenshot({path:out+'fallback.png'});
}finally{await fs.writeFile(out+'qa.json',JSON.stringify(report,null,2));console.log('REPORT',JSON.stringify(report,null,2));await browser.close()}
if(errors.length||report.errors?.length||!report.sleepStable||report.minVolume<=0||report.maxStrain>1.55||!report.settled?.every(s=>s.sleep))process.exitCode=1;
