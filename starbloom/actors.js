/**
 * STARBLOOM actors. Original procedural models, local up +Y and forward +Z.
 * Each factory owns its resources. No textures, DOM, globals, or external assets.
 * API: createPlayer(THREE), createEnemy(THREE, 'beetle'|'spitter'|'brute').
 */

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function workshop(THREE, name) {
  const group = new THREE.Group();
  group.name = name;
  const geometries = new Set();
  const materials = new Set();
  const geometry = g => (geometries.add(g), g);
  const material = (color, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.12, ...extra });
    materials.add(m);
    return m;
  };
  const sphereGeo = geometry(new THREE.SphereGeometry(1, 28, 20));
  const sphere = (parent, mat, position, scale) => {
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const mesh = (parent, geo, mat, position = [0,0,0]) => {
    const m = new THREE.Mesh(geometry(geo), mat);
    m.position.set(...position);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const pivot = (parent, name, position = [0,0,0]) => {
    const p = new THREE.Group(); p.name = name; p.position.set(...position); parent.add(p); return p;
  };
  const capsule = (parent, mat, radius, length, position = [0,0,0]) => {
    if (THREE.CapsuleGeometry) return mesh(parent, new THREE.CapsuleGeometry(radius, Math.max(0, length - radius * 2), 7, 18), mat, position);
    const points = [];
    const half = Math.max(0, length * .5 - radius);
    for (let i=0;i<=8;i++) { const a=-Math.PI/2+i/8*Math.PI/2; points.push(new THREE.Vector2(Math.cos(a)*radius,-half+Math.sin(a)*radius)); }
    for (let i=0;i<=8;i++) { const a=i/8*Math.PI/2; points.push(new THREE.Vector2(Math.cos(a)*radius,half+Math.sin(a)*radius)); }
    return mesh(parent,new THREE.LatheGeometry(points,20),mat,position);
  };
  const bone = (parent, mat, a, b, r1, r2 = r1) => {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), d = bv.clone().sub(av);
    const m = mesh(parent, new THREE.CylinderGeometry(r2, r1, d.length(), 16, 1), mat);
    m.position.copy(av).add(bv).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
    return m;
  };
  const ring = (parent, mat, radius, tube, position, scale = [1,1,1], arc = TAU) => {
    const m=mesh(parent,new THREE.TorusGeometry(radius,tube,8,48,arc),mat,position); m.scale.set(...scale); return m;
  };
  const tube = (parent, mat, points, radius, radiusEnd = radius, segments = 28) => {
    const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const geo=new THREE.TubeGeometry(path,segments,1,8,false);
    const pos=geo.attributes.position;
    for(let i=0;i<=segments;i++) {
      const center=path.getPointAt(i/segments);
      const r=radius+(radiusEnd-radius)*i/segments;
      for(let j=0;j<=8;j++) {
        const k=i*9+j;
        pos.setXYZ(k,center.x+(pos.getX(k)-center.x)*r,center.y+(pos.getY(k)-center.y)*r,center.z+(pos.getZ(k)-center.z)*r);
      }
    }
    geo.computeVertexNormals(); return mesh(parent,geo,mat);
  };
  const lathe = (parent, mat, points, position=[0,0,0]) => mesh(parent,new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),36),mat,position);
  // Batch static pieces by material inside each articulated node. This retains
  // every joint and the independently animated eyes/flash, while reducing draws.
  const optimize = () => {
    const nodes=[]; group.traverse(o=>{if(o.isGroup)nodes.push(o);});
    for(const node of nodes) {
      const batches=new Map();
      for(const child of node.children) {
        if(!child.isMesh || child.userData.keepAnimated || !child.visible)continue;
        if(!batches.has(child.material))batches.set(child.material,[]);
        batches.get(child.material).push(child);
      }
      for(const [mat,parts] of batches) {
        if(parts.length<2)continue;
        const chunks=[],counts={position:0,normal:0,uv:0};
        for(const part of parts) {
          part.updateMatrix();
          const g=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();
          g.applyMatrix4(part.matrix);
          for(const key of Object.keys(counts))counts[key]+=g.attributes[key]?.array.length||0;
          chunks.push(g);
        }
        const g=new THREE.BufferGeometry();
        for(const key of Object.keys(counts)) {
          if(!counts[key] || chunks.some(c=>!c.attributes[key]))continue;
          const data=new Float32Array(counts[key]);let offset=0;
          for(const c of chunks){data.set(c.attributes[key].array,offset);offset+=c.attributes[key].array.length;}
          g.setAttribute(key,new THREE.BufferAttribute(data,key==='uv'?2:3));
        }
        g.computeBoundingSphere();
        const merged=new THREE.Mesh(geometry(g),mat);merged.name='Batched '+node.name;merged.castShadow=true;merged.receiveShadow=true;
        parts.forEach(part=>node.remove(part));node.add(merged);chunks.forEach(c=>c.dispose());
      }
    }
  };
  const dispose = () => {
    if (group.userData.disposed) return;
    group.userData.disposed = true;
    geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
    geometries.clear(); materials.clear(); group.removeFromParent();
  };
  return { group, sphere, mesh, pivot, capsule, bone, ring, tube, lathe, material, dispose, optimize, materials };
}

