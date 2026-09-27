/** WeaponManager: owns the two weapons, handles switching + virtual-hand anchoring. */
import * as THREE from 'three';
import { Weapon } from './Weapon';
import type { WeaponId } from './WeaponData';
import { WEAPONS } from './WeaponData';

export class WeaponManager {
  private weapons = new Map<WeaponId, Weapon>();
  current: Weapon;
  /** virtual hand used when model has no hand bone */
  readonly virtualHand = new THREE.Object3D();

  constructor(visualRoot: THREE.Object3D) {
    this.virtualHand.name = 'virtualHand';
    visualRoot.add(this.virtualHand);

    for (const id of Object.keys(WEAPONS) as WeaponId[]) {
      const w = new Weapon(id);
      this.weapons.set(id, w);
      w.group.visible = false;
    }
    this.current = this.weapons.get('sword')!;
    this.equip('sword', visualRoot);
  }

  /** Position the virtual hand each frame from a hand bone if present, else approximate. */
  bindHandBone(handBone: THREE.Object3D | null): void {
    this.handBone = handBone;
  }
  private handBone: THREE.Object3D | null = null;

  syncHand(visualRoot: THREE.Object3D, fallbackLocal: THREE.Vector3): void {
    if (this.handBone) {
      // bone matrices come from the mixer step; refresh before sampling
      visualRoot.updateWorldMatrix(true, true);
      // copy world transform into virtualHand parent space
      this.handBone.getWorldPosition(tmpPos);
      visualRoot.worldToLocal(tmpPos);
      this.virtualHand.position.copy(tmpPos);
      this.handBone.getWorldQuaternion(tmpQuat);
      visualWorldToChildQuat(visualRoot, tmpQuat, this.virtualHand.quaternion);
    } else {
      this.virtualHand.position.lerp(fallbackLocal, 0.35);
      this.virtualHand.rotation.set(-0.4, 0, 0);
    }
  }

  equip(id: WeaponId, visualRoot: THREE.Object3D): void {
    const next = this.weapons.get(id);
    if (!next || next === this.current) return;
    this.current.group.visible = false;
    visualRoot.remove(this.current.group);
    this.current = next;
    this.attachCurrent();
    this.current.group.visible = true;
  }

  private attachCurrent(): void {
    this.current.attachTo(this.virtualHand, new THREE.Vector3(0, 0, 0), new THREE.Euler(0.25, 0, 0));
  }

  get data(): (typeof WEAPONS)[WeaponId] {
    return WEAPONS[this.current.id];
  }
}

const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpInv = new THREE.Quaternion();

function visualWorldToChildQuat(root: THREE.Object3D, worldQ: THREE.Quaternion, out: THREE.Quaternion): void {
  root.getWorldQuaternion(tmpInv);
  out.copy(tmpInv).invert().multiply(worldQ);
}
