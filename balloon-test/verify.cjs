const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname+'/app.js','utf8');
const functions = source.slice(source.indexOf('function gent('),source.indexOf('class RoomAudio'));
const random = source.slice(source.indexOf('function rng('),source.indexOf('const reducedQuery'));
const colors = source.match(/const palettes=\[[\s\S]*?\];/)[0];
const scope = vm.createContext({Math});
vm.runInContext(random+colors+'let round;'+functions+'this.api={gent,newSpec};',scope);
const {gent,newSpec}=scope.api;
let lowest=Infinity,highest=0;
for(let seed=1;seed<=1000;seed++){
 const spec=newSpec(seed);
 assert.equal(JSON.stringify(spec),JSON.stringify(newSpec(seed)),'seeded specimen must repeat');
 assert.equal(gent(1,spec),0);
 const peak=gent(1.43,spec),valley=gent(2.35,spec),end=gent(spec.limit,spec);
 assert(peak>valley,'first stroke peak must fall as the balloon grows');
 assert(end>peak*1.8&&end<8,'terminal pressure must rise sharply and fit the 0–8 kPa dial');
 assert(spec.fragmentCount>=18&&spec.fragmentCount<=28);
 for(let i=0;i<=100;i++){const l=1+(spec.limit-1)*i/100;assert(Number.isFinite(gent(l,spec))&&gent(l,spec)>=0);}
 lowest=Math.min(lowest,end);highest=Math.max(highest,end);
}
const html=fs.readFileSync(__dirname+'/index.html','utf8');
assert(!/<script[^>]+src=/.test(html),'all scripts must be inline');
assert(!/(?:src|href)=["'](?:\.\/|\.\.\/)/.test(html),'export must not depend on sidecar files');
assert(html.includes('Three.js Authors'),'retain Three.js license notice');
assert(html.includes('prefers-reduced-motion'));
const inlineScript=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(inlineScript,{filename:'standalone-bundle.js'});
console.log(`PASS: 1,000 seeded Gent curves; 18–28 fragments; terminal ${lowest.toFixed(2)}–${highest.toFixed(2)} kPa; standalone export.`);
