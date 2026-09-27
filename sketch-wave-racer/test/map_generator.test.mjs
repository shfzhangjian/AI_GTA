// Random map generation and Track reconfiguration tests.
import assert from "node:assert";

const { Track, HALF_WIDTH } = await import("../src/track/Track.js");
const { generateMapChoices } = await import("../src/track/TrackGenerator.js");
const { RaceState } = await import("../src/race/RaceState.js");
const { TrackFeatures } = await import("../src/track/TrackFeatures.js");
const { CollisionWorld } = await import("../src/physics/CollisionWorld.js");
const { BoatController } = await import("../src/boat/BoatController.js");
const { ItemSystem } = await import("../src/items/ItemSystem.js");

const fakeGroup = () => ({
  position: { copy() {}, set() {}, x: 0, y: 0, z: 0 },
  rotation: { set() {} }, scale: { set() {} }, add() {}, traverse() {},
});

const maps = generateMapChoices(3, 12345);
assert.strictEqual(maps.length, 3, "应随机生成 3 张候选地图");
assert.strictEqual(new Set(maps.map((m) => m.id)).size, 3, "3 张地图 id 应不同");
assert(maps.every((m) => m.controlPoints.length >= 13), "每张地图都应有足够控制点");

for (const m of maps) {
  const track = new Track(m);
  assert(track.length > 600 && track.length < 1500, `地图长度应合理: ${m.name} ${track.length}`);
  assert.strictEqual(track.checkpoints.length, 10, "每张地图都应生成 10 个检查点");
  const p = track.pointAt(0.25);
  assert(track.nearest(p.x, p.z).dist < 1.5, "中心线点 nearest 应接近 0");
  const tan = track.tangentAt(0.25);
  const offA = track.nearest(p.x + -tan.z * (HALF_WIDTH + 8), p.z + tan.x * (HALF_WIDTH + 8));
  const offB = track.nearest(p.x - -tan.z * (HALF_WIDTH + 8), p.z - tan.x * (HALF_WIDTH + 8));
  assert(Math.max(offA.dist, offB.dist) > HALF_WIDTH, "半宽外应至少有一侧可判越界");
}

{
  const track = new Track(maps[0]);
  const race = new RaceState(track, []);
  const features = new TrackFeatures(track);
  const collision = new CollisionWorld(track);
  const oldLen = track.length;
  track.configure(maps[1]);
  race.rebuildTrackGeometry(track);
  features.rebuild(track);
  collision.rebuild(track);
  assert.notStrictEqual(Math.round(track.length), Math.round(oldLen), "切换地图后长度应更新");
  assert.strictEqual(race.cpArc.length, 10, "RaceState 应重建检查点弧长");
  assert(features.boosts.every((b) => b.arc > 0 && b.arc < track.length), "加速带弧长应随新地图更新");
  assert(collision.obstacles.length >= 6, "碰撞障碍应随新地图重建");
}

for (const m of maps) {
  const track = new Track(m);
  const boat = new BoatController(fakeGroup(), { isDown: () => false }, { track });
  const race = new RaceState(track, [{ id: "player", label: "P", color: 0, boat }]);
  const items = new ItemSystem(track, race, { rng: () => 0 });
  for (const box of items.boxes) {
    boat.item = null;
    boat.airborne = false;
    boat.trapped = 0;
    box.respawn = 0;
    boat.position.x = box.pos.x;
    boat.position.y = 0.2;
    boat.position.z = box.pos.z;
    items.update(1 / 60);
    assert(boat.item, `地图 ${m.name} row=${box.row} lane=${box.lane} 的道具箱应能拾取`);
  }
}

console.log("ALL MAP-GENERATOR TESTS PASSED");
