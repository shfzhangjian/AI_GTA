// Flying fish dynamic hazard headless tests.
import assert from "node:assert";

global.window = { devicePixelRatio: 1, innerWidth: 800, innerHeight: 600, addEventListener() {} };
global.document = {
  getElementById: () => null,
  createElement: () => ({ getContext: () => ({}), width: 0, height: 0 }),
};
global.localStorage = { getItem: () => null, setItem() {} };
global.performance = { now: () => 0 };

const THREE = await import("three");
const { Track } = await import("../src/track/Track.js");
const { RaceState } = await import("../src/race/RaceState.js");
const { BoatController } = await import("../src/boat/BoatController.js");
const { FlyingFishSystem } = await import("../src/hazards/FlyingFishSystem.js");
const { CONFIG } = await import("../src/config.js");

const track = new Track();
const fakeGroup = () => ({
  position: { copy() {}, set() {}, x: 0, y: 0, z: 0 },
  rotation: { set() {} }, scale: { set() {} }, add() {}, traverse() {},
});

function placeAtArc(boat, arc, lat = 0) {
  const t = ((arc % track.length) + track.length) % track.length / track.length;
  const p = track.pointAt(t);
  const tan = track.tangentAt(t);
  boat.setPose(new THREE.Vector3(p.x + -tan.z * lat, 0.2, p.z + tan.x * lat),
    Math.atan2(-tan.x, -tan.z));
}

function makeRace(n = 4) {
  const racers = [];
  for (let i = 0; i < n; i++) {
    const boat = new BoatController(fakeGroup(), { isDown: () => false }, { track });
    placeAtArc(boat, 80 - i * 20);
    racers.push({ id: i === 0 ? "player" : `ai${i}`, label: `R${i}`, color: 0, boat });
  }
  const race = new RaceState(track, [racers[0]]);
  race.addAiRacers(racers.slice(1), racers.slice(1).map(() => 0.8));
  for (const r of racers) r.boat.race = race;
  race.phase = "racing";
  race.started = true;
  race.update(1 / 60);
  return { race, racers };
}

// 前 3 名才会被列入飞鱼突袭候选，且名次会按当前进度排序。
{
  const { race } = makeRace(4);
  const fish = new FlyingFishSystem(track, race, { rng: () => 0 });
  const eligible = fish._eligibleEntries();
  assert.deepStrictEqual(eligible.map((e) => e.place), [1, 2, 3], "只有前 3 名应成为飞鱼候选");
  fish.update(1, 1000);
  assert(fish.fish.length >= 1, "rng=0 且 dt=1 时前 3 名应有概率刷出飞鱼");
  assert(fish.fish.every((f) => ["player", "ai1", "ai2"].includes(f.targetId)), "飞鱼目标不得落到第 4 名");
  console.log("PASS flying fish ranking: top-3 only, rank-driven spawn");
}

// 碰到飞鱼会减速并产生事件。
{
  const { race } = makeRace(2);
  const fish = new FlyingFishSystem(track, race, { rng: () => 0.5 });
  const e = race.entryOf("player");
  const b = e.boat;
  b.speed = 24;
  const f = {
    id: 99, x: b.position.x, z: b.position.z, y: 1.1, age: 0.5,
    life: CONFIG.flyingFish.life, alive: true, hitIds: new Set(), nx: 1, nz: 0,
  };
  fish.fish.push(f);
  fish._collide(f);
  assert(b.speed < 24, `飞鱼命中应减速, got ${b.speed}`);
  assert.strictEqual(b.lastEvent, "hitfish", "命中后应写 hitfish 事件");
  assert(fish.log.some((ev) => ev.type === "hit" && ev.hazard === "flyingFish"), "应记录 hit 日志");
  console.log("PASS flying fish collision: hit slows and emits event");
}

// 横向躲开不会被撞。
{
  const { race } = makeRace(2);
  const fish = new FlyingFishSystem(track, race, { rng: () => 0.5 });
  const b = race.entryOf("player").boat;
  b.speed = 24;
  const f = {
    id: 100, x: b.position.x + CONFIG.flyingFish.radius + CONFIG.trackFeatures.colliderRadius + 4,
    z: b.position.z, y: 1.1, age: 0.5,
    life: CONFIG.flyingFish.life, alive: true, hitIds: new Set(), nx: 1, nz: 0,
  };
  fish.fish.push(f);
  fish._collide(f);
  assert.strictEqual(b.speed, 24, "横向距离足够时应能躲开飞鱼");
  assert.notStrictEqual(b.lastEvent, "hitfish", "躲开时不得写 hitfish");
  console.log("PASS flying fish dodge: lateral avoidance prevents hit");
}

console.log("ALL FLYING-FISH TESTS PASSED");