function damageTint(materials, state, dt, current) {
  const target = state.hurt ? 1 : 0;
  const flash = current + (target-current)*Math.min(1,dt*20);
  for (const m of materials) {
    if (!m.userData.baseEmissive) {
      m.userData.baseEmissive=m.emissive.clone();
      m.userData.baseEmissiveIntensity=m.emissiveIntensity;
    }
    m.emissive.copy(m.userData.baseEmissive).lerp(_damageColor(m),flash*.70);
    m.emissiveIntensity=(m.userData.pulseIntensity ?? m.userData.baseEmissiveIntensity)+flash*.70;
  }
  return flash;
}
function _damageColor(m) { return m.userData.damageColor || (m.userData.damageColor=m.color.clone().set(0xff7c65)); }

/** Height approximately 1.6 units, feet at y=0. `muzzle` points down local +Z. */
export function createPlayer(THREE) {
  const w=workshop(THREE,'Starbloom Ranger');
  const {group,sphere,mesh,pivot,capsule,bone,ring,tube,lathe,material}=w;
  const white=material(0xf3f5e8,{roughness:.32,metalness:.18});
  const teal=material(0x16aa9f,{roughness:.24,metalness:.30});
  const turquoise=material(0x83f5d9,{roughness:.24,metalness:.26});
  const dark=material(0x12363d,{roughness:.47,metalness:.12});
  const visor=material(0x092a39,{roughness:.12,metalness:.55});
  const coral=material(0xff7666,{roughness:.49,metalness:.02});
  const gold=material(0xffc96b,{roughness:.3,metalness:.48});
  const glow=material(0xc9fff3,{emissive:0x60ffe0,emissiveIntensity:1.55,roughness:.20,metalness:.08});
  const glassLight=material(0x8de5df,{emissive:0x3bd4d0,emissiveIntensity:.25,roughness:.17,metalness:.1});
  const body=pivot(group,'Animated suit');

  // A tailored, softly tapered suit with actual articulated joints.
  const torso=lathe(body,white,[[0,0],[.14,0],[.185,.025],[.204,.11],[.236,.26],[.218,.35],[.155,.40],[0,.40]],[0,.48,0]);
  torso.scale.z=.79;
  sphere(body,dark,[0,.495,0],[.18,.11,.135]);
  ring(body,teal,.171,.026,[0,.52,0],[1,.80,1]).rotation.x=Math.PI/2;
  sphere(body,teal,[0,.742,.151],[.16,.146,.032]);
  sphere(body,white,[0,.764,.177],[.115,.099,.018]);
  // Star chest badge, made from a clean bevelled five-point shape.
  const star=new THREE.Shape();
  for(let i=0;i<10;i++) { const a=Math.PI/2+i*Math.PI/5,r=i%2?.018:.036; i?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r); } star.closePath();
  mesh(body,new THREE.ExtrudeGeometry(star,{depth:.008,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.003,bevelThickness:.003}),gold,[0,.783,.196]);
  for(const x of [-.152,.152]) {
    tube(body,dark,[[x,.867,.113],[x*.90,.76,.176],[x*.82,.58,.12]],.015,.015,16);
    sphere(body,gold,[x*.91,.675,.164],[.022,.024,.009]);
  }
  const backpack=pivot(body,'Twin-cell life support',[0,.714,-.158]);
  capsule(backpack,teal,.096,.30,[0,0,-.053]);
  for(const side of [-1,1]) {
    capsule(backpack,white,.048,.228,[side*.101,-.005,-.06]);
    ring(backpack,dark,.049,.01,[side*.101,.037,-.06]).rotation.x=Math.PI/2;
    sphere(backpack,glow,[side*.101,-.11,-.058],[.029,.017,.029]);
  }

  const legs=[];
  for(const side of [-1,1]) {
    const hip=pivot(body,side<0?'Left hip':'Right hip',[side*.108,.501,0]);
    sphere(hip,dark,[0,-.025,0],[.078,.075,.080]);
    capsule(hip,white,.074,.224,[0,-.119,0]);
    const knee=pivot(hip,'Knee',[0,-.227,0]);
    sphere(knee,dark,[0,0,0],[.063,.060,.065]);
    sphere(knee,teal,[0,.005,.053],[.060,.056,.029]);
    capsule(knee,white,.060,.164,[0,-.086,0]);
    const boot=pivot(knee,'Boot',[0,-.191,.033]);
    sphere(boot,teal,[0,-.016,.005],[.084,.055,.132]);
    sphere(boot,white,[0,.012,.024],[.080,.059,.132]);
    capsule(boot,teal,.062,.087,[0,.049,-.026]);
    tube(boot,gold,[[-.047,.040,.100],[0,.048,.119],[.047,.040,.100]],.010,.010,10);
    legs.push({hip,knee,boot,side});
  }

  // Scarf sits under helmet. The trailing end is a tapered curved fabric strip.
  ring(body,coral,.134,.041,[0,.921,.0],[1,.90,1]).rotation.x=Math.PI/2;
  sphere(body,coral,[-.122,.90,.094],[.07,.046,.035]);
  const scarf=pivot(body,'Floating scarf',[-.145,.908,.03]);
  const ribbon=new THREE.Shape();
  ribbon.moveTo(0,.04);ribbon.bezierCurveTo(-.13,.028,-.16,-.06,-.28,-.07);ribbon.lineTo(-.252,-.104);ribbon.lineTo(-.293,-.142);ribbon.bezierCurveTo(-.16,-.17,-.12,-.038,0,-.04);ribbon.closePath();
  const ribbonMesh=mesh(scarf,new THREE.ExtrudeGeometry(ribbon,{depth:.022,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:3,steps:1}),coral); ribbonMesh.rotation.y=.55;

  const head=pivot(body,'Helmet',[0,1.17,0]);
  sphere(head,teal,[0,0,0],[.333,.302,.297]);
  sphere(head,white,[0,-.191,.036],[.269,.099,.250]);
  // Wide inset faceplate, not a tiny face pasted onto a spherical head.
  sphere(head,dark,[0,.012,.238],[.292,.218,.081]);
  sphere(head,visor,[0,.014,.265],[.268,.194,.070]);
  ring(head,turquoise,.241,.012,[0,.017,.289],[1.145,.797,1]);
  tube(head,glassLight,[[-.218,.112,.302],[-.175,.155,.317],[-.104,.175,.321]],.007,.003,14);
  sphere(head,glassLight,[-.17,.133,.321],[.016,.022,.004]);
  const eyes=[];
  for(const side of [-1,1]) {
    const eye=sphere(head,glow,[side*.094,.016,.329],[.029,.052,.008]); eye.userData.keepAnimated=true; eyes.push(eye);
    sphere(head,turquoise,[side*.153,-.067,.313],[.017,.008,.006]);
  }
  tube(head,turquoise,[[-.024,-.072,.332],[0,-.079,.334],[.024,-.072,.332]],.004,.004,10);
  for(const side of [-1,1]) {
    const ear=sphere(head,white,[side*.309,-.013,-.011],[.050,.098,.084]);
    ring(head,gold,.040,.009,[side*.349,-.013,.0]).rotation.y=Math.PI/2;
    sphere(head,teal,[side*.357,-.013,0],[.009,.038,.038]);
  }
  // Swept crescent beacon is the ranger's identifying silhouette.
  tube(head,gold,[[.077,.268,-.046],[.10,.327,-.041],[.136,.343,-.041]],.013,.010,12);
  const crescent=ring(head,gold,.058,.014,[.150,.349,-.039],[1,1,.75],Math.PI*1.49);
  crescent.rotation.z=.72;
  sphere(head,glow,[.187,.379,-.04],[.019,.019,.015]);
  tube(head,white,[[-.21,.217,-.08],[-.08,.288,-.071],[.061,.285,-.065]],.016,.012,18);

  const arms=[];
  for(const side of [-1,1]) {
    const shoulder=pivot(body,side<0?'Left shoulder':'Blaster shoulder',[side*.245,.848,.005]);
    sphere(shoulder,dark,[0,-.035,0],[.083,.078,.078]);
    sphere(shoulder,white,[side*.024,-.026,.005],[.095,.092,.090]);
    sphere(shoulder,teal,[side*.074,-.018,.005],[.025,.064,.060]);
    capsule(shoulder,white,.063,.207,[side*.014,-.135,0]);
    const elbow=pivot(shoulder,'Elbow',[side*.017,-.224,0]);
    sphere(elbow,dark,[0,0,0],[.052,.054,.055]);
    capsule(elbow,teal,.061,.175,[0,-.105,0]);
    ring(elbow,gold,.058,.011,[0,-.148,0]).rotation.x=Math.PI/2;
    sphere(elbow,white,[0,-.197,.005],[.065,.059,.061]);
    arms.push({shoulder,elbow,side});
  }
  const gun=pivot(arms[1].elbow,'Comet blaster',[.009,-.20,.043]);
  gun.rotation.x=1.30;
  const housing=capsule(gun,white,.086,.245,[0,.043,.064]); housing.rotation.x=Math.PI/2;
  sphere(gun,teal,[0,.068,.028],[.080,.065,.12]);
  const barrel=capsule(gun,dark,.050,.175,[0,.051,.211]);barrel.rotation.x=Math.PI/2;
  const muzzleRing=ring(gun,gold,.052,.014,[0,.051,.276]);
  ring(gun,turquoise,.035,.009,[0,.051,.292]);
  sphere(gun,glow,[0,.051,.286],[.025,.025,.009]);
  const grip=capsule(gun,dark,.037,.125,[0,-.037,.004]);grip.rotation.x=-.27;
  for(const side of [-1,1]) {
    sphere(gun,coral,[side*.077,.045,.077],[.011,.033,.056]);
    tube(gun,gold,[[side*.079,.051,.019],[side*.085,.07,.096],[side*.066,.067,.161]],.005,.005,12);
  }
  sphere(gun,glow,[0,.128,.065],[.020,.013,.047]);
  const muzzle=pivot(gun,'Muzzle',[0,.051,.315]);
  const muzzleFlash=sphere(muzzle,glow,[0,0,.026],[.055,.055,.095]); muzzleFlash.visible=false; muzzleFlash.userData.keepAnimated=true;

  let flash=0, clock=0;
  const animate=(dt,time,state={})=>{
    dt=clamp(Number(dt)||0,0,.08); clock=Number.isFinite(time)?time:clock+dt;
    const moving=state.moving?1:0, dash=state.dashing?1:0, shooting=state.shooting?1:0;
    const stride=Math.sin(clock*(dash?22:12));
    body.position.y=moving?Math.abs(stride)*.024:Math.sin(clock*2.5)*.009;
    body.rotation.z=(moving?stride*.024:Math.sin(clock*1.4)*.013)*(1-dash);
    body.rotation.x=dash?-.23:0;
    body.scale.set(1+dash*.04,1-dash*.08,1+dash*.04);
    head.rotation.y=Math.sin(clock*1.1)*.025*(1-shooting);
    head.rotation.x=-dash*.08;
    legs.forEach(({hip,knee,boot,side})=>{
      hip.rotation.x=stride*.60*moving*side;
      knee.rotation.x=Math.max(0,-stride*side)*.64*moving;
      boot.rotation.x=-hip.rotation.x*.20-knee.rotation.x*.22;
    });
    arms[0].shoulder.rotation.x=-stride*.40*moving-.12;
    arms[0].shoulder.rotation.z=.10+dash*.20;
    arms[0].elbow.rotation.x=-.23-Math.max(0,stride)*.30*moving;
    arms[1].shoulder.rotation.x=-.60-shooting*.08;
    arms[1].shoulder.rotation.z=-.09;
    arms[1].elbow.rotation.x=-.70+shooting*.08;
    gun.position.z=.043-(shooting?Math.max(0,Math.sin(clock*44))*.035:0);
    scarf.rotation.y=.18+Math.sin(clock*8)*(.12+moving*.14)+dash*.65;
    scarf.rotation.z=Math.sin(clock*6)*.045+dash*.2;
    const blinkPhase=clock%4.7;
    const blink=blinkPhase>4.53?Math.max(.1,Math.abs(blinkPhase-4.615)/.085):1;
    eyes.forEach(e=>e.scale.y=.052*blink);
    muzzleFlash.visible=!!shooting&&Math.sin(clock*45)>.55;
    muzzleFlash.scale.set(.055*(.8+Math.sin(clock*73)*.2),.055*(.8+Math.cos(clock*67)*.2),.095);
    flash=damageTint(w.materials,state,dt,flash);
  };
  group.userData.kind='player';group.userData.height=1.60;
  animate(0,0,{});
  w.optimize();
  return {group,animate,dispose:w.dispose,muzzle};
}

