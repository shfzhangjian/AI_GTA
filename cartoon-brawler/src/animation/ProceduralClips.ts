/**
 * ProceduralClipFactory: generates stylized action clips (attack, dodge, hit...)
 * by animating humanoid bone rotations. Works with ANY skeleton whose bones can
 * be name-matched (Mixamo naming + our procedural fallback rig). This keeps the
 * game fully animated even when Mixamo GLBs aren't available — swap in real
 * clips later without touching gameplay code.
 */
import * as THREE from 'three';


interface RigHandles {
  root: THREE.Object3D | null;      // hips / body
  torso: THREE.Object3D | null;
  head: THREE.Object3D | null;
  armL: THREE.Object3D | null;      // left upper arm (or whole arm)
  armR: THREE.Object3D | null;
  foreL: THREE.Object3D | null;
  foreR: THREE.Object3D | null;
  legL: THREE.Object3D | null;
  legR: THREE.Object3D | null;
}

export function findRig(root: THREE.Object3D): RigHandles {
  const handles: RigHandles = { root: null, torso: null, head: null, armL: null, armR: null, foreL: null, foreR: null, legL: null, legR: null };
  let hips: THREE.Object3D | null = null;
  let spine: THREE.Object3D | null = null;
  root.traverse((o) => {
    const n = o.name.toLowerCase();
    if (!hips && (n === 'hips' || n === 'mixamorighips' || n.includes('hips') || n === 'body')) hips = o;
    if (!spine && (n.includes('spine') || n.includes('chest') || n.includes('torso'))) spine = o;
    if (!handles.head && (n === 'head' || n.includes('head'))) handles.head = o;
    if (!handles.armL && ((n.includes('leftarm') && !n.includes('hand')) || n === 'arml')) handles.armL = o;
    if (!handles.armR && ((n.includes('rightarm') && !n.includes('hand')) || n === 'armr')) handles.armR = o;
    if (!handles.foreL && (n.includes('leftforearm') || n === 'forearml')) handles.foreL = o;
    if (!handles.foreR && (n.includes('rightforearm') || n === 'forearmr')) handles.foreR = o;
    if (!handles.legL && (n.includes('leftupleg') || n === 'legl')) handles.legL = o;
    if (!handles.legR && (n.includes('rightupleg') || n === 'legr')) handles.legR = o;
  });
  handles.root = hips ?? spine ?? root;
  handles.torso = spine ?? hips ?? root;
  return handles;
}

function q(x: number, y: number, z: number): THREE.Quaternion {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
}

export class ProceduralClipFactory {
  private rig: RigHandles;
  private rootObj: THREE.Object3D;

  constructor(armatureRoot: THREE.Object3D) {
    this.rig = findRig(armatureRoot);
    this.rootObj = armatureRoot;
  }

  private trackName(o: THREE.Object3D | null): string | null {
    if (!o) return null;
    // must be addressable from the clip's root (armature root)
    let node: THREE.Object3D | null = o;
    const chain: string[] = [];
    while (node && node !== this.rootObj) {
      chain.unshift(node.name);
      node = node.parent;
    }
    if (!node || chain.some((n) => !n)) return null;
    return chain.join('/');
  }

  private boneTrack(
    bone: THREE.Object3D | null,
    duration: number,
    samples: { t: number; rot: [number, number, number] }[],
  ): THREE.QuaternionKeyframeTrack | null {
    if (!bone || !bone.name) return null;
    const path = this.trackName(bone);
    if (!path) return null;
    const times: number[] = [];
    const values: number[] = [];
    const base = bone.quaternion.clone();
    const tq = new THREE.Quaternion();
    for (const s of samples) {
      times.push(s.t * duration);
      tq.copy(base).multiply(q(...s.rot));
      values.push(tq.x, tq.y, tq.z, tq.w);
    }
    return new THREE.QuaternionKeyframeTrack(`${path}.quaternion`, times, values);
  }

