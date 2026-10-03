/** Original miniature spherical biomes for STARBLOOM. No DOM, textures, or globals. */
export const BIOMES = Object.freeze([
  { id: 'meadow', name: '花海星原', label: 'MEADOW', icon: '✿', color: '#91e272', accent: '#ffd66e', sky: '#172d46', desc: '风车转动，花海沿星球的弧线绽放', hazardName: '宁静草原' },
  { id: 'river', name: '碧波环岛', label: 'RIVER', icon: '≈', color: '#41dbd0', accent: '#fff1ad', sky: '#142f46', desc: '绕过清澈河道，跨过小小的木桥', hazardName: '蜿蜒河流' },
  { id: 'ice', name: '极光冰原', label: 'GLACIER', icon: '❄', color: '#9de5ff', accent: '#caafff', sky: '#202542', desc: '蓝色冰川与水晶，在极光下闪烁', hazardName: '冰晶荒原' },
  { id: 'forest', name: '蘑菇秘林', label: 'FOREST', icon: '♣', color: '#55ca94', accent: '#ffb888', sky: '#152f37', desc: '穿过圆冠古树，探索发光蘑菇的家园', hazardName: '古老森林' },
  { id: 'volcano', name: '余烬火山', label: 'VOLCANO', icon: '▲', color: '#ff8660', accent: '#ffdc72', sky: '#30243f', desc: '小心流动的熔岩，向火山口进发', hazardName: '灼热熔岩' }
]);

