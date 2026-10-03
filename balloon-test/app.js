import * as THREE from 'three';

/* The bundled HTML is the deliverable. Everything, including maps and audio, is generated here. */
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = (a,b,x) => {const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=reducedQuery.matches;
reducedQuery.addEventListener('change',e=>reduced=e.matches);
const palettes=[['#c35f43','Terracotta'],['#769b6e','Sage'],['#c89840','Honey'],['#6c88a2','Cornflower'],['#af6580','Rose'],['#b17548','Apricot']];
let roundIndex=0,water=false,soundEnabled=true,round,state='ready',stroke=null,pumps=0,lambda=1,pressure=0;
let simTime=0,burstAge=0,burstSnapshot=null,burstData=null,flickTime=-100,flickStrength=0;
let gaugeValue=0,gaugeVelocity=0,sway=0,swayVelocity=0,lastTime=0,accumulator=0,ready=false;
let replayAccumulator=0,replayLead=0,replaySoundPlayed=false,burstTicks=0,fingerprint='';
let bestAir=0,bestWater=0;
try{bestAir=+localStorage.getItem('balloon-test-best-air')||0;bestWater=+localStorage.getItem('balloon-test-best-water')||0;}catch{}

// Gent: P = (2 mu H/R)(lambda^-1-lambda^-7)/(1-(2lambda²+lambda^-4-3)/Jm).
// Equal strokes add gas volume with a small compressibility correction. Rupture is a hidden material property.
function gent(l,spec=round){
 if(l<=1)return 0;
 const invariant=2*l*l+Math.pow(l,-4)-3;
 return spec.modulus*(1/l-Math.pow(l,-7))/Math.max(.025,1-invariant/spec.jm);
}
function gasAt(l){return Math.pow(l,3)*(1+gent(l)/101.325);}
function solveGas(v){let lo=1,hi=round.limit+.1;for(let i=0;i<26;i++){const m=(lo+hi)/2;if(gasAt(m)<v)lo=m;else hi=m;}return(lo+hi)/2;}
function newSpec(seed){
 const random=rng(seed),limit=3.45+random()*.65,modulus=4.3+random()*.7;
 const terminal=6.6+random()*1.1;
 const invariant=2*limit*limit+Math.pow(limit,-4)-3;
 const jm=invariant/(1-modulus*(1/limit-Math.pow(limit,-7))/terminal);
 const palette=palettes[Math.floor(random()*palettes.length)];
 return{seed,limit,modulus,jm,strokeVolume:1.95+random()*.38,palette,design:Math.floor(random()*6),weakU:.22+random()*.09,weakT:.58+random()*.1,fragmentCount:18+Math.floor(random()*11)};
}

class RoomAudio{
 constructor(){this.ctx=null;this.master=null;this.reverb=null;this.lastTick=-100;}
 start(){
  if(!soundEnabled)return;
  if(!this.ctx){
   const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;
   this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.5;this.master.connect(this.ctx.destination);
   this.reverb=this.ctx.createConvolver();const impulse=this.ctx.createBuffer(2,this.ctx.sampleRate*.48,this.ctx.sampleRate),r=rng(747);
   for(let c=0;c<2;c++){const a=impulse.getChannelData(c);for(let i=0;i<a.length;i++)a[i]=(r()*2-1)*Math.pow(1-i/a.length,3)*.2;}
   this.reverb.buffer=impulse;const wet=this.ctx.createGain();wet.gain.value=.19;this.reverb.connect(wet);wet.connect(this.master);
  }
  if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
 }
 out(node){node.connect(this.master);node.connect(this.reverb);}
 tone(f,end,duration,volume=.12,type='sine',delay=0){
  if(!soundEnabled||!this.ctx)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(10,end),t+duration);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(volume,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);this.out(g);o.start(t);o.stop(t+duration+.02);
 }
 noise(duration,volume,frequency=1400,delay=0,seed=round?.seed||1){
  if(!soundEnabled||!this.ctx)return;const t=this.ctx.currentTime+delay,b=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*duration),this.ctx.sampleRate),d=b.getChannelData(0),r=rng(seed);
  for(let i=0;i<d.length;i++)d[i]=(r()*2-1)*Math.pow(1-i/d.length,1.3);
  const n=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();n.buffer=b;f.type='bandpass';f.frequency.value=frequency;f.Q.value=.7;g.gain.value=volume;n.connect(f);f.connect(g);this.out(g);n.start(t);n.stop(t+duration);
 }
 pump(){this.start();this.noise(.32,.12,1300);this.tone(1800,500,.024,.07,'square');this.tone(100,44,.12,.2,'sine',.22);if(lambda>1.3){this.tone(230+pressure*35,125+pressure*30,.13,.035,'triangle',.1);this.noise(.15,.035,700+pressure*180,.08);}}
 flick(){this.start();const f=95+lambda*65+pressure*13;this.tone(f,f*.66,.8,.14,'sine');this.tone(f*1.61,f*1.32,.25,.025,'triangle');}
 pop(slow=false){this.start();if(slow){this.noise(2.2,.18,180,0,round.seed);this.tone(66,22,2.8,.18);return;}this.noise(.095,.5,4700);this.tone(135,28,.2,.35);this.noise(.22,.09,1100,.035);if(water){this.noise(.65,.23,900,.34);this.tone(87,38,.24,.14,'sine',.5);}}
 tick(){if(!this.ctx||this.ctx.currentTime-this.lastTick<.065)return;this.lastTick=this.ctx.currentTime;this.tone(water?900:1600,water?430:780,.026,.035,'triangle');}
 mute(){if(this.master)this.master.gain.setTargetAtTime(soundEnabled?.5:0,this.ctx.currentTime,.03);}
}
const audio=new RoomAudio();
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,alpha:false,powerPreference:'high-performance'});}catch{$('error').classList.add('show');$('loading').classList.add('done');}
if(renderer){
renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.5:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#eee9df');scene.fog=new THREE.Fog('#eee9df',14,33);
const camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.1,60);
const clockCamera={position:new THREE.Vector3(),target:new THREE.Vector3()};
const hemi=new THREE.HemisphereLight('#fff6dc','#94806a',2.25);scene.add(hemi);
const key=new THREE.DirectionalLight('#fff6df',3.3);key.position.set(-4,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-6,right:6,top:7,bottom:-5,near:1,far:22});key.shadow.bias=-.001;key.shadow.normalBias=.022;key.shadow.radius=4;scene.add(key);
const fill=new THREE.DirectionalLight('#ffffff',1.4);fill.position.set(5,4,-4);scene.add(fill);
function canvasTexture(w,h,draw,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
// Softboxes are procedural. Chrome reflects a real environment instead of a flat grey material.
const roomMap=canvasTexture(1024,512,(c,w,h)=>{
 c.fillStyle='#b1ab9f';c.fillRect(0,0,w,h);const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#eeeadd');g.addColorStop(.45,'#aca796');g.addColorStop(.53,'#544e44');g.addColorStop(1,'#b9b4a8');c.fillStyle=g;c.fillRect(0,0,w,h);
 c.fillStyle='#fffdf3';c.fillRect(100,90,120,180);c.fillRect(570,110,230,65);c.fillStyle='#38372e';c.fillRect(850,170,65,230);c.fillStyle='#e5d9be';c.fillRect(280,80,40,300);
});roomMap.mapping=THREE.EquirectangularReflectionMapping;
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(roomMap).texture;roomMap.dispose();pmrem.dispose();
const paperMap=canvasTexture(256,256,(c,w,h)=>{const r=rng(517),im=c.createImageData(w,h);for(let i=0;i<im.data.length;i+=4){const n=225+r()*18;im.data[i]=n;im.data[i+1]=n-3;im.data[i+2]=n-10;im.data[i+3]=255;}c.putImageData(im,0,0);});paperMap.wrapS=paperMap.wrapT=THREE.RepeatWrapping;paperMap.repeat.set(24,24);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:'#eee9df',map:paperMap,roughness:.95}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const chrome=new THREE.MeshStandardMaterial({color:'#d5d7d6',metalness:.97,roughness:.19});
const black=new THREE.MeshStandardMaterial({color:'#292d2b',roughness:.42,metalness:.4});
const rubber=new THREE.MeshStandardMaterial({color:'#272923',roughness:.72});
const brass=new THREE.MeshStandardMaterial({color:'#9e8860',roughness:.4,metalness:.75});
const woodMap=canvasTexture(256,64,(c,w,h)=>{c.fillStyle='#a67545';c.fillRect(0,0,w,h);const r=rng(742);for(let i=0;i<75;i++){c.strokeStyle=`rgba(${r()>.5?'71,37,17':'235,184,113'},${.08+r()*.2})`;c.beginPath();c.moveTo(0,r()*h);for(let x=0;x<w;x+=8)c.lineTo(x,(i*.91+Math.sin(x*.027+i)*1.1)%h);c.stroke();}});woodMap.wrapS=woodMap.wrapT=THREE.RepeatWrapping;
const wood=new THREE.MeshStandardMaterial({color:'#d6b183',map:woodMap,roughness:.38});
function cylinder(radius,height,mat,parent,x=0,y=0,z=0,top=radius){const m=new THREE.Mesh(new THREE.CylinderGeometry(top,radius,height,40),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function torus(r,t,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,12,64),mat);m.position.set(x,y,z);parent.add(m);return m;}
const pump=new THREE.Group();pump.position.set(-1.75,0,.22);scene.add(pump);
box(.9,.085,.48,black,pump,0,.075);box(.95,.026,.53,rubber,pump,0,.021);
cylinder(.155,1.02,black,pump,0,.6);cylinder(.177,.048,chrome,pump,0,.115);cylinder(.177,.052,chrome,pump,0,1.122);cylinder(.118,.06,black,pump,0,1.164);
const piston=new THREE.Group();pump.add(piston);cylinder(.045,.81,chrome,piston,0,1.56);
const grip=cylinder(.085,.68,wood,piston,0,1.95);grip.rotation.z=Math.PI/2;
const gripEnd1=new THREE.Mesh(new THREE.SphereGeometry(.082,20,12),wood);gripEnd1.position.set(-.34,1.95,0);piston.add(gripEnd1);const gripEnd2=gripEnd1.clone();gripEnd2.position.x=.34;piston.add(gripEnd2);
box(.18,.14,.16,black,piston,0,1.89);cylinder(.06,.13,brass,pump,.17,.2,.04);
// Printed cylinder label.
const labelTex=canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#c7c6b7';c.font='18px monospace';c.textAlign='center';c.fillText('AIR',w/2,82);c.font='10px monospace';c.fillText('HAND OPERATED',w/2,105);c.fillRect(70,125,116,1);c.fillText('0—8 kPa',w/2,146);c.font='9px monospace';c.fillText('NO. 001',w/2,182);});
const label=new THREE.Mesh(new THREE.PlaneGeometry(.22,.25),new THREE.MeshBasicMaterial({map:labelTex,transparent:true,depthWrite:false}));label.position.set(0,.7,.157);pump.add(label);
const gauge=new THREE.Group();gauge.position.set(0,.39,.255);gauge.rotation.x=-.16;pump.add(gauge);
const gaugeBody=cylinder(.25,.083,chrome,gauge);gaugeBody.rotation.x=Math.PI/2;
const dialTex=canvasTexture(512,512,(c,w,h)=>{
 c.fillStyle='#eeeadd';c.beginPath();c.arc(256,256,250,0,TAU);c.fill();const start=.75*Math.PI,range=1.5*Math.PI;
 c.strokeStyle='#bd604d';c.lineWidth=20;c.beginPath();c.arc(256,256,199,start+range*5/8,start+range);c.stroke();
 for(let i=0;i<=40;i++){const a=start+range*i/40;c.strokeStyle=i>=25?'#a84738':'#42453b';c.lineWidth=i%5?2:4;c.beginPath();c.moveTo(256+Math.cos(a)*202,256+Math.sin(a)*202);c.lineTo(256+Math.cos(a)*(i%5?188:177),256+Math.sin(a)*(i%5?188:177));c.stroke();if(i%5===0){c.fillStyle='#35382e';c.font='30px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(i/5,256+Math.cos(a)*148,256+Math.sin(a)*148);}}
 c.fillStyle='#686a5d';c.font='22px monospace';c.textAlign='center';c.fillText('kPa',256,337);c.font='15px monospace';c.fillText('GENT / 08',256,374);
});const dial=new THREE.Mesh(new THREE.CircleGeometry(.227,64),new THREE.MeshBasicMaterial({map:dialTex}));dial.position.z=.046;gauge.add(dial);
const needle=new THREE.Group();gauge.add(needle);const needleShape=new THREE.Shape();needleShape.moveTo(-.01,-.045);needleShape.lineTo(.008,-.045);needleShape.lineTo(.004,.184);needleShape.lineTo(0,.205);needleShape.lineTo(-.006,.18);needleShape.closePath();const needleMesh=new THREE.Mesh(new THREE.ShapeGeometry(needleShape),new THREE.MeshBasicMaterial({color:'#9e4b38'}));needleMesh.position.z=.053;needle.add(needleMesh);
const needleCap=new THREE.Mesh(new THREE.CircleGeometry(.02,24),new THREE.MeshBasicMaterial({color:'#575b50'}));needleCap.position.z=.058;gauge.add(needleCap);
const glass=new THREE.Mesh(new THREE.CircleGeometry(.226,64),new THREE.MeshPhysicalMaterial({color:'#ffffff',transparent:true,opacity:.08,roughness:.08,metalness:.1,depthWrite:false}));glass.position.z=.068;gauge.add(glass);

const stand=new THREE.Group();stand.position.set(.83,0,0);scene.add(stand);
cylinder(.49,.095,black,stand,0,.057);cylinder(.46,.013,chrome,stand,0,.111);cylinder(.09,.045,chrome,stand,0,.136);
cylinder(.042,1.13,chrome,stand,0,.71);cylinder(.075,.11,brass,stand,0,1.28);cylinder(.039,.17,chrome,stand,0,1.42);
torus(.04,.006,chrome,stand,0,1.47).rotation.x=Math.PI/2;
const nozzleY=1.51;
const hoseMat=new THREE.MeshStandardMaterial({color:'#373a31',roughness:.67});
const hoseCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.6,.21,.25),new THREE.Vector3(-1.02,.08,.8),new THREE.Vector3(.12,.055,.66),new THREE.Vector3(.79,.2,.12),new THREE.Vector3(.83,1.3,0)]);
let hoseGeo=new THREE.TubeGeometry(hoseCurve,56,.029,8,false);const hose=new THREE.Mesh(hoseGeo,hoseMat);hose.castShadow=true;scene.add(hose);
function updateHose(phase){const tall=innerHeight/innerWidth>1.5;const px=pump.position.x,pz=pump.position.z;hoseCurve.points[0].set(px+.16,.21,pz+.03);hoseCurve.points[1].set(px+.7,.07,pz+.6);hoseCurve.points[2].set(.02,.055,.7);hoseCurve.points[3].set(.79,.18+phase*.04,.14+phase*.08);const geo=new THREE.TubeGeometry(hoseCurve,48,.029,8,false);hose.geometry.dispose();hose.geometry=geo;}