  buildAll(): THREE.AnimationClip[] {
    const clips: THREE.AnimationClip[] = [];
    const push = (name: string, dur: number, tracks: (THREE.KeyframeTrack | null)[]): void => {
      const t = tracks.filter((x): x is THREE.KeyframeTrack => !!x);
      if (t.length === 0) return;
      const clip = new THREE.AnimationClip(name, dur, t);
      clips.push(clip);
    };

    // ---- Idle: gentle breathing sway ----
    push('Idle', 2.4, [
      this.boneTrack(this.rig.torso, 2.4, [
        { t: 0, rot: [0.02, 0, 0] }, { t: 0.5, rot: [-0.03, 0.02, 0] }, { t: 1, rot: [0.02, 0, 0] },
      ]),
      this.boneTrack(this.rig.armL, 2.4, [
        { t: 0, rot: [0, 0, 0.06] }, { t: 0.5, rot: [0.03, 0, 0.1] }, { t: 1, rot: [0, 0, 0.06] },
      ]),
      this.boneTrack(this.rig.armR, 2.4, [
        { t: 0, rot: [0, 0, -0.06] }, { t: 0.5, rot: [-0.03, 0, -0.1] }, { t: 1, rot: [0, 0, -0.06] },
      ]),
    ]);

    // ---- Walk / Run (same rig, run is faster + bigger) ----
    const legSwing = (amp: number): (THREE.KeyframeTrack | null)[] => [
      this.boneTrack(this.rig.legL, 1, [
        { t: 0, rot: [amp, 0, 0] }, { t: 0.5, rot: [-amp, 0, 0] }, { t: 1, rot: [amp, 0, 0] },
      ]),
      this.boneTrack(this.rig.legR, 1, [
        { t: 0, rot: [-amp, 0, 0] }, { t: 0.5, rot: [amp, 0, 0] }, { t: 1, rot: [-amp, 0, 0] },
      ]),
    ];
    const armSwing = (amp: number): (THREE.KeyframeTrack | null)[] => [
      this.boneTrack(this.rig.armL, 1, [
        { t: 0, rot: [-amp, 0, 0.05] }, { t: 0.5, rot: [amp, 0, 0.05] }, { t: 1, rot: [-amp, 0, 0.05] },
      ]),
      this.boneTrack(this.rig.armR, 1, [
        { t: 0, rot: [amp, 0, -0.05] }, { t: 0.5, rot: [-amp, 0, -0.05] }, { t: 1, rot: [amp, 0, -0.05] },
      ]),
    ];
    push('Walk', 0.95, [...legSwing(0.42), ...armSwing(0.3), this.boneTrack(this.rig.torso, 0.95, [
      { t: 0, rot: [0.05, -0.06, 0] }, { t: 0.5, rot: [0.05, 0.06, 0] }, { t: 1, rot: [0.05, -0.06, 0] },
    ])]);
    push('Run', 0.62, [...legSwing(0.78), ...armSwing(0.62), this.boneTrack(this.rig.torso, 0.62, [
      { t: 0, rot: [0.16, -0.1, 0] }, { t: 0.5, rot: [0.16, 0.1, 0] }, { t: 1, rot: [0.16, -0.1, 0] },
    ])]);

    // ---- Attacks (right arm swings weapon) ----
    push('Attack1', 0.72, [
      this.boneTrack(this.rig.armR, 0.72, [
        { t: 0, rot: [-0.9, 0.6, -0.3] },       // wind up back
        { t: 0.34, rot: [-2.5, 0.2, -0.2] },    // raise
        { t: 0.5, rot: [0.9, -0.8, 0.5] },      // slash down across
        { t: 0.72, rot: [-0.35, 0, 0] },        // recover
      ]),
      this.boneTrack(this.rig.foreR, 0.72, [
        { t: 0, rot: [-0.4, 0, 0] }, { t: 0.34, rot: [-1.5, 0, 0] }, { t: 0.5, rot: [-0.2, 0, 0] }, { t: 0.72, rot: [-0.3, 0, 0] },
      ]),
      this.boneTrack(this.rig.torso, 0.72, [
        { t: 0, rot: [0, 0.5, 0] }, { t: 0.34, rot: [-0.1, 0.6, 0] }, { t: 0.5, rot: [0.25, -0.7, 0] }, { t: 0.72, rot: [0, 0, 0] },
      ]),
    ]);

    push('Attack2', 0.68, [
      this.boneTrack(this.rig.armR, 0.68, [
        { t: 0, rot: [-0.4, -0.9, 0.2] },
        { t: 0.32, rot: [-1.2, 1.0, -0.5] },   // other side wind
        { t: 0.5, rot: [0.7, -1.1, 0.6] },     // reverse slash
        { t: 0.68, rot: [-0.3, 0, 0] },
      ]),
      this.boneTrack(this.rig.torso, 0.68, [
        { t: 0, rot: [0, -0.5, 0] }, { t: 0.32, rot: [-0.1, -0.6, 0] }, { t: 0.5, rot: [0.2, 0.8, 0] }, { t: 0.68, rot: [0, 0, 0] },
      ]),
    ]);

    push('Attack3', 0.92, [
      this.boneTrack(this.rig.armR, 0.92, [
        { t: 0, rot: [-1.2, 0.4, -0.4] },
        { t: 0.36, rot: [-3.0, 0.1, -0.15] },  // big overhead raise
        { t: 0.56, rot: [1.5, -0.2, 0.35] },   // overhead slam
        { t: 0.92, rot: [-0.3, 0, 0] },
      ]),
      this.boneTrack(this.rig.foreR, 0.92, [
        { t: 0, rot: [-0.5, 0, 0] }, { t: 0.36, rot: [-1.8, 0, 0] }, { t: 0.56, rot: [0, 0, 0] }, { t: 0.92, rot: [-0.3, 0, 0] },
      ]),
      this.boneTrack(this.rig.torso, 0.92, [
        { t: 0, rot: [-0.25, 0.4, 0] }, { t: 0.36, rot: [-0.55, 0.3, 0] }, { t: 0.56, rot: [0.55, -0.3, 0] }, { t: 0.92, rot: [0, 0, 0] },
      ]),
    ]);

    push('HeavyAttack', 1.15, [
      this.boneTrack(this.rig.armR, 1.15, [
        { t: 0, rot: [-0.6, 0.8, -0.3] },
        { t: 0.42, rot: [-3.1, 0.2, -0.1] },   // long windup overhead
        { t: 0.58, rot: [1.7, -0.1, 0.3] },    // crush down
        { t: 1.15, rot: [-0.3, 0, 0] },
      ]),
      this.boneTrack(this.rig.foreR, 1.15, [
        { t: 0, rot: [-0.6, 0, 0] }, { t: 0.42, rot: [-2.0, 0, 0] }, { t: 0.58, rot: [0, 0, 0] }, { t: 1.15, rot: [-0.3, 0, 0] },
      ]),
      this.boneTrack(this.rig.torso, 1.15, [
        { t: 0, rot: [-0.3, 0.6, 0] }, { t: 0.42, rot: [-0.7, 0.5, 0] }, { t: 0.58, rot: [0.65, -0.4, 0] }, { t: 1.15, rot: [0, 0, 0] },
      ]),
    ]);

    // ---- Dodge roll (root pitches forward) ----
    push('Dodge', 0.5, [
      this.boneTrack(this.rig.root, 0.5, [
        { t: 0, rot: [0, 0, 0] }, { t: 0.25, rot: [-1.9, 0, 0] }, { t: 0.6, rot: [-2.8, 0, 0] }, { t: 1, rot: [0, 0, 0] },
      ]),
      this.boneTrack(this.rig.torso, 0.5, [
        { t: 0, rot: [0, 0, 0] }, { t: 0.25, rot: [-0.6, 0, 0] }, { t: 0.6, rot: [-0.8, 0, 0] }, { t: 1, rot: [0, 0, 0] },
      ]),
      this.boneTrack(this.rig.legL, 0.5, [{ t: 0, rot: [0, 0, 0] }, { t: 0.3, rot: [1.2, 0, 0] }, { t: 1, rot: [0, 0, 0] }]),
      this.boneTrack(this.rig.legR, 0.5, [{ t: 0, rot: [0, 0, 0] }, { t: 0.3, rot: [0.9, 0, 0] }, { t: 1, rot: [0, 0, 0] }]),
    ]);

    // ---- Hit / Knockback / Knockdown / GetUp / Death ----
    push('Hit', 0.32, [
      this.boneTrack(this.rig.torso, 0.32, [{ t: 0, rot: [0.4, 0, 0] }, { t: 0.5, rot: [0.25, 0.1, 0] }, { t: 1, rot: [0, 0, 0] }]),
      this.boneTrack(this.rig.head, 0.32, [{ t: 0, rot: [0.5, 0, 0] }, { t: 1, rot: [0, 0, 0] }]),
    ]);

    push('Knockback', 0.5, [
      this.boneTrack(this.rig.torso, 0.5, [{ t: 0, rot: [0.6, 0, 0.15] }, { t: 1, rot: [0.3, 0, 0] }]),
      this.boneTrack(this.rig.armL, 0.5, [{ t: 0, rot: [-1.4, 0, 0.4] }, { t: 1, rot: [-0.6, 0, 0.2] }]),
      this.boneTrack(this.rig.armR, 0.5, [{ t: 0, rot: [-1.4, 0, -0.4] }, { t: 1, rot: [-0.6, 0, -0.2] }]),
    ]);

    push('Knockdown', 0.8, [
      this.boneTrack(this.rig.root, 0.8, [{ t: 0, rot: [0, 0, 0] }, { t: 0.55, rot: [-1.4, 0, 0.2] }, { t: 1, rot: [-1.5, 0, 0.25] }]),
      this.boneTrack(this.rig.torso, 0.8, [{ t: 0, rot: [0.3, 0, 0] }, { t: 0.55, rot: [0.7, 0, 0.2] }, { t: 1, rot: [0.8, 0, 0.2] }]),
      this.boneTrack(this.rig.armL, 0.8, [{ t: 0, rot: [-1.6, 0, 0.5] }, { t: 1, rot: [-1.9, 0, 0.7] }]),
    ]);

    push('GetUp', 0.6, [
      this.boneTrack(this.rig.root, 0.6, [{ t: 0, rot: [-1.5, 0, 0.25] }, { t: 0.6, rot: [-0.4, 0, 0] }, { t: 1, rot: [0, 0, 0] }]),
      this.boneTrack(this.rig.legL, 0.6, [{ t: 0, rot: [1.4, 0, 0] }, { t: 0.6, rot: [0.6, 0, 0] }, { t: 1, rot: [0, 0, 0] }]),
    ]);

    push('Death', 1.1, [
      this.boneTrack(this.rig.root, 1.1, [{ t: 0, rot: [0, 0, 0] }, { t: 0.45, rot: [-0.9, 0, 0.35] }, { t: 1, rot: [-1.35, 0, 0.5] }]),
      this.boneTrack(this.rig.torso, 1.1, [{ t: 0, rot: [0.2, 0, 0] }, { t: 0.45, rot: [0.6, 0, 0.3] }, { t: 1, rot: [0.9, 0, 0.4] }]),
      this.boneTrack(this.rig.head, 1.1, [{ t: 0, rot: [0.3, 0, 0] }, { t: 1, rot: [0.7, 0, 0] }]),
      this.boneTrack(this.rig.armL, 1.1, [{ t: 0, rot: [-1.2, 0, 0.3] }, { t: 1, rot: [-0.4, 0, 1.2] }]),
    ]);

    push('Jump', 0.4, [
      this.boneTrack(this.rig.legL, 0.4, [{ t: 0, rot: [0.9, 0, 0] }, { t: 1, rot: [0.35, 0, 0] }]),
      this.boneTrack(this.rig.legR, 0.4, [{ t: 0, rot: [0.7, 0, 0] }, { t: 1, rot: [0.55, 0, 0] }]),
      this.boneTrack(this.rig.armL, 0.4, [{ t: 0, rot: [-2.2, 0, 0.3] }]),
    ]);

    push('Fall', 0.5, [
      this.boneTrack(this.rig.legL, 0.5, [{ t: 0, rot: [0.2, 0, 0.15] }, { t: 1, rot: [-0.2, 0, -0.1] }]),
      this.boneTrack(this.rig.legR, 0.5, [{ t: 0, rot: [0.3, 0, -0.15] }, { t: 1, rot: [-0.1, 0, 0.1] }]),
      this.boneTrack(this.rig.armL, 0.5, [{ t: 0, rot: [-1.8, 0, 0.6] }]),
      this.boneTrack(this.rig.armR, 0.5, [{ t: 0, rot: [-1.8, 0, -0.6] }]),
    ]);

    push('Land', 0.34, [
      this.boneTrack(this.rig.torso, 0.34, [{ t: 0, rot: [0.5, 0, 0] }, { t: 1, rot: [0, 0, 0] }]),
      this.boneTrack(this.rig.legL, 0.34, [{ t: 0, rot: [0.8, 0, 0] }, { t: 1, rot: [0, 0, 0] }]),
      this.boneTrack(this.rig.legR, 0.34, [{ t: 0, rot: [0.8, 0, 0] }, { t: 1, rot: [0, 0, 0] }]),
    ]);

    // Boss spin attack reuses Attack1 rig with fast multi-rotation torso
    push('BossWindup', 1.0, [
      this.boneTrack(this.rig.armR, 1.0, [
        { t: 0, rot: [-0.5, 0.5, -0.3] }, { t: 0.55, rot: [-2.9, 0.2, -0.2] }, { t: 0.72, rot: [1.6, -0.2, 0.4] }, { t: 1, rot: [-0.3, 0, 0] },
      ]),
      this.boneTrack(this.rig.torso, 1.0, [
        { t: 0, rot: [-0.2, 0.5, 0] }, { t: 0.55, rot: [-0.6, 0.5, 0] }, { t: 0.72, rot: [0.6, -0.5, 0] }, { t: 1, rot: [0, 0, 0] },
      ]),
    ]);

    return clips;
  }
}