function makeBeetle(THREE) {
  const w=workshop(THREE,'Velvet beetle');
  const {group,pivot,sphere,bone,tube,material,mesh}=w;
  const shell=material(0x7751b5,{roughness:.27,metalness:.30});
  const trim=material(0xc996f4,{roughness:.28,metalness:.20});
  const dark=material(0x302944,{roughness:.43});
  const foot=material(0xa66cdf,{roughness:.33,metalness:.22});
  const lime=material(0xd5ff93,{emissive:0x9aff50,emissiveIntensity:1.3,roughness:.27});
  const body=pivot(group,'Beetle carapace',[0,.265,0]);
  sphere(body,dark,[0,-.02,0],[.269,.146,.335]);
  const carapace=mesh(body,new THREE.SphereGeometry(1,36,20,0,TAU,0,Math.PI*.54),shell);
  carapace.scale.set(.297,.231,.361);
  tube(body,dark,[[0,.039,.351],[0,.181,.225],[0,.230,0],[0,.18,-.22],[0,.031,-.351]],.010,.010,30);
  for(const side of [-1,1]) {
    tube(body,trim,[[side*.062,.041,.343],[side*.167,.168,.207],[side*.231,.16,-.005],[side*.172,.122,-.248]],.013,.006,25);
    tube(body,trim,[[side*.238,.090,.158],[side*.277,.063,0],[side*.237,.047,-.189]],.012,.008,18);
    sphere(body,lime,[side*.167,.190,.112],[.015,.008,.025]);
  }
  const head=pivot(body,'Beetle face',[0,-.008,.292]);
  sphere(head,foot,[0,0,.016],[.185,.142,.121]);
  sphere(head,dark,[0,-.013,.089],[.150,.092,.049]);
  for(const side of [-1,1]) {
    sphere(head,lime,[side*.086,.024,.126],[.040,.044,.018]);
    tube(head,trim,[[side*.082,-.079,.090],[side*.115,-.092,.150],[side*.063,-.062,.182]],.024,.007,18);
    tube(head,shell,[[side*.100,.091,.022],[side*.156,.220,.021],[side*.177,.255,.063]],.014,.005,18);
    sphere(head,lime,[side*.177,.255,.063],[.019,.025,.019]);
  }
  const legs=[];
  for(const side of [-1,1])for(let j=0;j<3;j++) {
    const z=.205-j*.205;
    const root=pivot(body,'Beetle leg',[side*.205,-.048,z]);
    const outer=[side*(.118+(j===1?.035:0)),-.032,.032*(1-j)];
    const end=[side*(.18+(j===1?.03:0)),-.201,.061*(1-j)];
    bone(root,dark,[0,0,0],outer,.038,.026);
    sphere(root,trim,outer,[.034,.032,.037]);
    tube(root,foot,[outer,[end[0]*.96,-.158,end[2]],end],.032,.013,15);
    sphere(root,dark,[end[0],end[1]+.002,end[2]+.01],[.035,.025,.043]);
    legs.push({root,side,j});
  }
  w.optimize();
  let flash=0,clock=0;
  return {group,dispose:w.dispose,animate(dt,time,state={}) {
    dt=clamp(Number(dt)||0,0,.08);clock=Number.isFinite(time)?time:clock+dt;
    const moving=state.moving?1:0;
    body.position.y=.265+Math.sin(clock*11)*.012*moving;
    body.rotation.z=Math.sin(clock*11)*.03*moving;
    body.rotation.x=state.attacking?-.12:Math.sin(clock*2)*.015;
    legs.forEach(({root,side,j})=>{const p=clock*13+j*Math.PI*.8+side;root.rotation.y=Math.sin(p)*.28*moving;root.rotation.z=Math.cos(p)*.15*moving*side;});
    head.rotation.x=Math.sin(clock*3)*.04-(state.attacking?.12:0);
    flash=damageTint(w.materials,state,dt,flash);
  }};
}