// A single deforming parameter grid feeds all four latex passes and both material-coordinate ink layers.
const NU=80,NV=56,skinGeo=new THREE.BufferGeometry();
const positions=new Float32Array((NU+1)*(NV+1)*3),uvs=new Float32Array((NU+1)*(NV+1)*2),indices=[];
for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++){const id=j*(NU+1)+i;uvs[id*2]=i/NU;uvs[id*2+1]=j/NV;if(j<NV&&i<NU){const a=id,b=id+1,c=id+NU+1,d=c+1;indices.push(a,c,b,b,c,d);}}
skinGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));skinGeo.setAttribute('uv',new THREE.BufferAttribute(uvs,2));skinGeo.setIndex(indices);
const balloon=new THREE.Group();balloon.position.set(.83,nozzleY,0);scene.add(balloon);
const shaderUniforms={uColor:{value:new THREE.Color('#c35f43')},uStretch:{value:1},uTime:{value:0},uFlick:{value:-100},uFlickStrength:{value:0},uTear:{value:-1},uWeak:{value:new THREE.Vector2(.31,.65)},uWater:{value:0},uPattern:{value:null},uCredit:{value:null}};
const vertexShader=`
uniform float uTear;uniform vec2 uWeak;
varying vec3 vNormal;varying vec3 vWorld;varying vec2 vUV;
vec3 globe(vec2 p){float a=p.x*6.2831853,b=p.y*3.1415926;return vec3(sin(b)*cos(a),-cos(b),sin(b)*sin(a));}
void main(){vUV=uv;vec3 p=position;
if(uTear>=0.){float d=acos(clamp(dot(globe(uv),globe(uWeak)),-1.,1.))+.07*sin(uv.x*151.+uv.y*33.)+.032*sin(uv.y*187.+uv.x*41.);float ridge=exp(-pow((d-uTear)/.075,2.));p+=normal*ridge*.055;}
vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`;
const commonShader=`
precision highp float;
uniform vec3 uColor;uniform float uStretch,uTime,uFlick,uFlickStrength,uTear,uWater;
uniform vec2 uWeak;varying vec3 vNormal,vWorld;varying vec2 vUV;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 sphereCoord(vec2 uv){float a=uv.x*6.2831853;float b=uv.y*3.1415926;return vec3(sin(b)*cos(a),-cos(b),sin(b)*sin(a));}
float tearDistance(){vec3 p=sphereCoord(vUV),w=sphereCoord(uWeak);float d=acos(clamp(dot(p,w),-1.,1.));return d+.07*sin(vUV.x*151.+vUV.y*33.)+.032*sin(vUV.y*187.+vUV.x*41.);}
void cut(){if(uTear>=0.&&tearDistance()<uTear)discard;}
vec3 surfaceNormal(){vec3 n=normalize(vNormal);float wrinkle=(1.-smoothstep(1.,2.6,uStretch))*.15;float wave=sin(vUV.x*170.+sin(vUV.y*24.)*4.)*sin(vUV.y*83.);n=normalize(n+vec3(wave*wrinkle,0.,wave*wrinkle*.4));return gl_FrontFacing?n:-n;}
`;
const transmissionShader=commonShader+`
void main(){cut();vec3 n=surfaceNormal(),v=normalize(cameraPosition-vWorld);
float path=1./max(.13,abs(dot(n,v)));float area=mix(1.,uStretch,smoothstep(.07,.29,vUV.y));
vec3 absorption=-log(clamp(uColor,vec3(.06),vec3(.92)))*1.95;
vec3 transmission=exp(-absorption*path/area);
if(uTear>=0.){float edge=1.-smoothstep(.01,.085,tearDistance()-uTear);transmission=mix(transmission,uColor*.22,edge);}
gl_FragColor=vec4(transmission,1.);}`;
const scatterShader=commonShader+`
void main(){cut();vec3 n=surfaceNormal(),v=normalize(cameraPosition-vWorld);
vec3 l=normalize(vec3(-.6,1.,.8));float ndv=abs(dot(n,v)),fres=pow(1.-ndv,5.);
float diffuse=.38+.62*max(0.,dot(n,l));float thickness=1./max(1.,uStretch);
vec3 scattering=uColor*(.13+thickness*.29)*diffuse;
vec3 h=normalize(l+v);float gloss=pow(max(0.,dot(n,h)),100.);
vec3 h2=normalize(normalize(vec3(.5,.4,-.5))+v);float gloss2=pow(max(0.,dot(n,h2)),62.);
float panel=pow(max(0.,dot(n,normalize(vec3(-.32,.55,.77)))),38.);
vec3 axisX=normalize(vec3(.8,0.,.6)),axisY=normalize(cross(h,axisX));vec3 nh=n-h;
float softbox=(1.-smoothstep(.068,.11,abs(dot(nh,axisX))))*(1.-smoothstep(.19,.27,abs(dot(nh,axisY))))*smoothstep(.6,.86,dot(n,h));
float age=uTime-uFlick;float dist=length((vUV-vec2(.32,.58))*vec2(2.,1.));
float ripple=sin(dist*60.-age*19.)*exp(-age*3.)*exp(-pow(dist-age*.8,2.)*70.)*step(0.,age)*uFlickStrength;
vec3 clearcoat=vec3(1.,.96,.86)*(gloss*.10+softbox*.23+gloss2*.10+panel*.035+fres*.085);
vec3 glow=uColor*pow(max(0.,dot(-n,l)),3.)*.07;
gl_FragColor=vec4(scattering+clearcoat+glow+vec3(abs(ripple)*.11),1.);}`;
function latexMaterial(side,add){const m=new THREE.ShaderMaterial({uniforms:shaderUniforms,vertexShader,fragmentShader:add?scatterShader:transmissionShader,side,transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:add?THREE.OneFactor:THREE.ZeroFactor,blendDst:add?THREE.OneFactor:THREE.SrcColorFactor});return m;}
const skinMeshes=[];for(let i=0;i<4;i++){const m=new THREE.Mesh(skinGeo,latexMaterial(i<2?THREE.BackSide:THREE.FrontSide,i%2===1));m.renderOrder=100+i;m.frustumCulled=false;balloon.add(m);skinMeshes.push(m);}
const inkShader=commonShader+`
uniform sampler2D uPattern,uCredit;uniform float uIsCredit;
void main(){cut();vec2 uv=vec2(1.-vUV.x,vUV.y);vec4 ink=uIsCredit>.5?texture2D(uCredit,uv):texture2D(uPattern,uv);
if(ink.a<.02)discard;
if(uIsCredit<.5){vec2 grid=fract(vUV*vec2(69.,54.));float threshold=smoothstep(6.,11.5,uStretch)*.18;float chip=hash(floor(vUV*vec2(69.,54.)));if(min(min(grid.x,1.-grid.x),min(grid.y,1.-grid.y))<threshold||chip<smoothstep(8.,12.,uStretch)*.18)discard;}
vec3 n=surfaceNormal();float lit=.78+.22*max(0.,dot(n,normalize(vec3(-.6,1.,.8))));gl_FragColor=vec4(pow(ink.rgb,vec3(1./2.2))*lit,ink.a*.94);}`;
const inkMeshes=[];for(let i=0;i<2;i++){const mat=new THREE.ShaderMaterial({uniforms:{...shaderUniforms,uIsCredit:{value:i}},vertexShader,fragmentShader:inkShader,transparent:true,depthWrite:false,side:THREE.FrontSide,polygonOffset:true,polygonOffsetFactor:-1});const m=new THREE.Mesh(skinGeo,mat);m.renderOrder=104+i;m.frustumCulled=false;balloon.add(m);inkMeshes.push(m);}
const collarMat=new THREE.MeshStandardMaterial({color:'#c35f43',roughness:.48});
const collar=torus(.056,.013,collarMat,balloon,0,.015);collar.rotation.x=Math.PI/2;collar.renderOrder=106;
// Physical transmission really samples the rendered room, and adds refracted highlights beneath the dyed latex.
const waterMaterial=new THREE.MeshPhysicalMaterial({color:'#eef8ed',roughness:.035,metalness:0,transmission:.94,thickness:1.45,ior:1.333,attenuationColor:new THREE.Color('#bdd5c2'),attenuationDistance:7,clearcoat:1,envMapIntensity:1.25});
const innerWater=new THREE.Mesh(skinGeo,waterMaterial);innerWater.scale.setScalar(.966);innerWater.renderOrder=90;innerWater.visible=false;innerWater.frustumCulled=false;balloon.add(innerWater);

