import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { clone as cloneSkeleton } from './vendor/SkeletonUtils.js';
import { createWorldWeapon } from './actors.js';

// The original Vanguard Soldier GLB supplies ALL meshes, textures, skin weights,
// fingers and Idle / Walk / Run clips. Only the firearm pose, recoil, reactions
// and fall below are procedural overlays; the source locomotion is never replaced.
const clamp = THREE.MathUtils.clamp;
const Y = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);
const MODEL_URL = new URL('./assets/vanguard.glb', import.meta.url).href;
let source = null;
let loading = null;

/** Preload once. A failed real asset load rejects; there is no substitute model. */
export function loadVanguard() {
  if (source) return Promise.resolve(source);
  if (loading) return loading;
  loading = new GLTFLoader().loadAsync(MODEL_URL).then(gltf => {
    for (const name of ['Idle', 'Walk', 'Run']) {
      if (!gltf.animations.some(clip => clip.name === name)) throw new Error(`Vanguard is missing its ${name} animation`);
    }
    let skinned = 0;
    gltf.scene.traverse(o => { if (o.isSkinnedMesh) skinned++; });
    if (!skinned) throw new Error('Vanguard did not contain its original skinned mesh');
    // Normalize the visible, slightly crouched source Idle stance to 1.90 m.
    // The source is already −Z facing. Applying the common glTF +Z correction
    // here would put his visor and gun on opposite sides of the body.
    const measuring = cloneSkeleton(gltf.scene);
    const mixer = new THREE.AnimationMixer(measuring);
    mixer.clipAction(gltf.animations.find(c => c.name === 'Idle')).play();
    mixer.update(0); measuring.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(measuring, true);
    const scale = 1.90 / (bounds.max.y - bounds.min.y);
    source = { scene: gltf.scene, clips: gltf.animations, scale, floor: -bounds.min.y * scale };
    mixer.stopAllAction(); mixer.uncacheRoot(measuring);
    measuring.traverse(o => { if (o.isSkinnedMesh) o.skeleton.dispose(); });
    return source;
  }).catch(error => { loading = null; throw new Error(`Vanguard asset failed to load: ${error.message}`, { cause: error }); });
  return loading;
}

function worldQuaternion(bone, q) {
  const parent = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(parent.invert().multiply(q));
  bone.updateWorldMatrix(false, true);
}
function rotateWorld(bone, axis, angle) {
  if (!bone || !angle) return;
  const q = bone.getWorldQuaternion(new THREE.Quaternion());
  q.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
  worldQuaternion(bone, q);
}
function aimBone(bone, child, desired) {
  const a = bone.getWorldPosition(new THREE.Vector3());
  const from = child.getWorldPosition(new THREE.Vector3()).sub(a).normalize();
  const to = desired.clone().sub(a).normalize();
  const q = bone.getWorldQuaternion(new THREE.Quaternion());
  q.premultiply(new THREE.Quaternion().setFromUnitVectors(from, to));
  worldQuaternion(bone, q);
}
/** Analytic two-link IK, preserving the source arm's twist and segment lengths. */
function solveArm(upper, lower, hand, target, pole) {
  const a = upper.getWorldPosition(new THREE.Vector3());
  const b = lower.getWorldPosition(new THREE.Vector3());
  const c = hand.getWorldPosition(new THREE.Vector3());
  const l1 = a.distanceTo(b), l2 = b.distanceTo(c);
  const direction = target.clone().sub(a);
  const distance = clamp(direction.length(), Math.abs(l1 - l2) + .002, l1 + l2 - .004);
  direction.normalize();
  const reachable = a.clone().addScaledVector(direction, distance);
  const bend = pole.clone().sub(a);
  bend.addScaledVector(direction, -bend.dot(direction));
  if (bend.lengthSq() < .000001) bend.set(1, -.5, .2).addScaledVector(direction, -direction.x);
  bend.normalize();
  const along = (l1 * l1 + distance * distance - l2 * l2) / (2 * distance);
  const height = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const elbow = a.clone().addScaledVector(direction, along).addScaledVector(bend, height);
  aimBone(upper, lower, elbow);
  aimBone(lower, hand, reachable);
  return hand.getWorldPosition(new THREE.Vector3()).distanceTo(target);
}
function handBasis(x, y) {
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  const up = new THREE.Vector3().crossVectors(z, x).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, up, z));
}

