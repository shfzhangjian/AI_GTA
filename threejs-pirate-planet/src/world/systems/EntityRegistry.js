/**
 * EntityRegistry — 世界实体索引。
 *
 * 建筑、船、人物、水面道具、特效目标都只在这里登记一次。后续系统（天气、灾害、任务、
 * 交互、破坏）按 tag/type 查询，不再彼此直接耦合。
 */
export class EntityRegistry {
  constructor() {
    this.entities = new Map();
    this.byObject = new WeakMap();
    this._next = 1;
  }

  register(object, opts = {}) {
    if (!object) return null;
    const id = opts.id || object.userData.entityId || 'entity-' + this._next++;
    const entity = {
      id,
      object,
      type: opts.type || 'prop',
      tags: new Set(opts.tags || []),
      port: opts.port || null,
      model: opts.model || object.userData.model || null,
      damageable: !!opts.damageable,
      maxHp: opts.maxHp ?? 100,
      hp: opts.hp ?? opts.maxHp ?? 100,
      destroyed: false,
      data: opts.data || {},
    };
    object.userData.entityId = id;
    object.userData.entityType = entity.type;
    this.entities.set(id, entity);
    this.byObject.set(object, entity);
    return entity;
  }

  get(idOrObject) {
    if (!idOrObject) return null;
    if (typeof idOrObject === 'string') return this.entities.get(idOrObject) || null;
    return this.byObject.get(idOrObject) || null;
  }

  query(opts = {}) {
    const tag = opts.tag || null;
    const type = opts.type || null;
    const damageable = opts.damageable;
    return [...this.entities.values()].filter((e) => {
      if (type && e.type !== type) return false;
      if (tag && !e.tags.has(tag)) return false;
      if (damageable !== undefined && e.damageable !== damageable) return false;
      return true;
    });
  }

  clear() {
    this.entities.clear();
    this.byObject = new WeakMap();
  }
}