function makeInk(design){
 const tex=canvasTexture(1024,1024,(c,w,h)=>{
 const center=w*.78,cy=h*.40;c.fillStyle='#fff5d5';c.strokeStyle='#fff5d5';c.textAlign='center';c.lineWidth=5;
 c.translate(center,cy);c.scale(.55,1.4);c.translate(-center,-cy);
  function star(x,y,r){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.42:r;c.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad);}c.closePath();c.fill();}
  if(design===0){star(center,cy,67);star(center-106,cy-45,23);star(center+95,cy+80,31);star(center-65,cy+128,18);}
  if(design===1){for(let y=270;y<645;y+=62)for(let x=center-145;x<center+155;x+=60){c.beginPath();c.arc(x+(y%124?15:0),y,11,0,TAU);c.fill();}}
  if(design===2){c.lineWidth=9;c.beginPath();c.arc(center,cy+30,90,0,TAU);c.stroke();c.beginPath();c.arc(center-32,cy+10,8,0,TAU);c.arc(center+32,cy+10,8,0,TAU);c.fill();c.beginPath();c.arc(center,cy+30,47,.15*Math.PI,.85*Math.PI);c.stroke();}
  if(design===3){c.font='bold 79px Arial';c.fillText('POP?',center,cy+30);c.font='bold 17px Arial';c.fillText('HANDLE WITH CARE',center,cy+76);c.lineWidth=2;c.beginPath();c.moveTo(center-124,cy-54);c.lineTo(center+124,cy-54);c.stroke();}
  if(design===4){c.beginPath();c.moveTo(center,cy+85);c.bezierCurveTo(center-145,cy-8,center-67,cy-112,center,cy-44);c.bezierCurveTo(center+67,cy-112,center+145,cy-8,center,cy+85);c.fill();}
 });return tex;
}
const creditTexture=canvasTexture(1024,1024,(c,w,h)=>{c.fillStyle='#fff5d5';c.textAlign='center';c.font='bold 32px monospace';c.translate(w*.78,h*.58);c.scale(.75,2);c.fillText('@vib3coded',0,0);});shaderUniforms.uCredit.value=creditTexture;
let patternTexture=null;
// Folded sack -> locally inflated neck -> teardrop. The neck origin remains exactly on the fixed nozzle.
function surface(u,t,l,time){
 const air=smooth(1,1.48,l),full=smooth(1.17,1.78,l),r=.34*l;
 const height=water?r*1.76:r*2.46;
 const a=u*TAU;const body=smooth(.1,.24,t);
 let rad;if(t<.14)rad=mix(.051,.077,t/.14);else{const q=(t-.14)/.86;rad=r*Math.pow(Math.sin(Math.PI*q),.68)*(water?(1.1-.16*q):(.68+.42*q));}
 const inflateFront=.17+full*.92;
 const local=smooth(t-.13,t+.12,inflateFront)*air;
 const fold=Math.sin(t*12+u*8)*.021*(1-full);
 const slackR=(.073+Math.sin(t*Math.PI)*.12)*(1+.13*Math.sin(u*28+t*18));
 const slackX=Math.sin(t*3.8)*.16+Math.cos(a)*slackR;
 const slackY=t<.12?t*.5:.10-(t-.12)*.52+Math.sin(t*7.5)*.08;
 const slackZ=Math.sin(a)*slackR*.19+Math.sin(t*4)*.09;
 let x=mix(slackX,Math.cos(a)*rad,local),y=mix(slackY,t*height+.025,local),z=mix(slackZ,Math.sin(a)*rad,local);
 // The limp tip folds over the growing lower bulb, rather than instantly becoming a sphere.
 if(full<1&&t>inflateFront){y+=(1-full)*air*.55;x+=(1-full)*air*.12;}
 const wrinkles=(1-smooth(1.05,1.65,l))*.012*Math.sin(u*TAU*21+t*45);x+=Math.cos(a)*wrinkles;z+=Math.sin(a)*wrinkles;
 // A tiny irregular terminal teat is visible on a stretched balloon.
 if(t>.964){const tip=smooth(.964,1,t);y+=tip*.065*(.8+.2*Math.sin(u*22));x+=tip*.013*Math.sin(a*3);}
 const danger=smooth(round.limit*.82,round.limit,l),du=Math.min(Math.abs(u-round.weakU),1-Math.abs(u-round.weakU)),dt=t-round.weakT;
 const bulge=danger*.23*r*Math.exp(-(du*du*160+dt*dt*210));x+=Math.cos(a)*bulge;z+=Math.sin(a)*bulge;y+=bulge*.15;
 const fa=time-flickTime;if(!reduced&&fa>=0&&fa<1.8){const d=Math.hypot((u-.32)*2,t-.58),wave=Math.sin(d*42-fa*18)*Math.exp(-fa*3)*Math.exp(-Math.pow(d-fa*.9,2)*40)*.025*flickStrength;x+=Math.cos(a)*wave;z+=Math.sin(a)*wave;}
 if(water&&!reduced){const wobble=Math.sin(time*5.6+t*7)*Math.exp(-Math.max(0,time-(stroke?.start||-100))*.5)*.012*full;x+=wobble*body;y+=Math.sin(time*4.3+a)*.009*body;}
 return[x,y,z];
}
let lastShape=-1;
function updateSkin(force=false){
 if(state==='burst'||state==='replay'||state==='ended')return;
 const rippling=!reduced&&simTime>=flickTime&&simTime-flickTime<1.8;
 if(!force&&!rippling&&!stroke&&Math.abs(lastShape-lambda)<.000001)return;
 for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++){const id=(j*(NU+1)+i)*3,p=surface(i/NU,j/NV,lambda,simTime);positions[id]=p[0];positions[id+1]=p[1];positions[id+2]=p[2];}
 skinGeo.attributes.position.needsUpdate=true;skinGeo.computeVertexNormals();lastShape=lambda;
}

