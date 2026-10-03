import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { CubeModel, FACE_ORDER, inverse, scramble, simplify } from '../model.js';
const context=vm.createContext({console});
vm.runInContext(fs.readFileSync(new URL('../vendor/cube.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('../vendor/solve.js',import.meta.url),'utf8'),context);
const Cube=context.Cube;
const solved=new CubeModel().asString();
let comparisons=0;
for(const face of FACE_ORDER)for(const suffix of ['',"'",'2']){
  const move=face+suffix,cube=new CubeModel().move(move),reference=new Cube().move(move);
  assert.equal(cube.asString(),reference.asString(),`Facelet mapping for ${move}`);comparisons++;
  cube.move(inverse(move));assert.equal(cube.asString(),solved,`Inverse of ${move}`);
}
for(const face of FACE_ORDER)assert.equal(new CubeModel().apply([face,face,face,face]).asString(),solved);
for(let test=0;test<50;test++){
  const moves=scramble(30);const model=new CubeModel(),reference=new Cube();
  for(const move of moves){model.move(move);reference.move(move);assert.equal(model.asString(),reference.asString());comparisons++;}
  assert.equal(model.stickers.length,54);
  for(const face of FACE_ORDER)assert.equal(model.asString().split(face).length-1,9);
  assert.equal(model.clone().apply(moves.slice().reverse().map(inverse)).asString(),solved);
  assert.equal(new CubeModel().apply(simplify(moves)).asString(),model.asString());
}
assert.deepEqual(simplify(['R','R',"R'",'U',"U'",'R']),['R2']);
assert.throws(()=>new CubeModel().move('X'));
console.log(`PASS: ${comparisons} independent facelet comparisons, inverses, color counts and simplification.`);
console.time('Solver initialization');Cube.initSolver();console.timeEnd('Solver initialization');
let solutions=0;
for(let i=0;i<12;i++){
  const model=new CubeModel().apply(scramble(25));
  const algorithm=Cube.fromString(model.asString()).solve();
  assert.ok(model.apply(algorithm).isSolved(),`Solver route ${i} must solve the geometric model`);solutions++;
}
console.log(`PASS: ${solutions} random states solved and verified against the geometric model.`);
