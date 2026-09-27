/** Weapon: big cartoon weapon mesh + its swing trail emitter anchor. */
import * as THREE from 'three';
import { WEAPONS, type WeaponId } from './WeaponData';
import { PALETTE } from '../config/graphicsConfig';

export class Weapon {
  readonly group = new THREE.Group();
  readonly id: WeaponId;
  /** tip anchor for trail sampling */
  readonly tipAnchor = new THREE.Object3D();
  /** grip anchor (attached to hand or virtual hand) */
  readonly gripAnchor = new THREE.Object3D();

  constructor(id: WeaponId) {
    this.id = id;
    const data = WEAPONS[id];
    if (id === 'sword') this.buildSword(data.colorBody, data.colorGrip);
    else this.buildHammer(data.colorBody, data.colorGrip);
    this.group.add(this.gripAnchor);
    this.gripAnchor.add(this.tipAnchor);
  }

  private buildSword(bodyColor: number, gripColor: number): void {
    const g = this.group;
    const bladeMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.35, metalness: 0.6 });
    const gripMat = new THREE.MeshStandardMaterial({ color: gripColor, roughness: 0.85 });
    const goldMat = new THREE.MeshStandardMaterial({ color: PALETTE.gold, roughness: 0.4, metalness: 0.7 });

    // oversized cartoon blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 0.05), bladeMat);
    blade.position.y = 1.05;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.113, 0.45, 4), bladeMat);
    tip.rotation.y = Math.PI / 4;
    tip.position.y = 2.0;
    // fuller stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.062), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.5 }));
    stripe.position.y = 1.0;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.14), goldMat);
    guard.position.y = 0.28;
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.42, 6), gripMat);
    grip.position.y = 0.02;
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), goldMat);
    pommel.position.y = -0.22;

    for (const m of [blade, tip, stripe, guard, grip, pommel]) {
      m.castShadow = true;
      g.add(m);
    }
    this.tipAnchor.position.set(0, 2.25, 0);
  }

  private buildHammer(bodyColor: number, gripColor: number): void {
    const g = this.group;
    const headMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.45, metalness: 0.55 });
    const woodMat = new THREE.MeshStandardMaterial({ color: gripColor, roughness: 0.9 });

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.7, 6), woodMat);
    handle.position.y = 0.75;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.62, 0.62), headMat);
    head.position.y = 1.68;
    // octagonal bevel look via extra slabs
    const capL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.7, 8), headMat);
    capL.rotation.z = Math.PI / 2;
    capL.position.set(-0.52, 1.68, 0);
    const capR = capL.clone();
    capR.position.x = 0.52;
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.66), new THREE.MeshStandardMaterial({ color: PALETTE.gold, roughness: 0.4, metalness: 0.7 }));
    band.position.y = 1.68;
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), headMat);
    pommel.position.y = -0.1;

    for (const m of [handle, head, capL, capR, band, pommel]) {
      m.castShadow = true;
      g.add(m);
    }
    this.tipAnchor.position.set(0, 2.05, 0);
  }

  /** Attach grip to a bone/object (hand). */
  attachTo(parent: THREE.Object3D, localPos: THREE.Vector3, localRotEuler?: THREE.Euler): void {
    parent.add(this.group);
    this.group.position.copy(localPos);
    if (localRotEuler) this.group.rotation.copy(localRotEuler);
  }
}
