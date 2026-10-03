import {puppeteer,executablePath,gpuArgs,baseURL} from './browser.mjs';
import fs from 'node:fs/promises';
const out=new URL('../artifacts/',import.meta.url);await fs.mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath,headless:true,args:gpuArgs});
const reports=[];
try{
 const page=await browser.newPage();await page.goto(baseURL);await page.waitForFunction(()=>window.jelly?.ready);
 for(const seed of [3,19,47,101,271,809]){
  const report=await page.evaluate(seed=>{
   const original=Math.random;let state=seed;Math.random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
   jelly.options.count=5;jelly.options.softness=.65;jelly.roll();Math.random=original;jelly.options.pause=true;
   let steps=0;while(steps<4800&&!jelly.dice.every(d=>d.sleep)){jelly.step(1/120);steps++}
   const before=jelly.dice.map(d=>Array.from(d.x));for(let i=0;i<120;i++)jelly.step(1/120);
   return{seed,steps,seconds:steps/120,stats:jelly.stats(),stable:before.every((a,d)=>a.every((v,i)=>v===jelly.dice[d].x[i])),errors:jelly.errors};
  },seed);
  reports.push(report);console.log(JSON.stringify(report));
 }
}finally{await fs.writeFile(new URL('settling.json',out),JSON.stringify(reports,null,2));await browser.close()}
if(reports.some(r=>!r.stable||r.stats.some(d=>!d.sleep||d.minVolume<=0||d.maxStrain>1.49||d.nudges>2)||r.errors.length))process.exitCode=1;
