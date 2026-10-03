import * as THREE from './vendor/three.module.min.js';

// Original SUNFALL weapons and first-person hands. All dimensions are metres.
// Static detail is merged by material inside each moving body part to keep draws low.
const Y = new THREE.Vector3(0, 1, 0);
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const V = (a) => new THREE.Vector3(...a);
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3(1, 1, 1);

function clothTexture() {
  const n = 64, data = new Uint8Array(n * n * 4);
  let seed = 7139;
  const rand = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const blotches = Array.from({ length: 35 }, () => [rand() * n, rand() * n, 3 + rand() * 10, rand()]);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let shade = .91 + rand() * .14;
    for (const [cx, cy, r, t] of blotches) {
      const dx = Math.min(Math.abs(x - cx), n - Math.abs(x - cx));
      const dy = Math.min(Math.abs(y - cy), n - Math.abs(y - cy));
      if (dx * dx + dy * dy < r * r * (1 + .16 * Math.sin(x * 1.7 + y))) shade *= t < .5 ? .73 : 1.13;
    }
    shade *= ((x + y) & 1) ? .98 : 1.025;
    const i = (y * n + x) * 4;
    data[i] = Math.min(255, 151 * shade); data[i + 1] = Math.min(255, 152 * shade);
    data[i + 2] = Math.min(255, 124 * shade); data[i + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 2);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  return tex;
}
const camo = clothTexture();
const mat = (color, roughness = .7, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const M = {
  receiver: mat(0x353d3d, .42, .78), steel: mat(0x626b67, .35, .82),
  dark: mat(0x171e21, .6, .65), edge: mat(0x7b826e, .54, .62),
  olive: mat(0x59624a, .79, .18), rubber: mat(0x252b26, .92),
  black: mat(0x11181a, .9), glass: mat(0x264f59, .18, .42, { emissive: 0x0b2831, emissiveIntensity: .4 }),
  lens: mat(0x6fbaaa, .12, .48, { emissive: 0x397970, emissiveIntensity: .38 }),
  opticGlass: mat(0x749b9e, .14, .08, { transparent: true, opacity: .14, depthWrite: false, side: THREE.DoubleSide }),
  opticLens: mat(0x9fc3b7, .13, .06, { transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide }),
  reticle: new THREE.MeshBasicMaterial({ color: 0xff6947, transparent: true, opacity: .95, depthWrite: false }),
  cloth: mat(0xc5c7a8, .97, 0, { map: camo }),
  armor: mat(0x4a5543, .9), webbing: mat(0x73785a, .97),
  glove: mat(0x404b3d, .92), glovePad: mat(0x232c26, .97),
  tan: mat(0xb8b28c, .84), boot: mat(0x343c31, .94),
  skin: mat(0xa78a6b, .9), copper: mat(0xa28957, .48, .65)
};

// Bevelled prisms, rather than plain cubes, catch narrow highlights on machined edges.
function bevel(w, h, d, radius = .004) {
  const r = Math.min(radius, w * .23, h * .23, d * .23);
  const shape = new THREE.Shape();
  const x = -w / 2 + r, y = -h / 2 + r, iw = w - r * 2, ih = h - r * 2;
  shape.moveTo(x, y); shape.lineTo(x + iw, y); shape.lineTo(x + iw, y + ih);
  shape.lineTo(x, y + ih); shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * r, steps: 1, bevelEnabled: true, bevelSegments: 2, bevelSize: r, bevelThickness: r, curveSegments: 1 });
  g.translate(0, 0, -d / 2 + r); return g;
}
function tapered(w0, w1, h, depth, lean = 0) {
  const s = new THREE.Shape();
  s.moveTo(-w0 / 2, h / 2); s.lineTo(w0 / 2, h / 2);
  s.lineTo(w1 / 2 + lean, -h / 2); s.lineTo(-w1 / 2 + lean, -h / 2); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 2, bevelSize: .004, bevelThickness: .003, steps: 1 });
  g.translate(0, 0, -depth / 2); return g;
}
function transform(geo, position = [0, 0, 0], rotation = null, scale = null) {
  const q = rotation ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)) : new THREE.Quaternion();
  return geo.applyMatrix4(new THREE.Matrix4().compose(V(position), q, scale ? V(scale) : _s));
}
class Batch {
  constructor(group) { this.group = group; this.bins = new Map(); }
  add(geo, material, position, rotation, scale) {
    transform(geo, position, rotation, scale);
    if (!this.bins.has(material)) this.bins.set(material, []);
    this.bins.get(material).push(geo); return this;
  }
  box(w, h, d, material, p, r, radius) { return this.add(bevel(w, h, d, radius), material, p, r); }
  ball(rx, ry, rz, material, p, r) { return this.add(new THREE.SphereGeometry(1, 12, 8), material, p, r, [rx, ry, rz]); }
  cylinder(radius, length, material, p, rotation = [Math.PI / 2, 0, 0], radius2 = radius, segments = 12, openEnded = false) {
    return this.add(new THREE.CylinderGeometry(radius, radius2, length, segments, 1, openEnded), material, p, rotation);
  }
  tube(points, radius, material, segments = 20) {
    return this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(V)), segments, radius, 7, false), material);
  }
  limb(a, b, radius, material, radius2 = radius) {
    const av = V(a), bv = V(b), delta = bv.clone().sub(av);
    const g = new THREE.CylinderGeometry(radius, radius2, delta.length(), 10);
    _q.setFromUnitVectors(Y, delta.normalize());
    g.applyMatrix4(_m.compose(av.add(bv).multiplyScalar(.5), _q, _s)); this.add(g, material);
    this.ball(radius, radius, radius, material, b); return this;
  }
  consolidate(mapping) {
    for (const [from, to] of mapping) if (from !== to && this.bins.has(from)) {
      if (!this.bins.has(to)) this.bins.set(to, []);
      this.bins.get(to).push(...this.bins.get(from)); this.bins.delete(from);
    }
    return this;
  }
  finish(head = false) {
    const meshes = [];
    for (const [material, parts] of this.bins) {
      const flat = parts.map(g => g.index ? g.toNonIndexed() : g);
      const len = flat.reduce((n, g) => n + g.getAttribute('position').count, 0);
      const position = new Float32Array(len * 3), normal = new Float32Array(len * 3), uv = new Float32Array(len * 2);
      let offset = 0;
      for (const g of flat) {
        const count = g.getAttribute('position').count;
        position.set(g.getAttribute('position').array, offset * 3);
        if (g.getAttribute('normal')) normal.set(g.getAttribute('normal').array, offset * 3);
        if (g.getAttribute('uv')) uv.set(g.getAttribute('uv').array, offset * 2);
        offset += count;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(position, 3)); g.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, material); mesh.castShadow = true; mesh.receiveShadow = true;
      if (head) mesh.userData.head = true;
      this.group.add(mesh); meshes.push(mesh);
      for (const geo of new Set([...parts, ...flat])) geo.dispose();
    }
    return meshes;
  }
}
function child(parent, name, p = [0, 0, 0]) { const g = new THREE.Group(); g.name = name; g.position.set(...p); parent.add(g); return g; }
function ring(batch, r, tube, material, p, rotation = [0, 0, 0]) {
  batch.add(new THREE.TorusGeometry(r, tube, 6, 16), material, p, rotation);
}
function screw(b, p, axis = 'x', size = .0045) {
  const rot = axis === 'x' ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0];
  b.cylinder(size, .0028, M.steel, p, rot, size, 8);
}
function picatinny(b, y, from, to, width = .035) {
  b.box(width * .66, .013, to - from, M.dark, [0, y - .006, (from + to) / 2]);
  for (let z = from; z < to; z += .021) b.box(width, .012, .010, M.receiver, [0, y, z], null, .0014);
}
function barrelEnd(b, z, r) {
  b.cylinder(r, .041, M.dark, [0, .032, z + .013]);
  // Hollow-looking recessed bore: bevelled metal crown, then dark depth.
  ring(b, r * .72, r * .25, M.steel, [0, .032, z - .007]);
  b.cylinder(r * .61, .003, M.black, [0, .032, z - .0074]);
}
function safetyDetails(b, rear = .055) {
  for (const x of [-.039, .039]) {
    screw(b, [x, -.006, rear]); screw(b, [x, .031, rear - .116]);
    b.box(.004, .012, .030, M.steel, [x, -.014, rear + .012], [.1, 0, x > 0 ? .4 : -.4], .001);
  }
  b.box(.003, .019, .075, M.black, [.040, .030, -.005]);
  b.box(.004, .012, .039, M.steel, [.043, .029, .003]);
  b.cylinder(.004, .043, M.steel, [.057, .038, .023], [0, 0, Math.PI / 2], .004, 8);
}
function grip(b, center = [0, -.091, .067]) {
  b.add(tapered(.047, .038, .122, .043, .006), M.rubber, center, [-.24, 0, 0]);
  for (let i = 0; i < 5; i++) b.box(.049, .004, .045, M.olive, [center[0], center[1] - .043 + i * .018, center[2] - .009 + i * .004], [-.24, 0, 0], .001);
}
function trigger(b, z = .027) {
  b.tube([[-.026,-.035,z+.038],[-.026,-.080,z+.024],[-.026,-.079,z-.033],[-.026,-.037,z-.045]], .005, M.receiver, 16);
  b.tube([[.026,-.035,z+.038],[.026,-.080,z+.024],[.026,-.079,z-.033],[.026,-.037,z-.045]], .005, M.receiver, 16);
  b.tube([[0,-.030,z-.008],[0,-.054,z-.009],[0,-.059,z+.002]], .0043, M.steel, 10);
}
function magazine(parent, kind) {
  const p = kind === 'pistol' ? [0,-.091,.069] : kind === 'sniper' ? [0,-.068,-.112] : [0,-.115,-.143];
  const g = child(parent, `${kind}_magazine`, p), b = new Batch(g);
  if (kind === 'rifle') {
    const s = new THREE.Shape();
    s.moveTo(-.041,.081); s.lineTo(.039,.081); s.bezierCurveTo(.038,.005,.054,-.053,.071,-.112);
    s.lineTo(-.015,-.121); s.bezierCurveTo(-.035,-.054,-.044,.020,-.041,.081); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: .041, bevelEnabled: true, bevelSegments: 2, bevelSize: .003, bevelThickness: .002 });
    // Profile runs longitudinally along Z, with width across X.
    geo.translate(0,0,-.0205); geo.rotateY(Math.PI/2); b.add(geo,M.olive);
    for (const x of [-.023,.023]) for (let i = 0; i < 3; i++) b.tube([[x,.045,-.020+i*.021],[x,-.025,-.017+i*.021],[x,-.087,-.033+i*.021]], .0025, M.rubber, 10);
    b.box(.052,.018,.091,M.rubber,[0,-.111,-.026],[.12,0,0]);
  } else if (kind === 'sniper') {
    b.box(.057,.104,.100,M.olive,[0,-.017,0],[-.05,0,0]);
    b.box(.066,.012,.112,M.rubber,[0,-.073,0]);
    for (let z=-.030;z<.05;z+=.025) b.box(.06,.071,.005,M.receiver,[0,-.018,z]);
  } else {
    b.box(.038,.110,.038,M.dark,[0,-.014,0],[-.24,0,0]);
    b.box(.054,.013,.058,M.olive,[0,-.072,-.006]);
  }
  b.finish(); g.userData.home = g.position.clone(); return g;
}
// A genuine open optic shell: outer wall plus reversed inner wall, no end caps.
function opticTube(b, rearRadius, frontRadius, length, material, p, wall = .003) {
  b.cylinder(rearRadius, length, material, p, [Math.PI / 2, 0, 0], frontRadius, 20, true);
  const inside = new THREE.CylinderGeometry(rearRadius - wall, frontRadius - wall, length, 20, 1, true);
  const index = inside.index.array;
  for (let i = 0; i < index.length; i += 3) { const swap = index[i]; index[i] = index[i + 2]; index[i + 2] = swap; }
  const normals = inside.attributes.normal.array;
  for (let i = 0; i < normals.length; i++) normals[i] *= -1;
  b.add(inside, material, p, [Math.PI / 2, 0, 0]);
}
function optic(b, kind) {
  if (kind === 'pistol') {
    b.box(.038,.016,.049,M.dark,[0,.068,.058]);
    for (const x of [-.022,.022]) b.box(.007,.043,.027,M.receiver,[x,.090,.050]);
    b.box(.050,.006,.028,M.receiver,[0,.111,.050]);
    b.add(new THREE.PlaneGeometry(.035,.033),M.opticGlass,[0,.090,.050]);
    b.ball(.0008,.0008,.0006,M.reticle,[0,.090,.052]);
    return;
  }
  if (kind === 'rifle') {
    b.box(.037,.021,.075,M.dark,[0,.086,-.075]);
    opticTube(b,.027,.027,.089,M.receiver,[0,.117,-.075]);
    ring(b,.025,.0037,M.rubber,[0,.117,-.120]); ring(b,.025,.0037,M.rubber,[0,.117,-.031]);
    b.add(new THREE.CircleGeometry(.022,24),M.opticGlass,[0,.117,-.121]);
    b.add(new THREE.CircleGeometry(.021,24),M.opticLens,[0,.117,-.030]);
    b.cylinder(.012,.016,M.dark,[.030,.117,-.072],[0,0,Math.PI/2]);
    b.box(.017,.016,.024,M.olive,[0,.150,-.073]);
  } else {
    for (const z of [-.10,.075]) { b.box(.047,.025,.039,M.dark,[0,.092,z]); ring(b,.025,.005,M.receiver,[0,.127,z]); }
    opticTube(b,.024,.024,.27,M.dark,[0,.128,-.035]);
    opticTube(b,.029,.041,.093,M.olive,[0,.128,-.203]);
    opticTube(b,.029,.029,.060,M.rubber,[0,.128,.116]);
    ring(b,.038,.004,M.receiver,[0,.128,-.251]); ring(b,.027,.004,M.receiver,[0,.128,.147]);
    b.add(new THREE.CircleGeometry(.034,24),M.opticGlass,[0,.128,-.253]);
    b.add(new THREE.CircleGeometry(.023,24),M.opticLens,[0,.128,.149]);
    b.cylinder(.017,.033,M.receiver,[0,.167,-.027],[0,0,0]);
    b.cylinder(.016,.032,M.receiver,[.038,.132,-.027],[0,0,Math.PI/2]);
    for(let i=0;i<10;i++) { const a=i*Math.PI/5; b.box(.004,.030,.003,M.steel,[Math.sin(a)*.018,.167,-.027+Math.cos(a)*.018],[0,-a,0],.0005); }
  }
}
function makeWeapon(parent, kind, withHands = true) {
  const root = child(parent, kind), b = new Batch(root);
  let muzzleZ;
  if (kind === 'pistol') {
    muzzleZ=-.219;
    b.box(.043,.049,.228,M.receiver,[0,.031,-.071],null,.004);
    b.box(.048,.024,.156,M.olive,[0,-.006,-.042],null,.004);
    b.box(.048,.027,.060,M.olive,[0,-.019,.045]);
    b.box(.037,.013,.150,M.steel,[0,.058,-.064]);
    for (const x of [-.024,.024]) for(let i=0;i<7;i++) b.box(.003,.033,.0035,M.dark,[x,.031,.006+i*.006],[-.20,0,0],.0005);
    b.box(.002,.018,.053,M.black,[.023,.036,-.028]);
    b.box(.003,.012,.038,M.steel,[.024,.037,-.024]);
    b.cylinder(.012,.034,M.steel,[0,.032,-.206]); barrelEnd(b,muzzleZ,.013);
    grip(b,[0,-.077,.044]); trigger(b,-.003); optic(b,kind);
    b.box(.032,.012,.029,M.dark,[0,.009,-.137]);
    b.box(.006,.012,.010,M.dark,[0,.064,-.166]);
    b.box(.007,.007,.015,M.steel,[-.028,-.012,.040]);
  } else {
    const sniper=kind==='sniper'; muzzleZ=sniper?-.905:-.666;
    b.box(.068,.076,.273,M.receiver,[0,.014,-.039],null,.007);
    b.box(.076,.045,.186,M.olive,[0,-.024,-.013],null,.005);
    // First-person view omits the shoulder stock behind the firing hand;
    // the full stock is retained on the world-carried weapon.
    if(!withHands){
    b.cylinder(.027,.275,M.dark,[0,.029,.164]);
    // Tapered stock, cheek riser and ribbed rubber shoulder pad.
    b.add(tapered(.048,.071,.090,.122),M.olive,[0,.003,.231]);
    b.box(.070,.057,.126,M.olive,[0,.042,.220],null,.009);
    b.box(.075,.133,.033,M.rubber,[0,-.012,.303],[.05,0,0],.009);
    for(let y=-.065;y<.05;y+=.017) b.box(.078,.004,.004,M.dark,[0,y,.322],null,.001);
    b.box(.053,.026,.030,M.dark,[0,-.070,.227]);
    }else{b.cylinder(.025,.10,M.dark,[0,.029,.078]);}
    grip(b); trigger(b); safetyDetails(b); picatinny(b,.063,-.21,.087,.041); optic(b,kind);
    if (!sniper) {
      b.box(.068,.069,.298,M.olive,[0,.022,-.335],null,.009);
      b.cylinder(.018,.252,M.steel,[0,.032,-.500]);
      b.cylinder(.023,.084,M.dark,[0,.032,-.613]);
      picatinny(b,.064,-.466,-.192,.039);
      for(const x of [-.036,.036]) {
        for(let z=-.445;z<-.225;z+=.044) {
          b.box(.003,.023,.026,M.black,[x,.029,z],null,.006);
          b.box(.005,.005,.025,M.edge,[x,.014,z],null,.001);
        }
        b.box(.008,.019,.129,M.receiver,[x,-.019,-.328]);
      }
      for(let z=-.438;z<-.225;z+=.025) b.box(.074,.004,.009,M.rubber,[0,-.014,z]);
      b.box(.028,.045,.035,M.dark,[0,.074,-.464]);
      b.box(.007,.040,.014,M.steel,[0,.096,-.464]);
      barrelEnd(b,muzzleZ,.023);
      for(let i=0;i<3;i++) for(const x of [-.021,.021]) b.box(.003,.011,.009,M.black,[x,.032,-.653+i*.015]);
    } else {
      b.box(.070,.065,.377,M.olive,[0,.012,-.347],null,.011);
      b.cylinder(.017,.457,M.steel,[0,.032,-.655]);
      b.cylinder(.022,.062,M.receiver,[0,.032,-.548]);
      b.cylinder(.026,.077,M.dark,[0,.032,-.872]);
      for(const x of [-.037,.037]) for(let z=-.491;z<-.235;z+=.051) b.box(.003,.022,.034,M.black,[x,.019,z],null,.005);
      picatinny(b,.050,-.514,-.190,.038);
      b.tube([[.035,.035,.020],[.072,.004,.052],[.077,-.027,.051]],.006,M.steel,12);
      b.ball(.014,.017,.014,M.rubber,[.077,-.036,.051]);
      // Folded bipod legs under the handguard.
      for(const x of [-.033,.033]) {
        b.limb([x,-.032,-.459],[x*1.22,-.048,-.278],.010,M.receiver,.008);
        b.box(.019,.016,.039,M.rubber,[x*1.22,-.049,-.275]);
      }
      barrelEnd(b,muzzleZ,.026);
    }
  }
  if (!withHands) b.consolidate([[M.steel,M.receiver],[M.edge,M.olive],[M.lens,M.glass],[M.opticLens,M.opticGlass],[M.rubber,M.dark],[M.black,M.dark]]);
  b.finish();
  const mag=magazine(root,kind);
  const bolt=child(root,`${kind}_action`), action=new Batch(bolt);
  action.box(.006,.012,kind==='pistol'?.038:.056,M.steel,[kind==='pistol'?.025:.045,.037,kind==='pistol'?-.022:.002]); action.finish();
  let right=null, support=null;
  if(withHands) { right=makeGripHand(root,kind); support=makeSupportHand(root,kind); }
  root.userData.parts={mag,bolt,right,support,muzzleZ};
  root.userData.muzzlePosition=new THREE.Vector3(0,.032,muzzleZ);
  root.userData.sightHeight=kind==='pistol'?.090:kind==='rifle'?.117:.128;
  return root;
}
function armSleeve(b, wrist, elbow, right) {
  b.limb(wrist,elbow,.038,M.cloth,.057);
  b.ball(.041,.035,.040,M.webbing,wrist);
  // Folded cuff and seam, running into the sleeve instead of floating alongside it.
  const mid=V(wrist).lerp(V(elbow),.2);
  b.ball(.043,.039,.042,M.cloth,mid.toArray());
  b.tube([wrist,[mid.x+(right?.031:-.031),mid.y,mid.z],elbow],.0018,M.webbing,9);
}
function makeGripHand(parent,kind) {
  const g=child(parent,'right_gloved_hand'),b=new Batch(g);
  const dz=kind==='pistol'?-.015:0, y=kind==='pistol'?.010:0;
  const off=p=>[p[0],p[1]+y,p[2]+dz];
  b.ball(.031,.050,.041,M.glove,off([.036,-.100,.060]),[-.22,.12,-.20]);
  b.ball(.020,.042,.030,M.glovePad,off([.060,-.099,.065]),[-.2,0,0]);
  for(let i=0;i<4;i++) {
    const fy=-.062-i*.023;
    const a=off([.056,fy,.031]), c=off([.037,fy-.005,-.003]), d=off([.002,fy-.009,-.009]),e=off([-.016,fy-.007,.011]);
    b.limb(a,c,.0082,M.glove); b.limb(c,d,.008,M.glove); b.limb(d,e,.0074,M.glovePad);
    b.ball(.010,.008,.011,M.glovePad,a);
  }
  b.limb(off([.029,-.063,.087]),off([-.022,-.049,.075]),.012,M.glove);
  b.limb(off([-.022,-.049,.075]),off([-.035,-.066,.029]),.0095,M.glove);
  const wrist=off([.053,-.162,.111]), elbow=off([.164,-.302,.340]);
  b.limb(off([.045,-.128,.076]),wrist,.028,M.glove,.026); armSleeve(b,wrist,elbow,true);
  b.finish(); return g;
}
function makeSupportHand(parent,kind) {
  const g=child(parent,'support_gloved_hand'),b=new Batch(g);
  if(kind==='pistol') {
    b.ball(.026,.044,.038,M.glove,[-.033,-.102,.057],[0,0,-.15]);
    for(let i=0;i<4;i++) {
      const y=-.060-i*.021;
      b.limb([-.046,y,.032],[-.028,y-.002,-.016],.008,M.glove);
      b.limb([-.028,y-.002,-.016],[.001,y-.004,-.020],.0076,M.glovePad);
    }
    b.limb([-.040,-.060,.068],[-.037,-.034,.005],.010,M.glove);
    b.limb([-.037,-.034,.005],[-.033,-.031,-.040],.009,M.glove);
    armSleeve(b,[-.047,-.161,.117],[-.177,-.288,.335],false);
  } else {
    const z=kind==='sniper'?-.381:-.338;
    b.ball(.039,.027,.060,M.glove,[-.037,-.048,z],[0,0,.22]);
    b.ball(.022,.028,.047,M.glovePad,[-.062,-.043,z]);
    for(let i=0;i<4;i++) {
      const fz=z-.042+i*.025;
      b.limb([-.060,-.035,fz],[-.058,.002,fz],.0087,M.glove);
      b.limb([-.058,.002,fz],[-.040,.024,fz],.008,M.glovePad);
      b.limb([-.040,.024,fz],[-.025,.020,fz+.001],.007,M.glove);
    }
    b.limb([-.028,-.064,z+.047],[.015,-.045,z+.059],.011,M.glove);
    b.limb([.015,-.045,z+.059],[.027,-.009,z+.059],.0095,M.glove);
    b.limb([-.039,-.064,z+.051],[-.065,-.122,z+.130],.027,M.glove,.029);
    armSleeve(b,[-.065,-.122,z+.130],[-.168,-.287,.236],false);
  }
  b.finish(); g.userData.home=g.position.clone(); return g;
}