// Analytic ellipsoid optical path on the paper. The edge is darker because the path is grazing.
const shadowUniforms={uColor:shaderUniforms.uColor,uStretch:shaderUniforms.uStretch,uOpacity:{value:.3},uWater:shaderUniforms.uWater,uTime:shaderUniforms.uTime};
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({uniforms:shadowUniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`precision highp float;varying vec2 vUv;uniform vec3 uColor;uniform float uStretch,uOpacity,uWater,uTime;void main(){vec2 p=(vUv-.5)*2.;float r=length(p);if(r>1.)discard;float chord=2.*sqrt(max(0.,1.-r*r));float rim=exp(-pow((r-.81)*7.,2.));vec3 center=mix(vec3(.1),uColor*.6,.68);float alpha=(chord*.09+rim*.15)*uOpacity;vec3 col=mix(center,vec3(.08),rim*.75);float caustic=pow(max(0.,sin(r*39.+sin(p.x*14.+uTime*.2)*2.)),18.)*smoothstep(.25,.6,r)*(1.-smoothstep(.7,.95,r))*uWater;col+=vec3(.5,.58,.46)*caustic*.8;gl_FragColor=vec4(col,alpha);}`,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(.99,.013,.22);scene.add(shadow);

// Fragments and the nozzle fringe are allocated before play, so the burst allocates no shader or material.
const darkLatex=new THREE.MeshStandardMaterial({color:'#713c2b',roughness:.59,side:THREE.DoubleSide});
const fragments=[];
function patchGeometry(ribbon=false){
 const plane=new THREE.PlaneGeometry(ribbon?.11:.18,ribbon?.34:.15,5,5),p=plane.attributes.position;
 const vertices=[],index=[];
 for(let face=0;face<2;face++)for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);vertices.push(x*(1+.2*Math.sin(y*71)),y,Math.sin(y*27)*.028+Math.sin(x*45)*.015+(face?-.005:.005));}
 const a=plane.index.array,n=p.count;for(let i=0;i<a.length;i+=3)index.push(a[i],a[i+1],a[i+2],a[i]+n,a[i+2]+n,a[i+1]+n);
 const perimeter=[0,1,2,3,4,5,11,17,23,29,35,34,33,32,31,30,24,18,12,6];
 for(let i=0;i<perimeter.length;i++){const v=perimeter[i],w=perimeter[(i+1)%perimeter.length];index.push(v,w,w+n,v,w+n,v+n);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(index);g.computeVertexNormals();plane.dispose();return g;
}
for(let i=0;i<28;i++){const mesh=new THREE.Mesh(patchGeometry(i%3===0),darkLatex);mesh.castShadow=true;mesh.visible=false;scene.add(mesh);fragments.push({mesh,active:false,pos:new THREE.Vector3(),vel:new THREE.Vector3(),spin:new THREE.Vector3(),age:0,landed:false});}
const fringe=new THREE.Group();fringe.position.set(.83,nozzleY,0);scene.add(fringe);
const fringeStrips=[];for(let i=0;i<13;i++){const m=new THREE.Mesh(patchGeometry(true),darkLatex);m.scale.set(.35,.4,.5);fringe.add(m);fringeStrips.push(m);}fringe.visible=false;
// Talc uses a generated radial sprite, initially distributed over the original ellipsoid.
const puffMap=canvasTexture(64,64,c=>{const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.8)');g.addColorStop(.35,'rgba(255,255,255,.3)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64);},false);
const dustPositions=new Float32Array(95*3),dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#f2eee1',map:puffMap,size:.19,transparent:true,opacity:0,depthWrite:false,blending:THREE.NormalBlending}));dust.renderOrder=110;dust.frustumCulled=false;scene.add(dust);
const droplets=new THREE.InstancedMesh(new THREE.SphereGeometry(.024,8,6),new THREE.MeshPhysicalMaterial({color:'#bdcebc',roughness:.12,metalness:.18,transparent:true,opacity:.72,envMapIntensity:1.7}),220);droplets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);droplets.visible=false;droplets.frustumCulled=false;scene.add(droplets);
const dropDummy=new THREE.Object3D(),dropStates=[];
const waterBlob1=new THREE.Mesh(new THREE.SphereGeometry(1,28,20),waterMaterial),waterBlob2=waterBlob1.clone();waterBlob1.visible=waterBlob2.visible=false;scene.add(waterBlob1,waterBlob2);
const puddleUniforms={uAge:{value:0},uAlpha:{value:0},uWater:{value:1}};
const puddle=new THREE.Mesh(new THREE.PlaneGeometry(4.6,4.1),new THREE.ShaderMaterial({uniforms:puddleUniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`precision highp float;varying vec2 vUv;uniform float uAge,uAlpha;void main(){vec2 p=(vUv-.5)*2.;float a=atan(p.y,p.x);float r=length(p);float edge=.69+.055*sin(a*7.)+.026*sin(a*17.);float spread=min(1.,max(0.,uAge)*2.8);float cover=1.-smoothstep(edge*spread-.035,edge*spread+.035,r);float ring=pow(max(0.,sin(r*45.-uAge*9.)),22.)*exp(-uAge*1.5);vec3 col=vec3(.50,.61,.52)+ring*.31;gl_FragColor=vec4(col,cover*uAlpha*(.18+ring*.18));}`,transparent:true,depthWrite:false}));puddle.rotation.x=-Math.PI/2;puddle.position.set(.83,.015,.08);scene.add(puddle);
const wetMat=new THREE.MeshStandardMaterial({color:'#42504a',transparent:true,opacity:0,roughness:.13,metalness:.5,depthWrite:false});const wetStand=cylinder(.492,.099,wetMat,stand,0,.059);wetStand.castShadow=false;

