/**
 * CharacterVisual: builds the cartoon body. Uses a GLB template when available;
 * otherwise builds an exaggerated-proportion procedural rig (big head/hands/feet,
 * stubby body) with named bones our procedural clips can drive.
 */
import * as THREE from 'three';
import { PALETTE } from '../config/graphicsConfig';

export interface VisualRig {
  root: THREE.Group;           // whole character visual (child of nothing until added)
  armatureRoot: THREE.Object3D; // clip mixer root (hips for procedural, model root for GLB)
  handBone: THREE.Object3D | null;
  headAnchor: THREE.Object3D;
  heightScale: number;
  /** Y (in root space) of the visual bottom — pin root.position.y = -feetOffsetY for feet-on-origin. */
  feetOffsetY: number;
}

function stdMat(color: number, rough = 0.85): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 });
}

interface BodyColors {
  body: number;
  cloth: number;
  skin: number;
  accent: number;
}

export const HERO_COLORS: BodyColors = { body: PALETTE.heroTunic, cloth: PALETTE.heroCloth, skin: PALETTE.skin, accent: PALETTE.gold };
export const ENEMY_A_COLORS: BodyColors = { body: PALETTE.enemyA, cloth: 0x5c3a2a, skin: PALETTE.skin, accent: 0x8f9aa8 };
export const ENEMY_B_COLORS: BodyColors = { body: PALETTE.enemyB, cloth: 0x3d4450, skin: 0xd9b48f, accent: 0xe8b23a };
export const ENEMY_C_COLORS: BodyColors = { body: PALETTE.enemyC, cloth: 0x2f3550, skin: 0xe8c9a8, accent: 0x9fe8a0 };
export const BOSS_COLORS: BodyColors = { body: PALETTE.boss, cloth: PALETTE.bossCloth, skin: 0xc9a06a, accent: PALETTE.gold };

/** Build an exaggerated cartoon character from primitives with a named bone hierarchy. */
export function buildProceduralCharacter(colors: BodyColors, scale = 1): VisualRig {
  const root = new THREE.Group();
  const bodyMat = stdMat(colors.body);
  const clothMat = stdMat(colors.cloth);
  const skinMat = stdMat(colors.skin);
  const accentMat = stdMat(colors.accent, 0.45);
  const bootMat = stdMat(0x4a3526);

  // ---- hips (root bone) ----
  const hips = new THREE.Object3D();
  hips.name = 'hips';
  hips.position.y = 0.82;
  root.add(hips);

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 0.34), clothMat);
  hips.add(pelvis);

  // ---- spine/torso: short body, big proportions ----
  const spine = new THREE.Object3D();
  spine.name = 'spine';
  spine.position.y = 0.16;
  hips.add(spine);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.55, 0.42), bodyMat);
  chest.position.y = 0.3;
  chest.castShadow = true;
  spine.add(chest);
  // belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.1, 0.44), accentMat);
  belt.position.y = 0.05;
  spine.add(belt);
  // cloth cape hint
  const cape = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.06), clothMat);
  cape.position.set(0, 0.22, -0.24);
  spine.add(cape);

  // ---- head: BIG ----
  const neck = new THREE.Object3D();
  neck.name = 'neck';
  neck.position.y = 0.62;
  spine.add(neck);
  const head = new THREE.Object3D();
  head.name = 'head';
  head.position.y = 0.1;
  neck.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), skinMat);
  skull.position.y = 0.24;
  skull.scale.set(1, 1.05, 0.95);
  skull.castShadow = true;
  head.add(skull);
  // eyes
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.052, 6, 6), stdMat(0x1a1426));
    eye.position.set(s * 0.12, 0.3, 0.3);
    head.add(eye);
  }
  // helmet-ish cap with nose guard
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), accentMat);
  helm.position.y = 0.28;
  helm.scale.set(1, 0.75, 1);
  helm.castShadow = true;
  head.add(helm);

  // ---- arms: big hands ----
  const mkArm = (side: 1 | -1, name: string): THREE.Object3D => {
    const arm = new THREE.Object3D();
    arm.name = name;
    arm.position.set(side * 0.4, 0.5, 0);
    spine.add(arm);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.3, 3, 6), bodyMat);
    upper.position.y = -0.2;
    upper.castShadow = true;
    arm.add(upper);
    const forearm = new THREE.Object3D();
    forearm.name = name === 'armL' ? 'forearmL' : 'forearmR';
    forearm.position.y = -0.4;
    arm.add(forearm);
    const foreMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.22, 3, 6), skinMat);
    foreMesh.position.y = -0.15;
    forearm.add(foreMesh);
    // BIG hand
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), skinMat);
    hand.name = name === 'armL' ? 'handL' : 'handR';
    hand.position.y = -0.36;
    hand.scale.set(1, 0.9, 1);
    hand.castShadow = true;
    forearm.add(hand);
    return arm;
  };
  const armL = mkArm(-1, 'armL');
  const armR = mkArm(1, 'armR');
  void armL;

  // ---- legs: big feet ----
  const mkLeg = (side: 1 | -1, name: string): THREE.Object3D => {
    const leg = new THREE.Object3D();
    leg.name = name;
    leg.position.set(side * 0.18, -0.05, 0);
    hips.add(leg);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.26, 3, 6), clothMat);
    thigh.position.y = -0.24;
    leg.add(thigh);
    // BIG foot
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.4), bootMat);
    foot.name = name === 'legL' ? 'footL' : 'footR';
    foot.position.set(0, -0.52, 0.08);
    foot.castShadow = true;
    leg.add(foot);
    return leg;
  };
  mkLeg(-1, 'legL');
  mkLeg(1, 'legR');

  root.scale.setScalar(scale);
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });

  let handBone: THREE.Object3D | null = null;
  armR.traverse((o) => {
    if (o.name === 'handR') handBone = o;
  });

  return { root, armatureRoot: hips, handBone, headAnchor: head, heightScale: scale, feetOffsetY: 0 };
}

/** Wrap a GLB template instance into a VisualRig (finds hips/hand). */
export function rigFromGLB(instance: THREE.Object3D, scale = 1): VisualRig {
  const root = new THREE.Group();
  root.add(instance);
  root.scale.setScalar(scale);

  let hips: THREE.Object3D | null = null;
  let headAnchor: THREE.Object3D | null = null;
  let handBone: THREE.Object3D | null = null;
  instance.traverse((o) => {
    const n = o.name.toLowerCase();
    if (!hips && (n.includes('hips') || n === 'mixamorighips')) hips = o;
    if (!headAnchor && (n === 'head' || n === 'mixamorighead')) headAnchor = o;
    // prefer the RIGHT hand (weapon hand); only fall back to left if right is absent
    if (n === 'mixamorigrighthand' || n === 'righthand') handBone = o;
    else if (!handBone && (n === 'mixamoriglefthand' || n === 'lefthand')) handBone = o;
  });

  // world-space Y of the visual bottom (mesh AABB min), expressed in root space —
  // consumers pin rig.root.position.y = -feetOffsetY so feet land on the origin.
  const afterBox = new THREE.Box3().setFromObject(root);

  return {
    root,
    armatureRoot: instance,
    handBone,
    headAnchor: headAnchor ?? instance,
    heightScale: scale,
    feetOffsetY: afterBox.min.y,
  };
}
