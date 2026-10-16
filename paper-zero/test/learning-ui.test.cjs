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
