/**
 * SeaSwell.js — 共享海浪场（船只漂浮的唯一「浪」来源，§吃水线 / 海浪）
 *
 * 用户反馈「船悬浮在水面上」根因：旧 bob = sin(t)×0.22 只是氛围级微抖，
 * 且船体原点（龙骨，实测 baseY=0）被 ROUTE_LIFT 抬在海面上方 → 悬浮。
 * 修复：船的实际位置 = 航线位置 + 法线 × (浪高 − 吃水)。吃水把龙骨压到海平面下，
 * 浪高让它随浪面升沉；横摇/俯仰取浪面斜率（小角度，永不翻船）。
 *
 * 铁律不变：姿态对齐（UP=法线/FORWARD=切线）只走 GeoUtils —— 本文件只算浪场数值
 * （waveHeight / waveTilt 是纯函数，船管理器把结果叠在自己的对齐上）。
 */
import * as THREE from 'three';

/** 浪场参数（世界单位 / 秒 / 度）。与 Ocean.js 可见浪纹同量级 → 观感对齐 */
export const SWELL = {
  AMP_A: 0.42, FREQ_A: 0.55,     // 主涌浪：长波慢摆
  AMP_B: 0.22, FREQ_B: 0.9,      // 次级 chop
  SPATIAL_A: 14.0, SPATIAL_B: 7.0, // 波长（度）→ 不同船相位不同（不整齐划一）
  TILT_GAIN: 2.2,                 // 浪面斜率 → 摇动的增益
  // ⚠ 单轴限幅 3°：roll+pitch 两轴叠加时局部 +Y 偏离法线的最坏角 = √(3²+3²) ≈ 4.24°
  //   （勾股合成，非相加）→ 船底朝外（UP=法线）在浪上仍成立（unit-ships <5°）
  TILT_MAX_DEG: 3.0,
};

/**
 * 某经纬度某时刻的浪面高度（相对海平面，世界单位）。
 * 两道斜向行波叠加（经/纬都有分量 → 浪斜穿球面传播）。
 */
export function waveHeight(lat, lon, time) {
  const TAU = Math.PI * 2;
  const a = Math.sin((lon / SWELL.SPATIAL_A + lat / (SWELL.SPATIAL_A * 1.7)) * TAU + time * SWELL.FREQ_A * TAU);
  const b = Math.sin((lon / SWELL.SPATIAL_B - lat / (SWELL.SPATIAL_B * 1.3)) * TAU - time * SWELL.FREQ_B * TAU);
  return a * SWELL.AMP_A + b * SWELL.AMP_B;
}

/**
 * 浪面斜率 → 随浪横摇 / 俯仰（弧度，限幅 ±4.5°）。
 * @returns {{roll:number, pitch:number}}
 */
export function waveTilt(lat, lon, time) {
  const eps = 0.5; // 度
  const dhLon = (waveHeight(lat, lon + eps, time) - waveHeight(lat, lon - eps, time)) / (2 * eps);
  const dhLat = (waveHeight(lat + eps, lon, time) - waveHeight(lat - eps, lon, time)) / (2 * eps);
  const lim = SWELL.TILT_MAX_DEG * Math.PI / 180;
  const clamp = (v) => THREE.MathUtils.clamp(Math.atan(v * SWELL.TILT_GAIN), -lim, lim);
  return { roll: clamp(dhLon), pitch: clamp(-dhLat) };
}
