const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert');
const base=__dirname+'/../src/';const nodes={},frames=[],listeners={};let now=0,timers=0;
function el(id){if(nodes[id])return nodes[id];const n={parentElement:{childNodes:[],dataset:{waveLabel:true}},textContent:'',style:{},dataset:{},children:[],classList:{add(){},remove(){}},appendChild(x){this.children.push(x)},addEventListener(k,f){this[k]=f},getBoundingClientRect(){return{left:0,top:0,width:1100,height:680}}};Object.defineProperty(n,'innerHTML',{get(){return this.html||''},set(x){this.html=x;this.children=[]}});return nodes[id]=n;}
const ctx=new Proxy({}, {get:(t,k)=>t[k]??(()=>{}),set:(t,k,v)=>(t[k]=v,true)});el('game').width=1100;el('game').height=680;el('game').getContext=()=>ctx;
const sandbox={Node:{TEXT_NODE:3},console,Math,performance:{now:()=>now},document:{getElementById:el,querySelector:s=>el(s.slice(1)),createElement:()=>el('b'+Math.random())},requestAnimationFrame:f=>frames.push(f),setInterval(){return ++timers},clearInterval(){}};sandbox.window=sandbox;sandbox.addEventListener=(k,f)=>listeners[k]=f;sandbox.globalThis=sandbox;vm.createContext(sandbox);
for(const f of ['math.js','boss.js','combat.js','game2.js']){let s=fs.readFileSync(base+f,'utf8');if(f==='game2.js')s=s.replace(/\}\)\(\);\s*$/, 'window.QA={getState:()=>state,makeRun,update,shoot,resolveShot,end,emitBoss,drawEnemy};})();');vm.runInContext(s,sandbox);}
const qa=sandbox.QA;const tick=n=>{for(let i=0;i<n*60;i++){now+=1000/60;frames.splice(0).forEach(f=>f(now));}};
function check(name,f){try{f();console.log('PASS',name)}catch(e){console.log('FAIL',name,e.message)}}

// Integration bot uses keyboard, pointer and existing menu handlers only.
// QA state is read solely to select inputs; no direct state mutations or end calls.
el('start').onclick();
let lastPage=0,lastWave=0,shots=0,steps=0,corner=0; const route=[[950,580],[150,580],[150,100],[950,100]];
for(;steps<36000;steps++){
 const s=qa.getState();
 if(s.ended){if(s.hp<=0){console.log('BOT LOSS',JSON.stringify({page:s.page+1,wave:s.wave+1,hp:s.hp,shots,time:steps/60}));break;}
 if(s.page===4){console.log('BOT VICTORY',JSON.stringify({pages:5,hp:s.hp,score:s.score,shots,time:steps/60}));break;}
 const b=el('choices').children[1];if(!b)throw Error('missing upgrade');b.onclick();
 }
 const cur=qa.getState();if(cur.page!==lastPage||cur.wave!==lastWave){console.log('ENTER',cur.page+1,cur.wave+1,'HP',cur.hp);lastPage=cur.page;lastWave=cur.wave;corner=0;}
 const p=cur.player,wp=route[corner];if(Math.hypot(p.x-wp[0],p.y-wp[1])<35)corner=(corner+1)%4;
 const next=route[corner];for(const [k,on] of Object.entries({a:p.x>next[0]+12,d:p.x<next[0]-12,w:p.y>next[1]+12,s:p.y<next[1]-12})){if(on)listeners.keydown({key:k,code:'Key'+k.toUpperCase(),preventDefault(){}});else listeners.keyup({key:k});}
 const enemy=cur.enemies.filter(e=>!e.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
 if(enemy){const goal=cur.page===3?10:0;let choices=Object.keys(sandbox.PaperZeroMath.OPERATORS).map(id=>({id,r:sandbox.PaperZeroMath.apply(enemy.value,id,goal)})).filter(o=>o.r.ok&&o.r.value!==enemy.value&&cur.cool[o.id]<=0&&(o.id==='minus'||cur.charges[o.id]>0));if(enemy.armor>0)choices=choices.filter(o=>o.id==='minus');choices.sort((a,b)=>a.r.value-b.r.value);const o=choices[0];if(o && !(o.id!=='minus'&&cur.shots.some(x=>x.id===o.id))){listeners.keydown({key:sandbox.PaperZeroMath.OPERATORS[o.id].key,code:'',preventDefault(){}});el('game').pointerdown({clientX:enemy.x,clientY:enemy.y,pointerType:'mouse',pointerId:1});shots++;}}
 tick(1/60);
}
if(steps===36000) console.log('BOT TIMEOUT');
