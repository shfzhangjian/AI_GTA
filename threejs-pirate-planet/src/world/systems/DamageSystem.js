/**
 * DamageSystem — 统一破坏入口。
 *
 * 天气/灾害/战斗只调用 applyDamage/applyRadialDamage。具体对象怎么受损、变暗、倒塌、
 * 隐藏或播放碎片效果，都集中在这里，避免每个事件自己改模型。
 */
import * as THREE from 'three';

const _pos = new THREE.Vector3();
const _center = new THREE.Vector3();

export class DamageSystem {
  constructor({ sceneManager, registry }) {
    this.sm = sceneManager;
    this.registry = registry;
    this.effects = new THREE.Group();
    this.effects.name = 'DamageEffects';
    this.sm.world.add(this.effects);
  }

  makeDamageable(object, opts = {}) {
    const existing = this.registry.get(object);
    const entity = existing || this.registry.register(object, opts);
    if (!entity) return null;
    entity.damageable = true;
    entity.maxHp = opts.maxHp ?? entity.maxHp ?? 100;
    entity.hp = opts.hp ?? entity.hp ?? entity.maxHp;
    entity.destroyed = false;
    object.userData.damageable = true;
    object.userData.hp = entity.hp;
    return entity;
  }

  applyDamage(target, amount, source = {}) {
    const entity = this.registry.get(target);
    if (!entity || !entity.damageable || entity.destroyed) return null;
    entity.hp = Math.max(0, entity.hp - amount);
    entity.object.userData.hp = entity.hp;
    this._applyVisualDamage(entity, 1 - entity.hp / Math.max(1, entity.maxHp));
    if (entity.hp <= 0) this._destroy(entity, source);
    return entity;
  }

  /**
   * 修理回血（渡轮到岸修理用）。与 applyDamage 互逆：血量回升 + 材质变暗同步减退
   * （_applyVisualDamage ratio=0 即恢复原色）。destroyed 的实体不可修理。
   * @returns {number} 实际回复量
   */
  applyRepair(target, amount) {
    const entity = this.registry.get(target);
    if (!entity || !entity.damageable || entity.destroyed) return 0;
    const before = entity.hp;
    entity.hp = Math.min(entity.maxHp, entity.hp + amount);
    entity.object.userData.hp = entity.hp;
    const healed = entity.hp - before;
    if (healed > 0) this._applyVisualDamage(entity, 1 - entity.hp / Math.max(1, entity.maxHp));
    return healed;
  }

  applyRadialDamage(center, radius, amount, opts = {}) {
    _center.copy(center);
    const affected = [];
    for (const entity of this.registry.query({ damageable: true })) {
      if (entity.destroyed || !entity.object.parent) continue;
      entity.object.getWorldPosition(_pos);
      const d = _pos.distanceTo(_center);
      if (d > radius) continue;
      const falloff = opts.falloff === false ? 1 : 1 - d / radius;
      const hit = this.applyDamage(entity.id, amount * falloff, opts);
      if (hit) affected.push(hit);
    }
    if (opts.effect !== false) this.spawnImpact(center, radius, opts.color || 0xffd08a);
    return affected;
  }

  spawnImpact(center, radius = 6, color = 0xffd08a) {
    const geo = new THREE.RingGeometry(radius * 0.75, radius, 48);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.name = 'DamageImpact';
    ring.position.copy(center);
    ring.lookAt(0, 0, 0);
    ring.userData.life = 0.85;
    ring.userData.maxLife = 0.85;
    this.effects.add(ring);
    return ring;
  }

  update(dt) {
    for (let i = this.effects.children.length - 1; i >= 0; i--) {
      const o = this.effects.children[i];
      o.userData.life -= dt;
      const t = Math.max(0, o.userData.life / o.userData.maxLife);
      o.scale.setScalar(1 + (1 - t) * 1.8);
      if (o.material) o.material.opacity = 0.55 * t;
      if (o.userData.life <= 0) {
        o.geometry?.dispose?.();
        o.material?.dispose?.();
        this.effects.remove(o);
      }
    }
  }

  _applyVisualDamage(entity, ratio) {
    entity.object.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mat = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!mat.color) return;
      // ⚠ Kenney 材质跨实例共享（同模型克隆共用）→ 基准色按「材质引用」全局注册一次，
      //   绝不能在材质上存 baseDamageColor 后按材质反查（会互相覆盖 / 修理错染别船）。
      if (!this._matBase) this._matBase = new Map();
      if (!this._matBase.has(mat)) this._matBase.set(mat, mat.color.clone());
      const base = this._matBase.get(mat);
      // 只向焦黑方向染；修理（ratio→0）恢复该材质基准色
      mat.color.copy(base).lerp(new THREE.Color(0x2a2420), Math.min(0.65, ratio * 0.75));
    });
  }

  _destroy(entity, source) {
    entity.destroyed = true;
    entity.object.userData.destroyed = true;
    entity.object.scale.multiplyScalar(0.72);
    entity.object.rotateZ((source.roll ?? 0.35) * (Math.random() < 0.5 ? -1 : 1));
    entity.object.traverse((o) => {
      if (o.isMesh && o.material) {
        const mat = Array.isArray(o.material) ? o.material[0] : o.material;
        if (mat.opacity !== undefined) {
          mat.transparent = true;
          mat.opacity = Math.min(mat.opacity, 0.72);
        }
      }
    });
  }
}