function setCaption(){const progress=(lambda-1)/(round.limit-1);const captions=['第一口气最难。','现在更容易了。注意指针。','开始变圆了。','这是很多气球。','橡胶变薄了。','请停下。'];let n=progress<.05?0:progress<.20?1:progress<.43?2:progress<.66?3:progress<.85?4:5;if(water&&progress>.43&&progress<.66)$('caption').textContent='每一口，都更沉一点。';else $('caption').textContent=captions[n];}
function setHUD(){ $('count').textContent=pumps;$('pressure').textContent=pressure.toFixed(1); }
function hideResult(){ $('result').classList.remove('show');$('result').setAttribute('aria-hidden','true');$('result').inert=true; }
function resetRound(seed){
 roundIndex++;const seedValue=seed??crypto.getRandomValues(new Uint32Array(1))[0];round=newSpec(seedValue);pumps=0;lambda=1;pressure=0;gaugeValue=0;gaugeVelocity=0;simTime=0;stroke=null;sway=0;swayVelocity=0;state='ready';burstAge=0;burstSnapshot=null;burstData=null;flickTime=-100;lastShape=-1;
 shaderUniforms.uColor.value.set(round.palette[0]).convertLinearToSRGB();shaderUniforms.uStretch.value=1;shaderUniforms.uWeak.value.set(round.weakU,round.weakT);shaderUniforms.uTear.value=-1;shaderUniforms.uWater.value=+water;
 collarMat.color.set(round.palette[0]);darkLatex.color.set(round.palette[0]).multiplyScalar(.12);
 document.documentElement.style.setProperty('--accent',round.palette[0]);
 $('world').dataset.replayMatch='pending';$('world').dataset.burstFingerprint='';
 if(patternTexture)patternTexture.dispose();patternTexture=makeInk(round.design);shaderUniforms.uPattern.value=patternTexture;
 skinMeshes.concat(inkMeshes).forEach(m=>m.visible=true);balloon.visible=true;balloon.rotation.set(0,0,0);innerWater.visible=water;collar.visible=true;fringe.visible=false;dust.material.opacity=0;droplets.visible=false;waterBlob1.visible=waterBlob2.visible=false;puddleUniforms.uAlpha.value=0;wetMat.opacity=0;
 fragments.forEach(f=>{f.mesh.visible=false;f.active=false;});
 hideResult();$('replay-status').classList.remove('show');$('water').setAttribute('aria-pressed',water);$('specimen-id').textContent='SPECIMEN / '+String(roundIndex).padStart(3,'0');$('specimen-name').textContent=`天然乳胶 · ${water?'水':'空气'}`;$('instruction').innerHTML='<strong>轻触任意位置</strong> 或 <span class="spacebar">SPACE</span> 泵气';setCaption();setHUD();updateSkin(true);resize(true);
}
function pumpAir(){
 if(!ready||state==='burst'||state==='replay'||state==='ended'||stroke)return;
 audio.pump();pumps++;state='pumping';stroke={start:simTime,from:lambda,volume:gasAt(lambda),toVolume:gasAt(lambda)+round.strokeVolume,duration:.57};swayVelocity+=(water?.35:.72);setHUD();
}
function flick(){if(!ready||state==='burst'||state==='replay'||state==='ended')return;audio.flick();flickTime=simTime;flickStrength=.6+smooth(1,round.limit,lambda)*.4;shaderUniforms.uFlick.value=flickTime;shaderUniforms.uFlickStrength.value=flickStrength;swayVelocity+=water?.24:.5;}
function toggleWater(){water=!water;resetRound();}

