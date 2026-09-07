import * as THREE from '../../libs/three.module.js';

export function makeTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function createPlane(texture, width, height, z = 0) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.z = z;
  return mesh;
}

export function skyTexture() {
  return makeTexture(1024, 512, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#76cbe0');
    gradient.addColorStop(0.45, '#d7f2dc');
    gradient.addColorStop(1, '#f1e7c7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 16; i += 1) {
      const x = (i * 173) % w;
      const y = 40 + ((i * 41) % 170);
      drawCloud(ctx, x, y, 0.7 + (i % 4) * 0.16);
    }
  });
}

export function mountainTexture(layer = 0) {
  return makeTexture(1400, 420, (ctx, w, h) => {
    const palettes = [
      ['rgba(35,83,91,0.56)', 'rgba(44,113,103,0.32)'],
      ['rgba(45,101,76,0.68)', 'rgba(92,145,84,0.38)'],
      ['rgba(35,74,55,0.74)', 'rgba(105,145,72,0.5)'],
    ];
    const [ink, wash] = palettes[layer % palettes.length];
    ctx.fillStyle = wash;
    ctx.beginPath();
    ctx.moveTo(0, h);

    const count = 8 + layer * 2;
    for (let i = 0; i <= count; i += 1) {
      const x = (i / count) * w;
      const peak = h * (0.22 + ((i * 31 + layer * 13) % 38) / 100);
      ctx.lineTo(x, peak);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = ink;
    ctx.lineWidth = 8 - layer;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < count; i += 1) {
      const x = (i / count) * w;
      const peak = h * (0.24 + ((i * 17 + layer * 7) % 34) / 100);
      brushLine(ctx, [
        [x - 120, h],
        [x + 20, peak],
        [x + 180, h],
      ]);
    }
    ctx.globalAlpha = 1;
  });
}

export function groundTexture() {
  return makeTexture(1400, 240, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#7fb86f');
    gradient.addColorStop(0.46, '#426a45');
    gradient.addColorStop(1, '#221916');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(20,42,27,0.42)';
    ctx.lineWidth = 8;
    for (let i = 0; i < 18; i += 1) {
      const y = 34 + ((i * 19) % 78);
      brushLine(ctx, [
        [i * 80 - 60, y],
        [i * 80 + 60, y + 9],
        [i * 80 + 180, y - 3],
      ]);
    }

    ctx.fillStyle = 'rgba(18,25,19,0.48)';
    for (let i = 0; i < 90; i += 1) {
      const x = (i * 47) % w;
      const y = h - 40 - ((i * 13) % 38);
      ctx.beginPath();
      ctx.ellipse(x, y, 7 + (i % 6), 16 + (i % 9), -0.5 + (i % 5) * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function treeTexture() {
  return makeTexture(320, 420, (ctx, w, h) => {
    ctx.translate(w / 2, h - 22);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = '#523925';
    ctx.lineWidth = 28;
    brushLine(ctx, [
      [0, 0],
      [-10, -70],
      [6, -138],
      [4, -218],
    ]);

    ctx.lineWidth = 15;
    brushLine(ctx, [
      [-2, -130],
      [-72, -194],
      [-104, -256],
    ]);
    brushLine(ctx, [
      [10, -160],
      [78, -224],
      [98, -286],
    ]);
    brushLine(ctx, [
      [0, -198],
      [-24, -264],
      [2, -324],
    ]);

    const leaves = [
      [-86, -260, 72, 48, '#2f8566'],
      [-28, -304, 88, 58, '#3d9a72'],
      [60, -262, 82, 56, '#2e7c68'],
      [-8, -228, 110, 62, '#23735f'],
      [10, -344, 62, 40, '#5aaf78'],
    ];

    for (const [x, y, rx, ry, color] of leaves) {
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(13,36,29,0.34)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, -0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });
}

export function caveTexture() {
  return makeTexture(360, 360, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2 + 16);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.32)';
    ctx.shadowBlur = 18;

    ctx.fillStyle = '#3c3f3d';
    ctx.strokeStyle = '#191918';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-150, 106);
    ctx.bezierCurveTo(-140, -68, -84, -146, 0, -152);
    ctx.bezierCurveTo(98, -146, 148, -70, 154, 108);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#151312';
    ctx.beginPath();
    ctx.moveTo(-78, 98);
    ctx.bezierCurveTo(-72, -30, -42, -88, 4, -92);
    ctx.bezierCurveTo(48, -86, 82, -34, 80, 100);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#b94e44';
    ctx.lineWidth = 9;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(2, -18, 42 + i * 24, -0.2, Math.PI * 1.7);
      ctx.stroke();
    }

    ctx.fillStyle = '#e7c369';
    ctx.font = '700 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('封', 2, -18);

    ctx.strokeStyle = 'rgba(238,207,124,0.48)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      brushLine(ctx, [
        [Math.cos(angle) * 18, -18 + Math.sin(angle) * 18],
        [Math.cos(angle) * 112, -18 + Math.sin(angle) * 112],
      ]);
    }
  });
}

