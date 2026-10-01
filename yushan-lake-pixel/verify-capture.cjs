const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL || undefined});
  try{
    const errors=[];
    const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto((process.env.YUSHAN_URL || 'http://127.0.0.1:4178/'));
    assert.equal(await page.locator('.scene-title').count(),0,'No external HTML title');
    assert.equal(await page.locator('#animated-title path').count(),8,'Title is SVG outlines');
    assert.equal(await page.locator('#drone-points > g').count(),807);
    const first=await page.locator('#drone-points > g').first().getAttribute('transform');
    await page.waitForFunction(previous=>document.querySelector('#drone-points').firstElementChild.getAttribute('transform')!==previous,first);
    assert.notEqual(await page.locator('#drone-points > g').first().getAttribute('transform'),first,'Drones animate');
    await page.locator('[data-toggle="drones"]').click();await page.waitForFunction(()=>document.querySelector('#drone-layer').getAttribute('display')==='none');
    assert.equal(await page.locator('#drone-layer').getAttribute('display'),'none');
    await page.locator('[data-toggle="drones"]').click();
    await page.locator('#day-toggle').click();await page.waitForFunction(()=>document.querySelector('#drone-layer').getAttribute('display')==='none');
    assert.equal(await page.locator('#drone-layer').getAttribute('display'),'none');
    await page.locator('#day-toggle').click();
    const downloadPromise=page.waitForEvent('download');
    await page.locator('#snapshot-button').click();
    const download=await downloadPromise;
    await download.saveAs('exports/截图按钮验证.png');
    assert.equal(await download.failure(),null);
    const png=fs.readFileSync('exports/截图按钮验证.png');
    assert.equal(png.readUInt32BE(16),1920);assert.equal(png.readUInt32BE(20),1080);
    await page.locator('#cinema-button').click();
    assert.equal(await page.locator('.control-deck').isVisible(),false);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.control-deck').isVisible(),true);
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:'exports/手机版预览.png'});
    await page.setViewportSize({width:1920,height:1080});
    await page.goto((process.env.YUSHAN_URL || 'http://127.0.0.1:4178/') + '?capture=1');
    const checkpoints=[8,20,30,40];
    const forms=['text','heart','skyline','text'];
    for(let i=0;i<checkpoints.length;i++){
      const result=await page.evaluate(t=>yushanCapture.renderAt(t),checkpoints[i]);
      assert.equal(result.formation,forms[i]);
      assert.equal(result.time,checkpoints[i]);
    }
    const svg=await page.evaluate(()=>yushanCapture.serializeSVG());
    assert(svg.includes('animated-title')&&svg.includes('drone-points')&&svg.includes('drone-reflection'));
    assert(!svg.includes('<image'),'SVG has no raster scene content');
    await page.goto((process.env.YUSHAN_URL || 'http://127.0.0.1:4178/') + 'film.html');
    await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
    const meta=await page.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration}));
    assert.deepEqual(meta,{width:1920,height:1080,duration:48});
    await page.locator('video').evaluate(v=>{v.muted=true;v.currentTime=20;return v.play();});
    await page.waitForTimeout(300);
    assert.equal(await page.locator('video').evaluate(v=>v.error),null);
    assert.deepEqual(errors,[]);
    console.log('PASS: SVG title, 807 moving drones, switch, day/night visibility, 1080p PNG download, cinema exit, mobile width, deterministic formations, standalone SVG, MP4 browser playback and seek.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
