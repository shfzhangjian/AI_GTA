/**
 * CombatFx —— 战斗特效中枢：爆炸火球 / 火焰与黑烟粒子 / 地面弹坑贴花 / 残骸持续燃烧。
 *
 * 全部程序化（Canvas 纹理 + Sprite），零素材；随 CombatFx.update(dt) 驱动。
 * 弹坑有数量上限（滚动清除最旧），燃烧残骸到期自动熄灭，避免特效堆积。
 */
import * as THREE from 'three';

const rand = (a, b) => a + Math.random() * (b - a);

/** 软边圆形精灵纹理（火焰/烟雾共用，靠颜色区分） */
function softCircleTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  for (const [k, col] of stops) grad.addColorStop(k, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  return t;
}

/** 弹坑贴花：不规则黑坑 + 焦褐外圈 + 飞溅斑点 */
function craterTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  // 外圈焦土
  let grad = g.createRadialGradient(64, 64, 30, 64, 64, 62);
  grad.addColorStop(0, 'rgba(58,42,30,0.9)');
  grad.addColorStop(0.7, 'rgba(58,42,30,0.45)');
  grad.addColorStop(1, 'rgba(58,42,30,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  // 坑体：多层随机圆叠出边缘不规则感
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = rand(16, 26);
    grad = g.createRadialGradient(64 + Math.cos(a) * 8, 64 + Math.sin(a) * 8, 2, 64 + Math.cos(a) * 8, 64 + Math.sin(a) * 8, r);
    grad.addColorStop(0, 'rgba(12,10,9,0.95)');
    grad.addColorStop(0.75, 'rgba(24,18,14,0.8)');
    grad.addColorStop(1, 'rgba(24,18,14,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(64 + Math.cos(a) * 8, 64 + Math.sin(a) * 8, r, 0, Math.PI * 2);
    g.fill();
  }
  // 中心最深
  grad = g.createRadialGradient(64, 64, 1, 64, 64, 22);
  grad.addColorStop(0, 'rgba(5,4,4,0.98)');
  grad.addColorStop(1, 'rgba(5,4,4,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  // 飞溅斑点
  g.fillStyle = 'rgba(40,30,22,0.75)';
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = rand(34, 60);
    g.beginPath();
    g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, rand(1, 3.4), 0, Math.PI * 2);
    g.fill();
  }
  return new THREE.CanvasTexture(c);
}