function prepareBurst(){
 // Sample exactly the frozen skin and world transform where the tear starts.
 balloon.updateMatrixWorld(true);const matrix=balloon.matrixWorld.clone(),random=rng(round.seed^0xA341316C),defs=[];
 for(let i=0;i<round.fragmentCount;i++){
  const u=(i/round.fragmentCount+random()*.06)%1,t=.23+random()*.70;
  const local=new THREE.Vector3(...surface(u,t,lambda,simTime)),pos=local.clone().applyMatrix4(matrix);
  const sphere=(u,t)=>new THREE.Vector3(Math.sin(t*Math.PI)*Math.cos(u*TAU),-Math.cos(t*Math.PI),Math.sin(t*Math.PI)*Math.sin(u*TAU));
  const dist=Math.acos(clamp(sphere(u,t).dot(sphere(round.weakU,round.weakT)),-1,1));
  const normal=new THREE.Vector3(Math.cos(u*TAU),.22+random()*.5,Math.sin(u*TAU)).transformDirection(matrix);
  const speed=3.3+random()*3.5;
  defs.push({u,t,pos:pos.toArray(),vel:normal.multiplyScalar(speed).toArray(),spin:[(random()-.5)*25,(random()-.5)*25,(random()-.5)*25],rotation:[random()*TAU,random()*TAU,random()*TAU],detach:Math.max(0,dist/Math.PI*.15),stretch:1.8+random()*1.3,scale:.6+random()*.55});
 }
 const puffs=[];for(let i=0;i<95;i++){const u=random(),t=.2+random()*.77,local=new THREE.Vector3(...surface(u,t,lambda,simTime)),p=local.clone().applyMatrix4(matrix);puffs.push({p:p.toArray(),v:[(p.x-.83)*.65,(p.y-nozzleY-.7)*.48,(p.z)*.65]});}
 const drops=[];for(let i=0;i<220;i++){
  const u=random(),t=.18+random()*.75,local=new THREE.Vector3(...surface(u,t,lambda,simTime)).multiplyScalar(.93),p=local.applyMatrix4(matrix),a=u*TAU,spray=i<95;
  drops.push({p:p.toArray(),v:[Math.cos(a)*(spray?2.5+random()*3:.3+random()),spray?(random()-.15)*3:-random(),Math.sin(a)*(spray?2.5+random()*3:.3+random())],size:.5+random()*1.3,spray,delay:spray?random()*.1:0});
 }
 return{fragments:defs,puffs,drops};
}
function burst(){
 updateSkin(true);balloon.updateMatrixWorld(true);
 burstSnapshot={positions:positions.slice(),normal:skinGeo.attributes.normal.array.slice(),rotation:balloon.rotation.toArray(),time:simTime,lambda,pressure,pumps,piston:piston.position.y};
 burstData=prepareBurst();state='burst';burstAge=0;stroke=null;audio.pop();innerWater.visible=false;activateBurst();$('caption').textContent=water?'水比空气更诚实。':'最后一口，总是多余的。';
}
function activateBurst(){
 burstTicks=0;
 fragments.forEach((f,i)=>{f.active=false;f.landed=false;f.age=0;f.mesh.visible=false;if(i<burstData.fragments.length){const d=burstData.fragments[i];f.pos.fromArray(d.pos);f.vel.fromArray(d.vel);f.spin.fromArray(d.spin);f.mesh.rotation.fromArray([...d.rotation,'XYZ']);f.mesh.scale.setScalar(d.scale*d.stretch);f.mesh.position.copy(f.pos);}});
 fringe.visible=true;
 burstData.drops.forEach((d,i)=>{dropStates[i]={pos:new THREE.Vector3(...d.p),vel:new THREE.Vector3(...d.v),landed:false,age:0,bounced:false};});
 dust.material.opacity=.38;droplets.visible=water;waterBlob1.visible=waterBlob2.visible=water;puddleUniforms.uAge.value=0;puddleUniforms.uAlpha.value=0;wetMat.opacity=0;
 shaderUniforms.uTear.value=0;
}
function replay(){
 if(!burstSnapshot||state==='replay')return;
 state='replay';burstAge=-.125;replayLead=15;replayAccumulator=0;replaySoundPlayed=false;simTime=burstSnapshot.time;lambda=burstSnapshot.lambda;pressure=burstSnapshot.pressure;pumps=burstSnapshot.pumps;
 positions.set(burstSnapshot.positions);skinGeo.attributes.position.needsUpdate=true;skinGeo.attributes.normal.array.set(burstSnapshot.normal);skinGeo.attributes.normal.needsUpdate=true;
 balloon.rotation.fromArray(burstSnapshot.rotation);skinMeshes.concat(inkMeshes).forEach(m=>m.visible=true);balloon.visible=true;innerWater.visible=water;collar.visible=true;
 activateBurst();shaderUniforms.uTear.value=-1;shadowUniforms.uOpacity.value=.85;fringe.visible=false;waterBlob1.visible=waterBlob2.visible=false;dust.material.opacity=0;droplets.visible=false;hideResult();$('replay-status').classList.add('show');$('caption').textContent='看看那一瞬间。';$('instruction').innerHTML='<strong>同一只气球。同一次撕裂。</strong>';audio.start();audio.tone(42,27,1.5,.08);
}
function finish(){
 state='ended';$('replay-status').classList.remove('show');$('result-title').textContent=water?'溅了。':'爆了。';
 const area=burstSnapshot.lambda**2;$('result-stats').textContent=`${pumps} 泵 · ${area.toFixed(1)}× · ${burstSnapshot.pressure.toFixed(1)} kPa`;
 $('verdict').textContent=round.limit<3.65?'廉价的派对气球。':round.limit>3.88?'重型橡胶。':'一只很有骨气的气球。';
 const prior=water?bestWater:bestAir,isBest=pumps>prior;if(water)bestWater=Math.max(bestWater,pumps);else bestAir=Math.max(bestAir,pumps);
 try{localStorage.setItem(`balloon-test-best-${water?'water':'air'}`,String(water?bestWater:bestAir));}catch{}
 $('best').textContent=`${isBest?'新纪录。 ':''}个人最佳 / ${water?'水':'空气'} ${(water?bestWater:bestAir)} 泵`;
 $('result').inert=false;$('result').classList.add('show');$('result').setAttribute('aria-hidden','false');$('instruction').innerHTML='<strong>R</strong> 再来一次 &nbsp; · &nbsp; <strong>S</strong> 慢动作重播';$('caption').textContent='极限，往往只差一下。';
}

