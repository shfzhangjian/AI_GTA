// Normal values, no health/shield/damage overrides. A simple kiting bot checks the first combat room.
const {output,testUrl,launchBrowser}=require('./browser-support.cjs');
const fs=require('node:fs');
(async()=>{
 const browser=await launchBrowser();
 const page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(testUrl());await page.waitForFunction(()=>window.__relicTest);
 await page.locator('#start-btn').click();await page.keyboard.press('Escape');await page.locator('#pause-guide').click();await page.locator('#modal-close').click();const guideResume=await page.evaluate(()=>window.__relicTest.game.state==='running');
 const result=await page.evaluate(async()=>{const {createRng}=await import(new URL('rules.js',location.href).href),g=window.__relicTest.game;g.lobby();g.selectHero('ranger');g.start();g.rng=createRng(5167);g.enterRoom();let loops=0,choices=0;while(g.room===0&&g.state!=='cleared'&&g.state!=='dead'&&loops<6000){loops++;if(g.state==='choice'){choices++;g.choose(g.currentChoices[0].id);continue;}const e=g.nearest(g.player),p=g.player;g.keys.clear();if(e){const d=Math.hypot(e.x-p.x,e.y-p.y),nx=(e.x-p.x)/d,ny=(e.y-p.y)/d;const radial=d<265?-1.2:d>350?.8:0;let dx=nx*radial-ny*.8,dy=ny*radial+nx*.8;if(p.x<115)dx+=2;if(p.x>781)dx-=2;if(p.y<115)dy+=2;if(p.y>781)dy-=2;const sx=dx-dy,sy=dx+dy;if(sx>.25)g.keys.add('KeyD');if(sx<-.25)g.keys.add('KeyA');if(sy>.25)g.keys.add('KeyS');if(sy<-.25)g.keys.add('KeyW');g.aim={x:e.x,y:e.y};g.holding=true;g.skill();if(g.projectiles.some(b=>b.hostile&&Math.hypot(b.x-p.x,b.y-p.y)<95))g.dodge();}if(p.hp<55&&g.supplies.tea>0)g.useSupply();g.update(1/30);}g.keys.clear();g.holding=false;return{state:g.state,loops,kills:g.run.kills,hp:Math.round(g.player.hp),maxhp:g.stats.maxhp,level:g.level,choices,elapsed:Math.round(g.runTime)};});
 console.log('NORMAL FIRST ROOM',result,'GUIDE RESUME',guideResume,'ERRORS',errors);
 fs.writeFileSync(output('normal-gameplay-validation.json'),JSON.stringify({result,guideResume,errors},null,2));
 if(result.state!=='cleared'||!guideResume||errors.length)throw new Error('Normal gameplay or pause-guide flow failed');
 await page.screenshot({path:output('preview-normal-play.png')});await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
