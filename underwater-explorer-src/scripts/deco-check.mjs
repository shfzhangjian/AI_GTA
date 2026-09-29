// 阶段4装饰验证：数量/纹理共享/激活休眠/drawCalls；用法 node scripts/deco-check.mjs
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { kill } from 'node:process';
const HTTP_PORT=9551, CDP_PORT=9552;
const server=spawn('python3',['-m','http.server',String(HTTP_PORT),'--bind','127.0.0.1'],{cwd:'dist',stdio:'ignore'});
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port='+CDP_PORT,'--use-angle=swiftshader-webgl','--use-gl=angle','--enable-unsafe-swiftshader','--no-first-run','about:blank'],{stdio:'ignore'});
const cleanup=()=>{try{server.kill();}catch{}try{chrome.kill('SIGKILL');}catch{}};
process.on('exit',cleanup);
let j=null;for(let i=0;i<60;i++){try{j=await(await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).json();if(j.webSocketDebuggerUrl)break;}catch{}await sleep(250);}
if(!j?.webSocketDebuggerUrl){console.log('chrome fail');process.exit(2);}
const bws=new WebSocket(j.webSocketDebuggerUrl);await new Promise(r=>bws.addEventListener('open',r));
let id=0;const W=new Map();bws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&W.has(m.id)){W.get(m.id)(m);W.delete(m.id);}});
const send=(met,pr={})=>new Promise(r=>{const i=++id;W.set(i,r);bws.send(JSON.stringify({id:i,method:met,params:pr}));});
const t=await send('Target.createTarget',{url:`http://127.0.0.1:${HTTP_PORT}/?devdt=0.016&test=1`});
const tid=t.result.targetId;
let purl=null;for(let i=0;i<40;i++){const l=await(await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json();purl=l.find(x=>x.id===tid)?.webSocketDebuggerUrl;if(purl)break;await sleep(250);}
const ws=new WebSocket(purl);await new Promise(r=>ws.addEventListener('open',r));
const PW=new Map();const cerr=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&PW.has(m.id)){PW.get(m.id)(m);PW.delete(m.id);}if(m.method==='Runtime.exceptionThrown')cerr.push(m.params.exceptionDetails?.text||'');});
let pid=0;const p=(met,pr={})=>new Promise(r=>{const i=++pid;PW.set(i,r);ws.send(JSON.stringify({id:i,method:met,params:pr}));});
await p('Runtime.enable');
const ev=async(x)=>{const r=await p('Runtime.evaluate',{expression:x,returnByValue:true});return r?.result?.result?.value ?? null;};
for(let i=0;i<40;i++){await sleep(300);if(await ev('!!(window.__UE_DEBUG__&&window.__UE_DEBUG__.decorCount>0)'))break;}
const st=JSON.parse(await ev('JSON.stringify({decor:__UE_DEBUG__.decorCount,active:__UE_DEBUG__.decorActive,tex:__UE_DEBUG__.decorTextures,calls:__UE_DEBUG__.drawCalls,x:__UE_DEBUG__.diverX})'));
console.log('idle:',JSON.stringify(st));
await p('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyD',key:'d'});await sleep(4000);
await p('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyD',key:'d'});await sleep(1500);
const st2=JSON.parse((await ev('JSON.stringify({active:__UE_DEBUG__.decorActive,calls:__UE_DEBUG__.drawCalls,x:__UE_DEBUG__.diverX})')) || '{}');
console.log('traveled:',JSON.stringify(st2));
const out=[];
out.push(st.decor>0?`PASS 装饰总量 ${st.decor}`:`FAIL 装饰=0`);
out.push(st.tex<=6?`PASS 共享源纹理 ${st.tex} 张（9 类装饰复用）`:`FAIL 纹理 ${st.tex}>6`);
out.push(st.active>3?`PASS 视野激活 ${st.active}（休眠生效：${st.decor}→${st.active}）`:`FAIL 激活 ${st.active} 过少`);
out.push(st2.calls<250?`PASS drawCalls ${st2.calls}（装饰+粒子+地形 <250）`:`FAIL drawCalls ${st2.calls}`);
out.push(st2.x>400?`PASS 长途巡游 x=${st2.x} 激活正常 ${st2.active}`:`FAIL 移动异常 x=${st2.x}`);
out.push(cerr.length===0?'PASS 页面异常 0':'FAIL 异常 '+cerr.length);
for(const o of out)console.log('  '+o);
console.log(out.some(o=>o.startsWith('FAIL'))?'DECO CHECK: FAIL':'DECO CHECK: PASS');
cleanup();process.exit(out.some(o=>o.startsWith('FAIL'))?1:0);
