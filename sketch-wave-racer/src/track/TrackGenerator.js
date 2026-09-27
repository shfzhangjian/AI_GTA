// Sketch Wave Racer — 随机地图候选生成
// 灵感来自卡丁车游戏的赛道节奏：宽弯、S 弯、连续道具/跳台机会；
// 不复刻任何具体商业赛道，生成本游戏自己的水上环线。

const NAMES = [
  ["贝壳杯", "珊瑚海湾"],
  ["浪花杯", "礁石峡谷"],
  ["星潮杯", "跳台群岛"],
  ["泡泡杯", "月牙潟湖"],
  ["海风杯", "彩带水道"],
  ["灯塔杯", "回旋港"],
];

export function generateMapChoices(count = 3, seed = Date.now() ^ Math.floor(Math.random() * 1e9)) {
  const rng = mulberry32(seed >>> 0);
  const archetypes = ["speed", "technical", "islands"];
  const out = [];
  for (let i = 0; i < count; i++) {
    const type = archetypes[i % archetypes.length];
    out.push(generateMap(type, i, rng));
  }
  return out;
}

export function generateMap(type = "speed", index = 0, rng = Math.random) {
  const namePair = NAMES[(index + Math.floor(rng() * NAMES.length)) % NAMES.length];
  const cfg = {
    speed:     { pts: 13, base: 142, amp: 22, wobble: 0.13, difficulty: 1, label: "高速宽弯" },
    technical: { pts: 16, base: 132, amp: 34, wobble: 0.22, difficulty: 2, label: "连续 S 弯" },
    islands:   { pts: 15, base: 150, amp: 30, wobble: 0.18, difficulty: 3, label: "跳台群岛" },
  }[type] || { pts: 14, base: 140, amp: 26, wobble: 0.16, difficulty: 1, label: "随机水道" };

  const points = [];
  const startR = cfg.base + rand(rng, -8, 8);
  points.push([0, -startR]);
  for (let i = 1; i < cfg.pts; i++) {
    const a0 = -Math.PI / 2 + (i / cfg.pts) * Math.PI * 2;
    let a = a0 + rand(rng, -cfg.wobble, cfg.wobble);
    let r = cfg.base + Math.sin(i * 1.7 + rng() * 2) * cfg.amp + rand(rng, -cfg.amp * 0.45, cfg.amp * 0.45);
    if (type === "technical") {
      r += (i % 2 === 0 ? 1 : -1) * rand(rng, 12, 24);
      a += (i % 3 === 0 ? 1 : -1) * rand(rng, 0.04, 0.1);
    } else if (type === "islands") {
      r += Math.sin(i * 2.4) * 18;
      if (i === 5 || i === 10) r -= rand(rng, 18, 28);
    } else {
      if (i === 3 || i === 9) r += rand(rng, 14, 26);
    }
    r = Math.max(86, Math.min(188, r));
    points.push([round(Math.cos(a) * r), round(Math.sin(a) * r)]);
  }

  // 给起点前后留出可读的直道，避免一出生就急弯。
  if (points.length >= 3) {
    points[1][0] = Math.max(48, Math.abs(points[1][0])) * Math.sign(points[1][0] || 1);
    points[points.length - 1][0] = -Math.max(36, Math.abs(points[points.length - 1][0]));
  }

  return {
    id: `${type}-${index}-${Math.floor(rng() * 1e6).toString(36)}`,
    name: `${namePair[0]} · ${namePair[1]}`,
    style: type,
    label: cfg.label,
    difficulty: cfg.difficulty,
    controlPoints: points,
  };
}

function rand(rng, a, b) {
  return a + rng() * (b - a);
}

function round(v) {
  return Math.round(v * 10) / 10;
}

function mulberry32(seed) {
  return function rng() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