function updateBurst(dt){
 if(burstAge<0){piston.position.y=mix(-.60,0,smooth(-.3,0,burstAge));return;}
 const a=burstAge;
 burstTicks++;
 shaderUniforms.uTear.value=Math.min(Math.PI+.2,a/.16*Math.PI);
 if(a>.17){skinMeshes.concat(inkMeshes).forEach(m=>m.visible=false);collar.visible=false;}
 if(state==='replay'&&!replaySoundPlayed){audio.pop(true);replaySoundPlayed=true;}
 for(let i=0;i<burstData.fragments.length;i++){
  const d=burstData.fragments[i],f=fragments[i];if(a<d.detach)continue;
  if(!f.active){f.active=true;f.mesh.visible=true;}
  f.age+=dt;
  if(!f.landed){
   // Quadratic drag produces the characteristic violent braking of tiny, dense rubber scraps.
   const speed=f.vel.length(),drag=1/(1+speed*2.9*dt);f.vel.multiplyScalar(drag);f.vel.y-=2.2*dt;f.pos.addScaledVector(f.vel,dt);f.mesh.rotation.x+=f.spin.x*dt;f.mesh.rotation.y+=f.spin.y*dt;f.mesh.rotation.z+=f.spin.z*dt;f.spin.multiplyScalar(Math.exp(-dt*.6));
   if(f.pos.y<.045){f.pos.y=.045;if(f.vel.y<-.3&&!f.landed){f.vel.y=-f.vel.y*.19;f.vel.x*=.5;f.vel.z*=.5;f.spin.multiplyScalar(.25);if(state!=='replay')audio.tick();}else{f.landed=true;f.mesh.rotation.x=-Math.PI/2;}}
  }
  const shrink=mix(d.stretch,1,smooth(0,.12,f.age));f.mesh.scale.set(d.scale*shrink,d.scale*shrink,.85);f.mesh.position.copy(f.pos);
 }
 for(let i=0;i<fringeStrips.length;i++){const angle=i/fringeStrips.length*TAU,m=fringeStrips[i],bounce=Math.exp(-a*13)*Math.sin(a*57+i);m.position.set(Math.cos(angle)*.064,.02+Math.sin(i*7)*.012,Math.sin(angle)*.064);m.rotation.set(Math.cos(angle)*(1.12+bounce*.45),-angle,Math.sin(angle)*.85);m.scale.set(.3,.23+.04*Math.sin(i*3),.55);}
 fringe.visible=true;
 const dustFade=Math.max(0,1-a/.75);dust.material.opacity=dustFade*.35;
 for(let i=0;i<burstData.puffs.length;i++){const d=burstData.puffs[i],k=i*3;dustPositions[k]=d.p[0]+d.v[0]*a;dustPositions[k+1]=d.p[1]+d.v[1]*a+a*.12;dustPositions[k+2]=d.p[2]+d.v[2]*a;}dustGeo.attributes.position.needsUpdate=true;
 shadowUniforms.uOpacity.value=Math.max(0,1-a*8);
 if(water){
  innerWater.visible=false;droplets.visible=a<3.8;
  for(let i=0;i<burstData.drops.length;i++){
   const d=burstData.drops[i],s=dropStates[i];if(a<d.delay){dropDummy.scale.setScalar(0);}else{
    s.age+=dt;
    if(!s.landed){s.vel.multiplyScalar(1/(1+s.vel.length()*.07*dt));s.vel.y-=9.81*dt;s.pos.addScaledVector(s.vel,dt);
     // The falling mass splits on the immovable nozzle, then droplets strike the weighted foot.
     const radial=Math.hypot(s.pos.x-.83,s.pos.z);if(radial<.48&&s.pos.y<.15&&s.pos.y>.04&&!s.bounced){s.vel.x+=(s.pos.x-.83)*7;s.vel.z+=s.pos.z*7;s.vel.y=Math.abs(s.vel.y)*.27;s.bounced=true;wetMat.opacity=.25;}
     if(s.pos.y<.027){s.pos.y=.027;if(!s.bounced&&s.vel.y<-1){s.vel.y=-s.vel.y*.28;s.vel.x*=.68;s.vel.z*=.68;s.bounced=true;}else{s.landed=true;}if(state!=='replay')audio.tick();}}
    dropDummy.position.copy(s.pos);dropDummy.scale.set(d.size,d.size*(s.landed?.18:1+Math.min(1.4,Math.abs(s.vel.y)*.12)),d.size);if(s.age>2.2)dropDummy.scale.multiplyScalar(Math.max(0,1-(s.age-2.2)/1.4));}
   dropDummy.updateMatrix();droplets.setMatrixAt(i,dropDummy.matrix);
  }droplets.instanceMatrix.needsUpdate=true;
  const fall=9.81*a*a*.5,centerY=nozzleY+.40*lambda*.85-fall,ground=centerY<.35;
  waterBlob1.visible=waterBlob2.visible=!ground;
  for(let i=0;i<2;i++){const b=i?waterBlob2:waterBlob1;b.position.set(.83+(i?1:-1)*a*.38,Math.max(.2,centerY),0);b.scale.set(.40*lambda*.60*(1-a*.5),.40*lambda*.76*(1+a*.5),.40*lambda*.85);b.rotation.z=(i?1:-1)*a*.2;}
  const impact=Math.sqrt((nozzleY+.40*lambda*.85-.25)*2/9.81);puddleUniforms.uAge.value=Math.max(0,a-impact);puddleUniforms.uAlpha.value=smooth(impact,impact+.2,a);if(a>impact)wetMat.opacity=.28;
 }
 if(burstTicks===120){
  const components=fragments.filter(f=>f.active).flatMap(f=>[...f.pos.toArray(),...f.vel.toArray()]);
  if(water)components.push(...dropStates.flatMap(d=>[...d.pos.toArray(),...d.vel.toArray()]));
  let hash=2166136261;for(const n of components){hash^=Math.round(n*100000);hash=Math.imul(hash,16777619);}const check=(hash>>>0).toString(16);
  if(state==='replay')$('world').dataset.replayMatch=String(check===fingerprint);else{fingerprint=check;$('world').dataset.burstFingerprint=check;}
 }
 if(a>4.6&&state!=='ended')finish();
}

