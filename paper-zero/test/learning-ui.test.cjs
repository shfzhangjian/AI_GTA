'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../src/subjects.js');
function boot(saved,blocked=false){
 const elements=new Map(),store={value:saved};
 function el(id){if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',hidden:false,disabled:false,dataset:{},className:'',classList:{add(){},remove(){}},listeners:{},addEventListener(k,fn){this.listeners[k]=fn;},setAttribute(){}});return elements.get(id);}
 const ctx={window:{PaperSubjects:R},document:{getElementById:el},localStorage:{getItem(){if(blocked)throw Error('blocked');return store.value;},setItem(k,v){if(blocked)throw Error('blocked');store.value=v;}},performance:{now:()=>100},requestAnimationFrame:()=>1,cancelAnimationFrame(){},console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../src/learn.js'),'utf8').replace('load(0);','window.qa={get:()=>({level,taskIndex,demo,state,progress}),handle};load(0);'),ctx);
 const click=(id,data)=>el(id).listeners.click({target:{closest:()=>({dataset:data})}});
 return {ctx,el,store,click,qa:ctx.window.qa};
}
const app=boot();
assert.equal(app.el('total').textContent,'0 / 24 枚印章');
for(let l=0;l<8;l++){
 assert.equal(app.qa.get().level,l);assert.equal(app.qa.get().demo,true);
 for(const a of R.solution(l,0))app.el('demoStep').onclick();
 assert.equal(R.solved(l,0,app.qa.get().state),true,'demo '+l);assert.equal(app.qa.get().progress.filter(Boolean).length,l*3,'demo never awards');
 app.el('begin').onclick();
 for(let t=0;t<3;t++){
  assert.equal(app.qa.get().taskIndex,t);
  for(const a of R.solution(l,t)){
   const data=a.type==='step'?{step:String(a.value)}:a.type==='fraction'?{fraction:`${a.n},${a.d}`}:a.type==='bothAdd'?{bothAdd:String(a.value)}:a.type==='bothDivide'?{bothDivide:String(a.value)}:a.type==='point'?{point:`${a.x},${a.y}`}:a.type==='set'?{adjust:String(a.value-app.qa.get().state.value)}:{action:a.type};
   app.click('controls',data);
  }
  assert.equal(R.solved(l,t,app.qa.get().state),true,`UI ${l}.${t}`);assert.equal(app.el('next').hidden,false);
  assert.equal(app.qa.get().progress.filter(Boolean).length,l*3+t+1);
  assert.doesNotMatch(app.el('scene').innerHTML,/NaN|undefined/);
  app.el('next').onclick();
 }
}
assert.equal(JSON.parse(app.store.value).filter(Boolean).length,24);
assert.match(app.el('feedback').textContent,/24 枚/);
assert.equal(boot(app.store.value).qa.get().progress.filter(Boolean).length,24);
assert.equal(boot('{bad').qa.get().progress.filter(Boolean).length,0);
const b=boot(null,true);b.el('begin').onclick();b.click('controls',{step:'-3'});b.click('controls',{step:'-1'});assert.equal(b.qa.get().progress[0],true);
b.el('reset').onclick();assert.equal(b.qa.get().state.value,4);b.click('controls',{step:'-1'});b.click('controls',{action:'undo'});assert.equal(b.qa.get().state.value,4);
console.log('Learning UI: 8 demos + 24 challenges, progress/reload/storage failure/reset/undo passed (DOM simulation, not browser).');
const d=boot();d.click('controls',{step:'1'});assert.equal(d.el('demoStep').textContent,'重新演示 →');d.el('demoStep').onclick();d.el('demoStep').onclick();assert.equal(R.solved(0,0,d.qa.get().state),true);d.click('controls',{action:'undo'});assert.equal(d.el('demoStep').disabled,false);d.el('demoStep').onclick();d.el('demoStep').onclick();assert.equal(R.solved(0,0,d.qa.get().state),true);
const e=boot();e.el('begin').onclick();e.click('controls',{step:'-3'});e.click('controls',{step:'-1'});e.click('controls',{step:'1'});assert.equal(e.el('next').hidden,true);e.click('controls',{action:'undo'});assert.equal(e.el('next').hidden,false);assert.equal(e.el('stamp').textContent,'已完成');
const c=boot(JSON.stringify(Array(24).fill(true)));c.click('levels',{level:'3'});c.el('begin').onclick();for(let i=0;i<7;i++)c.click('controls',{move:'0,1'});assert.equal(c.qa.get().state.y,5);assert.match(c.el('feedback').textContent,/范围/);
c.click('levels',{level:'2'});c.el('begin').onclick();c.click('controls',{bothDivide:'2'});c.click('controls',{bothMultiply:'2'});assert.equal(c.qa.get().state.a.n,3);c.click('controls',{bothAdd:'-6'});c.click('controls',{bothDivide:'3'});assert.equal(c.el('next').hidden,false);
console.log('UI edge cases: manual/undo demos, solved→change→undo, coordinate bounds, multiplication recovery passed.');
