/** Deterministic SVG film export. FFMPEG_PATH and PLAYWRIGHT_PATH can override installed tools. */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const playwright = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const out = path.join(__dirname, 'exports');
fs.mkdirSync(out, { recursive: true });
const output = path.join(out, '雨山湖夜游-无人机告白.mp4');
(async () => {
  let browser,encoder;
  try {
    browser = await playwright.chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto((process.env.YUSHAN_URL || 'http://127.0.0.1:4178/') + '?capture=1');
    await page.evaluate(()=>document.fonts.ready);
    const config=await page.evaluate(()=>({duration:yushanCapture.duration,fps:yushanCapture.fps}));
    const frames=config.duration*config.fps;
    const log=fs.openSync(path.join(out,'encode.log'),'w');
    encoder=spawn(ffmpeg,['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-framerate',String(config.fps),'-vcodec','mjpeg','-i','pipe:0','-i',path.join(out,'original-ambient.wav'),'-map','0:v:0','-map','1:a:0','-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p,fade=t=in:st=0:d=0.7,fade=t=out:st=46.5:d=1.5','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','aac','-b:a','160k','-t',String(config.duration),'-movflags','+faststart',output],{stdio:['pipe','ignore',log],windowsHide:true});
    const completed=once(encoder,'exit');
    let encodingError;encoder.stdin.on('error',e=>encodingError=e);
    const cdp=await page.context().newCDPSession(page);
    for(let i=0;i<frames;i++){
      if(encodingError)throw encodingError;
      if(encoder.exitCode!==null)throw Error('Encoder exited early; inspect exports/encode.log');
      await page.evaluate(t=>yushanCapture.renderAt(t),i/config.fps);
      const shot=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:94,fromSurface:true,captureBeyondViewport:false});
      if(!encoder.stdin.write(Buffer.from(shot.data,'base64')))await once(encoder.stdin,'drain');
      if([8,20,30,40].includes(i/config.fps)){
        const label={8:'文字编队',20:'爱心编队',30:'雨中双塔',40:'夜空告白'}[i/config.fps];
        await page.screenshot({path:path.join(out,`${label}.png`)});
        if(i/config.fps===40)fs.writeFileSync(path.join(out,'夜空告白.svg'),await page.evaluate(()=>yushanCapture.serializeSVG()));
      }
      if(i%120===0)console.log(`Export ${i}/${frames} (${(i/config.fps).toFixed(0)}s/${config.duration}s)`);
    }
    encoder.stdin.end();const [code]=await completed;fs.closeSync(log);
    if(code!==0)throw Error('Encoder failed; inspect exports/encode.log');
    if(errors.length)throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(out,'video-info.json'),JSON.stringify({file:path.basename(output),width:1920,height:1080,fps:config.fps,duration:config.duration,frames,droneCount:807,video:'H.264 / yuv420p',audio:'AAC / original synthesized ambient music',bytes:fs.statSync(output).size},null,2));
    console.log('COMPLETE '+output);
  } finally {if(encoder&&encoder.exitCode===null)encoder.kill();if(browser)await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