function step(dt){
 if(state==='burst'||state==='replay'||state==='ended'){
  if(state==='replay'){
   replayAccumulator+=dt/12;if(replayAccumulator+1e-10<dt)return;replayAccumulator-=dt;
   if(replayLead>0){replayLead--;burstAge=-replayLead/120;piston.position.y=mix(burstSnapshot.piston+.08,burstSnapshot.piston,smooth(-.125,0,burstAge));return;}
  }
  if(state==='ended'&&burstAge>10)return;
  burstAge+=dt;updateBurst(dt);return;
 }
 simTime+=dt;
 if(stroke){
  const q=(simTime-stroke.start)/stroke.duration;
  // Air flows only during the downward part of the handle travel.
  const flow=smooth(.04,.58,q);lambda=solveGas(mix(stroke.volume,stroke.toVolume,flow));pressure=gent(lambda);
  piston.position.y=q<.58?-.63*smooth(0,.58,q):-.63*(1-smooth(.58,1,q));
  if(lambda>=round.limit){lambda=round.limit;pressure=gent(lambda);updateSkin(true);burst();setHUD();return;}
  if(q>=1){stroke=null;state='ready';piston.position.y=0;setCaption();}
 }
 const target=pressure+(stroke?Math.sin(clamp((simTime-stroke.start)/stroke.duration,0,1)*Math.PI)*.12:0);
 // A damped physical needle, so it can briefly overshoot without faking the Gent reading in the HUD.
 gaugeVelocity+=(target-gaugeValue)*160*dt;gaugeVelocity*=Math.exp(-dt*15);gaugeValue+=gaugeVelocity*dt;
 swayVelocity+=(-sway*(water?19:10)-swayVelocity*(water?2.4:3.8))*dt;sway+=swayVelocity*dt;
}
let lastHosePhase=0;
function render(){
 if(state!=='burst'&&state!=='replay'&&state!=='ended'){
  updateSkin();const drift=reduced?0:Math.sin(simTime*.69)*.016;
  balloon.rotation.z=(reduced?0:sway*.13)+drift;balloon.rotation.x=reduced?0:Math.sin(simTime*.93)*.008+sway*.025;
  shaderUniforms.uStretch.value=lambda*lambda;shaderUniforms.uTime.value=reduced?0:simTime;shaderUniforms.uFlickStrength.value=reduced?0:flickStrength;
  innerWater.position.y=.034*(.34*lambda)*(water?1.76:2.46)*.55;
  shadow.scale.set(.85+lambda*.54,.56+lambda*.40,1);shadowUniforms.uOpacity.value=.85;
  const phase=stroke?Math.sin(clamp((simTime-stroke.start)/stroke.duration,0,1)*TAU)*.5:0;
  if(Math.abs(phase-lastHosePhase)>.025){updateHose(reduced?0:phase);lastHosePhase=phase;}
  setHUD();setCaption();
 }
 if(state==='burst'||state==='replay')gaugeValue*=.94;
 needle.rotation.z=mix(Math.PI*.75,-Math.PI*.75,clamp(gaugeValue/8,0,1));
 updateCamera();renderer.render(scene,camera);
 const canvas=$('world');canvas.dataset.state=state;canvas.dataset.ready=String(ready);canvas.dataset.programs=String(renderer.info.programs?.length);canvas.dataset.mode=water?'water':'air';canvas.dataset.seed=String(round.seed);
}
function cameraGoal(){
 const aspect=innerWidth/innerHeight,tall=aspect<.76,landscape=innerHeight<500&&aspect>1.4;
 const extent=.40*lambda*(water?1.85:2.5)+nozzleY;
 const scale=smooth(1,round.limit,lambda);
 const target=new THREE.Vector3(tall?.16:-.12,1.45+scale*.72,0);
 // The expanding specimen stays below the header and above the caption. The pump remains in frame.
 const dist=tall?11.4+scale*2.1:landscape?9.0+scale*1.6:10.1+scale*.8;
 return{target,position:new THREE.Vector3(target.x+(tall?1.6:2.25),target.y+dist*.28,dist),dist};
}
function updateCamera(immediate=false){const goal=cameraGoal();clockCamera.position.lerp(goal.position,immediate?1:reduced?1:.04);clockCamera.target.lerp(goal.target,immediate?1:reduced?1:.04);camera.position.copy(clockCamera.position);camera.lookAt(clockCamera.target);}
function resize(immediate=false){
 renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 const tall=innerHeight/innerWidth>1.5;pump.position.set(tall?-1.12:-1.75,0,tall?-1.1:.22);updateHose(0);updateCamera(immediate);
}
let suspended=false,frameCount=0,frameSample=0;
document.addEventListener('visibilitychange',()=>{suspended=document.hidden;lastTime=0;accumulator=0;});
function frame(now){requestAnimationFrame(frame);if(!ready||suspended)return;if(!lastTime)lastTime=now;const delta=Math.min((now-lastTime)/1000,.1);lastTime=now;accumulator+=delta;while(accumulator>=1/120){step(1/120);accumulator-=1/120;}render();if(!frameSample)frameSample=now;if(++frameCount>=60){$('world').dataset.fps=(60000/(now-frameSample)).toFixed(1);frameCount=0;frameSample=now;}}
$('water').addEventListener('click',toggleWater);$('flick').addEventListener('click',flick);$('reset').addEventListener('click',()=>resetRound());$('again').addEventListener('click',()=>resetRound());$('replay').addEventListener('click',replay);
$('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;$('sound').setAttribute('aria-pressed',soundEnabled);$('sound').classList.toggle('muted',!soundEnabled);if(soundEnabled)audio.start();audio.mute();});
document.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,a,.result'))return;pumpAir();});
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(e.target.closest('button,a')&&(e.code==='Space'||e.code==='Enter'))return;switch(e.code){case'Space':e.preventDefault();pumpAir();break;case'KeyF':flick();break;case'KeyW':toggleWater();break;case'KeyR':resetRound();break;case'KeyS':replay();break;}});
addEventListener('resize',()=>resize(true));
$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;$('error').textContent='3D 上下文已中断。请刷新页面继续实验。';$('error').classList.add('show');});
// Narrow read-only diagnostics are useful for validating the self-contained export.
window.balloonTest={snapshot:()=>({state,seed:round.seed,mode:water?'water':'air',pumps,lambda,areaStretch:lambda*lambda,pressure,gauge:gaugeValue,burstAge,programs:renderer.info.programs?.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,reduced,ready}),getPressure:(l)=>gent(l),getBurst:()=>burstData?JSON.parse(JSON.stringify(burstData)):null};
async function boot(){
 resetRound();
 // Include every effect, side, blend mode, physical transmission and mesh variant in the warm-up.
 const objects=[...fragments.map(f=>f.mesh),fringe,innerWater,droplets,waterBlob1,waterBlob2];const visibility=objects.map(o=>o.visible);objects.forEach(o=>o.visible=true);
 try{if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);renderer.render(scene,camera);}catch(e){console.error('Shader warm-up failed',e);}
 objects.forEach((o,i)=>o.visible=visibility[i]);ready=true;$('loading').classList.add('done');setTimeout(()=>$('loading').remove(),600);requestAnimationFrame(frame);
}
boot().catch(e=>{console.error(e);$('loading').classList.add('done');$('error').classList.add('show');});
}
