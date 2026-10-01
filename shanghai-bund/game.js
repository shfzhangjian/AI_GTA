(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);
  const world = $('world');
  const captureMode = new URLSearchParams(location.search).get('capture') === '1';
  const state = { night: true, rain: false, crowd: true, fireworks: true, lights: true, drones: true, sound: false };
  const keys = new Set();
  let seed = 48121;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const range = (a, b) => a + random() * (b - a);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function el(tag, attrs = {}, parent = world) { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (parent) parent.append(n); return n; }
  const group = (id, parent = world, attrs = {}) => el('g', { id, ...attrs }, parent);
  const rect = (x, y, width, height, fill, parent, extra = {}) => el('rect', { x, y, width, height, fill, ...extra }, parent);
  const poly = (points, fill, parent, extra = {}) => el('polygon', { points, fill, ...extra }, parent);
  const line = (x1, y1, x2, y2, stroke, width, parent, extra = {}) => el('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, ...extra }, parent);
  const label = (text, x, y, parent, attrs = {}) => { const n = el('text', { x, y, fill: '#c8dbd5', 'font-size': 10, 'font-family': 'Microsoft YaHei, sans-serif', ...attrs }, parent); n.textContent = text; return n; };
  const icons = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    moon: '<path d="M20 15.6A8.5 8.5 0 0 1 8.4 4 8.5 8.5 0 1 0 20 15.6Z"/>',
    people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/>',
    spark: '<path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8ZM20 2v4m-2-2h4M4 17v5m-2-2h4"/>',
    light: '<path d="m4 21 6-17m10 17L14 4M7 14h10M5 18h14M10 4h4M12 2v19"/>',
    rain: '<path d="M5 14a4 4 0 1 1 1-7 6 6 0 0 1 11-1 4 4 0 1 1 2 8M7 17l-2 4m8-4-2 4m8-4-2 4"/>',
    sound: '<path d="M3 9h4l5-4v14l-5-4H3ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>',
    drone: '<rect x="9" y="9" width="6" height="6" rx="1"/><path d="m9 9-3-3m9 3 3-3m-9 9-3 3m9-3 3 3M2 5h8m4 0h8M2 19h8m4 0h8"/><circle cx="6" cy="5" r="3"/><circle cx="18" cy="5" r="3"/><circle cx="6" cy="19" r="3"/><circle cx="18" cy="19" r="3"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  document.querySelectorAll('[data-icon]').forEach(n => n.innerHTML = icon(n.dataset.icon));
  $('compass-icon').innerHTML = icon('compass');

  const defs = el('defs');
  function gradient(id, stops, attrs = {}) { const n = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1, ...attrs }, defs); stops.forEach(([offset, color]) => el('stop', { offset, 'stop-color': color }, n)); return n; }
  const skyGradient = gradient('sky-gradient', [['0%', '#101a35'], ['57%', '#293450'], ['100%', '#aa7279']]);
  const riverGradient = gradient('river-gradient', [['0%', '#334962'], ['100%', '#142e43']]);
  gradient('lamp-gradient', [['0%', '#f9dca6'], ['100%', '#f9dca600']]);
  const beamGradient = gradient('beam-gradient', [['0%', '#8ddcc800'], ['100%', '#8ddcc8']]);
  world.setAttribute('shape-rendering', 'crispEdges');
  rect(-900, 0, 3400, 850, 'url(#sky-gradient)');
  const stars = group('stars');
  for (let i = 0; i < 95; i++) rect(range(20, 1580), range(15, 300), i % 8 ? 2 : 3, i % 8 ? 2 : 3, '#d9e4d6', stars, { opacity: range(.15, .7) });
  const moon = group('moon');
  poly('1232,59 1264,59 1264,65 1274,65 1274,75 1280,75 1280,102 1274,102 1274,113 1264,113 1264,119 1232,119 1232,113 1221,113 1221,102 1215,102 1215,75 1221,75 1221,65 1232,65', '#e4e7c2', moon);
  rect(1226, 75, 8, 8, '#cfd7b7', moon); rect(1254, 102, 12, 5, '#cfd7b7', moon);
  const sun = group('sun'); rect(1222, 69, 54, 42, '#ffe6aa', sun); rect(1228, 63, 42, 54, '#ffe6aa', sun);
  const clouds = group('clouds');
  for (let i = 0; i < 8; i++) { const g = group('cloud-' + i, clouds, { opacity: .13 }); const x = range(-100, 1550), y = range(50, 270); rect(x, y, range(70, 160), 7, '#ddcee2', g); rect(x + 25, y - 6, range(30, 80), 6, '#ddcee2', g); }
  const plane = group('plane');
  poly('0,8 25,8 14,0 22,0 39,8 56,8 60,12 40,14 22,24 14,24 25,14 4,14', '#bacad3', plane); rect(-82, 10, 72, 2, '#bdccdc', plane, { opacity: .22 });
  // Hand-authored stroke grids become individual SVG drones: no font sampling or bitmap canvas.
  const droneGlyphs = {
    '我': [[[1,3],[7,1]],[[4,2],[4,14],[2,13]],[[0,6],[14,6]],[[0,11],[7,8]],[[9,0],[9,7],[10,11],[13,14],[14,11]],[[13,8],[7,14]],[[12,1],[14,3]]],
    '上': [[[7,0],[7,14]],[[7,6],[13,6]],[[0,14],[14,14]]],
    '海': [[[1,1],[3,3]],[[0,6],[2,7]],[[0,14],[3,10]],[[7,0],[5,4]],[[6,2],[14,2]],[[6,5],[13,5],[12,14],[10,14]],[[6,5],[5,12],[14,12]],[[4,8],[15,8]],[[8,6],[9,7]],[[8,10],[9,11]]],
    '外': [[[5,0],[2,5]],[[4,3],[8,3],[7,7],[5,11],[1,14]],[[3,6],[6,8]],[[10,0],[10,14]],[[11,6],[14,9]]],
    '滩': [[[0,1],[2,3]],[[0,6],[2,7]],[[0,14],[2,10]],[[3,3],[7,3],[6,8],[3,13]],[[3,6],[7,13]],[[10,0],[8,5]],[[9,4],[9,14],[15,14]],[[12,1],[13,2]],[[9,4],[15,4]],[[9,7],[15,7]],[[9,10],[15,10]],[[12,4],[12,14]]],
    '晚': [[[0,3],[3,3],[3,12],[0,12],[0,3]],[[0,7],[3,7]],[[8,0],[5,4]],[[7,2],[12,2],[10,5]],[[6,5],[14,5],[14,9],[6,9],[6,5]],[[10,5],[9,10],[7,13],[4,14]],[[11,10],[11,14],[15,14],[15,12]]],
    '安': [[[7,0],[8,1]],[[1,5],[1,3],[14,3],[14,5]],[[0,7],[15,7]],[[7,5],[4,10],[14,14]],[[12,7],[10,11],[6,13],[1,14]]],
    '♥': [[[7,4],[4,1],[1,1],[0,4],[1,7],[7,14],[14,7],[15,4],[14,1],[11,1],[7,4]],[[4,4],[3,5],[7,10],[12,5],[11,4]]],
    '·': [[[7,7],[8,7]],[[7,8],[8,8]]]
  };
  function strokePoints(strokes, step = 1) {
    const points = new Map();
    for (const stroke of strokes) for (let j = 1; j < stroke.length; j++) {
      const [ax, ay] = stroke[j - 1], [bx, by] = stroke[j];
      const count = Math.ceil(Math.hypot(bx - ax, by - ay) / step);
      for (let k = 0; k <= count; k++) {
        const x = Math.round((ax + (bx - ax) * k / Math.max(1, count)) * 2) / 2;
        const y = Math.round((ay + (by - ay) * k / Math.max(1, count)) * 2) / 2;
        points.set(x + ',' + y, { x, y });
      }
    }
    return [...points.values()].sort((a, b) => a.x - b.x || a.y - b.y);
  }
  function droneText(text, color) {
    const chars = [...text], spacing = chars.length > 4 ? 3.7 : 4.5;
    const left = 650 - ((chars.length - 1) * 19 + 15) * spacing / 2;
    return chars.flatMap((char, index) => strokePoints(droneGlyphs[char]).map(p => ({
      x: left + (index * 19 + p.x) * spacing,
      y: 139 + p.y * spacing,
      color: char === '♥' ? '#ff9bb8' : color
    })));
  }
  const pearlStrokes = [
    [[24,0],[24,8]],[[22,9],[26,9],[28,11],[28,14],[26,16],[22,16],[20,14],[20,11],[22,9]],
    [[23,16],[23,28]],[[25,16],[25,28]],
    [[19,28],[29,28],[33,32],[33,37],[29,41],[19,41],[15,37],[15,32],[19,28]],
    [[15,34],[33,34]],[[21,42],[15,53]],[[27,42],[33,53]],[[24,42],[24,53]],
    [[4,56],[11,54],[18,56],[25,54],[32,56],[39,54],[46,56]]
  ];
  const droneFormations = [
    { name: '我 ♥ 上海', note: '把心意，写进上海的夜空', points: droneText('我♥上海', '#b4eee4') },
    { name: '云端东方明珠', note: '一江星光，一座不眠的城', points: strokePoints(pearlStrokes, 1.5).map(p => ({ x: 650 + (p.x - 24) * 3, y: 113 + p.y * 2, color: p.y >= 54 ? '#a4e4e3' : '#f2c6e8' })) },
    { name: '外滩 · 晚安', note: '愿每个晚归的人，都有灯等候', points: droneText('外滩·晚安', '#f5d7a2') }
  ];
  const droneShow = group('drone-show', world, { 'aria-label': '无人机灯光表演：我爱上海、东方明珠、外滩晚安' });
  label('云 端 来 信  /  DRONE BALLET', 650, 96, droneShow, { 'text-anchor': 'middle', 'font-size': 9, fill: '#b5d0d9', 'letter-spacing': 2 });
  const droneFleet = group('drone-fleet', droneShow);
  const droneCaption = label(droneFormations[0].note, 650, 246, droneShow, { 'text-anchor': 'middle', 'font-size': 10, fill: '#c1d4d8', 'letter-spacing': 2 });
  const droneCues = droneFormations.map((_, i) => rect(624 + i * 20, 259, 13, 2, '#c3e4df', droneShow));
  const droneCount = Math.max(...droneFormations.map(f => f.points.length));
  const drones = Array.from({ length: droneCount }, (_, i) => {
    const g = group('drone-' + i, droneFleet);
    rect(-5, -5, 10, 10, 'currentColor', g, { opacity: .055 });
    rect(-2.5, -2.5, 5, 5, 'currentColor', g, { opacity: .22 });
    rect(-1.2, -1.2, 2.4, 2.4, 'currentColor', g);
    return g;
  });
  let droneTime = 0, droneCue = -1;
  function animateDrones(dt, reduced) {
    if (!state.night || !state.drones) return;
    if (!reduced) droneTime += dt;
    const cycle = 14, hold = 9, index = Math.floor(droneTime / cycle) % droneFormations.length;
    const phase = droneTime % cycle, u = clamp((phase - hold) / (cycle - hold), 0, 1);
    const eased = u * u * (3 - 2 * u), next = (index + 1) % droneFormations.length;
    const from = droneFormations[index], to = droneFormations[next];
    if (droneCue !== index) {
      droneCue = index;
      droneCaption.textContent = from.note;
      droneShow.setAttribute('data-formation', from.name);
      droneCues.forEach((n, i) => n.setAttribute('opacity', i === index ? '.9' : '.2'));
    }
    droneCaption.setAttribute('opacity', String(1 - Math.sin(u * Math.PI) * .65));
    drones.forEach((node, i) => {
      const a = from.points[i], b = to.points[i];
      const start = a || { x: 500 + (i % 50) * 6, y: 281, color: b?.color || '#b4eee4' };
      const end = b || { x: 500 + (i % 50) * 6, y: 281, color: start.color };
      const opacity = (a ? 1 - eased : 0) + (b ? eased : 0);
      node.style.display = opacity < .01 ? 'none' : '';
      if (opacity < .01) return;
      const arc = Math.sin(u * Math.PI) * (12 + (i % 9) * 3);
      const drift = reduced ? 0 : Math.sin(droneTime * .7 + i * .4) * .35;
      node.setAttribute('transform', `translate(${(start.x + (end.x - start.x) * eased).toFixed(1)} ${(start.y + (end.y - start.y) * eased - arc + drift).toFixed(1)})`);
      node.setAttribute('opacity', (opacity * (reduced ? 1 : .91 + Math.sin(droneTime * 1.3 + i) * .09)).toFixed(2));
      node.style.color = u < .5 ? start.color : end.color;
    });
  }
  const distant = group('distant-skyline');
  for (let x = 0; x < 1600; x += range(21, 42)) { const h = range(25, 94); rect(x, 462 - h, range(18, 33), h, 'var(--tower-back)', distant); }
  const laser = group('light-show');
  const beams = [];
  for (let i = 0; i < 7; i++) beams.push(poly(`${730 + i * 120},458 ${560 + i * 130},95 ${600 + i * 130},95`, 'url(#beam-gradient)', laser, { opacity: .09 }));
  const skyline = group('skyline');
  function windows(x, y, cols, rows, dx, dy, parent, w = 4, h = 6) { for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) rect(x + col * dx, y + row * dy, w, h, random() > .25 ? 'var(--window)' : 'var(--window-dim)', parent, { opacity: range(.35, .95) }); }
  // Pudong: every silhouette is composed of native SVG geometry.
  for (let i = 0; i < 20; i++) { const x = 555 + i * 54, h = range(40, 135); rect(x, 461 - h, 36, h, i % 2 ? 'var(--tower-back)' : 'var(--tower-side)', skyline); windows(x + 5, 470 - h, 4, Math.floor(h / 13) - 1, 8, 12, skyline, 3, 4); }
  const pearl = group('oriental-pearl', skyline);
  el('title', {}, pearl).textContent = '东方明珠';
  poly('818,461 827,461 859,351 850,349', 'var(--tower-trim)', pearl); poly('874,349 884,349 915,461 902,461', 'var(--tower-trim)', pearl);
  rect(858, 197, 14, 256, 'var(--tower-body)', pearl); rect(860, 134, 6, 69, 'var(--tower-trim)', pearl); rect(862, 116, 2, 20, '#d1a8a5', pearl);
  function pixelOrb(cx, cy, w, h, parent) { poly(`${cx-w/2+10},${cy-h/2} ${cx+w/2-10},${cy-h/2} ${cx+w/2-10},${cy-h/2+6} ${cx+w/2},${cy-h/2+6} ${cx+w/2},${cy+h/2-6} ${cx+w/2-10},${cy+h/2-6} ${cx+w/2-10},${cy+h/2} ${cx-w/2+10},${cy+h/2} ${cx-w/2+10},${cy+h/2-6} ${cx-w/2},${cy+h/2-6} ${cx-w/2},${cy-h/2+6} ${cx-w/2+10},${cy-h/2+6}`, 'var(--pearl)', parent); rect(cx-w/2, cy-3, w, 6, '#e7bac1', parent); for (let x = cx-w/2+9; x < cx+w/2-4; x += 9) { rect(x, cy-h/2+5, 3, h-10, '#b1c4da', parent, { opacity: .7 }); } }
  pixelOrb(865, 205, 38, 29, pearl); pixelOrb(865, 323, 78, 54, pearl); pixelOrb(865, 413, 28, 22, pearl);
  rect(855, 234, 20, 53, 'var(--tower-side)', pearl); windows(859, 238, 2, 8, 8, 6, pearl, 3, 2); rect(807, 457, 117, 7, 'var(--tower-trim)', pearl);
  const jinmao = group('jin-mao', skyline); el('title', {}, jinmao).textContent = '金茂大厦';
  rect(1050, 193, 3, 32, 'var(--tower-trim)', jinmao);
  for (let i = 0; i < 11; i++) { const w = 14 + i * 5.6, y = 221 + i * 21; rect(1051-w/2, y, w, 24, 'var(--tower-body)', jinmao); rect(1048-w/2, y, w+6, 3, 'var(--tower-trim)', jinmao); windows(1053-w/2, y+6, Math.max(1, Math.floor(w/8)), 2, 7, 8, jinmao, 2, 4); }
  const center = group('shanghai-tower', skyline); el('title', {}, center).textContent = '上海中心大厦';
  poly('1155,455 1155,173 1160,173 1160,131 1165,131 1165,107 1173,107 1173,92 1199,88 1213,98 1222,122 1229,162 1234,228 1234,455', 'var(--tower-body)', center);
  poly('1199,94 1210,105 1219,144 1224,219 1224,455 1205,455 1207,232 1203,162', 'var(--tower-side)', center);
  for (let y = 120; y < 449; y += 10) { const inset = y < 170 ? (170-y)/4 : 0; rect(1161+inset, y, 62-inset, 2, 'var(--tower-trim)', center, { opacity: .52 }); }
  for (let i = 0; i < 5; i++) poly(`${1171+i*10},130 ${1176+i*10},130 ${1163+i*12},450 ${1161+i*12},450`, '#adc5cb', center, { opacity: .25 });
  const swfc = group('world-financial-center', skyline); el('title', {}, swfc).textContent = '上海环球金融中心';
  poly('1320,453 1325,172 1386,172 1400,453', 'var(--tower-body)', swfc);
  poly('1363,172 1386,172 1400,453 1377,453', 'var(--tower-side)', swfc);
  poly('1337,183 1375,183 1370,211 1340,211', '#3a405a', swfc);
  line(1325,172,1320,453,'var(--tower-trim)',3,swfc); line(1386,172,1400,453,'var(--tower-trim)',3,swfc); line(1325,172,1386,172,'var(--tower-trim)',3,swfc);
  for (let y=227; y<449; y+=10) { rect(1328,y,59+(y-227)/40,2,'var(--tower-trim)',swfc,{opacity:.48}); }
  for(let x=1336;x<1385;x+=10) line(x,223,x+3,449,'#b6ccd5',1,swfc,{opacity:.25});
  const rightTower = group('aurora', skyline); rect(1455, 317, 65, 142, 'var(--tower-body)', rightTower); rect(1448, 329, 79, 5, 'var(--tower-trim)', rightTower); windows(1462, 343, 7, 12, 8, 9, rightTower, 3, 4); label('SHANGHAI',1488,326,rightTower,{'text-anchor':'middle','font-size':8,fill:'#e3c9a0'});
  // Historic west-bank architecture and Customs House clock.
  const bund = group('historic-bund');
  function historic(x, y, w, h, levels, cols) { const g = group('facade-'+x,bund); rect(x,y,w,h,'var(--stone)',g); rect(x+w-9,y,9,h,'var(--stone-shadow)',g); rect(x-4,y,w+8,5,'var(--stone-edge)',g); rect(x-2,y+9,w+4,4,'var(--stone-shadow)',g); rect(x-5,y+h-9,w+10,9,'var(--stone-edge)',g); for(let r=0;r<levels;r++){const yy=y+21+r*(h-30)/levels; rect(x,yy+18,w,3,'var(--stone-shadow)',g);for(let c=0;c<cols;c++){const xx=x+9+c*(w-12)/cols;rect(xx,yy,8,15,'var(--historic-window)',g);rect(xx-2,yy-3,12,3,'var(--stone-edge)',g);rect(xx+3,yy,1,15,'var(--stone-shadow)',g);}}for(let xx=x+4;xx<x+w;xx+=w/cols)rect(xx,y+15,3,h-27,'var(--stone-edge)',g); return g; }
  historic(-18,339,109,138,4,7); historic(99,361,111,116,3,7);
  const hsbc=historic(218,345,125,135,4,8); rect(230,334,100,8,'var(--stone-edge)',hsbc); rect(262,301,40,36,'var(--stone)',hsbc); poly('257,303 263,290 272,284 289,284 299,291 306,303','#6d8a88',hsbc);rect(279,268,3,18,'#9fb2a5',hsbc);
  const customs=historic(350,342,133,139,4,9);
  rect(382,291,66,52,'var(--stone)',customs);rect(389,239,52,54,'var(--stone)',customs);rect(385,288,60,6,'var(--stone-edge)',customs);rect(384,237,62,6,'var(--stone-edge)',customs);rect(395,216,40,22,'var(--stone)',customs);rect(391,214,48,5,'var(--stone-edge)',customs);poly('395,215 401,202 429,202 435,215','var(--stone-shadow)',customs);rect(412,186,5,17,'var(--stone-edge)',customs);
  rect(399,250,32,32,'#dfcda0',customs); rect(401,252,28,28,'#1e3741',customs);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;rect(414+Math.sin(a)*11,265-Math.cos(a)*11,2,2,'#eddcac',customs);}
  const hourHand=line(415,266,415,259,'#f1ddad',2,customs);const minuteHand=line(415,266,415,255,'#f1ddad',1.6,customs);const secondHand=line(415,269,415,255,'#d08478',1,customs);rect(413,264,4,4,'#f1ddad',customs);
  windows(393,302,5,2,10,13,customs,4,8);
  historic(492,375,85,108,3,6);
  rect(0,478,600,10,'var(--stone-shadow)',bund);rect(0,485,615,6,'#b7a078',bund);
  const shore = group('far-shore'); rect(570,463,1030,10,'#31464d',shore);rect(580,468,1020,3,'#bbaa84',shore);for(let x=585;x<1600;x+=17)rect(x,464,3,3,'#e9d3a0',shore);

  const water=group('river');rect(-900,491,3400,196,'url(#river-gradient)',water);rect(610,475,990,20,'url(#river-gradient)',water);
  const reflection=group('reflections',water);const reflectionStrips=[];
  [{x:280,c:'#c3a87b',w:95},{x:420,c:'#e8c68c',w:80},{x:864,c:'#de9ca9',w:66},{x:1052,c:'#cbd3b4',w:40},{x:1193,c:'#91c8c7',w:72},{x:1360,c:'#8bbec7',w:56},{x:1487,c:'#d1b3c2',w:50}].forEach(({x,c,w})=>{for(let i=0;i<25;i++){const y=489+i*7.1,ww=range(w*.18,w)*(1+i/34);const xx=x-ww/2+range(-13,13);const n=rect(xx,y,ww,range(2,4),c,reflection,{opacity:range(.12,.45)*(1-i/34)});reflectionStrips.push({node:n,x:xx,phase:range(0,7)});}});
  const ripples=group('river-texture',water);const waveNodes=[];
  for(let i=0;i<165;i++){const x=range(-40,1610),y=range(494,684);const n=rect(x,y,range(8,46),i%3?1:2,'var(--wave)',ripples,{opacity:range(.1,.45)});waveNodes.push({node:n,x,phase:range(0,6)});}
  const boats=group('boats');
  function boat(kind,x,y,speed,scale){const g=group(kind,boats);const reflection=group(kind+'-wake',g);for(let i=0;i<5;i++)rect(-10-i*11,15+i*5,116+i*10,2,'#aec7cb',reflection,{opacity:.2-i*.03});if(kind==='cruise'){poly('-5,4 134,4 122,21 8,21','#e0d4b4',g);rect(10,-15,111,20,'#d1cbb8',g);rect(21,-30,86,15,'#e6d9ba',g);rect(32,-38,57,8,'#b2bbb2',g);rect(65,-48,3,12,'#c5cbb9',g);rect(3,1,125,3,'#d49387',g);for(let i=0;i<10;i++)rect(18+i*10,-10,7,8,'#f5da99',g);for(let i=0;i<7;i++)rect(29+i*10,-26,6,7,'#edcf8a',g);rect(9,8,116,2,'#576b6e',g);rect(127,-2,3,3,'#e68d80',g);}else{poly('0,0 154,0 139,18 12,18','#384c55',g);rect(5,-7,119,7,'#b27e69',g);['#9a775e','#677c78','#a78470','#6b8998'].forEach((c,i)=>{rect(13+i*25,-23,23,17,c,g);for(let j=0;j<4;j++)rect(16+i*25+j*5,-21,1,13,'#263d4666',g)});rect(118,-27,23,26,'#b3b9a7',g);rect(121,-35,18,8,'#d8cbb0',g);rect(122,-23,6,5,'#3c5963',g);rect(130,-23,6,5,'#3c5963',g);rect(130,-46,3,12,'#9ca99d',g);rect(135,-38,5,3,'#ce9a81',g);}return{node:g,x,y,speed,scale};}
  const movingBoats=[boat('cruise',720,573,20,1),boat('cargo',1370,521,-12,.63),boat('ferry',190,618,15,.73)];
  // The promenade has a retaining wall, separate steps, balustrade and paving.
  const promenade=group('promenade');
  poly('0,671 1600,639 1600,850 0,850','var(--paving)',promenade);
  poly('0,671 1600,639 1600,652 0,684','var(--wall-top)',promenade);
  poly('0,684 1600,652 1600,667 0,699','var(--wall)',promenade);
  for(let x=-30;x<1650;x+=57)line(x,685-x*.02,x,699-x*.02,'#3b4d58',2,promenade);
  poly('0,701 1600,669 1600,674 0,706','var(--step-light)',promenade);
  poly('0,712 1600,680 1600,685 0,717','var(--step-light)',promenade,{opacity:.65});
  for(let row=0;row<8;row++){const y=710+row*23;line(0,y,1600,y-32,'var(--paving-line)',1,promenade);for(let x=(row%2)*45;x<1600;x+=90)line(x,y-x*.02,x+9,y+23-x*.02,'var(--paving-line)',1,promenade);}
  const railing=group('railing');
  for(let x=0;x<1630;x+=29){let y=660-x*.02;rect(x,y-28,3,29,'var(--rail)',railing);rect(x-1,y-29,5,4,'var(--rail-highlight)',railing);}
  line(0,631,1600,599,'var(--rail-highlight)',4,railing);line(0,647,1600,615,'var(--rail)',2,railing);
  const spots=[{x:360,y:764,name:'钟楼回响',detail:'江海关的钟声，陪伴这座城市近一个世纪。'},{x:670,y:744,name:'轮渡来信',detail:'黄浦江上的每一次来往，都有自己的故事。'},{x:1030,y:736,name:'天际线收藏',detail:'东方明珠、金茂、环球金融中心与上海中心，同框。'},{x:1370,y:746,name:'江风晚安',detail:'走到这里，今天的步数也有了温度。'}];
  let visited=new Set();try{visited=new Set(JSON.parse(localStorage.getItem('bund-visits')||'[]').filter(i=>Number.isInteger(i)&&i>=0&&i<4));}catch{}
  const markers=group('viewpoints');
  spots.forEach((s,i)=>{const g=group('spot-'+i,markers);el('ellipse',{cx:s.x,cy:s.y,rx:21,ry:7,fill:'none',stroke:'#bfd4b5','stroke-width':1,'stroke-dasharray':'3 4',opacity:.45},g);poly(`${s.x},${s.y-8} ${s.x+4},${s.y-4} ${s.x},${s.y} ${s.x-4},${s.y-4}`,'#bfd4b5',g);s.node=g;});
  const props=group('street-furniture');
  function bench(x,y){const g=group('bench-'+x,props);rect(x,y,54,5,'#9e8771',g);rect(x,y+7,54,4,'#887766',g);rect(x-2,y+14,58,5,'#b39a7d',g);rect(x+5,y+19,4,12,'#253c46',g);rect(x+44,y+19,4,12,'#253c46',g);rect(x+3,y-3,3,21,'#31454b',g);rect(x+47,y-3,3,21,'#31454b',g);}
  bench(154,702);bench(580,693);bench(1140,687);bench(1470,678);
  function planter(x,y){rect(x,y,39,22,'#455354',props);rect(x-3,y-3,45,5,'#77847b',props);for(let i=0;i<8;i++)rect(x+range(-4,31),y-range(8,23),range(7,14),range(9,17),'var(--leaf)',props);}
  planter(233,721);planter(1234,701);
  const lampGlows=[];
  for(let x=75;x<1630;x+=260){const y=664-x*.02,g=group('lamp-'+x,props);const glow=poly(`${x-15},${y-108} ${x+15},${y-108} ${x+77},${y+41} ${x-77},${y+41}`,'url(#lamp-gradient)',g,{opacity:.06});lampGlows.push(glow);el('ellipse',{cx:x,cy:y+28,rx:66,ry:12,fill:'#f6d997',opacity:.07},g);rect(x-6,y-2,12,7,'#253b46',g);rect(x-3,y-106,6,105,'var(--lamp-post)',g);rect(x-21,y-106,42,4,'var(--lamp-post)',g);rect(x-23,y-107,3,14,'var(--lamp-post)',g);rect(x+20,y-107,3,14,'var(--lamp-post)',g);for(let dx of [-21,21]){rect(x+dx-5,y-97,10,15,'var(--lamp)',g);rect(x+dx-7,y-100,14,4,'#344750',g);rect(x+dx-6,y-82,12,3,'#344750',g);}rect(x-5,y-113,10,6,'#536267',g);}
  const peopleLayer=group('pedestrians');
  function person(id,color,isPlayer=false){const g=group(id,peopleLayer);el('ellipse',{cx:0,cy:0,rx:11,ry:3,fill:'#061926',opacity:.3},g);const body=group(id+'-body',g);rect(-5,-37,10,11,'#dbb392',body);rect(-6,-40,12,5,isPlayer?'#ece0b9':'#343643',body);rect(-6,-36,3,5,'#383942',body);rect(-7,-25,14,15,color,body);rect(-10,-24,4,14,color,body);rect(7,-24,4,12,color,body);rect(-10,-11,4,4,'#d6ad91',body);rect(7,-13,4,4,'#d6ad91',body);if(isPlayer){rect(-7,-23,5,12,'#af8765',body);rect(-7,-24,3,3,'#dbbc90',body);rect(3,-36,2,2,'#273744',body);}const leg1=rect(-5,-10,4,9,'#263643',g);const leg2=rect(2,-10,4,9,'#263643',g);const shoe1=rect(-6,-2,6,3,'#c9cbbf',g);const shoe2=rect(2,-2,6,3,'#c9cbbf',g);const umbrella=group(id+'-umbrella',g);line(2,-22,2,-60,'#d0bda5',2,umbrella);poly('-23,-48 -23,-54 -17,-54 -17,-60 -8,-60 -8,-64 10,-64 10,-60 19,-60 19,-54 25,-54 25,-48',isPlayer?'#cdb481':color,umbrella);rect(-22,-49,47,3,'#d8c5a2',umbrella,{opacity:.6});if(isPlayer){label('你',0,-53,g,{'text-anchor':'middle','font-size':10,fill:'#ecedce',class:'player-tag'});poly('-3,-47 3,-47 0,-43','#e4e7c2',g,{class:'player-tag'});}return{node:g,body,leg1,leg2,shoe1,shoe2,umbrella};}
  const npcs=[];const coats=['#af9689','#778c9e','#bab69b','#af7a7c','#7c9f91','#b69d74'];
  for(let i=0;i<19;i++){const p=person('walker-'+i,coats[i%coats.length]);Object.assign(p,{x:range(-20,1620),y:range(708,799),speed:range(8,21)*(i%2?1:-1),phase:range(0,7)});npcs.push(p);}
  const player=Object.assign(person('player','#b9cbaa',true),{x:800,y:761,dir:1,moving:false,target:null});
  const destination=group('destination');el('ellipse',{cx:0,cy:0,rx:12,ry:4,fill:'none',stroke:'#e2e5bd','stroke-width':1},destination);line(-5,0,5,0,'#e2e5bd',1,destination);line(0,-3,0,3,'#e2e5bd',1,destination);destination.style.display='none';
  const rainLayer=group('rain');const rainNodes=[];for(let i=0;i<150;i++){const n=line(0,0,-5,13,'#acc9d8',1,rainLayer,{opacity:range(.14,.42)});rainNodes.push({node:n,x:range(-50,1650),y:range(-30,850),speed:range(440,670)});}
  const rainRipples=group('rain-ripples');const rainRings=[];for(let i=0;i<35;i++){const n=el('ellipse',{cx:range(0,1600),cy:range(505,680),rx:1,ry:1,fill:'none',stroke:'#b5ced3','stroke-width':1},rainRipples);rainRings.push({node:n,phase:random()});}
  const fireworksLayer=group('fireworks');const bursts=[];let nextBurst=1.5;
  function burst(x,y){const g=group('burst-'+Math.round(performance.now()),fireworksLayer);const color=['#dfb89c','#d6dba9','#c4abd5','#9fcfcb'][Math.floor(random()*4)];const particles=[];for(let i=0;i<34;i++){const a=i/34*Math.PI*2;const n=rect(0,0,i%3?3:4,i%3?3:4,color,g);particles.push({node:n,vx:Math.cos(a)*range(23,66),vy:Math.sin(a)*range(23,66)});}bursts.push({node:g,x,y,age:0,particles});}
  let toastTimer;function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3800);}
  function progress(){ $('progress').textContent=visited.size+' / 4';spots.forEach((s,i)=>s.node.setAttribute('opacity',visited.has(i)?'.28':'1')); }
  let nearby=-1;
  function collect(){if(nearby<0)return;const s=spots[nearby];if(visited.has(nearby)){toast(s.name+' · '+s.detail);return;}visited.add(nearby);try{localStorage.setItem('bund-visits',JSON.stringify([...visited]));}catch{}progress();toast(visited.size===4?'四处风景已收藏。今晚的外滩，记得你来过。':s.name+' · '+s.detail);chime();}
  $('collect').addEventListener('click',collect);
  $('guide').addEventListener('click',()=>{const i=spots.findIndex((_,j)=>!visited.has(j));if(i<0){toast('四处风景已收藏，继续自在散步吧。');return;}player.target={x:spots[i].x,y:spots[i].y};toast('下一站：'+spots[i].name+' · 到达光点后按 E 打卡');});
  const nightPalette={'window':'#ecd5a2','window-dim':'#587586','tower-back':'#31445d','tower-body':'#405b70','tower-side':'#2c405c','tower-trim':'#9fb5ba','pearl':'#b88398','stone':'#8c8b80','stone-shadow':'#646e70','stone-edge':'#bab59a','historic-window':'#e0c696','wave':'#96b1c0','paving':'#405461','paving-line':'#506572','wall-top':'#8c9792','wall':'#596a70','step-light':'#84918f','rail':'#394f5c','rail-highlight':'#9aa8a0','lamp-post':'#334b57','lamp':'#f4d49a','leaf':'#4e7063'};
  const dayPalette={'window':'#9dc6cf','window-dim':'#6f959f','tower-back':'#91afb9','tower-body':'#a5c2c9','tower-side':'#7e9da9','tower-trim':'#d9e4de','pearl':'#d8a1ab','stone':'#c6bca4','stone-shadow':'#9e9d91','stone-edge':'#e2d8bd','historic-window':'#587884','wave':'#d7e4db','paving':'#b3b5a7','paving-line':'#c5c5b5','wall-top':'#d8d4bf','wall':'#9caba7','step-light':'#ddd6bf','rail':'#778f93','rail-highlight':'#d2d6c3','lamp-post':'#647b7f','lamp':'#d9ddc7','leaf':'#739879'};
  function applyState(){const palette=state.night?nightPalette:dayPalette;for(const[k,v]of Object.entries(palette))world.style.setProperty('--'+k,v);$('app').classList.toggle('day',!state.night);const colors=state.night?(state.rain?['#152437','#344653','#64777c']:['#101a35','#293450','#aa7279']):(state.rain?['#809ca9','#a2b5b9','#bdc7c3']:['#8db9cf','#b8d4d7','#f0ddbe']);[...skyGradient.children].forEach((n,i)=>n.setAttribute('stop-color',colors[i]));[...riverGradient.children].forEach((n,i)=>n.setAttribute('stop-color',state.night?['#334962','#142e43'][i]:['#83afb9','#5b8e9e'][i]));stars.style.display=state.night&&!state.rain?'':'none';moon.style.display=state.night&&!state.rain?'':'none';sun.style.display=!state.night&&!state.rain?'':'none';plane.style.display=!state.night&&!state.rain?'':'none';laser.style.display=state.night&&state.lights?'':'none';fireworksLayer.style.display=state.night&&state.fireworks?'':'none';droneShow.style.display=state.night&&state.drones?'':'none';reflection.setAttribute('opacity',state.night?1:.18);rainLayer.style.display=rainRipples.style.display=state.rain?'':'none';npcs.forEach(p=>{p.node.style.display=state.crowd?'':'none';p.umbrella.style.display=state.rain?'':'none';});player.umbrella.style.display=state.rain?'':'none';player.node.querySelectorAll('.player-tag').forEach(n=>n.setAttribute('transform',state.rain?'translate(0 -22)':''));lampGlows.forEach(n=>n.setAttribute('opacity',state.night?'.09':'0'));$('weather-icon').innerHTML=icon(state.rain?'rain':state.night?'moon':'sun');$('scene-label').textContent=(state.rain?'微雨':'晴朗')+(state.night?'夜晚':'白昼');$('day-btn').classList.toggle('active',!state.night);$('night-btn').classList.toggle('active',state.night);$('day-btn').setAttribute('aria-pressed',String(!state.night));$('night-btn').setAttribute('aria-pressed',String(state.night));for(const[key,id]of [['crowd','crowd'],['fireworks','fireworks'],['lights','lights'],['drones','drones'],['rain','weather'],['sound','sound']]){$(id+'-btn').classList.toggle('active',state[key]);$(id+'-btn').setAttribute('aria-pressed',String(state[key]));}updateAudio();}
  $('day-btn').addEventListener('click',()=>{state.night=false;$('walk-label').textContent='今日的散步清单';applyState();});$('night-btn').addEventListener('click',()=>{state.night=true;$('walk-label').textContent='今晚的散步清单';applyState();});
  $('drones-btn').addEventListener('click',()=>{state.drones=!state.drones;if(state.drones){droneTime=0;droneCue=-1;}applyState();if(state.drones)toast(state.night?'云端来信 · 无人机灯光表演开始':'无人机表演已开启，切换到夜晚即可欣赏。');});
  for(const[key,id]of [['crowd','crowd'],['fireworks','fireworks'],['lights','lights'],['rain','weather']])$(id+'-btn').addEventListener('click',()=>{state[key]=!state[key];applyState();if(!state.night&&(key==='fireworks'||key==='lights')&&state[key])toast('已开启，切换到夜晚即可欣赏。');});
  $('fullscreen-btn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('app').requestFullscreen)await $('app').requestFullscreen();else toast('当前浏览器不支持全屏，请使用横屏浏览。');}catch{toast('当前浏览器暂时无法进入全屏。');}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreen-btn').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'切换全屏');});
  const timeFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const dateFormatter=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit'});
  function clockTick(now=new Date()){const display=timeFormatter.format(now),[h,m,s]=display.split(':').map(Number);$('clock').textContent=display;$('clock').dateTime=now.toISOString();$('date').textContent=dateFormatter.format(now)+' · UTC+8';hourHand.setAttribute('transform',`rotate(${h%12*30+m*.5+s/120} 415 266)`);minuteHand.setAttribute('transform',`rotate(${m*6+s*.1} 415 266)`);secondHand.setAttribute('transform',`rotate(${s*6} 415 266)`);}
  // Ambient sound is synthesized locally and begins only after the sound button is pressed.
  let audioContext,ambientGain,noiseFilter;
  function initAudio(){if(audioContext)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('audio unsupported');audioContext=new Audio();const buffer=audioContext.createBuffer(1,audioContext.sampleRate*3,audioContext.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const noise=audioContext.createBufferSource();noise.buffer=buffer;noise.loop=true;noiseFilter=audioContext.createBiquadFilter();noiseFilter.type='lowpass';noiseFilter.frequency.value=450;ambientGain=audioContext.createGain();ambientGain.gain.value=0;noise.connect(noiseFilter).connect(ambientGain).connect(audioContext.destination);noise.start();}
  function updateAudio(){if(!audioContext)return;noiseFilter.frequency.setTargetAtTime(state.rain?1500:420,audioContext.currentTime,.4);ambientGain.gain.setTargetAtTime(state.sound?(state.rain?.07:.04):0,audioContext.currentTime,.3);}
  function chime(){if(!state.sound||!audioContext)return;[523.25,659.25,783.99].forEach((f,i)=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),t=audioContext.currentTime+i*.13;oscillator.type='sine';oscillator.frequency.value=f;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.055,t+.02);gain.gain.exponentialRampToValueAtTime(.001,t+.6);oscillator.connect(gain).connect(audioContext.destination);oscillator.start(t);oscillator.stop(t+.65);});}
  $('sound-btn').addEventListener('click',async()=>{try{initAudio();await audioContext.resume();state.sound=!state.sound;$('sound-btn').setAttribute('aria-label',state.sound?'关闭环境音效':'开启环境音效');applyState();if(state.sound)chime();}catch{toast('当前浏览器暂不支持环境音效。');}});
  const movementKeys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d'];
  window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(movementKeys.includes(k)){e.preventDefault();keys.add(k);player.target=null;}if(k==='e'&&!e.repeat)collect();});
  window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
  window.addEventListener('blur',()=>{keys.clear();player.target=null;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(audioContext)audioContext.suspend();}else if(audioContext&&state.sound)audioContext.resume().catch(()=>{});});
  document.querySelectorAll('[data-dir]').forEach(btn=>{btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);keys.add(btn.dataset.dir);player.target=null;});for(const name of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(name,()=>keys.delete(btn.dataset.dir));});
  world.addEventListener('pointerdown',e=>{const matrix=world.getScreenCTM();if(!matrix)return;const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());if(point.y<688-point.x*.02)return;world.focus({preventScroll:true});player.target={x:clamp(point.x,25,1575),y:clamp(point.y,720-point.x*.02,814)};});
  function pose(p,t,moving,dir){p.node.setAttribute('transform',`translate(${Math.round(p.x)} ${Math.round(p.y)})`);const stride=moving?Math.sin(t*10+(p.phase||0))*3:0;p.body.setAttribute('transform',`translate(0 ${moving?Math.round(Math.abs(stride)*-.45):Math.sin(t*1.7)*.4})`);p.leg1.setAttribute('height',9+stride);p.leg2.setAttribute('height',9-stride);p.shoe1.setAttribute('y',-2+stride);p.shoe2.setAttribute('y',-2-stride);}
  let last=performance.now(),elapsed=0,sortTimer=0;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(now){const dt=Math.max(0,Math.min((now-last)/1000,.05));last=now;elapsed+=dt;const t=elapsed;
    let dx=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0),dy=(keys.has('ArrowDown')||keys.has('s')?1:0)-(keys.has('ArrowUp')||keys.has('w')?1:0);
    if(player.target&&!dx&&!dy){const vx=player.target.x-player.x,vy=player.target.y-player.y,d=Math.hypot(vx,vy);if(d<4){player.target=null;}else{dx=vx/d;dy=vy/d;}}
    const length=Math.hypot(dx,dy);player.moving=length>0;if(length){player.x=clamp(player.x+dx/length*112*dt,25,1575);player.y=clamp(player.y+dy/length*112*dt,720-player.x*.02,814);if(dx)player.dir=dx>0?1:-1;}pose(player,t,player.moving,player.dir);
    if(player.target){destination.style.display='';destination.setAttribute('transform',`translate(${player.target.x} ${player.target.y})`);}else destination.style.display='none';
    nearby=spots.findIndex(s=>Math.hypot(s.x-player.x,s.y-player.y)<43);$('interaction').hidden=nearby<0;if(nearby>=0)$('interaction').querySelector('span').textContent=spots[nearby].name+(visited.has(nearby)?' · 已收藏':' · 记录风景');
    if(state.crowd)npcs.forEach(p=>{p.x+=p.speed*dt;if(p.x>1640)p.x=-40;if(p.x< -40)p.x=1640;pose(p,t,true,Math.sign(p.speed));});
    sortTimer+=dt;if(sortTimer>.2){[...npcs,player].sort((a,b)=>a.y-b.y).forEach(p=>peopleLayer.append(p.node));sortTimer=0;}
    for(const b of movingBoats){b.x+=b.speed*dt;if(b.x>1720)b.x=-180;if(b.x< -190)b.x=1700;b.node.setAttribute('transform',`translate(${b.x} ${b.y+Math.sin(t*1.6+b.y)*1.2}) scale(${b.scale})`);}
    if(!reducedMotion){reflectionStrips.forEach(r=>r.node.setAttribute('x',r.x+Math.sin(t*1.4+r.phase)*6));waveNodes.forEach(r=>r.node.setAttribute('x',r.x+Math.sin(t*.7+r.phase)*10));clouds.setAttribute('transform',`translate(${Math.sin(t*.022)*45} 0)`);beams.forEach((b,i)=>b.setAttribute('transform',`rotate(${Math.sin(t*.28+i)*15} ${730+i*120} 458)`));stars.setAttribute('opacity',.75+Math.sin(t*.7)*.15);}
    plane.setAttribute('transform',`translate(${(t*25+420)%1900-160} ${111+Math.sin(t*.08)*10}) scale(.7)`);
    if(state.rain){rainNodes.forEach(r=>{r.y+=r.speed*dt;r.x-=r.speed*.34*dt;if(r.y>860){r.y=-20;r.x=range(-10,1890);}r.node.setAttribute('transform',`translate(${r.x} ${r.y})`);});rainRings.forEach(r=>{const a=(t*.75+r.phase)%1;r.node.setAttribute('rx',a*16);r.node.setAttribute('ry',a*4);r.node.setAttribute('opacity',(1-a)*.4);});}
    animateDrones(dt, reducedMotion);
    if(state.night&&state.fireworks&&!reducedMotion){nextBurst-=dt;if(nextBurst<=0){burst(range(state.drones?960:640,1510),range(65,235));nextBurst=range(3.3,6.8);}}
    for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.age+=dt;if(b.age>2.4){b.node.remove();bursts.splice(i,1);continue;}const a=b.age;b.node.setAttribute('opacity',Math.min(1,(2.4-a)/1.4));for(const p of b.particles){p.node.setAttribute('x',b.x+p.vx*a);p.node.setAttribute('y',b.y+p.vy*a+14*a*a);}}
    const box=world.getBoundingClientRect(),visibleWidth=Math.min(1600,box.width/box.height*850),maxOffset=(1600-visibleWidth)/2;const offset=clamp(player.x-800,-maxOffset,maxOffset);world.setAttribute('viewBox',`${offset.toFixed(1)} 0 1600 850`);
    if(!captureMode)requestAnimationFrame(frame);
  }
  applyState();progress();clockTick();
  if(captureMode){
    const captureEpoch=Date.now();
    window.bundCapture={renderAt(seconds){frame(last+Math.max(0,(seconds-elapsed)*1000));clockTick(new Date(captureEpoch+seconds*1000));}};
    frame(last);
  }else{setInterval(clockTick,1000);requestAnimationFrame(frame);}
})();
