// unit-systems.mjs — 玩法系统（EntityRegistry / DamageSystem / EnvironmentEventSystem）纯逻辑测试
//   node --import ./scripts/register-loader.mjs scripts/unit-systems.mjs
//
// 无浏览器、无 WebGL：用假 sceneManager 验证注册、查询、伤害、生命周期与破坏的数值行为。
import * as THREE from 'three';
globalThis.THREE = THREE;

const { EntityRegistry } = await import('../src/world/systems/EntityRegistry.js');
const { DamageSystem } = await import('../src/world/systems/DamageSystem.js');
const { EnvironmentEventSystem } = await import('../src/world/systems/EnvironmentEventSystem.js');
const { PLANET } = await import('../src/config.js');

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ok  ' + n); } else { fail++; console.log('  XX  ' + n + (x ? '  ' + x : '')); } };

/** 假 sceneManager（只需 world 组） */
const fakeSM = () => { const world = new THREE.Group(); return { world, scene: new THREE.Scene() }; };
/** 假实体：Group + 带 color 的 mesh。放进 world 并 updateMatrixWorld，保证 getWorldPosition 正确 */
function place(world, pos) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0x88cc88 }));
  g.add(mesh);
  g.position.copy(pos);
  world.add(g);                 // ⚠ 必须在场景图内，getWorldPosition 才有效
  world.updateMatrixWorld(true);
  return g;
}

console.log('--- EntityRegistry：注册 / 查询 / 反查 ---');
{
  const reg = new EntityRegistry();
  const w = new THREE.Group();
  const a = place(w, new THREE.Vector3(0, 100, 0));
  const b = place(w, new THREE.Vector3(0, 0, 100));
  const ea = reg.register(a, { type: 'ship', tags: ['ship', 'pirate'], damageable: true, maxHp: 120 });
  const eb = reg.register(b, { type: 'building', tags: ['port'], damageable: true, maxHp: 100 });
  ok('注册返回带 id 的实体', !!ea && !!ea.id, ea && ea.id);
  ok('id 唯一', ea.id !== eb.id);
  ok('按 type 查询', reg.query({ type: 'ship' }).length === 1);
  ok('按 tag 查询', reg.query({ tag: 'pirate' }).length === 1);
  ok('按 damageable 过滤', reg.query({ damageable: true }).length === 2 && reg.query({ damageable: false }).length === 0);
  ok('按对象反查实体', reg.get(a) === ea);
  ok('按 id 反查', reg.get(ea.id) === ea);
  ok('userData 回写 entityId', a.userData.entityId === ea.id);
  ok('maxHp 生效', ea.maxHp === 120 && ea.hp === 120);
  reg.clear();
  ok('clear 后为空', reg.query({}).length === 0);
}

console.log('--- DamageSystem：applyDamage 数值与破坏状态 ---');
{
  const sm = fakeSM();
  const reg = new EntityRegistry();
  const dmg = new DamageSystem({ sceneManager: sm, registry: reg });
  const o = place(sm.world, new THREE.Vector3(0, 100, 0));
  const e = dmg.makeDamageable(o, { type: 'building', maxHp: 50 });
  ok('makeDamageable 注册并置 damageable', !!e && e.damageable && e.maxHp === 50);
  dmg.applyDamage(o, 20);
  ok('伤害扣血', reg.get(o).hp === 30);
  ok('未破坏时 destroyed=false', !reg.get(o).destroyed);
  // 材质应变暗（写入 baseDamageColor 并变暗）
  const mat = o.children[0].material;
  ok('受损材质变暗（色值下降）', mat.color.getHex() !== 0x88cc88, mat.color.getHexString());
  dmg.applyDamage(o, 999);
  const e2 = reg.get(o);
  ok('血量归 0 不为负', e2.hp === 0);
  ok('触发破坏 destroyed=true', e2.destroyed === true);
  ok('破坏后继续加伤无效', (() => { const s = e2.hp; dmg.applyDamage(o, 10); return reg.get(o).hp === s; })());
  dmg.update(0.1);   // 不应抛错
  ok('update 不抛错', true);
}

console.log('--- DamageSystem：applyRadialDamage 距离衰减 + 命中范围 ---');
{
  const sm = fakeSM();
  const reg = new EntityRegistry();
  const dmg = new DamageSystem({ sceneManager: sm, registry: reg });
  const center = latLon(0, 0);
  const near = place(sm.world, center.clone());
  const far = place(sm.world, latLon(0, 60));       // 远于半径
  dmg.makeDamageable(near, { maxHp: 100 });
  dmg.makeDamageable(far, { maxHp: 100 });
  const affected = dmg.applyRadialDamage(center, 25, 40, {});
  ok('命中范围内实体', affected.length === 1 && affected[0].object === near);
  ok('范围内实体受伤', reg.get(near).hp < 100);
  ok('范围外实体不受影响', reg.get(far).hp === 100);
  ok('生成冲击特效环', dmg.effects.children.length >= 1);
  // 特效会随时间回收
  for (let i = 0; i < 60; i++) dmg.update(0.05);
  ok('冲击特效会过期回收', dmg.effects.children.length === 0);
}

console.log('--- EnvironmentEventSystem：触发 / 生命周期 / 造成伤害 ---');
{
  const sm = fakeSM();
  const reg = new EntityRegistry();
  const dmg = new DamageSystem({ sceneManager: sm, registry: reg });
  const env = new EnvironmentEventSystem({ sceneManager: sm, damageSystem: dmg });
  const target = place(sm.world, latLon(12, 100));
  dmg.makeDamageable(target, { maxHp: 200 });

  const ev = env.trigger('meteor', { lat: 12, lon: 100, radius: 40, damage: 120 });
  ok('trigger 返回事件对象', !!ev && ev.type === 'meteor');
  ok('事件挂进场景组', env.group.children.length === 1);
  ok('事件中心 = 经纬度球面点（半径≈R）', Math.abs(ev.center.length() - PLANET.RADIUS) < 3, ev.center.length().toFixed(1));
  ok('未知事件类型抛错', (() => { try { env.trigger('earthquake', {}); return false; } catch { return true; } })());

  // 推进到爆发时刻 → 应造成伤害
  let hurt = false;
  for (let i = 0; i < 200; i++) { env.update(0.05); if (reg.get(target).hp < 200) hurt = true; }
  ok('灾害到达时造成伤害', hurt);
  ok('灾害结束后自动回收（事件清空）', env.events.length === 0 && env.group.children.length === 0);
}

console.log('--- 四种事件类型都应可触发且生命周期正常 ---');
{
  for (const type of ['rain', 'tornado', 'tsunami', 'meteor']) {
    const sm = fakeSM();
    const reg = new EntityRegistry();
    const dmg = new DamageSystem({ sceneManager: sm, registry: reg });
    const env = new EnvironmentEventSystem({ sceneManager: sm, damageSystem: dmg });
    const ev = env.trigger(type, { lat: 5, lon: 5 });
    let frames = 0;
    while (env.events.length && frames < 400) { env.update(0.05); frames++; }
    ok(type + '：触发→自动结束', frames > 0 && frames < 400, 'frames=' + frames);
  }
}

function latLon(lat, lon) {
  const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)).multiplyScalar(PLANET.RADIUS);
}

console.log('');
console.log(fail === 0 ? 'PASS 玩法系统单元测试全通过 (' + pass + ')' : 'FAIL ' + fail + ' 失败 / ' + pass + ' 通过');
process.exit(fail ? 1 : 0);
