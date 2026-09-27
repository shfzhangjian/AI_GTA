import assert from "node:assert";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const main = read("src/main.js");
const model = read("src/boat/BoatModel.js");
const config = read("src/config.js");

const idx = (src, needle) => {
  const i = src.indexOf(needle);
  assert(i >= 0, `missing source fragment: ${needle}`);
  return i;
};

// Browser path contract: GO is a one-frame flow event. RaceState.update() clears
// race.event, so start-blow visuals must be fired before race.update(dt).
{
  const capture = idx(main, "const flowEvent = race.event?.type === \"go\" ? race.event : null;");
  const lock = idx(main, "bb.popT = Math.max(bb.popT || 0, lockT);");
  const blow = idx(main, "if (view?.triggerBlowUp) view.triggerBlowUp();");
  const spring = idx(main, "if (view?.triggerSpringHead) view.triggerSpringHead(lockT);");
  const particles = idx(main, "spray.emitBlast(bb.position.x, bb.position.z);");
  const raceUpdate = idx(main, "race.update(dt);");
  assert(capture < lock && lock < blow && blow < spring && spring < particles,
    "GO flow event must lock boat, then trigger visible blow/spring/particles in order");
  assert(spring < raceUpdate && particles < raceUpdate,
    "start-blow visuals must fire before race.update(dt) clears race.event");
}

// Model contract: spring reset must not erase the blast that triggerBlowUp just
// made visible. It may reset pieces, but blast clearing is only allowed in full restore.
{
  const springFn = model.slice(idx(model, "function triggerSpringHead("));
  const springBody = springFn.slice(0, springFn.indexOf("function triggerLaunchStretch()"));
  assert(springBody.includes("_resetPartsForExplosion()"),
    "triggerSpringHead must reset parts for a clean explosion baseline");
  assert(!springBody.includes("_restoreHead()") && !springBody.includes("_clearBlast()"),
    "triggerSpringHead must not clear the blast effect started by triggerBlowUp");
}

// Visual amplitude contract: these numbers are intentionally oversized because
// the game camera is pulled back; subtle values are effectively invisible.
{
  assert(model.includes("5.2 * Math.sin(q * Math.PI)"),
    "driver explosion must visibly eject upward");
  assert(model.includes("const waterZ = driver.userData.baseZ - 4.2;"),
    "driver explosion must visibly eject forward");
  assert(model.includes("driver.scale.setScalar(1 + 1.25 * Math.sin(q * Math.PI))"),
    "driver explosion must scale up enough to read at gameplay camera distance");
  assert(model.includes("const waterY = 0.05;"),
    "driver head must have an explicit water-surface float height");
  assert(model.includes("driver.visible = Math.floor(q * 14) % 2 === 0 || q > 0.88;"),
    "driver head must blink while restoring from the water");
  assert(model.includes("bow.userData.baseZ - 1.45 * punch"),
    "bow spring must visibly pop forward");
  assert(model.includes("bow.userData.baseScale.y * (1 + 2.35 * punch)"),
    "bow spring must visibly stretch along the cone length axis");
}

// Duration contract: recovery is dynamic from false-start throttle duration and
// hard-capped at 1s. popT uses that same duration to lock motion.
{
  const m = config.match(/popDriverTime:\s*([0-9.]+)/);
  assert(m, "missing CONFIG.raceFlow.start.popDriverTime");
  assert(Number(m[1]) <= 1.0, `popDriverTime must not exceed 1s, got ${m[1]}`);
  assert(config.includes("penaltyMax: 1.0"),
    "false-start penalty must be capped at 1s");
  assert(main.includes("const lockT = Math.min(CONFIG.raceFlow.start.popDriverTime, Math.max(0.35, b.penalty || 0));"),
    "main must compute dynamic start-blow lock from false-start penalty capped by popDriverTime");
  assert(model.includes("_springDur = Math.max(0.35, Math.min(1, duration || 1));"),
    "model must clamp per-blow spring duration to <= 1s");
}

// Perfect-launch contract: launch recovery starts from the actual countdown
// swell size. It must not squash the boat smaller on the GO frame; otherwise the
// user sees an instant shrink instead of a forward launch that restores slowly.
{
  assert(model.includes("const swollen = 1 + p * (SV.swellBoatScale || 0);"),
    "perfect launch must derive its initial size from actual countdown swell");
  assert(model.includes("const body = 1 + (swollen - 1) * k;"),
    "perfect launch body scale must gradually restore from swollen size to normal");
  assert(model.includes("const dur = SV.launchRestoreTime || 5.0;"),
    "perfect launch must use an explicit 5s restore duration instead of a fast half-life");
  assert(model.includes("const k = 1 - (u * u * (3 - 2 * u));"),
    "perfect launch must use a monotonic smoothstep restore curve");
  assert(model.includes("group.translateZ(-(SV.launchForward || 0) * p * k);"),
    "perfect launch must visually move forward according to actual start size");
  assert(config.includes("launchRestoreTime: 5.0"),
    "perfect launch restore duration must be configured as 5 seconds");
}

console.log("PASS static start visual contracts: event order, blast preservation, amplitude, duration");