export function createPlanet(THREE, index = 0, seed = 1) {
  index = ((index % 5) + 5) % 5;
  const biome = BIOMES[index], R = 14, group = new THREE.Group();
  group.name = `planet-${biome.id}`;
  const geometries = new Set(), materials = new Set(), animated = [];
  const UP = new THREE.Vector3(0, 1, 0), temp = new THREE.Object3D();
  let state = ((seed >>> 0) + 991 * (index + 1)) >>> 0;
  const random = () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const phase = (seed % 71) * 0.073;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const G = g => (geometries.add(g), g);
  const M = m => (materials.add(m), m);
  const mat = (color, extra = {}) => M(new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: 0, ...extra }));
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const normal = n => { const l = Math.hypot(n.x, n.y, n.z) || 1; return { x: n.x / l, y: n.y / l, z: n.z / l }; };
  const volcanoAxis = v(.79, -.02, -.61).normalize();
  const volcanoTangent = v(-volcanoAxis.z, 0, volcanoAxis.x).normalize();
  const volcanoBitangent = new THREE.Vector3().crossVectors(volcanoTangent, volcanoAxis).normalize();
  const lonLat = (lon, lat) => v(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
  const riverLatitude = lon => .15 * Math.sin(lon * 3 + .55) + .07 * Math.sin(lon * 7 - .25);
  const riverDistance = n => Math.abs(Math.asin(clamp(n.y, -1, 1)) - riverLatitude(Math.atan2(n.z, n.x)));
  const terrainNoise = n => (
    Math.sin(n.x * 5.1 + phase) * Math.cos(n.y * 4.2 - 1.7) * Math.sin(n.z * 4.7 + .3) * .54 +
    Math.sin(n.x * 11.7 + n.z * 5.1) * Math.sin(n.y * 9.3 - phase) * .22 +
    Math.cos(n.z * 20.1 + n.x * 7.7) * Math.sin(n.y * 19.3) * .075
  );
  const craterAngle = n => Math.acos(clamp(n.x * volcanoAxis.x + n.y * volcanoAxis.y + n.z * volcanoAxis.z, -1, 1));
  function lavaDistance(n) {
    // Three organic lava streams radiate from the volcano into the lowlands.
    const dot = n.x * volcanoAxis.x + n.y * volcanoAxis.y + n.z * volcanoAxis.z;
    const tx = n.x * volcanoTangent.x + n.y * volcanoTangent.y + n.z * volcanoTangent.z;
    const ty = n.x * volcanoBitangent.x + n.y * volcanoBitangent.y + n.z * volcanoBitangent.z;
    const a = Math.atan2(ty, tx), d = Math.acos(clamp(dot, -1, 1));
    let result = 10;
    for (let k = 0; k < 3; k++) {
      const target = k * Math.PI * 2 / 3 + .42 + .13 * Math.sin(d * 10 + k);
      const diff = Math.atan2(Math.sin(a - target), Math.cos(a - target));
      result = Math.min(result, Math.abs(diff) * Math.sin(d));
    }
    return d < .075 || d > 1.19 ? 10 : result;
  }
  function surfaceHeight(input) {
    const n = normal(input), noise = terrainNoise(n), safe = smooth(.97, .83, n.y);
    let h = R + noise * [ .42, .36, .32, .46, .44 ][index] * safe;
    if (index === 1) h = mix(h, R - .26 + noise * .05, 1 - smooth(.055, .10, riverDistance(n)));
    if (index === 2) h += Math.pow(Math.max(0, noise), 2) * .7;
    if (index === 4) {
      const d = craterAngle(n);
      const cone = 3.65 * Math.pow(1 - smooth(.11, .47, d), 1.12);
      const bowl = 1.65 * (1 - smooth(.045, .12, d));
      h += cone - bowl;
      h -= (1 - smooth(.027, .047, lavaDistance(n))) * .09;
    }
    return h;
  }
  function hazard(input, time = 0) {
    if (index !== 4) return 0;
    const n = normal(input), d = craterAngle(n);
    return d < .085 ? 1 : (1 - smooth(.023, .046, lavaDistance(n))) * .85;
  }
  const palette = [
    ['#81c75a', '#91dc67', '#b8e57c', '#6bad51'],
    ['#78c986', '#a7db8a', '#dfd19a', '#54b79e'],
    ['#d8f3fb', '#a9d7ec', '#edfafd', '#8cc4df'],
    ['#4c9c65', '#6abc74', '#a0cd79', '#387e55'],
    ['#6e626e', '#85717c', '#a68985', '#4b4e62']
  ][index].map(c => new THREE.Color(c));
  const terrainGeometry = G(new THREE.SphereGeometry(1, 144, 96));
  const pos = terrainGeometry.attributes.position, colors = new Float32Array(pos.count * 3);
  const n = new THREE.Vector3(), color = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i).normalize();
    const noise = terrainNoise(n), patch = clamp(.5 + noise * 1.15);
    color.copy(palette[0]).lerp(palette[1], patch).lerp(palette[2], smooth(.25, .6, noise) * .7);
    if (index === 1) color.lerp(palette[2], 1 - smooth(.078, .13, riverDistance(n)));
    if (index === 2) color.lerp(palette[3], smooth(-.08, -.45, noise) * .5);
    if (index === 3) color.lerp(palette[3], smooth(-.05, -.6, noise) * .5);
    if (index === 4) {
      color.lerp(new THREE.Color('#b77b71'), smooth(.5, .08, craterAngle(n)) * .5);
      color.lerp(new THREE.Color('#f47532'), hazard(n) * .88);
    }
    const h = surfaceHeight(n); pos.setXYZ(i, n.x * h, n.y * h, n.z * h);
    colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
  }
  terrainGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeometry.computeVertexNormals();
  const terrainMaterial = mat('#ffffff', { vertexColors: true, roughness: .96 });
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.name = 'sculpted-color-terrain'; terrain.receiveShadow = true; terrain.castShadow = true; group.add(terrain);

  // Reusable low-poly, smoothly lit miniature shapes are drawn in colored instance batches.
  const batches = new Map();
  function batch(name, geometry, material, shadow = true) {
    const b = { name, geometry, material, data: [], shadow }; batches.set(name, b); return b;
  }
  function instance(b, direction, height, scale, tint, spin = 0, localOffset = null) {
    temp.position.copy(direction).multiplyScalar(height);
    temp.quaternion.setFromUnitVectors(UP, direction);
    if (spin) temp.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(UP, spin));
    if (localOffset) temp.position.add(localOffset.clone().applyQuaternion(temp.quaternion));
    temp.scale.set(scale[0], scale[1], scale[2]); temp.updateMatrix();
    b.data.push({ matrix: temp.matrix.clone(), color: tint ? new THREE.Color(tint) : null });
  }
  function mesh(geometry, material, direction, height, scale = [1, 1, 1], spin = 0) {
    const m = new THREE.Mesh(geometry, material);
    m.position.copy(direction).multiplyScalar(height); m.quaternion.setFromUnitVectors(UP, direction);
    if (spin) m.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(UP, spin));
    m.scale.set(...scale); m.castShadow = m.receiveShadow = true; group.add(m); return m;
  }
  const roundGeo = G(new THREE.SphereGeometry(1, 10, 8));
  // Gentle shape deformation removes the primitive-perfect ball appearance from crowns and rocks.
  const p = roundGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + .045 * Math.sin(x * 6 + y * 4) * Math.cos(z * 7);
    p.setXYZ(i, x * f, y * f, z * f);
  }
  roundGeo.computeVertexNormals();
  const coneGeo = G(new THREE.CylinderGeometry(.48, .73, 1, 7));
  const trunkGeo = G(new THREE.CylinderGeometry(.065, .10, 1, 7));
  const pebble = batch('soft-stones', roundGeo, mat('#ffffff'));
  const tufts = batch('grass-blades', G(new THREE.ConeGeometry(.06, .38, 3)), mat('#ffffff'), false);
  const stems = batch('flower-stems', G(new THREE.CylinderGeometry(.012, .021, .22, 4)), mat('#619754'), false);
  const flowers = batch('flower-petals', roundGeo, mat('#ffffff', { roughness: .66 }), false);
  const hearts = batch('flower-hearts', roundGeo, mat('#ffd970'), false);
  const trunks = batch('tree-trunks', trunkGeo, mat('#ffffff'));
  const crowns = batch('rounded-tree-crowns', roundGeo, mat('#ffffff'));
  const crystals = batch('tapered-crystals', G(new THREE.CylinderGeometry(.0, .3, 1, 5)), mat('#a6eafb', { roughness: .22, metalness: .12, emissive: '#347993', emissiveIntensity: .15 }));
  const caps = batch('mushroom-caps', G(new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, 0, Math.PI * .54)), mat('#ffffff', { roughness: .68 }));
  const spots = batch('mushroom-spots', roundGeo, mat('#fff1cf'), false);
  const logEnds = batch('wood-ring-cuts', G(new THREE.CylinderGeometry(.12, .12, .026, 10)), mat('#d2af76'));
  function randomNormal() { const y = random() * 2 - 1, a = random() * Math.PI * 2, r = Math.sqrt(1 - y * y); return v(r * Math.cos(a), y, r * Math.sin(a)); }
  function free(d, margin = 0) {
    if (d.y > .967 - margin) return false;
    if (index === 1 && riverDistance(d) < .13 + margin) return false;
    if (index === 4 && (craterAngle(d) < .5 + margin || hazard(d) > .05)) return false;
    return true;
  }
  function flower(d, size = 1, tint = '#ffeec2') {
    const h = surfaceHeight(d), angle = random() * Math.PI * 2;
    instance(stems, d, h + .11 * size, [size, size, size]);
    for (let j = 0; j < 5; j++) {
      const a = angle + j * Math.PI * 2 / 5;
      instance(flowers, d, h + .24 * size, [.06 * size, .025 * size, .105 * size], tint, a, v(0, 0, .074 * size));
    }
    instance(hearts, d, h + .258 * size, [.042 * size, .028 * size, .042 * size]);
  }
  function tree(d, size = 1, style = 0) {
    const h = surfaceHeight(d), spin = random() * Math.PI * 2;
    instance(trunks, d, h + .56 * size, [size * 1.3, size * 1.25, size * 1.3], index === 2 ? '#b9b0c9' : '#9b7662');
    if (style === 1) {
      // Layered snowy firs, each layer with a soft colored underside.
      const snowTint = ['#d8eff7', '#b8e1ef', '#ecf8ff'][Math.floor(random() * 3)];
      for (let j = 0; j < 3; j++) instance(firCrowns, d, h + (1.05 + j * .4) * size, [(1 - j * .2) * size, .9 * size, (1 - j * .2) * size], snowTint, spin);
    } else {
      const c = index === 1 ? ['#52b69b', '#77c796', '#afd779'] : index === 3 ? ['#348d69', '#50ab70', '#68bd7f', '#91ce76'] : ['#79bd63', '#a8d779', '#68b277'];
      const tint = c[Math.floor(random() * c.length)];
      instance(crowns, d, h + 1.12 * size, [.54 * size, .58 * size, .53 * size], tint, spin);
      instance(crowns, d, h + 1.57 * size, [.45 * size, .49 * size, .46 * size], tint, spin, v(.13 * size, 0, -.03 * size));
      instance(crowns, d, h + 1.24 * size, [.40 * size, .40 * size, .39 * size], tint, spin, v(-.28 * size, 0, .12 * size));
    }
  }
  const firCrowns = batch('snowy-fir-layers', G(new THREE.ConeGeometry(.65, 1.15, 9)), mat('#ffffff'));
  function mushroom(d, size = 1, tint = '#e77d8b') {
    const h = surfaceHeight(d), spin = random() * Math.PI * 2;
    instance(trunks, d, h + .22 * size, [.9 * size, .45 * size, .9 * size], '#f5e1b6');
    instance(caps, d, h + .40 * size, [.40 * size, .23 * size, .40 * size], tint, spin);
    for (let j = 0; j < 4; j++) {
      const a = j * 2.4 + spin, r = j === 0 ? 0 : .22 * size;
      instance(spots, d, h + (.60 - (j === 0 ? 0 : .045)) * size, [.045 * size, .016 * size, .05 * size], null, spin, v(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
  }

  const treeCount = [58, 58, 36, 118, 0][index];
  for (let i = 0; i < treeCount; i++) { const d = randomNormal(); if (free(d, .015)) tree(d, .72 + random() * .65, index === 2 ? 1 : 0); }
  for (let i = 0; i < 145; i++) {
    const d = randomNormal(); if (!free(d)) continue;
    const s = .07 + random() * .19;
    const t = index === 2 ? '#bfdfeb' : index === 4 ? ['#5c5668', '#96808b', '#766671'][i % 3] : ['#b4b9a1', '#cbd0b5', '#929f91'][i % 3];
    instance(pebble, d, surfaceHeight(d) + s * .2, [s * 1.4, s * .65, s], t, random() * 6.28);
  }
  if (index === 0 || index === 1 || index === 3) {
    for (let i = 0; i < (index === 0 ? 440 : 260); i++) {
      const d = randomNormal(); if (!free(d)) continue;
      if (index === 0 || random() < .32) flower(d, .65 + random() * .65, ['#fff0bc', '#f7b4cc', '#c9b5f2', '#fff5df'][i % 4]);
      for (let k = 0; k < 3; k++) instance(tufts, d, surfaceHeight(d) + .09, [.75, .55 + random() * .5, .7], index === 3 ? '#86bc78' : '#7cae56', random() * 6.28, v((random() - .5) * .25, 0, (random() - .5) * .25));
    }
  }

  // Curved ribbons follow the true radial height; shoreline blends are part of the ground mesh.
  function ribbon(points, widths, material, radialHeight = null, name = 'ribbon', lift = .035) {
    const vertices = [], normals = [], uvs = [], indices = [];
    for (let i = 0; i < points.length; i++) {
      const d = points[i], tangent = points[Math.min(points.length - 1, i + 1)].clone().sub(points[Math.max(0, i - 1)]).normalize();
      const side = new THREE.Vector3().crossVectors(d, tangent).normalize();
      for (const sign of [-1, 1]) {
        const dn = d.clone().addScaledVector(side, sign * (Array.isArray(widths) ? widths[i] : widths) / R).normalize();
        const h = radialHeight == null ? surfaceHeight(dn) + lift : radialHeight;
        vertices.push(dn.x * h, dn.y * h, dn.z * h); normals.push(dn.x, dn.y, dn.z); uvs.push(sign < 0 ? 0 : 1, i / (points.length - 1));
      }
      if (i < points.length - 1) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = G(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(indices);
    const m = new THREE.Mesh(g, material); m.name = name; m.receiveShadow = true; group.add(m); return m;
  }

  if (index === 0) {
    // Cream windmill with petal-like blades and a tiny tiled roof.
    const d = v(-.62, .54, -.57).normalize(), h = surfaceHeight(d);
    const base = new THREE.Group(); base.position.copy(d).multiplyScalar(h); base.quaternion.setFromUnitVectors(UP, d); group.add(base);
    const tower = new THREE.Mesh(G(new THREE.CylinderGeometry(.25, .42, 1.75, 12)), mat('#ffeed1')); tower.position.y = .875; tower.castShadow = true; base.add(tower);
    const roof = new THREE.Mesh(G(new THREE.ConeGeometry(.48, .55, 12)), mat('#db7e76')); roof.position.y = 1.92; roof.castShadow = true; base.add(roof);
    const door = new THREE.Mesh(G(new THREE.BoxGeometry(.17, .33, .04)), mat('#81706c')); door.position.set(0, .2, .4); base.add(door);
    const rotor = new THREE.Group(); rotor.position.set(0, 1.35, .31); base.add(rotor);
    const bladeMat = mat('#fff8d9'), bladeG = G(new THREE.BoxGeometry(.14, 1.3, .047));
    for (let j = 0; j < 4; j++) { const arm = new THREE.Mesh(bladeG, bladeMat); arm.rotation.z = j * Math.PI / 2 + .3; arm.position.set(Math.sin(-arm.rotation.z) * .52, Math.cos(arm.rotation.z) * .52, .08); rotor.add(arm); }
    const hub = new THREE.Mesh(roundGeo, mat('#d89b67')); hub.scale.set(.15, .15, .09); hub.position.z = .1; rotor.add(hub);
    animated.push((dt, time) => { rotor.rotation.z = time * .32; });
    // A stepping-stone garden loop around the mill.
    for (let j = 0; j < 25; j++) { const dd = d.clone().add(v(Math.sin(j * .35), Math.cos(j * .35), Math.sin(j * .7)).multiplyScalar(.09)).normalize(); instance(pebble, dd, surfaceHeight(dd) + .035, [.16, .05, .21], '#d5d5b5', j); }
  }

  if (index === 1) {
    const waterMat = mat('#43c9ca', { roughness: .24, metalness: .22, emissive: '#12717c', emissiveIntensity: .13, side: THREE.DoubleSide });
    const pts = [];
    for (let j = 0; j <= 420; j++) { const l = -Math.PI + j / 420 * Math.PI * 2; pts.push(lonLat(l, riverLatitude(l))); }
    ribbon(pts, .91, waterMat, R - .035, 'winding-turquoise-river');
    const foam = mat('#b5f4e4', { transparent: true, opacity: .62, roughness: .7, side: THREE.DoubleSide });
    for (let k = 0; k < 36; k++) {
      const l = random() * Math.PI * 2 - Math.PI, ll = riverLatitude(l) + (random() - .5) * .06;
      const rr = []; for (let j = 0; j < 5; j++) rr.push(lonLat(l + j * .0035, ll + Math.sin(j) * .001));
      ribbon(rr, .025, foam, R - .021, 'river-glint');
    }
    // Raised curved timber footbridges across the winding water.
    const plankG = G(new THREE.BoxGeometry(.16, .10, 1.00)), plankM = mat('#c69369'), railG = G(new THREE.CylinderGeometry(.038, .038, .56, 5)), railM = mat('#986f57');
    for (const l of [-1.45, .62, 2.63]) {
      const d = lonLat(l, riverLatitude(l)), bridge = new THREE.Group(); bridge.position.copy(d).multiplyScalar(R + .015); bridge.quaternion.setFromUnitVectors(UP, d); group.add(bridge);
      const tangent = lonLat(l + .001, riverLatitude(l + .001)).sub(d).normalize();
      const inv = bridge.quaternion.clone().invert(); const localTangent = tangent.applyQuaternion(inv); bridge.rotateY(Math.atan2(localTangent.x, localTangent.z));
      for (let j = 0; j < 17; j++) { const x = (j - 8) * .16, rise = .19 * Math.sin(j / 16 * Math.PI); const plank = new THREE.Mesh(plankG, plankM); plank.position.set(x, rise, 0); plank.castShadow = true; bridge.add(plank); if (j % 4 === 0) for (const s of [-1, 1]) { const post = new THREE.Mesh(railG, railM); post.position.set(x, .27 + rise, s * .45); bridge.add(post); } }
      for (const s of [-1, 1]) { const rail = new THREE.Mesh(G(new THREE.BoxGeometry(2.72, .06, .055)), railM); rail.position.set(0, .55, s * .45); bridge.add(rail); }
    }
    animated.push((dt, time) => { waterMat.emissiveIntensity = .11 + Math.sin(time * .8) * .035; });
  }

  if (index === 2) {
    const iceRock = batch('blue-glacier-boulders', G(new THREE.IcosahedronGeometry(1, 1)), mat('#ffffff', { roughness: .35, metalness: .07 }));
    for (let i = 0; i < 31; i++) {
      const d = randomNormal(); if (!free(d, .02)) continue;
      const size = .6 + random() * .9;
      instance(iceRock, d, surfaceHeight(d) + size * .15, [size, size * .65, size * .85], ['#80c6df', '#a8ddf1', '#c5e5f0'][i % 3], random() * 6.28);
      for (let j = 0; j < 4; j++) instance(crystals, d, surfaceHeight(d) + .4 + random() * .2, [.6 + random() * .6, .9 + random() * 1.4, .6 + random() * .6], null, random() * 6.28, v((random() - .5) * 1.1, 0, (random() - .5) * 1.1));
    }
    // Three giant low-relief ice shelves give the world a readable glacial silhouette.
    for (const a of [[.8, .05, .5], [-.3, -.5, .8], [-.5, .4, -.6]]) {
      const d = v(...a).normalize(); instance(iceRock, d, surfaceHeight(d) + .15, [1.4, .5, 1.9], '#a1d9ec', random() * 6.28);
      for (let j = 0; j < 7; j++) instance(crystals, d, surfaceHeight(d) + .75, [.7, 1 + random() * 1.3, .75], null, j, v((random() - .5) * 1.8, 0, (random() - .5) * 1.7));
    }
    const auroraMat = M(new THREE.MeshBasicMaterial({ color: '#86ffd8', transparent: true, opacity: .09, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    const auroraPts = []; for (let j = 0; j <= 100; j++) auroraPts.push(lonLat(j / 100 * Math.PI * 2, -.48 + .07 * Math.sin(j / 100 * Math.PI * 6)));
    const aurora = ribbon(auroraPts, .55, auroraMat, R + .8, 'low-polar-aurora');
    animated.push((dt, time) => { auroraMat.opacity = .075 + Math.sin(time * .5) * .018; aurora.rotation.y = time * .016; });
  }

  if (index === 3) {
    for (let i = 0; i < 135; i++) { const d = randomNormal(); if (free(d)) mushroom(d, .45 + random() * .85, ['#ef918d', '#e2b17e', '#bda2e5', '#73d3c4'][i % 4]); }
    const fern = batch('fern-leaflets', roundGeo, mat('#86be73'), false);
    for (let i = 0; i < 150; i++) {
      const d = randomNormal(); if (!free(d)) continue; const h = surfaceHeight(d), spin = random() * 6.28;
      for (let j = 0; j < 6; j++) { const angle = spin + j * Math.PI / 3; instance(fern, d, h + .075, [.055, .027, .22], j % 2 ? '#8eca7c' : '#70ad70', angle, v(0, 0, .16)); }
    }
    // A fairy ring around a broad old tree at a deliberately clear off-spawn landmark.
    const d = v(.55, .42, .72).normalize(); tree(d, 1.65);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, d);
    for (let j = 0; j < 14; j++) { const a = j * Math.PI * 2 / 14; const offset = v(Math.cos(a) * .095, 0, Math.sin(a) * .095).applyQuaternion(q); mushroom(d.clone().add(offset).normalize(), .75, j % 2 ? '#efb18b' : '#df8d97'); }
    const fireflyG = G(new THREE.SphereGeometry(.029, 5, 4));
    const fireflyM = M(new THREE.MeshBasicMaterial({ color: '#f9eaa8' }));
    const flies = new THREE.InstancedMesh(fireflyG, fireflyM, 44); flies.name = 'forest-fireflies'; group.add(flies);
    const flyData = Array.from({ length: 44 }, () => ({ d: randomNormal(), p: random() * 6.28, s: .5 + random() }));
    animated.push((dt, time) => { flyData.forEach((f, i) => { temp.position.copy(f.d).multiplyScalar(surfaceHeight(f.d) + .45 + .18 * Math.sin(time * f.s + f.p)); temp.quaternion.identity(); temp.scale.setScalar(.6 + .4 * Math.sin(time * 1.6 + f.p) ** 2); temp.updateMatrix(); flies.setMatrixAt(i, temp.matrix); }); flies.instanceMatrix.needsUpdate = true; });
  }

  if (index === 4) {
    const lavaMat = mat('#ff8e30', { roughness: .55, emissive: '#ff541c', emissiveIntensity: .85, side: THREE.DoubleSide });
    const innerLavaMat = mat('#ffce5f', { roughness: .5, emissive: '#ff8d35', emissiveIntensity: .85, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const tangent = volcanoTangent, bitangent = volcanoBitangent;
    for (let k = 0; k < 3; k++) {
      const pts = [], widths = [];
      for (let j = 0; j <= 88; j++) {
        const d = .073 + j / 88 * 1.102, angle = k * Math.PI * 2 / 3 + .42 + .13 * Math.sin(d * 10 + k);
        pts.push(volcanoAxis.clone().multiplyScalar(Math.cos(d)).addScaledVector(tangent, Math.sin(d) * Math.cos(angle)).addScaledVector(bitangent, Math.sin(d) * Math.sin(angle)).normalize());
        widths.push(.30 + .095 * Math.sin(d * 15 + k));
      }
      ribbon(pts, widths, lavaMat, null, `lava-stream-${k}`, .115);
      ribbon(pts, widths.map(x => x * .36), innerLavaMat, null, `lava-hot-core-${k}`, .13);
    }
    const crater = mesh(G(new THREE.CylinderGeometry(1.22, 1.22, .025, 44)), lavaMat, volcanoAxis, surfaceHeight(volcanoAxis) + .32);
    crater.name = 'glowing-crater-lake';
    const fissures = batch('obsidian-shards', G(new THREE.ConeGeometry(.23, 1, 5)), mat('#625969', { roughness: .6, metalness: .18 }));
    for (let i = 0; i < 84; i++) { const d = randomNormal(); if (free(d)) instance(fissures, d, surfaceHeight(d) + .18, [.6 + random(), .5 + random() * .7, .6 + random()], null, random() * 6.28); }
    // Pooled instanced eruption embers are deterministic and bounded, no particle allocations per frame.
    const emberG = G(new THREE.IcosahedronGeometry(.063, 0)), emberM = mat('#ffbc51', { emissive: '#ff6a16', emissiveIntensity: 1.3 });
    const embers = new THREE.InstancedMesh(emberG, emberM, 64); embers.name = 'eruption-embers'; group.add(embers);
    const emberData = Array.from({ length: 64 }, () => ({ phase: random(), angle: random() * Math.PI * 2, drift: .24 + random() * .65, scale: .4 + random() * 1.15 }));
    const smoke = new THREE.InstancedMesh(roundGeo, mat('#b9a1ae', { transparent: true, opacity: .20, depthWrite: false, roughness: 1 }), 10); smoke.name = 'soft-volcanic-puffs'; group.add(smoke);
    animated.push((dt, time) => {
      lavaMat.emissiveIntensity = .75 + Math.sin(time * 1.7) * .15; innerLavaMat.emissiveIntensity = 1 + Math.sin(time * 2.3) * .2;
      const baseH = surfaceHeight(volcanoAxis);
      for (let i = 0; i < emberData.length; i++) { const e = emberData[i], t = (time * .31 + e.phase) % 1, height = Math.sin(t * Math.PI) * 3.6;
        temp.position.copy(volcanoAxis).multiplyScalar(baseH + .15 + height).addScaledVector(tangent, Math.cos(e.angle) * t * e.drift * 2.1).addScaledVector(bitangent, Math.sin(e.angle) * t * e.drift * 2.1); temp.quaternion.identity(); temp.scale.setScalar(e.scale * (1 - t * .65)); temp.updateMatrix(); embers.setMatrixAt(i, temp.matrix); }
      embers.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 10; i++) { const t = (time * .09 + i / 10) % 1; temp.position.copy(volcanoAxis).multiplyScalar(baseH + 1.3 + t * 4.1).addScaledVector(tangent, Math.sin(i * 2.2) * (.15 + t * .5)).addScaledVector(bitangent, t * .75); temp.scale.setScalar((.12 + t * .55) * Math.sin(t * Math.PI)); temp.quaternion.identity(); temp.updateMatrix(); smoke.setMatrixAt(i, temp.matrix); } smoke.instanceMatrix.needsUpdate = true;
    });
  }

  for (const b of batches.values()) {
    if (!b.data.length) continue;
    const im = new THREE.InstancedMesh(b.geometry, b.material, b.data.length); im.name = b.name; im.castShadow = b.shadow; im.receiveShadow = true;
    b.data.forEach((o, i) => { im.setMatrixAt(i, o.matrix); if (o.color) im.setColorAt(i, o.color); }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); group.add(im);
  }
  // Keep origin-friendly bounds for orbital cameras; dynamic particles stay inside radius + 8.
  for (const child of group.children) if (child.isInstancedMesh && (child.name.includes('ember') || child.name.includes('puffs') || child.name.includes('fireflies'))) child.frustumCulled = false;
  let disposed = false;
  function update(dt, time) { if (!disposed) for (const fn of animated) fn(dt, time); }
  update(0, 0);
  function dispose() {
    if (disposed) return; disposed = true;
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    group.traverse(o => { if (o.isInstancedMesh && typeof o.dispose === 'function') o.dispose(); });
    group.removeFromParent(); group.clear(); geometries.clear(); materials.clear(); animated.length = 0; batches.clear();
  }
  return { group, radius: R, surfaceHeight, hazard, update, dispose, biome, spawnNormal: UP.clone(), terrain, volcanoAxis: index === 4 ? volcanoAxis.clone() : null, riverDistance: index === 1 ? riverDistance : null };
}
