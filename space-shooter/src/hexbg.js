// KayKit hex background: a slowly scrolling low-poly hex terrain strip that the
// ship flies over. Renders to its own canvas behind the gameplay canvas.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const HEX_SPACING_X = 3.02;      // axial -> world for pointy-top hex of radius 1
const HEX_SPACING_Z = 2.62;
const ROWS = 26;
const COLS = 34;

export class HexBackground {
  constructor(canvas, onReady) {
    this.canvas = canvas;
    this.onReady = onReady;
    this.ok = false;
    this.scroll = 0;
    this.speed = 1.6;
    this.clouds = [];
    this.time = 0;
    this.init().catch(err => console.warn('[hex] background disabled:', err.message));
  }

  async init() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x0b1024, 1);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0b1024, 26, 78);
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
    camera.position.set(0, 13.5, 17);
    camera.lookAt(0, 0, -4);
    this.camera = camera;

    scene.add(new THREE.HemisphereLight(0xbcd4ff, 0x2a2438, 1.15));
    const dir = new THREE.DirectionalLight(0xfff2d8, 1.35);
    dir.position.set(-6, 14, 6);
    scene.add(dir);

    const loader = new GLTFLoader();
    const load = (f) => new Promise((res, rej) =>
      loader.load(`assets/three/${f}.gltf`, g => res(g.scene), undefined, rej));

    const [hexTile, cloudBig, cloudSmall, castle, hill] = await Promise.all([
      load('hex_grass'), load('cloud_big'), load('cloud_small'),
      load('building_castle_green'), load('hill_single_A'),
    ]);

    // Shared texture + material so every hex is one draw-call-friendly set.
    const tex = new THREE.TextureLoader().load('assets/three/hexagons_medieval.png');
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const repatch = (root, mut) => root.traverse(o => {
      if (o.isMesh) {
        // KayKit ships one atlas texture; force every primitive to use it so
        // missing/mismatched material references can't render as flat white.
        o.material = new THREE.MeshLambertMaterial({ map: tex });
        if (mut) mut(o);
      }
    });

    this.prototype = hexTile;
    repatch(hexTile);
    repatch(castle);
    repatch(hill);
    [cloudBig, cloudSmall].forEach((c, i) => repatch(c, o => {
      o.material.transparent = true;
      o.material.opacity = i === 0 ? 0.85 : 0.75;
    }));

    // Hex field: instanced clones pooled into a ring that scrolls toward the camera.
    this.tiles = [];
    this.group = new THREE.Group();
    scene.add(this.group);
    const origin = new THREE.Vector3();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const m = hexTile.clone();
        const x = (c - COLS / 2) * HEX_SPACING_X + (r % 2 ? HEX_SPACING_X / 2 : 0);
        const z = -r * HEX_SPACING_Z;
        m.position.set(x, 0, z);
        m.userData.base = { x, z };
        // sprinkle landmarks deterministically
        const h = hash(c, r);
        if (h > 0.986) this._placeLandmark(m, castle, 1.5);
        else if (h > 0.955) this._placeLandmark(m, hill, 1.2);
        this.group.add(m);
        this.tiles.push(m);
      }
    }

    for (let i = 0; i < 9; i++) {
      const m = (i % 2 ? cloudSmall : cloudBig).clone();
      m.position.set(rand(-45, 45), rand(6, 12), rand(-70, 10));
      m.scale.setScalar(rand(1.4, 3.2));
      m.userData.drift = rand(0.4, 1.5);
      scene.add(m);
      this.clouds.push(m);
    }

    // Stars far above, so the top of the frame isn't empty fog
    const starGeo = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i < 320; i++) {
      pts.push(rand(-70, 70), rand(18, 60), rand(-95, -25));
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xcfe4ff, size: 0.42, sizeAttenuation: true, transparent: true, opacity: 0.85,
    })));

    this.ok = true;
    this.resize();
    this.onReady?.();
  }

  _placeLandmark(tile, proto, s) {
    const l = proto.clone();
    l.scale.setScalar(s);
    l.position.set(0, 0.02, 0);
    l.rotation.y = Math.random() * Math.PI * 2;
    tile.add(l);
  }

  resize() {
    if (!this.renderer) return;
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // widen for tall screens so the hex field still covers the frame
    this.camera.fov = THREE.MathUtils.clamp(52 * (h / w) * 0.9 + 24, 46, 78);
    this.camera.updateProjectionMatrix();
  }

  update(dt, intensity) {
    if (!this.ok) return;
    this.time += dt;
    this.speed = 1.5 + intensity * 3.2;
    this.scroll += this.speed * dt;

    const span = ROWS * HEX_SPACING_Z;
    for (const t of this.tiles) {
      const b = t.userData.base;
      // wrap each tile inside a band from -span to just past the camera
      let z = ((b.z + this.scroll) % span + span) % span; // 0..span
      t.position.z = z - span + HEX_SPACING_Z * 2.5;
    }

    for (const c of this.clouds) {
      c.position.z += (this.speed * 0.55 + c.userData.drift) * dt;
      if (c.position.z > 16) { c.position.z = -80; c.position.x = rand(-45, 45); }
    }

    this.camera.position.x = Math.sin(this.time * 0.25) * 1.4;
    this.camera.lookAt(0, 0, -6);
    if (this.renderer) this.renderer.render(this.scene, this.camera);
  }
}

function rand(a, b) { return a + Math.random() * (b - a); }
function hash(a, b) {
  let h = (a * 73856093 ^ b * 19349663) >>> 0;
  h = (h ^ (h >> 13)) * 1274126177 >>> 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}