export class CombatFx {
  constructor(scene) {
    this.scene = scene;
    this.parts = [];   // 粒子/火球/光闪/碎石
    this.craters = []; // 弹坑贴花（滚动上限）
    this.burns = [];   // 燃烧残骸 {mesh, t, life, light, spawnF, spawnS}
    this._texFlame = softCircleTexture([[0, 'rgba(255,255,235,1)'], [0.35, 'rgba(255,190,80,0.9)'], [1, 'rgba(255,120,20,0)']]);
    this._texSmoke = softCircleTexture([[0, 'rgba(255,255,255,0.75)'], [0.6, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
    this._texCrater = craterTexture();
    this._craterGeo = new THREE.PlaneGeometry(1, 1);
    this._maxPartsSeen = 0; // 测试探针
  }

  /* ---------------- 爆炸 ---------------- */
  explosion(pos) {
    // 火球
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.95, depthWrite: false })
    );
    ball.position.copy(pos);
    this.scene.add(ball);
    this.parts.push({ kind: 'ball', obj: ball, t: 0, life: 0.5 });

    // 光闪
    const light = new THREE.PointLight(0xff7a29, 40, 30, 1.8);
    light.position.copy(pos).add(new THREE.Vector3(0, 0.6, 0));
    this.scene.add(light);
    this.parts.push({ kind: 'light', obj: light, t: 0, life: 0.45 });

    // 碎石
    const debrisMat = new THREE.MeshBasicMaterial({ color: 0x9aa2ad });
    for (let i = 0; i < 14; i++) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), debrisMat);
      d.position.copy(pos).add(new THREE.Vector3(0, 0.2, 0));
      const ang = Math.random() * Math.PI * 2;
      const sp = rand(5, 13);
      this.scene.add(d);
      this.parts.push({ kind: 'debris', obj: d, t: 0, life: 1.1, vel: new THREE.Vector3(Math.cos(ang) * sp, rand(6, 13), Math.sin(ang) * sp) });
    }

    // 火焰团（短促上升）
    for (let i = 0; i < 16; i++) this._puff(pos, 'flame', rand(0.55, 0.95));
    // 黑烟柱（缓慢升起膨胀消散）
    for (let i = 0; i < 10; i++) this._puff(pos.clone().add(new THREE.Vector3(rand(-.5, .5), rand(0, .8), rand(-.5, .5))), 'smoke', rand(2.4, 3.6));

    this._maxPartsSeen = Math.max(this._maxPartsSeen, this.parts.length);
  }

  _puff(pos, kind, life) {
    const mat = new THREE.SpriteMaterial({
      map: kind === 'flame' ? this._texFlame : this._texSmoke,
      color: kind === 'flame' ? new THREE.Color().setHSL(rand(0.03, 0.1), 1, 0.55) : new THREE.Color(0x2e3238),
      transparent: true,
      opacity: kind === 'flame' ? 0.95 : 0.55,
      depthWrite: false,
    });
    const s = new THREE.Sprite(mat);
    const base = kind === 'flame' ? rand(0.8, 1.6) : rand(1.4, 2.6);
    s.scale.setScalar(base * 0.5);
    s.position.copy(pos).add(new THREE.Vector3(rand(-.4, .4), rand(0, .5), rand(-.4, .4)));
    this.scene.add(s);
    this.parts.push({
      kind, obj: s, t: 0, life, base,
      vel: new THREE.Vector3(rand(-.6, .6), kind === 'flame' ? rand(2.2, 4) : rand(1.1, 2.2), rand(-.6, .6)),
    });
  }

  /* ---------------- 弹坑 ---------------- */
  crater(pos) {
    const mat = new THREE.MeshBasicMaterial({ map: this._texCrater, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const m = new THREE.Mesh(this._craterGeo, mat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = Math.random() * Math.PI * 2;
    m.scale.setScalar(rand(3.6, 5.4));
    m.position.set(pos.x, pos.y + 0.015, pos.z);
    this.scene.add(m);
    this.craters.push(m);
    if (this.craters.length > 26) { // 滚动清除最旧，防堆积
      const old = this.craters.shift();
      this.scene.remove(old);
      old.material.dispose();
    }
  }

  /* ---------------- 残骸持续燃烧 ---------------- */
  attachBurningWreck(mesh, life = 16) {
    const light = new THREE.PointLight(0xff6a1f, 8, 9, 2);
    this.scene.add(light);
    this.burns.push({ mesh, t: 0, life, light, spawnF: 0, spawnS: 0 });
  }

  update(dt) {
    // —— 粒子 ——
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const f = this.parts[i];
      f.t += dt;
      const k = f.t / f.life;
      if (k >= 1) {
        this.scene.remove(f.obj);
        f.obj.geometry?.dispose();
        if (f.obj.material) f.obj.material.dispose();
        this.parts.splice(i, 1);
        continue;
      }
      if (f.kind === 'ball') {
        f.obj.scale.setScalar(0.6 + k * 5.4);
        f.obj.material.opacity = 0.95 * (1 - k * k);
      } else if (f.kind === 'light') {
        f.obj.intensity = 40 * (1 - k) ** 2;
      } else if (f.kind === 'debris') {
        f.vel.y -= 20 * dt;
        f.obj.position.addScaledVector(f.vel, dt);
        f.obj.rotation.x += dt * 7;
        f.obj.rotation.z += dt * 5;
      } else { // flame / smoke 精灵
        f.obj.position.addScaledVector(f.vel, dt);
        f.obj.scale.setScalar(f.base * (f.kind === 'flame' ? 0.5 + Math.sin(k * Math.PI) : 0.5 + k * 2.4));
        f.obj.material.opacity = (f.kind === 'flame' ? 0.95 : 0.55) * (1 - k);
      }
    }

    // —— 燃烧残骸：持续喷火冒烟 + 火光闪烁，到期熄灭 ——
    for (let i = this.burns.length - 1; i >= 0; i--) {
      const b = this.burns[i];
      b.t += dt;
      if (b.t >= b.life) {
        this.scene.remove(b.light);
        this.burns.splice(i, 1);
        continue;
      }
      const p = b.mesh.position;
      b.light.position.set(p.x, p.y + 0.9, p.z);
      b.light.intensity = 6 + Math.sin(b.t * 23) * 3 + Math.random() * 2;

      const fade = Math.max(0.15, 1 - b.t / b.life); // 火势渐弱
      b.spawnF -= dt;
      if (b.spawnF <= 0 && fade > 0.2) {
        b.spawnF = 0.09;
        this._puff(new THREE.Vector3(p.x + rand(-.7, .7), p.y + rand(.5, 1.2), p.z + rand(-.5, .5)), 'flame', rand(0.5, 0.8));
      }
      b.spawnS -= dt;
      if (b.spawnS <= 0) {
        b.spawnS = 0.22 / fade; // 末期只剩缓缓青烟
        this._puff(new THREE.Vector3(p.x + rand(-.5, .5), p.y + rand(.8, 1.4), p.z), 'smoke', rand(2, 3));
      }
    }
  }
}