/** Camera-space arsenal. animate never changes group position or muzzle visibility. */
export function createArsenal(camera) {
  const group=new THREE.Group(); group.name='sunfall_first_person_arsenal';
  if(camera) camera.add(group);
  const models={pistol:makeWeapon(group,'pistol'),rifle:makeWeapon(group,'rifle'),sniper:makeWeapon(group,'sniper')};
  const muzzle=new THREE.Group(); muzzle.name='muzzle_flash'; muzzle.visible=false; group.add(muzzle);
  const flame=new THREE.Mesh(new THREE.ConeGeometry(.040,.150,9,1,true),new THREE.MeshBasicMaterial({color:0xffb94f,transparent:true,opacity:.86,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  flame.rotation.x=-Math.PI/2; flame.position.z=-.057; muzzle.add(flame);
  const core=new THREE.Mesh(new THREE.ConeGeometry(.018,.100,7,1,true),new THREE.MeshBasicMaterial({color:0xfff5c6,transparent:true,opacity:.96,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  core.rotation.x=-Math.PI/2; core.position.z=-.035; muzzle.add(core);
  let current='rifle';
  for(const [name,model] of Object.entries(models)) model.visible=name===current;
  muzzle.position.set(0,.032,models[current].userData.parts.muzzleZ);
  function animate(dt,state={}) {
    const {time=0,weapon='rifle',aim=false,reloadProgress=0,fireKick=0,moving=false}=state;
    const name=typeof weapon==='string'?weapon:(weapon?.id||weapon?.name||'rifle');
    current=models[name]?name:'rifle';
    const model=models[current],parts=model.userData.parts;
    for(const [key,item] of Object.entries(models)) item.visible=key===current;
    const a=typeof aim==='number'?clamp(aim,0,1):(aim?1:0);
    const progress=clamp(reloadProgress||0,0,1);
    const active=progress>0&&progress<1;
    const lower=active?Math.sin(Math.PI*progress):0;
    const sway=moving?.0028:.0006;
    // Fine local motion only: the caller retains ownership of camera recoil and ADS offset.
    model.position.set(Math.sin(time*6.5)*sway*(1-a*.85),-Math.abs(Math.sin(time*6.5))*sway-lower*.035,0);
    model.rotation.set(lower*.20,Math.sin(time*3.3)*.003*(1-a),-lower*.22);
    const out=active?Math.sin(Math.PI*clamp((progress-.1)/.66,0,1)):0;
    parts.mag.position.copy(parts.mag.userData.home);
    parts.mag.position.y-=out*.155; parts.mag.position.z+=out*.043; parts.mag.rotation.x=out*.18;
    if(parts.support) {
      parts.support.position.copy(parts.support.userData.home);
      parts.support.position.y-=out*.170; parts.support.position.z+=out*(current==='pistol'?.065:.21);
      parts.support.position.x+=out*.033; parts.support.rotation.set(out*.25,0,out*.16);
    }
    parts.bolt.position.z=clamp(fireKick,0,1)*.026;
    muzzle.position.set(model.position.x,.032+model.position.y,parts.muzzleZ);
    muzzle.rotation.z=time*19;
  }
  return {group,models,muzzle,animate};
}

/** Full third-person firearm, without first-person arms. Forward is local −Z. */
export function createWorldWeapon(kind='rifle') {
  const holder=new THREE.Group();
  const weapon=makeWeapon(holder,['rifle','sniper','pistol'].includes(kind)?kind:'rifle',false);
  holder.remove(weapon);
  return weapon;
}
