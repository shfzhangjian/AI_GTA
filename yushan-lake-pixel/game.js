(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const world = $('#world');
  const params = new URLSearchParams(location.search);
  const captureMode = params.get('capture') === '1';
  const lettering = window.YUSHAN_LETTERING;
  const state = { night: true, crowd: true, fireworks: true, lights: true, drones: true, rain: false, sound: false };
  const keys = new Set();
  let seed = 199510, time = 0, lastTime = 0, target = null, nearest = null, toastTimer, cameraWidth = 1600;
  const rand = (a = 0, b = 1) => { seed = (seed * 1664525 + 1013904223) >>> 0; return a + seed / 4294967296 * (b - a); };
  const pick = a => a[Math.floor(rand(0, a.length))];
  const rect = (x,y,w,h,c,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" ${extra}/>`;
  const poly = (points,c,extra='') => `<polygon points="${points}" fill="${c}" ${extra}/>`;
  const path = (d,c,extra='') => `<path d="${d}" fill="${c}" ${extra}/>`;
  const text = (x,y,t,c,size=10,extra='') => `<text x="${x}" y="${y}" fill="${c}" font-size="${size}" ${extra}>${t}</text>`;
  const group = (id,content,extra='') => `<g id="${id}" ${extra}>${content}</g>`;
  const shore = x => 698 + Math.sin(x / 315) * 18;
  const player = { x: 715, y: shore(715) + 70, face: 1, moving: false };
  const stops = [
    { x: 290, title:'一桥晚风', location:'湖西 · 望湖亭', description:'绕过树影，走过小桥，湖风正好吹过肩膀。亭檐下的一盏暖灯，把寻常的散步照成了值得记住的夜晚。' },
    { x: 815, title:'把灯火装进口袋', location:'湖心视野 · 观景步道', description:'站在这里，看红色灯火在水面碎成星河。金鹰双塔与湖岸的暖灯遥遥相望，而你拥有整个不必赶路的夜晚。' },
    { x: 1300, title:'诗城的红色夜色', location:'东岸 · 金鹰远眺', description:'高低相伴的金鹰双塔，是雨山湖畔醒目的城市轮廓。红色光带一层层升起，也把一份温柔留在湖面上。' }
  ];
  const collected = new Set();
  try { JSON.parse(localStorage.getItem('yushan-memories') || '[]').forEach(i => { if (Number.isInteger(i) && i >= 0 && i < 3) collected.add(i); }); } catch {}
  const icons = {
    camera:'<path d="M3 7h4l2-3h6l2 3h4v13H3Z"/><circle cx="12" cy="13" r="4"/>',
    film:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3Z"/>',
    drone:'<path d="m8 8 8 8m0-8-8 8M9 10h6v4H9Z"/><circle cx="5" cy="5" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1.5-1.5 2.5M12 17h.01"/>',
    moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/><path d="m17 3 .5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5Z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    people:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3"/>',
    spark:'<path d="M12 2v5m0 10v5M2 12h5m10 0h5M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3m-7 1 2 3-2 3-2-3Z"/>',
    light:'<path d="m12 3-3 7h6l-3-7Zm0 7v11M5 4l2 3m10 0 2-3M3 12h4m10 0h4M5 20l2-3m10 0 2 3"/>',
    rain:'<path d="M5 14a4 4 0 0 1 0-8 6 6 0 0 1 11-1 4.5 4.5 0 0 1 2 9H5ZM7 17l-1 3m6-3-1 3m6-3-1 3"/>',
    sound:'<path d="M3 9h4l5-4v14l-5-4H3ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    keys:'<rect x="8" y="2" width="8" height="8" rx="1"/><rect x="1" y="12" width="7" height="8" rx="1"/><rect x="9" y="12" width="7" height="8" rx="1"/><rect x="17" y="12" width="6" height="8" rx="1"/><path d="m10 7 2-2 2 2m-9 8-2 1 2 1m6-2 1 2 1-2m6 0 2 1-2 1"/>',
    pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>'
  };
  function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`; }
  document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
  function vectorWords(key,x,y,color,extra='') {
    return `<g transform="translate(${x} ${y})" fill="${color}" ${extra}>${lettering[key].glyphs.map((g,i)=>`<path data-glyph="${i}" d="${g.d}" transform="translate(${g.x} 0) scale(${g.scale} ${-g.scale})"/>`).join('')}</g>`;
  }

  let defs = `<defs>
    <linearGradient id="sky" x2="0" y2="1"><stop id="sky-top" stop-color="#0c192c"/><stop id="sky-middle" offset=".62" stop-color="#283749"/><stop id="sky-bottom" offset="1" stop-color="#856069"/></linearGradient>
    <linearGradient id="water" x2="0" y2="1"><stop id="water-top" stop-color="#344956"/><stop id="water-bottom" offset="1" stop-color="#152e3c"/></linearGradient>
    <linearGradient id="red-face" x2="1" y2="0"><stop stop-color="#7b293d"/><stop offset=".4" stop-color="#e44050"/><stop offset=".75" stop-color="#a9213e"/><stop offset="1" stop-color="#571d34"/></linearGradient>
    <linearGradient id="tower-day" x2="1" y2="0"><stop stop-color="#699da9"/><stop offset=".5" stop-color="#bfd0c9"/><stop offset="1" stop-color="#577a8f"/></linearGradient>
    <radialGradient id="lamp-glow"><stop stop-color="#ffd69a" stop-opacity=".22"/><stop offset="1" stop-color="#ffd69a" stop-opacity="0"/></radialGradient>
    <radialGradient id="red-glow"><stop stop-color="#dc334f" stop-opacity=".13"/><stop offset="1" stop-color="#dc334f" stop-opacity="0"/></radialGradient>
    <linearGradient id="reflection-fade" x2="0" y2="1"><stop stop-color="white"/><stop offset="1" stop-color="#181818"/></linearGradient>
    <mask id="fade"><rect x="0" y="470" width="1600" height="250" fill="url(#reflection-fade)"/></mask>
    <mask id="water-strips">${Array.from({length:65},(_,i)=>rect(0,477+i*3.8,1600,i%3===0?2.7:1.7,'white')).join('')}</mask>
    <clipPath id="lake-clip"><path d="M0 473H1600V${shore(1600)} ${Array.from({length:81},(_,i)=>`L${1600-i*20} ${shore(1600-i*20)}`).join('')}Z"/></clipPath>
    <pattern id="paving" width="66" height="24" patternUnits="userSpaceOnUse"><rect width="66" height="24" fill="var(--pavement)"/><path d="M0 0h66M0 24h66M33 0v12M0 12h66M12 12v12" fill="none" stroke="var(--paving-line)" stroke-width="1"/></pattern>
    <style>.night-lit{opacity:var(--night)}.day-lit{opacity:var(--day)}.tower-surface{fill:var(--tower)}.far-window{fill:var(--window)}.show-band{opacity:var(--show)}.umbrella{display:var(--umbrella)}.pixel{shape-rendering:crispEdges}</style>
  </defs>`;
  let sky = rect(0,0,1600,490,'url(#sky)');
  let stars = '';
  for(let i=0;i<115;i++){let x=rand(15,1585),y=rand(20,320),s=pick([1,1,1.5,2]);stars+=rect(x,y,s,s,'#c7d5da',`opacity="${rand(.2,.8)}"`);}
  sky += group('stars',stars,'class="night-lit pixel"');
  sky += group('moon',rect(1327,75,22,30,'#eadcbb')+rect(1321,80,33,20,'#eadcbb')+rect(1317,84,36,12,'#eadcbb')+rect(1319,74,24,18,'#152336'),'class="night-lit pixel"');
  sky += group('sun',rect(1320,80,34,34,'#f6daa2')+rect(1315,87,44,20,'#f6daa2'),'class="day-lit pixel"');
  let clouds = '';
  for(let i=0;i<9;i++){const x=rand(-100,1400),y=rand(72,255);clouds+=group(`cloud-${i}`,rect(0,10,rand(85,180),9,'#a1aab5')+rect(24,3,80,10,'#9da9b4')+rect(43,-4,33,9,'#9da9b4'),`transform="translate(${x} ${y})" opacity=".09"`);}
  sky += group('clouds',clouds,'class="pixel"');
  sky += group('plane',poly('0,6 19,6 28,0 32,0 28,6 42,6 48,3 51,3 49,9 25,10 17,17 13,17 17,10 0,9','#e8e3d9')+rect(-95,7,90,1,'#dde1d8','opacity=".25"'),'class="day-lit pixel"');
  sky += poly('0,402 50,383 84,388 145,340 198,359 243,325 300,360 354,339 414,385 486,377 554,414 630,398 710,370 786,394 865,421 953,392 1020,426 1123,384 1230,369 1340,414 1420,397 1490,369 1600,391 1600,488 0,488','var(--mountain)');
  let city='';
  for(let i=0;i<47;i++){
    const x=i*36+rand(-10,10),w=rand(21,51),h=rand(24,94),y=468-h;
    city+=rect(x,y,w,h,pick(['var(--city-a)','var(--city-b)','var(--city-c)']));
    city+=rect(x+3,y-4,w-6,5,'var(--city-a)');
    for(let wy=y+8;wy<465;wy+=9)for(let wx=x+4;wx<x+w-3;wx+=7)if(rand()>.35)city+=rect(wx,wy,3,3,'var(--window)',`opacity="${rand(.2,.7)}"`);
  }
  function tower(x,y,w,h,id) {
    let out=rect(x+10,y-10,w-25,10,'#52606a')+rect(x+15,y-14,w-35,5,'#657079')+rect(x,y,w,h,'var(--tower)','class="tower-surface"');
    out+=poly(`${x+w-19},${y} ${x+w},${y+9} ${x+w},${y+h} ${x+w-19},${y+h}`,'#281e31','opacity=".6"');
    out+=rect(x+3,y+2,w-25,h-3,'url(#red-face)','class="night-lit"');
    for(let dx=8;dx<w-20;dx+=7)out+=rect(x+dx,y+2,1,h-3,'#f6a7a5','opacity=".27"');
    for(let dy=7;dy<h;dy+=7){
      out+=rect(x+2,y+dy,w-23,1,'#351e32','opacity=".75"');
      out+=rect(x+3,y+dy+1,w-24,1,'#ff7a7c','class="night-lit" opacity=".48"');
    }
    for(let dx=4;dx<17;dx+=5)for(let dy=10;dy<h;dy+=9)out+=rect(x+w-20+dx,y+dy,2,3,'#e8958c','class="night-lit" opacity=".45"');
    out+=rect(x,y,3,h,'#ff797c','class="night-lit"')+rect(x+w-22,y,2,h,'#fc7a79','class="night-lit"');
    out+=rect(x,y,w-20,3,'#ffaaa1','class="night-lit"');
    let bands='';
    for(let i=0;i<7;i++)bands+=poly(`${x+4},${y+34+i*35} ${x+w-24},${y+14+i*35} ${x+w-24},${y+22+i*35} ${x+4},${y+42+i*35}`,'#ffaf98',`opacity="${i%2?.26:.48}"`);
    out+=group(id+'-bands',bands,'class="night-lit"');
    out+=text(x+(w-20)/2,y+25,'金 鹰','#ffe8c7',11,'text-anchor="middle" class="night-lit" letter-spacing="3"');
    out+=rect(x+10,y+h-25,w-40,24,'#3c2433')+rect(x+12,y+h-24,w-44,2,'#dd705e','class="night-lit"');
    return out;
  }
  city += group('golden-eagle',tower(974,138,105,326,'tower-a')+tower(1108,219,92,245,'tower-b'));
  city += rect(917,436,314,36,'var(--mall)')+rect(930,429,288,8,'#63545b')+rect(923,442,301,2,'#dcac80','class="night-lit"');
  for(let x=930;x<1220;x+=12)city+=rect(x,450,7,15,'#d7ae7e','class="night-lit" opacity=".8"');
  city+=text(1067,443,'G O L D E N   E A G L E','#ead0a0',6,'text-anchor="middle"');
  city+=rect(1380,386,66,84,'var(--city-b)')+rect(1386,378,54,8,'var(--city-c)');
  for(let x=1386;x<1441;x+=9)for(let y=391;y<465;y+=9)city+=rect(x,y,4,4,'var(--window)','opacity=".6"');
  let farShore=rect(0,471,1600,9,'#142d31');
  for(let x=0;x<1600;x+=13){let h=rand(12,29);farShore+=rect(x,467-h,rand(11,22),h,pick(['var(--tree-a)','var(--tree-b)','var(--tree-c)']));}
  farShore+=rect(0,477,1600,2,'#ad8b62','class="night-lit" opacity=".7"');
  for(let x=0;x<1600;x+=33)farShore+=rect(x,466,2,11,'#697169')+rect(x-2,465,5,3,'#f8cc89','class="night-lit"');
  function pavilion(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})">`+rect(3,0,3,34,'#905c4e')+rect(40,0,3,34,'#905c4e')+rect(20,0,3,34,'#8a5747')+poly('-12,0 -3,-4 8,-15 21,-21 28,-17 39,-7 55,0','#20343b')+poly('-12,0 55,0 50,4 -8,4','#be9771')+rect(-4,31,53,4,'#ab8871')+rect(7,7,11,12,'#e7b97b','class="night-lit" opacity=".8"')+rect(25,7,11,12,'#e7b97b','class="night-lit" opacity=".8"')+rect(-9,36,61,4,'#456064')+'</g>';}
  farShore+=pavilion(385,447,1.15)+pavilion(725,452,.8);
  farShore+=path('M480 477Q554 420 628 477L615 477Q554 436 493 477Z','#89918a');
  farShore+=path('M480 470Q554 412 628 470','none','stroke="#eac793" stroke-width="2" class="night-lit"');
  for(let i=0;i<14;i++){let x=486+i*10,y=470-26*Math.sin((i/13)*Math.PI);farShore+=rect(x,y-8,2,9,'#b5b29b');}
  let water=rect(0,477,1600,248,'url(#water)');
  water+=`<g clip-path="url(#lake-clip)"><g mask="url(#fade)"><g mask="url(#water-strips)" opacity=".55"><use id="reflection" href="#skyline" transform="translate(0 835) scale(1 -.76)"/></g></g></g>`;
  let ripples='';
  for(let i=0;i<400;i++){let x=rand(0,1600),y=rand(485,725);ripples+=rect(x,y,rand(2,26)*(y-390)/220,1,pick(['#6f8b94','#9d9e9b','#48707a']),`opacity="${rand(.08,.34)}"`);}
  water+=group('water-ripples',ripples,'clip-path="url(#lake-clip)" class="pixel"');
  let glints='';
  for(let i=0;i<120;i++){let y=rand(484,684),spread=(y-450)*.35,x=pick([1020,1150])+rand(-spread,spread);glints+=rect(x,y,rand(4,21),rand(1,2.5),pick(['#f36a72','#db5666','#de977c']),`opacity="${rand(.1,.4)}"`);}
  water+=group('red-glints',glints,'class="night-lit pixel" clip-path="url(#lake-clip)"');
  let bank='';
  const contour=(offset)=>Array.from({length:81},(_,i)=>`${i*20},${shore(i*20)+offset}`).join(' ');
  bank+=poly(`0,900 ${contour(0)} 1600,900`,'#1e3033');
  bank+=poly(`${contour(0)} ${Array.from({length:81},(_,i)=>`${1600-i*20},${shore(1600-i*20)+11}`).join(' ')}`,'#85918a');
  bank+=poly(`0,900 ${contour(12)} 1600,900`,'#3e514f');
  bank+=poly(`0,900 ${contour(21)} 1600,900`,'url(#paving)');
  bank+=poly(`0,900 ${contour(129)} 1600,900`,'var(--grass)');
  bank+=poly(`${contour(122)} ${Array.from({length:81},(_,i)=>`${1600-i*20},${shore(1600-i*20)+130}`).join(' ')}`,'#6d7b69');
  for(let x=0;x<1600;x+=38){let y=shore(x);bank+=rect(x,y+2,1,10,'#485957');}
  // A small stepped landing gives the shoreline a second depth plane.
  bank+=poly('405,705 530,714 573,757 432,748','#6e7d79');
  for(let j=0;j<5;j++)bank+=poly(`${408+j*6},${708+j*8} ${532+j*8},${717+j*8} ${536+j*8},${722+j*8} ${411+j*6},${713+j*8}`,j%2?'#829087':'#586d69');
  let rail='';
  for(let x=0;x<=1600;x+=28){if(x>402&&x<565)continue;let y=shore(x);rail+=rect(x,y-20,3,31,'#34474b')+rect(x-1,y-22,5,3,'#a5a991');if(x<1580&&!(x>380&&x<565)){rail+=path(`M${x} ${y-17}L${x+28} ${shore(x+28)-17}`,'none','stroke="#979f8d" stroke-width="3"');rail+=path(`M${x} ${y-5}L${x+28} ${shore(x+28)-5}`,'none','stroke="#637a76" stroke-width="2"');}}
  bank+=rail;
  function tree(x,y,s=1,willow=false){let out=`<g transform="translate(${x} ${y}) scale(${s})" class="pixel">`+rect(-5,-67,10,68,'#3a3934')+rect(-3,-64,3,60,'#6b5b45');out+=poly('-2,-46 -26,-74 -23,-77 2,-59 20,-80 24,-77 5,-45','#4d4d3d');for(let i=0;i<36;i++){let dx=rand(-44,35),dy=rand(-107,-58);out+=rect(dx,dy,rand(13,30),rand(9,19),pick(['var(--tree-a)','var(--tree-b)','var(--tree-c)']));}if(willow)for(let i=0;i<16;i++){let dx=-44+i*6;out+=path(`M${dx} -85l${rand(-10,10)} 22v${rand(20,55)}`,'none',`stroke="${pick(['#42634d','#577656','#324e41'])}" stroke-width="3" stroke-dasharray="5 2"`);}return out+'</g>';}
  let foreground='';
  for(let x=12;x<1600;x+=14){let y=shore(x)+rand(131,200);foreground+=rect(x,y,rand(6,17),rand(3,7),pick(['#354e3e','#294437','#50603e']));if(rand()>.8)foreground+=rect(x+3,y-3,3,3,pick(['#ac9270','#b18172','#c0aa81']));}
  const lamps=[];
  for(let x=120;x<1600;x+=230){const y=shore(x)+28;lamps.push({x,y});foreground+=`<g class="night-lit"><ellipse cx="${x}" cy="${y+31}" rx="50" ry="15" fill="url(#lamp-glow)"/><circle cx="${x}" cy="${y-63}" r="47" fill="url(#lamp-glow)"/></g>`;foreground+=rect(x-3,y-64,5,65,'#1a2c35')+rect(x-6,y-3,11,5,'#637474')+rect(x-4,y-66,7,3,'#8b8770')+rect(x-7,y-77,13,11,'#b9b99a')+rect(x-5,y-75,9,8,'#ffda96','class="night-lit"')+rect(x-9,y-79,17,3,'#27373a')+rect(x-2,y-83,3,4,'#69736e');}
  function bench(x,y){return rect(x,y-8,55,8,'#997759')+rect(x,y-12,55,3,'#b69470')+rect(x+3,y-23,50,4,'#8a6e54')+rect(x+3,y-18,50,3,'#8a6e54')+rect(x+4,y-21,3,30,'#263839')+rect(x+47,y-21,3,30,'#263839')+rect(x-3,y-5,60,3,'#3e4940');}
  foreground+=bench(350,shore(350)+111)+bench(910,shore(910)+111)+bench(1380,shore(1380)+111);
  foreground+=tree(36,shore(36)+120,1.8,true)+tree(1566,shore(1566)+132,1.65,true);
  foreground+=pavilion(85,shore(85)+65,1.65);
  foreground+=tree(200,shore(200)+155,.9)+tree(1210,shore(1210)+158,.72)+tree(1480,shore(1480)+166,.82);
  let markers='';
  stops.forEach((s,i)=>{markers+=group(`stop-${i}`,path('M0 -12L6 -6 0 0 -6 -6Z','#e8bd86')+rect(-1,3,2,8,'#d9b68a')+text(0,-20,String(i+1).padStart(2,'0'),'#e2c8a0',9,'text-anchor="middle"'),`transform="translate(${s.x} ${shore(s.x)+39})"`);});
  const titleArt=rect(0,-51,18,1,'#c9927e')+vectorWords('intro',30,-47,'#c7ab8e')+vectorWords('title',0,0,'#f1ece1','id="animated-title" aria-label="今夜，走慢一点。"')+vectorWords('subtitle',1,31,'#a3b7c3')+rect(0,44,lettering.title.width,1,'#b99279','opacity=".18"')+rect(0,43,22,2,'#eec5a0','id="title-spark"');
  world.innerHTML=defs+group('sky-layer',sky)+group('skyline',city,'class="pixel"')+group('far-shore',farShore,'class="pixel"')+group('water-layer',water)+group('drone-reflection','','clip-path="url(#lake-clip)" pointer-events="none"')+group('boats','')+group('firework-layer','', 'class="pixel"')+group('drone-layer','','pointer-events="none"')+group('bank',bank,'class="pixel"')+group('markers',markers)+group('actors','', 'class="pixel"')+group('foreground',foreground,'class="pixel"')+group('rain-layer','','pointer-events="none"')+group('cursor-marker','', 'class="pixel"')+group('svg-title',titleArt,'transform="translate(65 114)" pointer-events="none"')+group('film-caption',vectorWords('ending',65,868,'#b7bfb9')+text(1535,868,'YUSHAN LAKE · SVG PIXEL WORLD','#9eaaa7',10,'text-anchor="end" letter-spacing="3"'),'pointer-events="none"');
  const droneCount=lettering.dots.length;
  const droneEls=[],droneReflections=[];
  let droneSvg='',droneMirror='';
  for(let i=0;i<droneCount;i++){
    droneSvg+=`<g><rect x="-3.5" y="-3.5" width="7" height="7" fill="#ec7792" opacity=".13"/><rect x="-1.2" y="-1.2" width="2.4" height="2.4" fill="#ffcfad"/></g>`;
    if(i%3===0)droneMirror+=rect(0,0,4.5,1.3,'#f4a0a0','opacity=".24"');
  }
  $('#drone-layer').innerHTML=group('drone-points',droneSvg)+vectorWords('love',550-lettering.love.width/2,369,'#e7b7a7','id="drone-love-caption"')+text(550,391,`${droneCount} LIGHTS · A LOVE LETTER TO MA’ANSHAN`,'#9d9fad',8,'text-anchor="middle" letter-spacing="2.5"');
  $('#drone-reflection').innerHTML=droneMirror;
  droneEls.push(...$('#drone-points').children);droneReflections.push(...$('#drone-reflection').children);
  const textPoints=lettering.dots.map(([x,y])=>({x:257+x*3.5,y:225+y*3.5}));
  function heartPoint(i){const t=i/droneCount*Math.PI*2;const layer=.58+(i%4)*.14;return{x:550+16*Math.sin(t)**3*9*layer,y:235-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*6.2*layer};}
  const silhouette=[[365,311],[419,311],[419,229],[450,229],[450,209],[480,209],[480,311],[520,311],[520,157],[574,157],[574,311],[616,311],[616,204],[660,204],[660,311],[717,311]];
  const segments=silhouette.slice(1).map((p,i)=>({a:silhouette[i],b:p,length:Math.hypot(p[0]-silhouette[i][0],p[1]-silhouette[i][1])}));
  const totalLength=segments.reduce((sum,s)=>sum+s.length,0);
  function skylinePoint(i){if(i%4===0){const u=(i/4)/(droneCount/4);return{x:345+u*405,y:328+Math.sin(u*Math.PI*4)*6};}let distance=(i/droneCount)*totalLength;for(const s of segments){if(distance<=s.length)return{x:s.a[0]+(s.b[0]-s.a[0])*distance/s.length,y:s.a[1]+(s.b[1]-s.a[1])*distance/s.length};distance-=s.length;}return{x:717,y:311};}
  const formations={text:textPoints,heart:droneEls.map((_,i)=>heartPoint(i)),skyline:droneEls.map((_,i)=>skylinePoint(i)),launch:droneEls.map((_,i)=>({x:220+(i%81)*8.2,y:454+Math.floor(i/81)*1.5}))};
  function updateDrones(){
    const enabled=state.drones&&state.night;
    $('#drone-layer').setAttribute('display',enabled?'inline':'none');$('#drone-reflection').setAttribute('display',enabled?'inline':'none');if(!enabled)return;
    const t=time%48;let from='text',to='text',start=0;
    if(t<5){from='launch';to='text';start=0;}else if(t<14){from=to='text';}else if(t<24){from='text';to='heart';start=14;}else if(t<34){from='heart';to='skyline';start=24;}else{from='skyline';to='text';start=34;}
    $('#drone-layer').setAttribute('data-formation',to);
    const progress=from===to?1:Math.max(0,Math.min(1,(t-start)/4));const mix=progress*progress*(3-2*progress);
    for(let i=0;i<droneCount;i++){
      const a=formations[from][i],b=formations[to][i];const arc=Math.sin(progress*Math.PI)*(i%2?1:-1)*24;
      const x=a.x+(b.x-a.x)*mix+Math.sin(time*.8+i*.7)*.35,y=a.y+(b.y-a.y)*mix+arc;
      droneEls[i].setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      droneEls[i].setAttribute('opacity',String(.72+.28*Math.sin(time*1.6+i*.15)**2));
      if(i%3===0){const r=droneReflections[i/3];r.setAttribute('x',String(x+Math.sin(time*1.7+y*.25)*4));r.setAttribute('y',String(480+(477-y)*.55));r.setAttribute('opacity',String(.10+.12*Math.sin(time*2+i)**2));}
    }
  }
  const titleGlyphs=[...$('#animated-title').children];
  function updateTitle(){
    titleGlyphs.forEach((el,i)=>{const reveal=Math.min(1,Math.max(0,(time-i*.13)/.8));el.setAttribute('opacity',String(.22+.78*reveal));const g=lettering.title.glyphs[i];el.setAttribute('transform',`translate(${g.x} ${Math.sin(time*1.3-i*.4)*.65+(1-reveal)*6}) scale(${g.scale} ${-g.scale})`);});
    $('#title-spark').setAttribute('x',String((time*26)%(lettering.title.width-22)));
  }

  function person(color,skin='#d0ab8d',isPlayer=false) {
    return `<ellipse cx="0" cy="1" rx="8" ry="2.2" fill="#0a1b28" opacity=".4"/>`+
      (isPlayer?path('M-8 4h16','none','stroke="#f0c990" stroke-width="1.5"'):'')+
      group('',rect(-4,-8,3,8,'#263342')+rect(1,-8,3,8,'#263342')+rect(-5,-1,4,2,'#b9b7ac')+rect(1,-1,4,2,'#b9b7ac'),'class="legs"')+
      rect(-5,-19,10,12,color)+rect(-7,-17,2,9,skin)+rect(5,-17,2,9,skin)+rect(-4,-27,8,8,skin)+rect(-5,-29,10,5,isPlayer?'#deac73':'#30313a')+rect(-4,-26,3,2,'#403339')+
      (isPlayer?rect(-4,-18,8,2,'#e7d8b3')+rect(-3,-15,6,5,'#bd725a'):'')+
      `<g class="umbrella">${rect(6,-35,1,24,'#beb9a7')}${poly('-13,-34 -9,-41 -2,-45 7,-47 15,-44 23,-37 25,-33',isPlayer?'#e8b864':color)}${rect(-13,-34,38,2,'#a99c8a')}${rect(6,-49,1,3,'#d3c7aa')}</g>`+
      (isPlayer?text(0,-38,'你','#f1d4a7',6,'text-anchor="middle" class="player-label"'):'');
  }
  const actors = $('#actors');
  const crowd=[];
  for(let i=0;i<29;i++){
    const g=document.createElementNS(NS,'g');g.innerHTML=person(pick(['#bfa790','#8196a7','#be7772','#c7b374','#749d91','#a0a3b7','#d2c8b0']));g.setAttribute('data-npc','');actors.appendChild(g);
    crowd.push({el:g,x:rand(90,1510),lane:rand(44,102),speed:rand(5,17)*(rand()>.5?1:-1),phase:rand(0,10)});
  }
  const playerEl=document.createElementNS(NS,'g');playerEl.id='player';playerEl.innerHTML=person('#e0d2b3','#d8ae8a',true);actors.appendChild(playerEl);
  const boatData=[{x:225,y:543,s:.92,v:11,type:0},{x:950,y:580,s:.65,v:-8,type:1},{x:1420,y:515,s:.5,v:7,type:1}];
  boatData.forEach((b,i)=>{const g=document.createElementNS(NS,'g');g.id=`boat-${i}`;let shape=poly('-52,0 55,0 41,13 -39,13','#a07559')+rect(-40,-5,83,6,'#ded4b2');if(b.type===0){shape+=rect(-30,-24,58,18,'#263d43')+rect(-25,-21,12,12,'#d1ae76')+rect(-9,-21,12,12,'#d1ae76')+rect(7,-21,12,12,'#d1ae76')+poly('-39,-25 -31,-29 -22,-34 20,-34 29,-28 37,-25','#816150')+rect(-36,-25,70,3,'#e0b978')+rect(-31,-3,66,2,'#efb272');}else{shape+=path('M-17 -5v-11h5v-8h5v-4h11v8h-9v17','#d5d8c7')+rect(4,-10,26,7,'#99afb1')+rect(10,-16,5,6,'#b7987c')+rect(11,-21,4,5,'#d0b591');}shape+=rect(-36,17,69,1,'#a6bab4','opacity=".35"')+rect(-29,22,54,1,'#b3b4a2','opacity=".17"');g.innerHTML=shape;$('#boats').appendChild(g);b.el=g;});
  let rainSvg='';const drops=[];for(let i=0;i<135;i++){const x=rand(0,1650),y=rand(-900,900);drops.push({x,y,speed:rand(420,650)});rainSvg+=`<path id="drop-${i}" d="M0 0l-4 13" stroke="#aac8d5" stroke-width="1" opacity="${rand(.15,.4)}"/>`;}
  const rainRings=[];for(let i=0;i<30;i++){rainRings.push({x:rand(0,1600),y:rand(490,685),phase:rand(0,2)});rainSvg+=`<ellipse id="ring-${i}" cx="0" cy="0" rx="1" ry="1" fill="none" stroke="#a6c2c7" stroke-width="1"/>`;}
  $('#rain-layer').innerHTML=rainSvg;drops.forEach((d,i)=>d.el=$(`#drop-${i}`));rainRings.forEach((d,i)=>d.el=$(`#ring-${i}`));
  const fireworkBursts=[];let nextFirework=3.5;
  function burst(x,y){if(!state.night||!state.fireworks)return;const el=document.createElementNS(NS,'g');const color=pick(['#f4b58e','#ed8d8d','#d8c392','#e2c5a9']);let particles=[];for(let i=0;i<32;i++){const angle=i/32*Math.PI*2,speed=rand(25,70);const p=document.createElementNS(NS,'rect');p.setAttribute('width',i%3?2:3);p.setAttribute('height',i%3?2:3);p.setAttribute('fill',color);el.appendChild(p);particles.push({el:p,dx:Math.cos(angle)*speed,dy:Math.sin(angle)*speed});}$('#firework-layer').appendChild(el);fireworkBursts.push({el,particles,x,y,start:time});chime();}
  function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3300);}
  function updateStamps(){document.querySelectorAll('.stamps i').forEach((el,i)=>el.classList.toggle('collected',collected.has(i)));$('#journey-label').textContent=collected.size===3?'三处风景已收集 · 今夜值得珍藏':`发现沿岸 3 处风景 · ${collected.size} / 3`;stops.forEach((_,i)=>$(`#stop-${i}`).setAttribute('opacity',collected.has(i)?'.4':'1'));}
  function collect(){if(nearest===null)return;const i=nearest,s=stops[i];collected.add(i);try{localStorage.setItem('yushan-memories',JSON.stringify([...collected]));}catch{}updateStamps();$('#card-number').textContent=String(i+1).padStart(2,'0');$('#card-title').textContent=s.title;$('#card-description').textContent=s.description;$('#postcard').showModal();keys.clear();target=null;chime();}
  function applyState(){
    const n=state.night;
    const vars={'--night':n?1:0,'--day':n?0:1,'--tower':n?'url(#red-face)':'url(#tower-day)','--mountain':n?'#263743':'#729da1','--city-a':n?'#293e49':'#8fa9ab','--city-b':n?'#354753':'#b3bcb2','--city-c':n?'#3c4b58':'#9bb5bb','--window':n?'#e4b986':'#547e8e','--mall':n?'#52454a':'#b6b8a7','--tree-a':n?'#213f37':'#567a54','--tree-b':n?'#2c4c3d':'#6e915e','--tree-c':n?'#395b43':'#87a86b','--pavement':n?'#566563':'#acb3a3','--paving-line':n?'#62716c':'#959e90','--grass':n?'#233e33':'#698557','--umbrella':state.rain?'inline':'none'};
    for(const [k,v]of Object.entries(vars))world.style.setProperty(k,v);
    const colors=n?(state.rain?['#101b29','#293c4a','#60606b','#334a56','#1c3543']:['#0c192c','#283749','#856069','#344956','#152e3c']):(state.rain?['#667f91','#91a5ab','#bdc0b0','#768f95','#547a80']:['#6dabc5','#a5c9d0','#e7d9b9','#88b4b8','#548e99']);
    ['sky-top','sky-middle','sky-bottom','water-top','water-bottom'].forEach((id,i)=>$('#'+id).setAttribute('stop-color',colors[i]));
    $('#app').classList.toggle('day',!n);$('#app').classList.toggle('rain',state.rain);$('#rain-layer').style.display=state.rain?'':'none';
    crowd.forEach(p=>p.el.style.display=state.crowd?'':'none');
    $('#day-label').textContent=n?'看看白天':'回到夜晚';$('#day-toggle').setAttribute('aria-label',n?'切换到白天':'切换到夜晚');$('#day-toggle [data-icon]').innerHTML=icon(n?'sun':'moon');$('#status-icon').innerHTML=icon(state.rain?'rain':n?'moon':'sun');
    $('#scene-time').textContent=n?'20:16':'15:36';$('#scene-weather').textContent=state.rain?'细雨落湖 · 带伞慢行':n?'夜色晴朗 · 湖风轻拂':'晴空微风 · 湖光正好';$('#weather-label').textContent=state.rain?'雨天':'晴天';
    document.querySelectorAll('[data-toggle]').forEach(b=>{b.classList.toggle('active',state[b.dataset.toggle]);b.setAttribute('aria-pressed',String(state[b.dataset.toggle]));});
    $('.player-label').style.display=state.rain?'none':'';
    if(!n||!state.fireworks){fireworkBursts.forEach(f=>f.el.remove());fireworkBursts.length=0;}
    setSound();
  }
  let audio=null,audioGain=null,rainFilter=null;
  async function setSound(){if(!audio)return;try{if(state.sound){await audio.resume();audioGain.gain.setTargetAtTime(state.rain?.07:.018,audio.currentTime,.5);rainFilter.frequency.setTargetAtTime(state.rain?1800:380,audio.currentTime,.5);}else{audioGain.gain.setTargetAtTime(0,audio.currentTime,.15);}}catch{state.sound=false;toast('此浏览器暂时无法播放音效');}}
  function initAudio(){if(audio)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio unsupported');audio=new Audio();audioGain=audio.createGain();audioGain.gain.value=0;audioGain.connect(audio.destination);rainFilter=audio.createBiquadFilter();rainFilter.type='lowpass';rainFilter.frequency.value=380;rainFilter.connect(audioGain);const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;noise.connect(rainFilter);noise.start();}
  function chime(){if(!state.sound||!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=pick([392,523.25,659.25]);gain.gain.setValueAtTime(.018,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+1.3);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+1.3);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
  document.querySelectorAll('[data-toggle]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.toggle;if(key==='sound'&&!state.sound){try{initAudio();}catch{toast('此浏览器暂时无法播放音效');return;}}state[key]=!state[key];applyState();if(key==='rain')toast(state.rain?'下雨了，湖边的人们撑起了伞。':'雨停了，继续沿湖走走吧。');if(key==='lights')toast(state.lights?'红色灯光秀已开启':'红色常亮，灯光秀已暂停');if(key==='fireworks'&&state.fireworks&&!state.night)toast('烟花已开启，入夜后绽放');}));
  $('#day-toggle').addEventListener('click',()=>{state.night=!state.night;applyState();toast(state.night?'灯火亮起，欢迎回到雨山湖的夜晚。':'天色放晴，抬头看看过境的飞机。');});
  $('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#app').requestFullscreen();}catch{toast('当前窗口不支持全屏，请在独立浏览器打开。');}});
  document.addEventListener('fullscreenchange',()=>{const active=!!document.fullscreenElement;$('#fullscreen').classList.toggle('active',active);$('#fullscreen').setAttribute('aria-label',active?'退出全屏':'进入全屏');$('#fullscreen').lastElementChild.textContent=active?'退出':'全屏';});
  $('#help-button').addEventListener('click',()=>{$('#help-dialog').showModal();keys.clear();target=null;});
  document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  $('#start-walk').addEventListener('click',()=>$('#help-dialog').close());$('#keep-walking').addEventListener('click',()=>$('#postcard').close());
  $('#interaction').addEventListener('click',collect);$('#interaction').setAttribute('role','button');$('#interaction').tabIndex=0;$('#interaction').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();collect();}});
  const keymap={w:'up',W:'up',ArrowUp:'up',s:'down',S:'down',ArrowDown:'down',a:'left',A:'left',ArrowLeft:'left',d:'right',D:'right',ArrowRight:'right'};
  window.addEventListener('keydown',e=>{if($('dialog[open]'))return;if(keymap[e.key]){if(e.target.closest('button'))e.target.blur();e.preventDefault();keys.add(keymap[e.key]);target=null;}if(e.key.toLowerCase()==='e'&&!e.repeat)collect();});
  window.addEventListener('keyup',e=>keys.delete(keymap[e.key]));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{keys.clear();lastTime=0;if(audio){if(document.hidden)audio.suspend();else if(state.sound)audio.resume().catch(()=>{});}});
  document.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.dir);target=null;});['pointerup','pointercancel','lostpointercapture'].forEach(type=>b.addEventListener(type,()=>keys.delete(b.dataset.dir)));});
  world.addEventListener('pointerdown',e=>{if($('dialog[open]'))return;const pt=world.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(world.getScreenCTM().inverse());if(p.y<430){if(state.night&&state.fireworks)burst(p.x,p.y);return;}if(p.y<shore(p.x)-15)return;target={x:Math.max(72,Math.min(1530,p.x)),y:Math.max(shore(p.x)+40,Math.min(shore(p.x)+102,p.y))};$('#cursor-marker').innerHTML=path(`M${target.x-8} ${target.y}h5m6 0h5M${target.x} ${target.y-6}v3m0 6v3`,'none','stroke="#efd59d" stroke-width="2"');});
  function resizeCamera(){const bounds=world.getBoundingClientRect();cameraWidth=window.innerWidth<=760?Math.min(1600,900*bounds.width/bounds.height):1600;}
  new ResizeObserver(resizeCamera).observe($('#world-wrap'));resizeCamera();
  function frame(now,offline=false){
    const dt=offline?Math.max(0,now/1000-time):(lastTime?Math.min((now-lastTime)/1000,.045):0);lastTime=now;if(document.hidden&&!offline){requestAnimationFrame(frame);return;}time+=dt;
    const modal=!!$('dialog[open]');let dx=0,dy=0;
    if(!modal){dx=(keys.has('right')?1:0)-(keys.has('left')?1:0);dy=(keys.has('down')?1:0)-(keys.has('up')?1:0);if(target&&!dx&&!dy){const tx=target.x-player.x,ty=target.y-player.y,len=Math.hypot(tx,ty);if(len<4){target=null;$('#cursor-marker').innerHTML='';}else{dx=tx/len;dy=ty/len;}}}
    const len=Math.hypot(dx,dy);player.moving=len>0;if(len){player.x=Math.max(72,Math.min(1530,player.x+dx/len*94*dt));player.y=Math.max(shore(player.x)+40,Math.min(shore(player.x)+102,player.y+dy/len*94*dt));if(dx)player.face=Math.sign(dx);}
    const cameraX=Math.max(0,Math.min(1600-cameraWidth,player.x-cameraWidth*.5));world.setAttribute('viewBox',`${cameraX.toFixed(1)} 0 ${cameraWidth.toFixed(1)} 900`);
    const droneScale=cameraWidth<1000?Math.min(1,(cameraWidth-70)/650):1;
    $('#drone-layer').setAttribute('transform',cameraWidth<1000?`translate(${cameraX+cameraWidth/2} 260) scale(${droneScale}) translate(-550 -260)`:'');
    $('#drone-reflection').setAttribute('transform',cameraWidth<1000?`translate(${cameraX+cameraWidth/2} 599.35) scale(${droneScale}) translate(-550 -599.35)`:'');
    $('#svg-title').setAttribute('transform',cameraWidth<1000?`translate(${cameraX+32} 110) scale(.76)`:'translate(65 114)');updateTitle();updateDrones();
    const bob=player.moving?Math.sin(time*15)*.7:Math.sin(time*2)*.15;
    playerEl.setAttribute('transform',`translate(${Math.round(player.x)} ${Math.round(player.y)+bob}) scale(${player.face*1.7} 1.7)`);
    const legs=playerEl.querySelector('.legs');legs.setAttribute('transform',`skewX(${player.moving?Math.sin(time*15)*10:0})`);
    playerEl.querySelector('.player-label').setAttribute('transform',`scale(${player.face} 1)`);
    crowd.forEach(p=>{if(!state.crowd)return;p.x+=p.speed*dt;if(p.x>1550)p.x=60;if(p.x<50)p.x=1540;const y=shore(p.x)+p.lane;p.el.setAttribute('transform',`translate(${p.x.toFixed(1)} ${(y+Math.sin(time*8+p.phase)*.6).toFixed(1)}) scale(${Math.sign(p.speed)*1.15} 1.15)`);p.el.querySelector('.legs').setAttribute('transform',`skewX(${Math.sin(time*8+p.phase)*12})`);});
    // Sort silhouettes by their feet so passing pedestrians layer naturally.
    if(Math.floor(time*5)!==Math.floor((time-dt)*5)){[...crowd.map(p=>({el:p.el,y:shore(p.x)+p.lane})),{el:playerEl,y:player.y}].sort((a,b)=>a.y-b.y).forEach(p=>actors.appendChild(p.el));}
    nearest=null;let distance=75;stops.forEach((s,i)=>{const d=Math.hypot(s.x-player.x,shore(s.x)+64-player.y);if(d<distance){distance=d;nearest=i;}});$('#interaction').hidden=nearest===null;$('#location-label').textContent=nearest===null?'湖畔漫步':stops[nearest].location;
    boatData.forEach(b=>{b.x+=b.v*dt;if(b.x>1660)b.x=-65;if(b.x<-65)b.x=1660;b.el.setAttribute('transform',`translate(${b.x.toFixed(1)} ${(b.y+Math.sin(time*1.5+b.y)*1.2).toFixed(1)}) scale(${Math.sign(b.v)*b.s} ${b.s})`);});
    $('#reflection').setAttribute('transform',`translate(${Math.sin(time*.8)*2} 835) scale(1 -.76)`);$('#red-glints').setAttribute('opacity',String(.72+Math.sin(time*1.8)*.16));$('#water-ripples').setAttribute('transform',`translate(${Math.sin(time*.4)*5} 0)`);
    ['tower-a-bands','tower-b-bands'].forEach((id,i)=>{$('#'+id).setAttribute('opacity',state.lights?String(.5+Math.sin(time*.75+i)*.4):'.25');});
    $('#plane').setAttribute('transform',`translate(${(time*28+650)%1850-120} ${123+Math.sin(time*.04)*10})`);
    $('#clouds').setAttribute('transform',`translate(${Math.sin(time*.015)*50} 0)`);
    if(state.night&&state.fireworks&&time>nextFirework){burst(state.drones?rand(1240,1500):rand(370,875),rand(200,320));nextFirework=time+rand(5,10);}
    for(let i=fireworkBursts.length-1;i>=0;i--){const f=fireworkBursts[i],age=time-f.start;if(age>2.7){f.el.remove();fireworkBursts.splice(i,1);continue;}f.el.setAttribute('opacity',String(Math.max(0,1-age/2.7)));f.particles.forEach(p=>{p.el.setAttribute('x',String(Math.round(f.x+p.dx*age)));p.el.setAttribute('y',String(Math.round(f.y+p.dy*age+13*age*age)));});}
    if(state.rain){drops.forEach(d=>{const y=((d.y+time*d.speed)%1100+1100)%1100-100;d.el.setAttribute('transform',`translate(${d.x-y*.22} ${y})`);});rainRings.forEach(r=>{const a=(time+r.phase)%1.8;r.el.setAttribute('cx',r.x);r.el.setAttribute('cy',r.y);r.el.setAttribute('rx',3+a*8);r.el.setAttribute('ry',1+a*2);r.el.setAttribute('opacity',(1-a/1.8)*.4);});}
    if(!offline)requestAnimationFrame(frame);
  }
  function setCinema(on){document.body.classList.toggle('cinema',on);$('#exit-cinema').hidden=!on||captureMode;resizeCamera();}
  $('#cinema-button').addEventListener('click',()=>setCinema(true));$('#exit-cinema').addEventListener('click',()=>setCinema(false));
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!captureMode)setCinema(false);});
  function serializeScene(){
    const copy=world.cloneNode(true);copy.setAttribute('viewBox','0 0 1600 900');copy.setAttribute('width','1920');copy.setAttribute('height','1080');copy.style.fontFamily='"Microsoft YaHei", sans-serif';
    copy.querySelector('#drone-layer').removeAttribute('transform');copy.querySelector('#drone-reflection').removeAttribute('transform');
    copy.querySelector('#svg-title').setAttribute('transform','translate(65 114)');copy.querySelector('#film-caption').setAttribute('display','inline');
    return new XMLSerializer().serializeToString(copy);
  }
  function saveBlob(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  $('#snapshot-button').addEventListener('click',async()=>{
    const button=$('#snapshot-button');button.disabled=true;
    try{const url=URL.createObjectURL(new Blob([serializeScene()],{type:'image/svg+xml;charset=utf-8'}));try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;canvas.getContext('2d').drawImage(image,0,0,1920,1080);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG encoding failed');saveBlob(blob,'雨山湖夜游-截图.png');toast('已保存 1080p 截图，包含标题、无人机与湖面倒影。');}finally{URL.revokeObjectURL(url);}}
    catch(error){toast('截图暂未成功，请使用浏览器截图。');console.error(error);}finally{button.disabled=false;}
  });
  let lastCue='';
  function advanceCapture(seconds){
    const cue=seconds>=28&&seconds<34?'rain':'clear';
    if(cue!==lastCue){state.rain=cue==='rain';applyState();lastCue=cue;}
    const x=715+Math.sin(seconds*.15)*205;target={x,y:shore(x)+73};
    frame(seconds*1000,true);
  }
  window.yushanCapture={
    duration:48,fps:24,width:1920,height:1080,
    renderAt(seconds){
      if(!captureMode)throw Error('Use ?capture=1 for deterministic frames');
      if(seconds<time)throw Error('Capture timeline must advance; reload to restart');
      while(time+1/24<seconds-1e-8)advanceCapture(time+1/24);
      advanceCapture(seconds);
      return{time,formation:$('#drone-layer').getAttribute('data-formation'),drones:droneCount};
    },
    serializeSVG:serializeScene,
    saveSVG(){saveBlob(new Blob([serializeScene()],{type:'image/svg+xml;charset=utf-8'}),'雨山湖夜游-矢量截图.svg');}
  };
  if(captureMode||params.get('cinema')==='1')setCinema(true);
  applyState();updateStamps();if(captureMode)frame(0,true);else requestAnimationFrame(frame);
})();
