import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const puppeteer=require(process.env.PUPPETEER_PATH||'puppeteer-core');
const gameURL=new URL(process.env.GAME_URL||'http://127.0.0.1:5199/');if(!gameURL.pathname.endsWith('/'))gameURL.pathname+='/';
const out=path.resolve('artifacts');fs.mkdirSync(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-gpu-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
  await page.setViewport({width:1440,height:900});await page.goto(new URL('?test=1',gameURL).href,{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__NEON__);await wait(1600);await page.screenshot({path:path.join(out,'desktop-menu.png')});
  await page.click('#start-btn');await page.waitForFunction(()=>__NEON__.game.status==='running',{timeout:20000});await page.keyboard.down('d');await page.waitForFunction(()=>__NEON__.game.x>2);await page.keyboard.up('d');const moved=await page.evaluate(()=>__NEON__.state());if(moved.x<1)throw new Error('键盘移动未响应');
  await page.click('#pause-btn');const before=await page.evaluate(()=>__NEON__.state());await wait(400);const after=await page.evaluate(()=>__NEON__.state());if(before.distance!==after.distance)throw new Error('暂停没有冻结模拟');await page.click('#resume-btn');
  await page.keyboard.press('Space');await page.keyboard.press('e');await page.waitForFunction(()=>__NEON__.game.jumpY>0&&__NEON__.game.burst>0,{timeout:4000}).catch(async()=>{console.log('技能诊断',await page.evaluate(()=>({state:__NEON__.state(),burst:__NEON__.game.burst,jump:__NEON__.game.jumpY,jumpTime:__NEON__.game.jumpTime,focus:document.activeElement.id})));throw new Error('跳跃或爆发技能没有响应');});
  await wait(1200);await page.screenshot({path:path.join(out,'desktop-play.png')});
  await page.evaluate(()=>{__NEON__.game.distance=__NEON__.game.level.length-.01;__NEON__.game.enemies=[];__NEON__.step(.05,1);});await wait(1300);await page.screenshot({path:path.join(out,'desktop-boss.png')});
  const desktop=await page.evaluate(()=>({state:__NEON__.state(),render:__NEON__.renderer.stats(),overflow:document.documentElement.scrollWidth>innerWidth,fatal:!document.getElementById('fatal').hidden}));
  await page.evaluate(()=>{const g=__NEON__.game;g.boss.hp=1;g.bullets.push({id:987654,s:g.boss.s-2,prev:0,x:g.boss.x,vx:0,damage:100});__NEON__.step(.05);});await wait(350);if(await page.$eval('#result',e=>e.hidden))throw new Error('首领击败后没有结算');const unlocked=await page.evaluate(()=>__NEON__.save().unlocked);if(unlocked!==2)throw new Error('章节没有解锁');await page.screenshot({path:path.join(out,'desktop-result.png')});
  await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__NEON__);if(await page.evaluate(()=>__NEON__.save().unlocked)!==2)throw new Error('存档未持久化');
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1});await page.reload({waitUntil:'networkidle0'});await wait(1300);await page.screenshot({path:path.join(out,'mobile-menu.png')});await page.click('[data-hero="su"]');await page.click('#start-btn');await page.waitForFunction(()=>__NEON__.game.status==='running',{timeout:20000});
  const client=await page.createCDPSession();await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:420}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:270,y:420}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(400);const touchX=await page.evaluate(()=>__NEON__.game.x);if(touchX<1)throw new Error('触屏滑动没有响应');await page.click('#jump-btn');await page.click('#ability-btn');await wait(160);await page.screenshot({path:path.join(out,'mobile-play.png')});
  const mobile=await page.evaluate(()=>({state:__NEON__.state(),render:__NEON__.renderer.stats(),bounds:__NEON__.renderer.heroBounds(),overflow:document.documentElement.scrollWidth>innerWidth,fatal:!document.getElementById('fatal').hidden}));
  if(mobile.bounds.minX< -1||mobile.bounds.maxX>1)throw new Error('手机角色被裁切');
  await page.evaluate(()=>{__NEON__.game.distance=__NEON__.game.level.length-.01;__NEON__.game.enemies=[];__NEON__.step(.05);});await wait(1300);await page.screenshot({path:path.join(out,'mobile-boss.png')});
  const result={desktop,mobile,unlocked,errors,checks:['键盘移动','暂停冻结与恢复','跳跃与爆发','首领战渲染','胜利结算','章节解锁','存档持久化','手机触屏移动','手机技能按钮']};fs.writeFileSync(path.join(out,'browser-check.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(errors.length||desktop.fatal||mobile.fatal||desktop.overflow||mobile.overflow)throw new Error('发现浏览器错误或布局溢出');
}finally{await browser.close();}
