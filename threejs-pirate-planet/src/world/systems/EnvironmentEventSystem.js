/**
 * EnvironmentEventSystem — 局部天气/灾害事件层。
 *
 * 支持事件类型：
 *   rain      局部雨幕（低伤害/无伤害，可后续接湿润材质）
 *   tornado   龙卷风（持续径向伤害）
 *   tsunami   海啸冲击环（扩散径向伤害）
 *   meteor    流星撞击（落点爆发伤害）
 *
 * 这里先提供统一生命周期、可见占位效果、破坏调用。以后替换成更复杂粒子/水面 shader
 * 时，不需要改港口、船或主循环。
 */
import * as THREE from 'three';
import { PLANET } from '../../config.js';
import { latLonToVector3 } from '../../utils/GeoUtils.js';

const EVENT_DEFAULTS = {
  rain: { duration: 7, radius: 22, damage: 0 },
  tornado: { duration: 8, radius: 18, damage: 12 },
  tsunami: { duration: 5, radius: 42, damage: 28 },
  meteor: { duration: 2.4, radius: 26, damage: 70 },
};

export class EnvironmentEventSystem {
  constructor({ sceneManager, damageSystem }) {
    this.sm = sceneManager;
    this.damage = damageSystem;
    this.group = new THREE.Group();
    this.group.name = 'EnvironmentEvents';
    this.sm.world.add(this.group);
    this.events = [];
  }

  trigger(type, opts = {}) {
    const defaults = EVENT_DEFAULTS[type];
    if (!defaults) throw new Error('[EnvironmentEventSystem] Unknown event type: ' + type);
    const event = {
      type,
      ...defaults,
      ...opts,
      age: 0,
      center: this._centerFrom(opts),
      object: null,
      _pulse: 0,
    };
    event.object = this._makeVisual(event);
    this.group.add(event.object);
    this.events.push(event);
    return event;
  }

  update(dt) {
    for (let i = this.events.length - 1; i >= 0; i--) {
      const e = this.events[i];
      e.age += dt;
      const t = Math.min(1, e.age / e.duration);
      this._updateVisual(e, t, dt);
      this._applyEventDamage(e, dt, t);
      if (e.age >= e.duration) {
        this._disposeVisual(e.object);
        this.group.remove(e.object);
        this.events.splice(i, 1);
      }
    }
  }

  _centerFrom(opts) {
    if (opts.center) return opts.center.clone();
    const lat = opts.lat ?? 0;
    const lon = opts.lon ?? 0;
    const alt = opts.alt ?? 1.2;
    return latLonToVector3(lat, lon, PLANET.RADIUS + alt, new THREE.Vector3());
  }

  _makeVisual(event) {
    if (event.type === 'tornado') return this._makeTornado(event);
    if (event.type === 'rain') return this._makeRain(event);
    if (event.type === 'tsunami') return this._makeRing(event, 0x7edcff);
    if (event.type === 'meteor') return this._makeMeteor(event);
    return new THREE.Group();
  }

  _makeTornado(event) {
    const geo = new THREE.ConeGeometry(event.radius * 0.5, event.radius * 1.8, 24, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color: 0x9da8b8, transparent: true, opacity: 0.38, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'Weather:Tornado';
    this._placeUpright(mesh, event.center, event.radius * 0.85);
    return mesh;
  }

  _makeRain(event) {
    const count = 180;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * event.radius;
      pos[i * 3 + 1] = Math.random() * event.radius * 1.6;
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * event.radius;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x9fd8ff, size: 0.5, transparent: true, opacity: 0.55 });
    const pts = new THREE.Points(geo, mat);
    pts.name = 'Weather:Rain';
    this._placeUpright(pts, event.center, event.radius * 0.65);
    return pts;
  }

  _makeRing(event, color) {
    const geo = new THREE.RingGeometry(event.radius * 0.18, event.radius * 0.22, 72);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(geo, mat);
    ring.name = 'Weather:' + event.type;
    ring.position.copy(event.center);
    ring.lookAt(0, 0, 0);
    return ring;
  }

  _makeMeteor(event) {
    const group = new THREE.Group();
    group.name = 'Weather:Meteor';
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(1.2, event.radius * 0.08), 16, 10),
      new THREE.MeshBasicMaterial({ color: 0xffc26a }),
    );
    const trail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 1.2, event.radius * 1.1, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xff8a42, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    trail.position.y = event.radius * 0.5;
    group.add(core, trail);
    this._placeUpright(group, event.center, event.radius * 1.1);
    return group;
  }

  _placeUpright(object, center, height) {
    const normal = center.clone().normalize();
    object.position.copy(center).addScaledVector(normal, height);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  }

  _updateVisual(event, t, dt) {
    if (event.type === 'tornado') {
      event.object.rotateY(dt * 5.5);
      event.object.material.opacity = 0.38 * (1 - Math.max(0, t - 0.75) / 0.25);
    } else if (event.type === 'rain') {
      const a = event.object.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i) - dt * 28;
        if (y < 0) y += event.radius * 1.6;
        a.setY(i, y);
      }
      a.needsUpdate = true;
    } else if (event.type === 'tsunami') {
      event.object.scale.setScalar(1 + t * 4);
      event.object.material.opacity = 0.5 * (1 - t);
    } else if (event.type === 'meteor') {
      const normal = event.center.clone().normalize();
      event.object.position.copy(event.center).addScaledVector(normal, (1 - t) * event.radius * 1.1);
    }
  }

  _applyEventDamage(event, dt, t) {
    if (!this.damage || event.damage <= 0) return;
    if (event.type === 'tornado') {
      event._pulse += dt;
      if (event._pulse >= 0.45) {
        event._pulse = 0;
        this.damage.applyRadialDamage(event.center, event.radius, event.damage, { color: 0xb8c2d0, effect: false });
      }
    } else if (event.type === 'tsunami' && !event._hit && t > 0.55) {
      event._hit = true;
      this.damage.applyRadialDamage(event.center, event.radius, event.damage, { color: 0x7edcff });
    } else if (event.type === 'meteor' && !event._hit && t > 0.82) {
      event._hit = true;
      this.damage.applyRadialDamage(event.center, event.radius, event.damage, { color: 0xffb45c });
    }
  }

  _disposeVisual(object) {
    object.traverse((o) => {
      o.geometry?.dispose?.();
      o.material?.dispose?.();
    });
  }
}
