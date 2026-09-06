// 游戏核心：Three.js 场景、主循环、状态
import * as THREE from 'three';
import { Player } from '../player/Player.js';
import { World } from '../world/World.js';
import { MonsterManager } from '../monsters/MonsterManager.js';
import { Sfx } from './Sfx.js';

export class Game {
  constructor(container) {
    this.container = container;
    this.sfx = new Sfx();
    this.running = false;
    this.lastTime = 0;
    this.clock = new THREE.Clock();

    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 80, 220);

    const w = window.innerWidth, h = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 灯光
    const sun = new THREE.DirectionalLight(0xfff2d0, 1.1);
    sun.position.set(60, 120, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -120; sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120; sun.shadow.camera.bottom = -120;
    sun.shadow.camera.far = 400;
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0xbfd4ff, 0.55));
    this.hemi = new THREE.HemisphereLight(0xcfe8ff, 0x557733, 0.5);
    this.scene.add(this.hemi);

    // 模块（World 需要 game 引用以播放音效/特效）
    this.world = new World(this.scene, this);
    this.player = new Player(this);
    this.monsters = new MonsterManager(this);
    this.monsters.spawnInitial();

    // 特效层（攻击火花/刀光/伤害数字）
    this.fxGroup = new THREE.Group();
    this.scene.add(this.fxGroup);
    this.fx = []; // 活动特效
    this.fxPool = []; // 复用池
    this.damageTexts = []; // 飘字
    this.healthBars = new Map(); // 目标对象 -> {el, ratio} 持久血条

    // 屏幕震动
    this.shake = 0;

    this.player.mesh.position.set(0, 0, 0);
    this.bindEvents(w, h);
  }

  bindEvents() {
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    this.player.bindInput();
  }

  start() {
    if (this.running) return; // 防止长按开始按钮导致重复循环
    this.running = true;
    this.clock.start();
    this.lastTime = performance.now();
    this.sfx.startMusic();
    this.loop();
  }

  stop() { this.running = false; }

  loop = () => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0.1) dt = 0.1; // 防大卡顿

    this.player.update(dt);
    this.monsters.update(dt);
    this.world.update(dt, this.player);
    this.updateFx(dt);
    this.updateCamera(dt);
    this.updateHUD();
    this.renderer.render(this.scene, this.camera);
  };

  // ---- 特效系统（攻击火花/刀光/伤害飘字） ----
  _poolGet() {
    return this.fxPool.pop() || new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 6, 5),
      new THREE.MeshBasicMaterial({ transparent: true })
    );
  }
  _poolPut(p) {
    p.visible = false;
    if (this.fxGroup.children.includes(p)) this.fxGroup.remove(p);
    this.fxPool.push(p);
  }

  // 火花粒子（命中时迸发）
  sparkBurst(pos, color = 0xffcc55, count = 10, speed = 5) {
    for (let i = 0; i < count; i++) {
      const p = this._poolGet();
      const mat = p.material;
      mat.color.setHex(color);
      mat.transparent = true;
      mat.opacity = 1;
      p.visible = true;
      p.position.copy(pos);
      p.scale.setScalar(0.08 + Math.random() * 0.1);
      const dir = new THREE.Vector3(
        Math.random() * 2 - 1, Math.random() * 1.2, Math.random() * 2 - 1
      ).normalize().multiplyScalar(speed * (0.5 + Math.random() * 0.8));
      this.fxGroup.add(p);
      this.fx.push({ mesh: p, vel: dir, life: 0.35 + Math.random() * 0.25, maxLife: 0.6, grav: 8 });
    }
  }

  // 刀光弧（近战挥砍残影）
  slashArc(ownerPos, facing, def) {
    const g = new THREE.Group();
    const arcGeo = new THREE.RingGeometry(def.range * 0.55, def.range, 20, 1, 0, def.arc * 1.2);
    const mat = new THREE.MeshBasicMaterial({
      color: def.fire ? 0xff9944 : 0xddeeff,
      transparent: true, opacity: 0.75, side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(arcGeo, mat);
    ring.rotation.x = -Math.PI / 2;
    g.add(ring);
    g.position.copy(ownerPos).add(new THREE.Vector3(0, 1.2, 0));
    g.rotation.y = Math.atan2(facing.x, facing.z) + Math.PI;
    this.fxGroup.add(g);
    this.fx.push({ mesh: g, vel: null, life: 0.22, maxLife: 0.22, isArc: true });
  }

  // 伤害飘字（3D 坐标投影到屏幕）
  damageText(pos, text, color = '#fff', scale = 1) {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText = `position:fixed;color:${color};font-weight:bold;font-size:${16 * scale}px;
      text-shadow:0 2px 4px #000,0 0 8px rgba(0,0,0,.6);pointer-events:none;z-index:20;
      transform:translate(-50%,-50%);white-space:nowrap;`;
    document.body.appendChild(div);
    this.damageTexts.push({ el: div, pos: pos.clone(), life: 0.9, vy: 4 });
  }

  // 持久血条：命中后跟随目标，超出 hideDist 或目标死亡后隐藏
  healthBar(target, worldPos, ratio, color = '#ff5a5a', hideDist = 20) {
    let bar = this.healthBars.get(target);
    if (!bar) {
      const div = document.createElement('div');
      div.innerHTML = `<div style="width:48px;height:6px;background:rgba(0,0,0,.65);border:1px solid rgba(255,255,255,.5);border-radius:3px;overflow:hidden">
        <div style="width:${Math.max(0, ratio * 100)}%;height:100%;background:${color};transition:width .1s"></div></div>`;
      div.style.cssText = 'position:fixed;pointer-events:none;z-index:19;transform:translate(-50%,-50%);';
      document.body.appendChild(div);
      bar = { el: div, ratio: 1, hideDist };
      this.healthBars.set(target, bar);
    }
    bar.ratio = Math.max(bar.ratio * 0.92, ratio); // 平滑回落
    bar._pos = worldPos.clone();
    bar._dead = false;
  }

  // 血条更新：跟随目标投影到屏幕，超距/死亡隐藏，长期未受击移除
  updateHealthBars(dt, playerPos) {
    for (const [target, bar] of this.healthBars) {
      if (target._removed) { bar.el.remove(); this.healthBars.delete(target); continue; }
      const tPos = target.isMonster ? target.mesh.position : target.position;
      bar._pos.lerp(tPos.clone().add(new THREE.Vector3(0, 1.6, 0)), Math.min(1, dt * 10));
      const d = tPos.distanceTo(playerPos);
      const hidden = d > bar.hideDist || (target.isMonster && target.dead);
      // 锁定目标强制显示（即使稍远）
      const isTarget = this.player.target === target;
      bar.el.style.display = (hidden && !isTarget) ? 'none' : 'block';
      const v = bar._pos.clone().project(this.camera);
      if (isFinite(v.x) && isFinite(v.y) && v.z < 1) {
        bar.el.style.left = (v.x * 0.5 + 0.5) * window.innerWidth + 'px';
        bar.el.style.top = (-v.y * 0.5 + 0.5) * window.innerHeight + 'px';
      }
      const inner = bar.el.firstChild;
      if (inner) inner.style.width = (Math.max(0, bar.ratio) * 100) + '%';
      if (target.isMonster) bar.ratio = Math.max(0, target.hp / target.maxHp);
      else bar.ratio = Math.max(0, target.userData.hp / target.userData.maxHp);
      // 长期未受击且超出范围 -> 移除 DOM
      if (hidden && bar.ratio <= 0.01 && !isTarget) {
        bar.el.remove();
        this.healthBars.delete(target);
      }
    }
  }

  updateFx(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life -= dt;
      if (f.life <= 0) {
        if (f.isArc) {
          this.fxGroup.remove(f.mesh);
          f.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
        } else this._poolPut(f.mesh);
        this.fx.splice(i, 1);
        continue;
      }
      const t = f.life / f.maxLife;
      if (f.vel) {
        f.vel.y -= (f.grav || 8) * dt;
        f.mesh.position.addScaledVector(f.vel, dt);
        if (f.mesh.material) f.mesh.material.opacity = t;
      } else if (f.isArc) {
        // 刀光是 Group：材质挂在子网格 ring 上，Group 本身没有 material
        const mat = f.mesh.material || (f.mesh.children[0] && f.mesh.children[0].material);
        if (mat) mat.opacity = t * 0.75;
        f.mesh.scale.setScalar(1 + (1 - t) * 0.25);
      }
    }
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const d = this.damageTexts[i];
      d.life -= dt;
      if (d.life <= 0) { d.el.remove(); this.damageTexts.splice(i, 1); continue; }
      d.pos.y += (d.vy || 4) * dt * 0.6;
      const v = d.pos.clone().project(this.camera);
      const x = (v.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
      d.el.style.left = x + 'px';
      d.el.style.top = y + 'px';
      d.el.style.opacity = Math.min(1, d.life / 0.3);
    }
    this.updateHealthBars(dt, this.player.mesh.position);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3);
  }

  addShake(amount) { this.shake = Math.min(1, this.shake + amount); }

  updateCamera(dt) {
    const p = this.player.mesh.position;
    const cam = this.camera;
    // 塞尔达式高俯视斜视角
    const height = 26;
    const back = 18;
    const target = new THREE.Vector3(p.x, p.y + 2, p.z);
    cam.position.lerp(new THREE.Vector3(p.x, p.y + height, p.z + back), Math.min(1, dt * 6));
    cam.lookAt(target);
    // 攻击震动
    if (this.shake > 0) {
      cam.position.x += (Math.random() - 0.5) * this.shake * 0.6;
      cam.position.y += (Math.random() - 0.5) * this.shake * 0.4;
      cam.position.z += (Math.random() - 0.5) * this.shake * 0.6;
    }
  }

  updateHUD() {
    const p = this.player;
    const hpBar = document.getElementById('hp-bar');
    const stBar = document.getElementById('st-bar');
    if (hpBar) hpBar.style.width = (Math.max(0, p.hp) / p.maxHp * 100) + '%';
    if (stBar) stBar.style.width = (p.stamina / p.maxStamina * 100) + '%';
  }

  showMessage(text, duration = 2000) {
    const el = document.getElementById('msg');
    if (!el) return;
    el.textContent = text;
    el.style.opacity = 1;
    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => { el.style.opacity = 0; }, duration);
  }

  playerDied() {
    this.stop();
    if (window.__setAimCursor) window.__setAimCursor(false); // 死亡面板恢复光标
    const ov = document.getElementById('overlay');
    ov.classList.remove('hidden');
    document.getElementById('overlay-title').textContent = '你倒下了...';
    document.getElementById('overlay-text').textContent = `击杀数: ${this.monsters.kills} | 存活: ${Math.floor(this.elapsed ?? 0)}s`;
    const btn = document.getElementById('overlay-btn');
    btn.textContent = '重新开始';
    // 死亡后点击按钮刷新页面（旧监听器随页面一起销毁）
    btn.addEventListener('click', () => location.reload(), { once: true });
    this.sfx.stopMusic();
    this.sfx.play('dead');
  }

  restart() {
    location.reload();
  }
}
