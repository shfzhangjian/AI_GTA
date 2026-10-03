export const FACE_ORDER = ['U','R','F','D','L','B'];
export const FACES = {
  U: { name:'上面', color:'#f7f3e8', text:'#5f6059', normal:[0,1,0], right:[1,0,0], up:[0,0,-1], axis:1, layer:1 },
  R: { name:'右面', color:'#e36a54', text:'#fff', normal:[1,0,0], right:[0,0,-1], up:[0,1,0], axis:0, layer:1 },
  F: { name:'前面', color:'#448f77', text:'#fff', normal:[0,0,1], right:[1,0,0], up:[0,1,0], axis:2, layer:1 },
  D: { name:'下面', color:'#eec95b', text:'#796229', normal:[0,-1,0], right:[1,0,0], up:[0,0,1], axis:1, layer:-1 },
  L: { name:'左面', color:'#eda458', text:'#fff', normal:[-1,0,0], right:[0,0,1], up:[0,1,0], axis:0, layer:-1 },
  B: { name:'后面', color:'#6494c1', text:'#fff', normal:[0,0,-1], right:[-1,0,0], up:[0,1,0], axis:2, layer:-1 }
};
export function parseMove(move) {
  if (!/^[URFDLB](2|')?$/.test(move)) throw new Error(`Invalid move: ${move}`);
  const face = move[0], turns = move.endsWith('2') ? 2 : move.endsWith("'") ? -1 : 1;
  return {face, turns, ...FACES[face], quarter: -FACES[face].layer * turns};
}
export function inverse(move) { return move.endsWith('2') ? move : move.endsWith("'") ? move[0] : move + "'"; }
export function rotate(v, axis, quarters) {
  let out = [...v];
  for (let i=0; i<((quarters % 4)+4)%4; i++) {
    const [x,y,z] = out;
    out = axis === 0 ? [x,-z,y] : axis === 1 ? [z,y,-x] : [-y,x,z];
  }
  return out.map(n => n === 0 ? 0 : n);
}
const same = (a,b) => a.every((n,i)=> n===b[i]);
export class CubeModel {
  constructor() { this.reset(); }
  reset() {
    this.stickers = FACE_ORDER.flatMap(face => {
      const f=FACES[face];
      return Array.from({length:9},(_,i)=> ({ color:face, normal:[...f.normal], position:f.normal.map((v,k)=>v+f.right[k]*(i%3-1)+f.up[k]*(1-Math.floor(i/3))) }));
    });
    return this;
  }
  move(move) {
    const m=parseMove(move);
    for (const s of this.stickers) if (s.position[m.axis]===m.layer) {
      s.position=rotate(s.position,m.axis,m.quarter);
      s.normal=rotate(s.normal,m.axis,m.quarter);
    }
    return this;
  }
  apply(sequence) { for (const move of typeof sequence==='string' ? sequence.trim().split(/\s+/).filter(Boolean) : sequence) this.move(move); return this; }
  face(face) {
    const f=FACES[face], result=Array(9);
    for (const s of this.stickers) if (same(s.normal,f.normal)) {
      const col=s.position.reduce((a,n,k)=>a+n*f.right[k],0)+1;
      const row=1-s.position.reduce((a,n,k)=>a+n*f.up[k],0);
      result[row*3+col]=s.color;
    }
    return result;
  }
  asString() { return FACE_ORDER.map(f=>this.face(f).join('')).join(''); }
  isSolved() { return FACE_ORDER.every(f=>this.face(f).every(c=>c===f)); }
  correctCount() { return FACE_ORDER.reduce((sum,f)=>sum+this.face(f).filter(c=>c===f).length,0); }
  clone() { const cube=new CubeModel(); cube.stickers=structuredClone(this.stickers); return cube; }
}
export function scramble(length=20) {
  const result=[]; const axes={R:0,L:0,U:1,D:1,F:2,B:2};
  for(let i=0;i<length;i++) {
    let face;
    do { face=FACE_ORDER[Math.floor(Math.random()*6)]; } while(result.length && axes[face]===axes[result.at(-1)[0]]);
    result.push(face+['',"'",'2'][Math.floor(Math.random()*3)]);
  }
  return result;
}
export function simplify(sequence) {
  const result=[];
  for(const move of sequence) {
    if(result.at(-1)?.[0]===move[0]) {
      const prior=result.pop(); const turns=((parseMove(prior).turns+parseMove(move).turns)%4+4)%4;
      if(turns) result.push(move[0]+(turns===2?'2':turns===3?"'":''));
    } else result.push(move);
  }
  return result;
}