export function heroTexture() {
  return makeTexture(260, 300, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2 + 24);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawShadow(ctx, 0, 104, 62, 14);

    ctx.strokeStyle = '#3b2519';
    ctx.lineWidth = 18;
    brushLine(ctx, [
      [-42, 52],
      [-68, 86],
    ]);
    brushLine(ctx, [
      [34, 56],
      [60, 88],
    ]);

    ctx.fillStyle = '#4a7d48';
    ctx.strokeStyle = '#18261b';
    ctx.lineWidth = 7;
    roundPath(ctx, -54, -8, 96, 92, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f2c58c';
    ctx.beginPath();
    ctx.ellipse(-6, -72, 38, 44, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2b2019';
    ctx.beginPath();
    ctx.moveTo(-48, -83);
    ctx.quadraticCurveTo(-20, -128, 35, -105);
    ctx.quadraticCurveTo(62, -82, 24, -50);
    ctx.quadraticCurveTo(-2, -76, -48, -52);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#1d1712';
    ctx.lineWidth = 5;
    brushLine(ctx, [
      [-24, -74],
      [-7, -68],
    ]);
    brushLine(ctx, [
      [14, -72],
      [28, -80],
    ]);

    ctx.strokeStyle = '#6f4729';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(-62, -16, 82, -1.35, 1.17);
    ctx.stroke();

    ctx.strokeStyle = '#f2d37e';
    ctx.lineWidth = 3;
    brushLine(ctx, [
      [-79, -94],
      [-54, 70],
    ]);

    ctx.strokeStyle = '#382313';
    ctx.lineWidth = 10;
    brushLine(ctx, [
      [-50, -8],
      [-2, 12],
      [48, -4],
    ]);

    ctx.strokeStyle = '#f1db7a';
    ctx.lineWidth = 5;
    brushLine(ctx, [
      [48, -4],
      [82, -14],
    ]);

    ctx.fillStyle = '#d19d3e';
    ctx.beginPath();
    ctx.ellipse(45, 30, 16, 24, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

export function enemyTexture(typeKey, color) {
  return makeTexture(220, 220, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2 + 14);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawShadow(ctx, 0, 74, 58, 13);

    ctx.fillStyle = shade(color, -22);
    ctx.strokeStyle = '#201713';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(0, 18, 54, 64, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#2a1a14';
    ctx.lineWidth = 13;
    brushLine(ctx, [
      [-38, 58],
      [-60, 84],
    ]);
    brushLine(ctx, [
      [38, 58],
      [58, 84],
    ]);

    if (typeKey === 'serpent') {
      drawSerpentHead(ctx, color);
    } else if (typeKey === 'scorpion') {
      drawScorpionCrest(ctx, color);
    } else if (typeKey === 'sorcerer') {
      drawSorcererMask(ctx, color);
    } else {
      drawGobletMask(ctx, color);
    }

    drawTarget(ctx, typeKey === 'scorpion' ? 45 : 37);
  });
}

export function circleTexture(color, alpha = 1) {
  return makeTexture(96, 96, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.55, withAlpha(color, alpha));
    gradient.addColorStop(1, withAlpha(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });
}

export function labelTexture(text, color = '#ffe28a') {
  return makeTexture(256, 112, (ctx, w, h) => {
    ctx.font = '900 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(33,16,9,0.85)';
    ctx.strokeText(text, w / 2, h / 2);
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2);
  });
}

export function targetBadgeTexture(accent = '#d86957') {
  return makeTexture(180, 180, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = 'rgba(245,233,203,0.92)';
    ctx.strokeStyle = 'rgba(35,26,18,0.9)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const rings = ['#6fa076', '#e2ba5e', '#5f8fb0', accent];
    for (let i = 0; i < rings.length; i += 1) {
      ctx.strokeStyle = rings[i];
      ctx.lineWidth = i === 0 ? 8 : 7;
      ctx.beginPath();
      ctx.arc(0, 0, 52 - i * 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(58,43,28,0.64)';
    ctx.lineWidth = 4;
    brushLine(ctx, [
      [-74, 0],
      [74, 0],
    ]);
    brushLine(ctx, [
      [0, -74],
      [0, 74],
    ]);
  });
}

export function sealCrackTexture() {
  return makeTexture(180, 180, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = '#ffdc79';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#ff743d';
    ctx.shadowBlur = 12;
    for (let i = 0; i < 9; i += 1) {
      const angle = (i / 9) * Math.PI * 2;
      brushLine(ctx, [
        [Math.cos(angle) * 10, Math.sin(angle) * 10],
        [Math.cos(angle + 0.12) * (54 + (i % 3) * 15), Math.sin(angle + 0.12) * (54 + (i % 3) * 15)],
      ]);
    }
  });
}

function drawCloud(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 44, 18, 0, 0, Math.PI * 2);
  ctx.ellipse(38, 8, 34, 24, 0, 0, Math.PI * 2);
  ctx.ellipse(74, 18, 46, 18, 0, 0, Math.PI * 2);
  ctx.ellipse(22, 0, 26, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTarget(ctx, radius) {
  ctx.save();
  ctx.translate(18, 12);
  ctx.fillStyle = '#e8dcc4';
  ctx.strokeStyle = '#2b241f';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const rings = ['#79a971', '#f2d47b', '#658cab', '#d86957'];
  for (let i = 0; i < rings.length; i += 1) {
    ctx.strokeStyle = rings[i];
    ctx.lineWidth = i === 0 ? 6 : 5;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 9 - i * 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawGobletMask(ctx, color) {
  ctx.fillStyle = shade(color, 24);
  ctx.strokeStyle = '#211610';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(-16, -42, 30, 26, -0.2, 0, Math.PI * 2);
  ctx.ellipse(22, -40, 30, 26, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawSerpentHead(ctx, color) {
  ctx.fillStyle = shade(color, 20);
  ctx.strokeStyle = '#1d1611';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-50, -36);
  ctx.quadraticCurveTo(-4, -92, 54, -36);
  ctx.quadraticCurveTo(24, -18, -50, -36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#f1da82';
  ctx.lineWidth = 4;
  brushLine(ctx, [
    [-6, -44],
    [16, -58],
    [36, -42],
  ]);
}

function drawScorpionCrest(ctx, color) {
  ctx.strokeStyle = shade(color, 36);
  ctx.lineWidth = 12;
  brushLine(ctx, [
    [42, -28],
    [66, -62],
    [44, -94],
  ]);
  ctx.fillStyle = '#e2c25f';
  ctx.beginPath();
  ctx.arc(40, -92, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawSorcererMask(ctx, color) {
  ctx.fillStyle = shade(color, 30);
  ctx.strokeStyle = '#1a1314';
  ctx.lineWidth = 6;
  roundPath(ctx, -44, -78, 88, 58, 18);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#f7d477';
  ctx.lineWidth = 4;
  brushLine(ctx, [
    [-22, -54],
    [-6, -42],
    [10, -54],
    [28, -42],
  ]);
}

function drawShadow(ctx, x, y, rx, ry) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function brushLine(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function roundPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function shade(hex, amount) {
  const raw = hex.replace('#', '');
  const channels = [0, 2, 4].map((index) => {
    const value = Number.parseInt(raw.slice(index, index + 2), 16);
    return Math.max(0, Math.min(255, value + amount));
  });
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function withAlpha(hex, alpha) {
  const raw = hex.replace('#', '');
  const channels = [0, 2, 4].map((index) => Number.parseInt(raw.slice(index, index + 2), 16));
  return `rgba(${channels.join(',')},${alpha})`;
}