/** Ground-origin, −Z-facing operative; each clone owns its bones and mixer. */
export function createOperative(id = 0, weapon = 'rifle') {
  if (!source) throw new Error('Call and await loadVanguard() before createOperative()');
  if (!['rifle', 'sniper', 'pistol'].includes(weapon)) weapon = 'rifle';
  const group = new THREE.Group(); group.name = `vanguard_${id}`;
  const visual = new THREE.Group(); visual.name = 'vanguard_ground_offset';
  visual.position.y = source.floor; group.add(visual);
  const model = cloneSkeleton(source.scene); model.name = `vanguard_skin_${id}`;
  model.scale.setScalar(source.scale); visual.add(model);
  const bones = {}, meshes = [], ownedMaterials = new Set();
  model.traverse(o => {
    if (o.isBone) bones[o.name.replace(/^mixamorig:?/, '')] = o;
    if (!o.isSkinnedMesh) return;
    meshes.push(o); o.castShadow = true; o.receiveShadow = true;
    o.frustumCulled = false; // Animated bounds must not cull a raised arm or a corpse.
    o.userData.botId = id;
    o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone();
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) ownedMaterials.add(m);
    const originalRaycast = o.raycast;
    o.raycast = function(raycaster, intersections) {
      group.updateMatrixWorld(true);
      // Exact skin bounds are refreshed on a shot, rather than 7,434 vertices
      // for every bot on every animation frame. Triangle hits use actual skin.
      this.computeBoundingSphere(); this.boundingBox = null;
      originalRaycast.call(this, raycaster, intersections);
    };
  });
  for (const required of ['Hips', 'Spine', 'Spine1', 'Spine2', 'Head', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand']) {
    if (!bones[required]) throw new Error(`Vanguard rig is missing ${required}`);
  }
  const bindPose = new Map(Object.values(bones).map(b => [b, b.quaternion.clone()]));
  const mixer = new THREE.AnimationMixer(model);
  const actions = Object.fromEntries(['Idle', 'Walk', 'Run'].map(name => {
    const action = mixer.clipAction(source.clips.find(c => c.name === name));
    action.setEffectiveWeight(name === 'Idle' ? 1 : 0).play();
    return [name, action];
  }));
  // Independent phase per combatant; the source keyframes still drive the legs.
  const phase = ((Number(id) || 0) * .173) % 1;
  for (const action of Object.values(actions)) action.time = phase * action.getClip().duration;
  mixer.update(0); group.updateMatrixWorld(true);
  const neutral = new Map(Object.values(bones).map(b => [b, { q: b.quaternion.clone(), p: b.position.clone() }]));
  // Measure the actual helmet and face vertices influenced by Head. A tiny
  // geometric head ellipsoid misses the front of this substantial helmet.
  const headHitBox = new THREE.Box3();
  const bootVertices = { Left: [], Right: [] };
  const headVertex = new THREE.Vector3(), inverseHead = bones.Head.matrixWorld.clone().invert();
  for (const mesh of meshes) {
    const indices = mesh.geometry.getAttribute('skinIndex'), weights = mesh.geometry.getAttribute('skinWeight');
    for (let i = 0; i < indices.count; i++) {
      let headWeight = 0, leftFootWeight = 0, rightFootWeight = 0;
      for (let k = 0; k < 4; k++) {
        const bone = mesh.skeleton.bones[indices.getComponent(i, k)], weight = weights.getComponent(i, k);
        if (bone === bones.Head) headWeight += weight;
        if (bone === bones.LeftFoot || bone === bones.LeftToeBase) leftFootWeight += weight;
        if (bone === bones.RightFoot || bone === bones.RightToeBase) rightFootWeight += weight;
      }
      if (leftFootWeight >= .35) bootVertices.Left.push({ mesh, index: i });
      if (rightFootWeight >= .35) bootVertices.Right.push({ mesh, index: i });
      if (headWeight < .4) continue;
      mesh.getVertexPosition(i, headVertex).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverseHead);
      headHitBox.expandByPoint(headVertex);
    }
  }
  headHitBox.expandByScalar(.8);


  const carried = createWorldWeapon(weapon); carried.name = `vanguard_carried_${weapon}`;
  bones.RightHand.add(carried);
  const gunScale = weapon === 'pistol' ? 1 : .86;
  const gunInverseScale = 1 / (source.scale * .01);
  carried.scale.setScalar(gunScale * gunInverseScale);
  const muzzle = new THREE.Group(); muzzle.name = 'vanguard_muzzle';
  muzzle.position.copy(carried.userData.muzzlePosition || new THREE.Vector3(0, .032, carried.userData.parts.muzzleZ));
  carried.add(muzzle);
  const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffce73, transparent: true, opacity: .96, depthWrite: false, blending: THREE.AdditiveBlending });
  const flash = new THREE.Mesh(new THREE.ConeGeometry(.045, .15, 6), flashMaterial);
  flash.rotation.x = -Math.PI / 2; flash.position.z = -.075; muzzle.add(flash); muzzle.visible = false;
  const alertMesh = new THREE.Mesh(new THREE.OctahedronGeometry(.037), new THREE.MeshBasicMaterial({ color: 0xe8a150, transparent: true, opacity: .92, depthWrite: false }));
  alertMesh.name = 'alert_indicator'; alertMesh.position.set(0, 2.04, 0); alertMesh.visible = false; group.add(alertMesh);
  const fingerRest = new Map(Object.values(bones).filter(b => /Hand(Thumb|Index|Middle|Ring|Pinky)\d$/.test(b.name)).map(b => [b, b.quaternion.clone()]));
  const rightHandQ = handBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, .95, -.312));
  const leftHandQ = handBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0));
  let moveWeight = 0, runWeight = 0, aim = 0, aimYaw = 0, aimPitch = 0;
  let recoil = 0, flashTime = 0, hitTime = 0, age = 0, deadPose = null, lastDeathProgress = -1, disposed = false;
  const headCenter = new THREE.Vector3();
  const debug = { rightGripError: 0, leftGripError: 0, footLift: { Left: 0, Right: 0 }, sourceClips: ['Idle', 'Walk', 'Run'], procedural: ['two-arm IK', 'finger grip', 'aim', 'recoil', 'hit', 'death'] };
  group.userData.animation = debug;

  function curlFingers(reload = 0) {
    for (const [bone, rest] of fingerRest) {
      const match = bone.name.match(/(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)(\d)$/);
      if (!match) continue;
      const [, side, digit, number] = match;
      const n = Number(number), support = side === 'Left';
      let bend = digit === 'Thumb' ? (n === 1 ? .30 : .45) : n === 1 ? .70 : n === 2 ? 1.14 : .78;
      if (digit === 'Index' && !support) bend *= .48; // Trigger finger, not a mitten.
      if (support && reload) bend *= 1 - reload * .7;
      bone.quaternion.copy(rest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), bend));
    }
  }
  function updateHead() {
    bones.Head.localToWorld(headCenter.set(0, 12, 0));
  }
  function holdWeapon(reload, time) {
    group.updateMatrixWorld(true);
    const rootQ = group.getWorldQuaternion(new THREE.Quaternion());
    const yawQ = new THREE.Quaternion().setFromAxisAngle(Y, aimYaw);
    const pitchQ = new THREE.Quaternion().setFromAxisAngle(X, aimPitch - (1 - aim) * .09 + recoil * .085 - reload * .28);
    const gunQ = rootQ.clone().multiply(yawQ).multiply(pitchQ);
    const shoulder = bones.RightArm.getWorldPosition(new THREE.Vector3());
    const bob = Math.sin(time * 1.8 + phase) * .002;
    const shoulderCenter = shoulder.clone().add(bones.LeftArm.getWorldPosition(new THREE.Vector3())).multiplyScalar(.5);
    const gunPosition = shoulderCenter.add(new THREE.Vector3(.150, -.050 - (1 - aim) * .026 + bob - reload * .04, -.225 + recoil * .045).applyQuaternion(rootQ.clone().multiply(yawQ)));
    const supportOffset = weapon === 'pistol' ? new THREE.Vector3(-.10, -.13, .095) : new THREE.Vector3(-.13, -.075, -.205);
    supportOffset.lerp(new THREE.Vector3(-.12, -.26, -.015), reload);
    const leftShoulder = bones.LeftArm.getWorldPosition(new THREE.Vector3());
    const leftElbow = bones.LeftForeArm.getWorldPosition(new THREE.Vector3());
    const leftWrist = bones.LeftHand.getWorldPosition(new THREE.Vector3());
    const supportWorldOffset = supportOffset.clone().multiplyScalar(gunScale).applyQuaternion(gunQ);
    const reach = leftShoulder.distanceTo(leftElbow) + leftElbow.distanceTo(leftWrist) - .010;
    const supportDistance = gunPosition.clone().add(supportWorldOffset).sub(leftShoulder);
    // A sprint's recorded shoulder twist can shorten reach. Translate the
    // two-handed mount a few centimetres toward the supporting shoulder,
    // rather than stretching an arm or leaving its palm behind the weapon.
    if (supportDistance.length() > reach) gunPosition.addScaledVector(supportDistance, -(supportDistance.length() - reach) / supportDistance.length());
    const rightOffset = new THREE.Vector3(.034, -.145, weapon === 'pistol' ? .15 : .12).multiplyScalar(gunScale).applyQuaternion(gunQ);
    const rightTarget = gunPosition.clone().add(rightOffset);
    const rightPole = shoulder.clone().add(new THREE.Vector3(.25, -.38, .13).applyQuaternion(rootQ));
    debug.rightGripError = solveArm(bones.RightArm, bones.RightForeArm, bones.RightHand, rightTarget, rightPole);
    worldQuaternion(bones.RightHand, gunQ.clone().multiply(rightHandQ));
    // The gun is genuinely parented to RightHand. Convert the desired world
    // mount into that bone's local space; no gun can float away from its grip.
    carried.position.copy(bones.RightHand.worldToLocal(gunPosition.clone()));
    carried.quaternion.copy(bones.RightHand.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(gunQ));
    carried.updateWorldMatrix(false, true);
    const leftTarget = carried.localToWorld(supportOffset.clone());
    const leftPole = leftShoulder.clone().add(new THREE.Vector3(-.18, -.36, .02).applyQuaternion(rootQ));
    debug.leftGripError = solveArm(bones.LeftArm, bones.LeftForeArm, bones.LeftHand, leftTarget, leftPole);
    worldQuaternion(bones.LeftHand, gunQ.clone().multiply(weapon === 'pistol' ? rightHandQ : leftHandQ));
    curlFingers(reload);
  }
  /** Optional terrain hook: floorAt(worldX, worldZ) returns world-space floor Y.
   * Only boots intersecting terrain above the root floor receive a bounded
   * placement correction. Flat-ground and airborne source strides are intact.
   */
  function placeFeet(floorAt) {
    debug.footLift.Left = debug.footLift.Right = 0;
    if (typeof floorAt !== 'function') return;
    group.updateMatrixWorld(true);
    const rootFloor = group.getWorldPosition(new THREE.Vector3()).y;
    const rootQ = group.getWorldQuaternion(new THREE.Quaternion());
    const forward = new THREE.Vector3(0, 0, -.20).applyQuaternion(rootQ);
    const point = new THREE.Vector3();
    for (const side of ['Left', 'Right']) {
      const ankle = bones[`${side}Foot`], knee = bones[`${side}Leg`], hip = bones[`${side}UpLeg`];
      const anklePosition = ankle.getWorldPosition(new THREE.Vector3());
      let higherGround = false;
      // A conservative footprint discovers a step before testing its real
      // boot vertices; ordinary ground needs only nine cheap height probes.
      for (const x of [-.14, 0, .14]) for (const z of [-.30, 0, .15]) {
        point.set(x, 0, z).applyQuaternion(rootQ).add(anklePosition);
        const floor = floorAt(point.x, point.z);
        if (Number.isFinite(floor) && floor > rootFloor + .025 && floor < rootFloor + .40) higherGround = true;
      }
      if (!higherGround) continue;
      let penetration = 0;
      for (const sample of bootVertices[side]) {
        sample.mesh.getVertexPosition(sample.index, point).applyMatrix4(sample.mesh.matrixWorld);
        const floor = floorAt(point.x, point.z);
        if (Number.isFinite(floor) && floor > rootFloor + .025 && floor < rootFloor + .40) penetration = Math.max(penetration, floor - point.y);
      }
      if (penetration <= .006) continue;
      const lift = Math.min(.36, penetration + .009);
      const target = anklePosition.clone().add(new THREE.Vector3(0, lift, 0));
      const footQ = ankle.getWorldQuaternion(new THREE.Quaternion());
      const pole = knee.getWorldPosition(new THREE.Vector3()).add(forward);
      solveArm(hip, knee, ankle, target, pole);
      worldQuaternion(ankle, footQ);
      debug.footLift[side] = lift;
      group.updateMatrixWorld(true);
    }
  }
  function animateDeath(progress) {
    if (deadPose && progress === lastDeathProgress) { group.updateMatrixWorld(true); updateHead(); return; }
    lastDeathProgress = progress;
    if (!deadPose) deadPose = new Map(Object.values(bones).map(b => [b, { q: b.quaternion.clone(), p: b.position.clone() }]));
    const t = clamp(progress, 0, 1), ease = t * t * (3 - 2 * t);
    const settle = Math.min(1, ease * 1.5);
    for (const [bone, pose] of deadPose) {
      bone.position.copy(pose.p); bone.quaternion.copy(pose.q);
      if (/Hips|Spine|Neck|Head|UpLeg|Leg$|Foot|Toe/.test(bone.name)) bone.quaternion.slerp(bindPose.get(bone), settle);
    }
    visual.position.y = source.floor;
    group.updateMatrixWorld(true);
    const rootQ = group.getWorldQuaternion(new THREE.Quaternion());
    const axisX = X.clone().applyQuaternion(rootQ), axisY = Y.clone().applyQuaternion(rootQ);
    // Articulated knees fold first; the pelvis then tips backward and settles.
    // The caller's root remains upright at the authoritative terrain height.
    rotateWorld(bones.LeftUpLeg, axisX, .40 * ease);
    rotateWorld(bones.RightUpLeg, axisX, .22 * ease);
    rotateWorld(bones.LeftLeg, axisX, -.80 * ease);
    rotateWorld(bones.RightLeg, axisX, -.44 * ease);
    rotateWorld(bones.Spine2, axisX, -.06 * ease);
    rotateWorld(bones.Head, axisX, .10 * ease);
    rotateWorld(bones.Hips, axisX, 1.62 * ease);
    rotateWorld(bones.Hips, axisY, .13 * ease);
    group.updateMatrixWorld(true);
    // Exact deformed vertices, including boots, establish the local floor.
    // Only dying combatants pay this cost; it avoids a rigid plank / sunk feet.
    let min = Infinity;
    const vertex = new THREE.Vector3();
    const inverseRoot = group.matrixWorld.clone().invert();
    for (const mesh of meshes) {
      const count = mesh.geometry.getAttribute('position').count;
      for (let i = 0; i < count; i++) {
        mesh.getVertexPosition(i, vertex).applyMatrix4(mesh.matrixWorld);
        vertex.applyMatrix4(inverseRoot); min = Math.min(min, vertex.y);
      }
    }
    if (Number.isFinite(min)) visual.position.y -= min;
    alertMesh.visible = false; muzzle.visible = false;
    group.updateMatrixWorld(true); updateHead();
  }
  function animate(dt = 0, state = {}) {
    if (disposed) return;
    dt = clamp(Number(dt) || 0, 0, .1); age += dt;
    if (state.dead) { animateDeath(state.deathProgress ?? 1); return; }
    deadPose = null; lastDeathProgress = -1; visual.position.y = source.floor;
    const speed = state.moving ? Math.max(0, Number(state.speed) || 0) : 0;
    const smoothing = 1 - Math.exp(-dt * 10);
    moveWeight = THREE.MathUtils.lerp(moveWeight, state.moving ? clamp(speed / .45, 0, 1) : 0, smoothing);
    runWeight = THREE.MathUtils.lerp(runWeight, clamp((speed - 1.8) / 2.1, 0, 1), smoothing);
    aim = THREE.MathUtils.lerp(aim, clamp(Number(state.aiming) || 0, 0, 1), smoothing);
    aimYaw = THREE.MathUtils.lerp(aimYaw, clamp(Number(state.aimYaw) || 0, -.85, .85), smoothing);
    aimPitch = THREE.MathUtils.lerp(aimPitch, clamp(Number(state.aimPitch) || 0, -.55, .60), smoothing);
    actions.Idle.setEffectiveWeight(1 - moveWeight);
    actions.Walk.setEffectiveWeight(moveWeight * (1 - runWeight)).setEffectiveTimeScale(clamp(speed / 1.7, .55, 1.65));
    actions.Run.setEffectiveWeight(moveWeight * runWeight).setEffectiveTimeScale(clamp(speed / 4.5, .60, 1.65));
    // Remove the previous procedural pass BEFORE sampling the original clips.
    // AnimationMixer may skip writing a constant track, so explicit restoration
    // also prevents additive arm / finger / aim drift over long matches.
    for (const [bone, rest] of neutral) { bone.quaternion.copy(rest.q); bone.position.copy(rest.p); }
    mixer.update(dt);
    group.updateMatrixWorld(true);
    placeFeet(state.floorAt);
    const rootQ = group.getWorldQuaternion(new THREE.Quaternion());
    const axisY = Y.clone().applyQuaternion(rootQ), axisX = X.clone().applyQuaternion(rootQ);
    const reaction = Math.sin(clamp(hitTime / .23, 0, 1) * Math.PI);
    rotateWorld(bones.Spine1, axisY, aimYaw * .35 + reaction * .06);
    rotateWorld(bones.Spine2, axisY, aimYaw * .50);
    rotateWorld(bones.Head, axisY, aimYaw * .15);
    rotateWorld(bones.Spine1, axisX, aimPitch * .14 - reaction * .07);
    rotateWorld(bones.Head, axisX, aimPitch * .42 + recoil * .015);
    const reload = typeof state.reloading === 'number' ? Math.sin(clamp(state.reloading, 0, 1) * Math.PI) : state.reloading ? .8 : 0;
    holdWeapon(reload, Number(state.time) || age);
    recoil *= Math.exp(-dt * 16); hitTime = Math.max(0, hitTime - dt);
    flashTime = Math.max(0, flashTime - dt); muzzle.visible = flashTime > 0;
    flash.rotation.z += dt * 91;
    alertMesh.rotation.y += dt; group.updateMatrixWorld(true); updateHead();
  }
  function fire() { if (disposed || deadPose) return; recoil = Math.min(1.5, recoil + 1); flashTime = .065; muzzle.visible = true; }
  function hit() { if (!disposed && !deadPose) hitTime = .23; }
  function classifyHit(point) {
    group.updateMatrixWorld(true); updateHead();
    const p = bones.Head.worldToLocal(point.clone());
    // Bone-local bounds follow the actual animated helmet, including a fall.
    return headHitBox.containsPoint(p) ? 'head' : 'body';
  }
  function dispose() {
    if (disposed) return; disposed = true;
    mixer.stopAllAction(); mixer.uncacheRoot(model);
    for (const skeleton of new Set(meshes.map(mesh => mesh.skeleton))) skeleton.dispose();
    for (const material of ownedMaterials) material.dispose();
    // Weapon geometry belongs to this factory call; its actors.js materials do
    // not. Original GLB geometry and textures remain shared for the next match.
    carried.traverse(o => { if (o.isMesh && o !== flash) o.geometry.dispose(); });
    flash.geometry.dispose(); flashMaterial.dispose();
    alertMesh.geometry.dispose(); alertMesh.material.dispose();
    group.removeFromParent();
  }
  animate(0, { time: phase, aiming: 0 });
  return { group, meshes, alertMesh, animate, dispose, hit, fire, muzzle, bones, mixer, actions, weapon: carried, classifyHit };
}