// A curved, solid, bevel-like petal. Surface curvature gives a readable blade
// silhouette rather than using scaled spheres for the flower's structural parts.
function petalGeometry(THREE,length,width,curve) {
  const p=[],uv=[],indices=[];const rows=14,cols=10;
  for(let side=0;side<2;side++)for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++) {
    const u=i/rows,v=j/cols*2-1;
    const taper=Math.pow(Math.sin(Math.PI*u),.66);
    const x=v*width*taper;
    const y=u*length;
    const z=Math.sin(Math.PI*u)*curve+(1-v*v)*taper*.020+(side===0?.010:-.010)*Math.sin(Math.PI*u);
    p.push(x,y,z);uv.push(j/cols,u);
  }
  const stride=cols+1,N=(rows+1)*stride;
  for(let side=0;side<2;side++)for(let i=0;i<rows;i++)for(let j=0;j<cols;j++) {
    const a=side*N+i*stride+j,b=a+1,c=a+stride,d=c+1;
    if(side===0)indices.push(a,b,c,b,d,c);else indices.push(a,c,b,b,c,d);
  }
  for(let i=0;i<rows;i++)for(const j of [0,cols]) {
    const a=i*stride+j,b=(i+1)*stride+j;
    indices.push(a,b,a+N,b,b+N,a+N);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

function makeSpitter(THREE) {
  const w=workshop(THREE,'Solar blossom sentry');
  const {group,pivot,sphere,tube,ring,lathe,material,mesh}=w;
  const orange=material(0xff9547,{roughness:.28,metalness:.28});
  const petalLight=material(0xffc174,{roughness:.33,metalness:.22,side:THREE.DoubleSide});
  const copper=material(0xab523b,{roughness:.35,metalness:.5});
  const dark=material(0x492d30,{roughness:.39,metalness:.24});
  const leafMat=material(0x608f70,{roughness:.43,metalness:.23,side:THREE.DoubleSide});
  const glow=material(0xffe6a1,{emissive:0xffa833,emissiveIntensity:1.5,roughness:.24});
  const base=pivot(group,'Root chassis');
  lathe(base,copper,[[0,0],[.07,0],[.145,.025],[.144,.078],[.097,.135],[.047,.162],[0,.164]],[0,.024,-.028]);
  ring(base,dark,.112,.012,[0,.079,-.028]).rotation.x=Math.PI/2;
  for(let i=0;i<3;i++) {
    const a=i*TAU/3+.35,x=Math.sin(a),z=Math.cos(a);
    tube(base,dark,[[x*.087,.105,z*.087-.028],[x*.160,.061,z*.160-.028],[x*.196,.029,z*.196-.028]],.034,.016,15);
    sphere(base,orange,[x*.191,.029,z*.191-.028],[.042,.025,.041]);
  }
  const stem=pivot(base,'Flexible stem',[0,.147,-.028]);
  tube(stem,leafMat,[[0,0,0],[.023,.16,-.033],[0,.343,.024]],.055,.041,26);
  for(let i=0;i<3;i++)ring(stem,copper,.050-i*.002,.012,[.01,.057+i*.071,-.012]).rotation.x=Math.PI/2;
  for(const side of [-1,1]) {
    const leaf=pivot(stem,'Curled leaf',[side*.022,.095,-.008]);leaf.rotation.z=-side*.83;leaf.rotation.y=side*.42;
    mesh(leaf,petalGeometry(THREE,.240,.065,.072),leafMat);
    tube(leaf,orange,[[0,.015,.009],[0,.12,.089],[0,.221,.045]],.005,.002,14);
  }
  const crown=pivot(stem,'Flower head',[0,.345,.035]);
  sphere(crown,copper,[0,0,-.027],[.113,.113,.066]);
  const petals=[];
  for(let i=0;i<7;i++) {
    const a=i*TAU/7;
    const p=pivot(crown,'Sculpted petal',[Math.sin(a)*.063,Math.cos(a)*.063,0]);
    p.rotation.z=-a;
    mesh(p,petalGeometry(THREE,.224,.063,.028),i%2?orange:petalLight);
    tube(p,copper,[[0,.012,.017],[0,.103,.064],[0,.198,.032]],.004,.0015,14);
    petals.push({p,a});
  }
  ring(crown,copper,.098,.022,[0,0,.034]);
  sphere(crown,glow,[0,0,.053],[.087,.087,.045]);
  ring(crown,orange,.058,.013,[0,0,.091]);
  sphere(crown,dark,[0,0,.100],[.047,.047,.015]);
  ring(crown,glow,.034,.007,[0,0,.115]);
  sphere(crown,glow,[0,0,.116],[.023,.023,.009]);
  for(let i=0;i<6;i++){const a=i*TAU/6;sphere(crown,dark,[Math.sin(a)*.080,Math.cos(a)*.080,.077],[.009,.009,.005]);}
  w.optimize();
  let flash=0,clock=0;
  return {group,dispose:w.dispose,animate(dt,time,state={}) {
    dt=clamp(Number(dt)||0,0,.08);clock=Number.isFinite(time)?time:clock+dt;
    stem.rotation.z=Math.sin(clock*2.5)*.055;
    stem.rotation.x=Math.sin(clock*1.9)*.035;
    crown.rotation.z=Math.sin(clock*1.7)*.045;
    crown.position.z=.035+(state.attacking?Math.sin(clock*21)*.025:0);
    petals.forEach(({p,a})=>p.rotation.x=Math.sin(clock*2+a)*.075+(state.attacking?-.16:0));
    glow.userData.pulseIntensity=1.3+Math.sin(clock*3)*.3+(state.attacking?.65:0);
    flash=damageTint(w.materials,state,dt,flash);
  }};
}

function makeBrute(THREE) {
  const w=workshop(THREE,'Tidal claw guardian');
  const {group,pivot,sphere,bone,tube,ring,mesh,material}=w;
  const blue=material(0x347ba8,{roughness:.29,metalness:.33});
  const light=material(0x77c7d1,{roughness:.30,metalness:.29});
  const dark=material(0x173e55,{roughness:.47,metalness:.20});
  const boneMat=material(0xe6dabe,{roughness:.39,metalness:.14});
  const coral=material(0xf08673,{roughness:.30,metalness:.22});
  const eye=material(0xffd286,{emissive:0xffaa49,emissiveIntensity:1.4,roughness:.22});
  const body=pivot(group,'Heavy carapace',[0,.591,-.018]);
  sphere(body,dark,[0,-.064,0],[.370,.218,.295]);
  const shell=mesh(body,new THREE.SphereGeometry(1,40,22,0,TAU,0,Math.PI*.58),blue,[0,.009,-.018]);shell.scale.set(.432,.325,.353);
  // Swept rim and layered plate seams make one cohesive shell.
  tube(body,light,[[-.403,-.018,.025],[-.340,.059,.217],[0,.081,.337],[.34,.059,.217],[.403,-.018,.025]],.030,.030,30);
  tube(body,dark,[[0,.125,.300],[0,.312,.090],[0,.318,-.10],[0,.114,-.340]],.012,.012,26);
  for(const side of [-1,1]) {
    tube(body,light,[[side*.132,.262,.082],[side*.235,.240,-.036],[side*.299,.116,-.230]],.024,.008,22);
    tube(body,dark,[[side*.288,.162,.184],[side*.363,.108,.060],[side*.350,.029,-.189]],.012,.012,20);
    tube(body,boneMat,[[side*.348,.113,-.023],[side*.453,.155,-.115],[side*.488,.225,-.159]],.058,.004,22);
  }
  const face=pivot(body,'Crab face',[0,-.006,.282]);
  sphere(face,light,[0,-.030,.017],[.265,.143,.078]);
  sphere(face,dark,[0,.020,.067],[.191,.075,.020]);
  for(const side of [-1,1]) {
    const stalk=pivot(body,'Armored eye stalk',[side*.169,.148,.215]);
    tube(stalk,dark,[[0,0,0],[side*.022,.192,.003],[side*.038,.276,.025]],.032,.025,18);
    sphere(stalk,blue,[side*.034,.243,.013],[.074,.066,.073]);
    sphere(stalk,dark,[side*.036,.252,.072],[.056,.036,.018]);
    sphere(stalk,eye,[side*.036,.253,.086],[.037,.019,.008]);
    tube(face,boneMat,[[side*.088,-.107,.017],[side*.061,-.130,.085],[side*.019,-.095,.100]],.027,.011,14);
  }
  for(let i=0;i<3;i++) {
    const plate=sphere(body,light,[0,-.131-i*.058,.213-i*.016],[.224-i*.023,.039,.074]);
  }
  const legs=[];
  for(const side of [-1,1])for(let j=0;j<3;j++) {
    const z=.156-j*.170;
    const leg=pivot(body,'Armored walking leg',[side*.282,-.137,z]);
    const elbow=[side*(.197+(j===1?.038:0)),-.047,.045*(1-j)];
    const tip=[side*(.278+(j===1?.040:0)),-.424,.079*(1-j)];
    bone(leg,dark,[0,0,0],elbow,.067,.049);
    sphere(leg,blue,[elbow[0]*.65,elbow[1]*.65,elbow[2]*.65],[.12,.080,.087]);
    sphere(leg,coral,elbow,[.064,.068,.071]);
    tube(leg,blue,[elbow,[tip[0]*.93,-.27,tip[2]*.80],tip],.063,.022,18);
    tube(leg,boneMat,[[tip[0]*.988,-.367,tip[2]],[tip[0]*1.02,-.430,tip[2]+.044],[tip[0]*1.00,-.435,tip[2]+.102]],.027,.004,12);
    legs.push({leg,side,j});
  }
  const claws=[];
  for(const side of [-1,1]) {
    const arm=pivot(body,'Claw shoulder',[side*.332,-.045,.181]);
    const elbow=[side*.211,-.011,.190];
    bone(arm,dark,[0,0,0],elbow,.074,.058);
    sphere(arm,light,[side*.070,-.004,.060],[.112,.084,.112]);
    sphere(arm,coral,elbow,[.073,.075,.077]);
    const claw=pivot(arm,'Pincer',elbow);
    claw.rotation.y=side*.10;
    sphere(claw,blue,[side*.013,0,.138],[.152,.122,.184]);
    tube(claw,light,[[side*.075,.083,.021],[side*.116,.073,.161],[side*.065,.053,.267]],.015,.009,18);
    const fixed=pivot(claw,'Fixed pincer',[side*.077,0,.230]);
    tube(fixed,blue,[[0,0,0],[side*.025,.014,.134],[-side*.043,.010,.206]],.079,.005,21);
    tube(fixed,boneMat,[[side*.021,.010,.112],[-side*.012,.010,.173],[-side*.043,.010,.208]],.031,.003,12);
    const finger=pivot(claw,'Moving pincer',[-side*.064,-.011,.223]);
    tube(finger,light,[[0,0,0],[-side*.040,0,.087],[side*.035,.004,.172]],.058,.004,20);
    tube(finger,boneMat,[[-side*.030,0,.071],[0,.002,.138],[side*.035,.004,.172]],.021,.003,12);
    claws.push({arm,claw,finger,side});
  }
  w.optimize();
  let flash=0,clock=0;
  return {group,dispose:w.dispose,animate(dt,time,state={}) {
    dt=clamp(Number(dt)||0,0,.08);clock=Number.isFinite(time)?time:clock+dt;
    const moving=state.moving?1:0,attacking=state.attacking?1:0;
    body.position.y=.591+Math.sin(clock*7)*.018*moving+Math.sin(clock*2)*.007;
    body.rotation.z=Math.sin(clock*7)*.026*moving;
    legs.forEach(({leg,side,j})=>{const a=clock*8+j*1.7+side;leg.rotation.y=Math.sin(a)*.20*moving;leg.rotation.z=Math.cos(a)*.11*moving*side;});
    claws.forEach(({arm,claw,finger,side})=>{
      arm.rotation.y=-side*(.06+Math.sin(clock*2.6+side)*.05+attacking*.20);
      arm.rotation.x=-.10+Math.sin(clock*3+side)*.035-attacking*.24;
      finger.rotation.y=side*(.12+(Math.sin(clock*(attacking?15:2.3))+1)*.13);
    });
    flash=damageTint(w.materials,state,dt,flash);
  }};
}

/** Enemy feet at y≈0. Type aliases unknown -> beetle. Independent GPU ownership. */
export function createEnemy(THREE,type='beetle') {
  const actor=type==='spitter'?makeSpitter(THREE):type==='brute'?makeBrute(THREE):makeBeetle(THREE);
  actor.group.userData.kind=type;
  actor.group.userData.height=type==='brute'?1.3:type==='spitter'?.8:.7;
  actor.animate(0,0,{});
  return actor;
}
