const assert=require('assert'); const M=require('../src/math.js');
assert.deepStrictEqual(M.apply(12,'half',0),{ok:true,value:6});
assert.strictEqual(M.apply(11,'half',0).ok,false); assert.strictEqual(M.apply(10,'root',0).ok,false);
assert.deepStrictEqual(M.apply(14,'mod',0),{ok:true,value:2});
assert.strictEqual(M.apply(11,'minus',10).ok,true); assert.strictEqual(M.apply(10,'minus',10).reason,'会低于 10');
assert.strictEqual(M.apply(12,'half',10).reason,'会低于 10'); assert.strictEqual(M.apply(36,'root',10).reason,'会低于 10');
assert.strictEqual(M.apply(100,'mod',10).reason,'目标 10 禁用模 3');
assert.strictEqual(M.apply(-1,'minus',0).ok,false); assert.strictEqual(M.apply(Infinity,'minus',0).ok,false);
assert.strictEqual(M.apply(1.2,'minus',0).ok,false); assert.strictEqual(M.apply(Number.MAX_SAFE_INTEGER+1,'minus',0).ok,false);
assert.strictEqual(M.apply(10,'wat',0).ok,false);
// Exhaustive reachability check for every authored target-10 spawn. The search uses
// the same production operation function and never permits values below target.
function reachesTen(start){const q=[start],seen=new Set(q);while(q.length){const n=q.shift();if(n===10)return true;for(const op of ['minus','half','root']){const r=M.apply(n,op,10);if(r.ok&&!seen.has(r.value)){seen.add(r.value);q.push(r.value);}}}return false;}
[11,12,16,25,36].forEach(n=>assert.ok(reachesTen(n),`target page ${n} reaches 10`));
// No target-10 transition can cross the floor; mod is rejected rather than spent.
for(let n=10;n<=144;n++) for(const op of Object.keys(M.OPERATORS)){const r=M.apply(n,op,10);assert.ok(!r.ok||r.value>=10,`${n}/${op} stayed valid`);}
console.log('math tests: ok');
