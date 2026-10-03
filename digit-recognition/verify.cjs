const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const screenshots=path.join(__dirname,'artifacts');
fs.mkdirSync(screenshots,{recursive:true});
const M=require('./handwriting-model.js');
for(let i=0;i<10;i++){const d=M.classify(M.templates[i]);assert.deepEqual(d.winners,[i]);assert.equal(d.features.length,72);assert.equal(d.distances[i],0);assert(Math.abs(d.probabilities.reduce((a,b)=>a+b)-1)<1e-12)}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4180/');
 assert.equal(await page.locator('#film').getAttribute('data-renderer'),'threejs');
 assert.equal(await page.evaluate(()=>THREE.REVISION),'185');
 assert.equal(await page.locator('#digits button').count(),10);
 await page.locator('#play').click();const paused=Number(await page.locator('#film').getAttribute('data-time'));await page.waitForTimeout(180);assert.equal(Number(await page.locator('#film').getAttribute('data-time')),paused);
 await page.locator('#speed').selectOption('2');await page.locator('#play').click();await page.waitForTimeout(330);await page.locator('#play').click();assert(Number(await page.locator('#film').getAttribute('data-time'))>paused+.3);
 for(let i=0;i<10;i++){
   await page.locator(`button[data-digit="${i}"]`).click();await page.locator('button[data-chapter="7"]').click();
   assert.match(await page.locator('#equation').textContent(),new RegExp('p\\('+M.labels[i]+'\\)'));
 }
 await page.locator('button[data-digit="1"]').click();await page.locator('button[data-chapter="3"]').click();
 assert.match(await page.locator('#equation').textContent(),/−/);
 assert(!/\|0\| = 0/.test(await page.locator('#equation').textContent()),'Manual convolution step chooses a useful nonzero example');
 await page.locator('#next').click();assert.equal(await page.locator('#film').getAttribute('data-chapter'),'4');
 await page.locator('#previous').click();assert.equal(await page.locator('#film').getAttribute('data-chapter'),'3');
 await page.locator('#timeline').fill('54');assert.equal(await page.locator('#film').getAttribute('data-chapter'),'5');
 await page.locator('#timeline').fill('76.8');await page.locator('#play').click();await page.waitForTimeout(300);assert.equal(await page.locator('#film').getAttribute('data-time'),'77.00');assert.equal(await page.locator('#play').getAttribute('aria-label'),'重播动画');
 await page.locator('#play').click();await page.waitForTimeout(140);await page.locator('#play').click();assert(Number(await page.locator('#film').getAttribute('data-time'))<1);
 await page.locator('#fullscreen').click();assert(await page.evaluate(()=>!!document.fullscreenElement));await page.locator('#fullscreen').click();
 for(const [width,height] of [[1440,900],[1024,768],[768,1024],[390,844],[320,568],[844,390]]){
  await page.setViewportSize({width,height});
  for(let ch=0;ch<8;ch++){
    await page.locator(`button[data-chapter="${ch}"]`).click();
    const layout=await page.evaluate(()=>{
      const ids=['narration','stage','math-caption','transport'],bounds=Object.fromEntries(ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();return [id,{top:r.top,bottom:r.bottom,left:r.left,right:r.right}]}));
      const svg=document.querySelector('#diagram'),v=svg.viewBox.baseVal;
      const clipped=[...svg.querySelectorAll('text')].filter(t=>{const b=t.getBBox();return b.x< -1||b.x+b.width>v.width+1||b.y< -1||b.y+b.height>v.height+1}).map(t=>t.textContent);
      return {overflow:document.documentElement.scrollWidth>innerWidth,bounds,clipped};
    });
    assert(!layout.overflow,`No horizontal overflow ${width}x${height} stage ${ch}`);
    assert(layout.bounds.transport.bottom<=height+1,`Transport visible ${width}x${height}`);
    assert(layout.bounds['math-caption'].bottom<layout.bounds.transport.top+2,`Caption avoids controls ${width}x${height} stage ${ch}`);
    assert.deepEqual(layout.clipped,[],`SVG labels fit ${width}x${height} stage ${ch}`);
  }
 }
 await page.setViewportSize({width:1440,height:900});
 for(const ch of [0,3,4,7]){await page.locator(`button[data-chapter="${ch}"]`).click();await page.waitForTimeout(760);await page.screenshot({path:path.join(screenshots,`film-${ch}.png`)});}
 await page.setViewportSize({width:390,height:844});await page.locator('button[data-chapter="4"]').click();await page.waitForTimeout(760);await page.screenshot({path:path.join(screenshots,'film-mobile.png')});
 const external=[];page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url())});
 await page.goto(pathToFileURL(path.join(__dirname,'digit-recognition.html')).href);await page.locator('button[data-digit="9"]').click();await page.locator('button[data-chapter="7"]').click();assert.match(await page.locator('#equation').textContent(),/p\(0\)/);assert.equal(await page.locator('#film').getAttribute('data-renderer'),'threejs');assert.deepEqual(external,[]);
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();assert.equal(await page.locator('#play').getAttribute('aria-label'),'播放动画');assert(Number(await page.locator('#film').getAttribute('data-time'))>0);
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS: real Three.js renderer; 10 correct examples; 8 chapters; actual formulas; pause, speed, seek, replay, fullscreen; 6 screen sizes; reduced motion; offline bundle without external requests.');
})().catch(e=>{console.error(e);process.exit(1)});
