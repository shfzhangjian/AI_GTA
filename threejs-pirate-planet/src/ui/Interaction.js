/**
 * Interaction.js — 悬停信息 + 拾取（§28，为 Phase 7 打底）
 *
 * 关键点：星球在自转（sceneManager.planet.rotation.y 每帧变化），
 * 因此指针坐标必须**每帧重播 raycast**，只在 pointermove 时 raycast 一次会因自转失效。
 * 点击判定用 pointerdown/pointerup 的位移阈值（区分「拖拽」与「点击」）。
 */
import * as THREE from 'three';
import { ViewMode } from '../core/CameraManager.js';

export class Interaction {
  /**
   * @param {{rendererManager, cameraManager, sceneManager, infoEl, onPick?}} deps
   */
  constructor(deps) {
    this.rm = deps.rendererManager;
    this.cam = deps.cameraManager;
    this.sm = deps.sceneManager;
    this.infoEl = deps.infoEl || null;
    this.onPick = deps.onPick || null;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(Infinity, Infinity);
    this.insideMini = false;
    this.hovered = null;

    this._down = { x: 0, y: 0, t: 0 };
    this._visible = new THREE.Vector3();

    this._bind();
  }

  _bind() {
    const canvas = this.rm.canvas;
    canvas.addEventListener('pointermove', (e) => {
      this.insideMini = this._inMini(e.clientX, e.clientY);
      this._toNdc(e.clientX, e.clientY);
      this._screen = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('pointerleave', () => {
      this.pointer.set(Infinity, Infinity);
      this._clearHover();
    });
    canvas.addEventListener('pointerdown', (e) => {
      this._down = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    canvas.addEventListener('pointerup', (e) => {
      const moved = Math.hypot(e.clientX - this._down.x, e.clientY - this._down.y);
      const dt = performance.now() - this._down.t;
      if (moved < 6 && dt < 500) this._onClick(e);   // 视为点击而非拖拽
    });
  }

  _inMini(x, y) {
    const r = this.rm.miniRect;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  _toNdc(x, y) {
    const w = window.innerWidth, h = window.innerHeight;
    this.pointer.set((x / w) * 2 - 1, -((y / h) * 2 - 1));
  }

  /** 收集可拾取目标（船只 + 港口地标 + 建筑；跳过海量植被实例） */
  _targets() {
    const out = [];
    const pick = (obj) => {
      if (obj.isPort || obj.isLandmark || obj.userData.isPort || obj.userData.isLandmark) return true;
      if (obj.userData.isShip) return true;
      if (obj.userData.isCharacter) return true;   // 陆地小人（CharacterManager）
      if (obj.userData.isPet) return true;         // 小动物（PetManager）
      if (obj.userData.model && obj.parent && obj.parent.userData.isPort) return true;
      return false;
    };
    this.sm.world.traverse((o) => {
      if (!o.visible) return;
      if (o === this.sm.props) return;                       // 跳过植被（量大且无信息价值）
      if (pick(o) || (o.isInstancedMesh && o.userData.layer && o.userData.layer.name === 'DockProps')) out.push(o);
    });
    return out;
  }

  /** 每帧调用（关键：星球自转下必须重播 raycast） */
  update() {
    if (this.pointer.x === Infinity || this.insideMini || this.cam.mode === ViewMode.GLOBE) {
      // 全球视角下不做悬停（建筑太小，且会误触）
      this._clearHover();
      return;
    }
    this.raycaster.setFromCamera(this.pointer, this.cam.camera);
    const hits = this.raycaster.intersectObjects(this._targets(), true);
    const hit = hits.find((h) => h.object.visible);

    if (hit) {
      const info = this._describe(hit);
      if (!this.hovered || this.hovered.name !== info.name) {
        this.hovered = info;
        this._show(info);
      } else if (this.infoEl) {
        this._position(this._screen);
      }
      document.body.style.cursor = 'pointer';
    } else {
      this._clearHover();
    }
  }

  _describe(hit) {
    let o = hit.object;
    let shipRoot = null;
    for (let p = o, i = 0; p && i < 12; p = p.parent, i++) {
      if (p.userData?.isShip) { shipRoot = p; break; }
    }
    if (shipRoot) o = shipRoot;
    // 往上找带业务标记的父级
    if (!shipRoot) {
      for (let i = 0; i < 5 && o; i++) {
        if (o.userData && (o.userData.isPort || o.userData.isShip || o.userData.model)) break;
        o = o.parent;
      }
    }
    const u = (o && o.userData) || {};
    const portId = u.port || (o && o.userData && o.userData.port);
    const port = portId ? this._portName(portId) : null;
    const point = hit.point.clone();
    // 陆地小人：用 CharacterManager 实时状态命名（杰克 · 行走中）
    let name = labelOf(u.model || 'object');
    let kind = u.isLandmark ? '地标建筑' : u.isPortPart ? '港口设施' : '模型';
    if (u.isPet) {
      name = labelOf(u.model || 'object');
      kind = '小动物';
    }
    if (u.isCharacter && this.cm) {
      const ch = this.cm.characters.find((c) => c.object === o);
      if (ch) {
        const st = ch.state === 'walk' ? '行走中' : ch.state === 'sprint' ? '奔跑中' : '歇脚中';
        name = ch.name + ' · ' + st;
        kind = ch.isChair ? '轮椅岛民' : '岛民';
      }
    }
    return {
      object: o,
      name,
      model: u.model || null,
      port,
      point,
      isShip: !!u.isShip,
      isCharacter: !!u.isCharacter,
      kind,
    };
  }

  /** 注入 CharacterManager（建人后调用），悬停显示岛民实时状态 */
  bindCharacters(cm) { this.cm = cm; }

  _portName(id) {
    if (!this.pm) return id;
    const p = this.pm.getPortById ? this.pm.getPortById(id) : null;
    return p ? p.name : id;
  }

  /** 注入 PortManager（建港后调用），用于显示港口名 */
  bindPorts(pm) { this.pm = pm; }

  _show(info) {
    if (!this.infoEl) return;
    this.infoEl.classList.add('show');
    this.infoEl.innerHTML =
      '<h3>' + esc(info.name) + '</h3>' +
      '<dl>' +
      '<dt>类型</dt><dd>' + esc(info.kind) + '</dd>' +
      (info.port ? '<dt>港口</dt><dd>' + esc(info.port) + '</dd>' : '') +
      '</dl>';
    this._position(this._screen);
  }

  _position(screen) {
    if (!this.infoEl || !screen) return;
    const pad = 14;
    const w = this.infoEl.offsetWidth || 200;
    let x = screen.x + pad, y = screen.y + pad;
    if (x + w > window.innerWidth - 8) x = screen.x - w - pad;
    if (y + (this.infoEl.offsetHeight || 90) > window.innerHeight - 8) y = screen.y - (this.infoEl.offsetHeight || 90) - pad;
    this.infoEl.style.left = Math.max(8, x) + 'px';
    this.infoEl.style.top = Math.max(8, y) + 'px';
  }

  _clearHover() {
    if (this.hovered) {
      this.hovered = null;
      if (this.infoEl) this.infoEl.classList.remove('show');
    }
    document.body.style.cursor = '';
  }

  _onClick(e) {
    if (this._inMini(e.clientX, e.clientY)) return null;
    this._toNdc(e.clientX, e.clientY);
    this.raycaster.setFromCamera(this.pointer, this.cam.camera);
    const hits = this.raycaster.intersectObjects(this._targets(), true);
    const hit = hits.find((h) => h.object.visible);
    if (!hit) return null;
    const info = this._describe(hit);
    return this.onPick ? this.onPick(info) : info;
  }
}

/** 模型名 → 可读中文名 */
function labelOf(model) {
  const map = {
    'tower-complete-large': '港口主塔楼',
    'tower-complete-small': '次级塔楼',
    'tower-watch': '瞭望塔',
    'castle-gate': '城堡大门',
    'castle-wall': '城墙',
    structure: '港口民居',
    'structure-roof': '民居屋顶',
    'structure-platform-dock': '主码头',
    'structure-platform-dock-small': '小码头',
    'platform-planks': '木板栈道',
    'structure-fence': '围栏',
    'boat-row-small': '舢板',
    'boat-row-large': '划艇',
    cannon: '岸防炮',
    'flag-pirate-high': '海盗旗',
    'flag-pennant': '三角旗',
    barrel: '木桶',
    crate: '木箱',
    chest: '宝箱',
    'crate-bottles': '酒瓶箱',
    'boat-row-large': '大划艇（渡轮）',
    'animal-cat': '小猫 · 味噌', 'animal-dog': '小狗 · 饼干', 'animal-bunny': '小兔 · 蓟花',
    'animal-fox': '狐狸 · 余烬', 'animal-deer': '小鹿 · 蕨叶', 'animal-lion': '狮子 · 日光',
    'animal-tiger': '老虎 · 暴风', 'animal-panda': '熊猫 · 竹竹', 'animal-penguin': '企鹅 · 卵石',
    'animal-pig': '小猪 · 松露', 'animal-cow': '奶牛 · 毛茛', 'animal-giraffe': '长颈鹿 · 云朵',
    'animal-elephant': '大象 · 长牙', 'animal-monkey': '猴子 · 芒果', 'animal-koala': '考拉 · 桉叶',
    'animal-hog': '野猪 · 灰烬', 'animal-beaver': '河狸 · 伐木', 'animal-crab': '螃蟹 · 烧爪',
    'animal-chick': '小鸡 · 啾啾', 'animal-parrot': '鹦鹉 · 琪琪',
  };
  return map[model] || model || '场景物件';
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
