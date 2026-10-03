/* A single continuous scene. SVG narrates; Three.js gives the data physical depth. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), T=window.THREE, M=window.HandwritingModel;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  const cyan='#88f5df',violet='#b6a0ff',dim='#596a8b';
  const chapters=[
    {start:0,end:7,name:'笔迹',en:'HANDWRITING',title:'故事，从一笔开始。',subtitle:'你看到一个数字。计算机看到一条轨迹。'},
    {start:7,end:16,name:'像素',en:'SAMPLING',title:'把一笔，拆成 196 个数。',subtitle:'笔迹等比居中，再用 14 × 14 个网格采样。'},
    {start:16,end:24,name:'二值',en:'THRESHOLD',title:'每个像素，做一次选择。',subtitle:'覆盖率达到 0.20，记为 1；否则，记为 0。'},
    {start:24,end:38,name:'卷积',en:'CONVOLUTION',title:'一个小窗口，寻找笔画。',subtitle:'对应相乘，再相加。让横边缘与竖边缘显现。'},
    {start:38,end:47,name:'特征',en:'FEATURE MAPS',title:'同一个数字，不同的线索。',subtitle:'两种滤波器，产生两张 12 × 12 的响应图。'},
    {start:47,end:57,name:'池化',en:'MAX POOLING',title:'留下最强的，带走更少的。',subtitle:'每四个响应保留最大值，把两张图压缩成 72 个特征。'},
    {start:57,end:68,name:'比较',en:'COMPARISON',title:'像不像，现在可以计算。',subtitle:'用同样的方法处理十个手写模板，逐项比较特征距离。'},
    {start:68,end:77,name:'答案',en:'CLASSIFICATION',title:'答案，回到这个数字。',subtitle:'距离越小，越接近。把十个距离变成相对分类分数。'}
  ];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state={time:reduced?3:0,playing:!reduced,sample:1,speed:1,chapter:-1,wasPlaying:false};
  let data=M.classify(M.templates[1]),width=1,height=1,compact=false,lastStamp=0,lastSvg=-1,renderer;
  const stage=$('stage'),overlay=$('diagram'),scene=new T.Scene();
  try {renderer=new T.WebGLRenderer({canvas:$('world'),alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;}
  catch(e){$('engine-error').hidden=false;state.playing=false;}
  const camera=new T.OrthographicCamera(-7,7,3.5,-3.5,.1,100);camera.position.set(0,0,16);
  scene.add(new T.AmbientLight(0xa9c8ff,1.5));const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(-4,7,10);scene.add(key);const fill=new T.DirectionalLight(0x9d8bff,2.5);fill.position.set(7,-2,4);scene.add(fill);
  const dummy=new T.Object3D(),color=new T.Color(),base=new T.Color('#162337'),geometry=new T.BoxGeometry(1,1,1);
  function makeGrid(n,tint){
    const group=new T.Group(),material=new T.MeshStandardMaterial({color:0xffffff,roughness:.36,metalness:.15,transparent:true,opacity:0,depthWrite:false});
    const mesh=new T.InstancedMesh(geometry,material,n*n);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(mesh);scene.add(group);return {group,mesh,material,n,tint,values:[],visibleAmount:0};
  }
  const input=makeGrid(14,cyan),horizontal=makeGrid(12,cyan),vertical=makeGrid(12,violet),poolH=makeGrid(6,cyan),poolV=makeGrid(6,violet);
  const grids=[input,horizontal,vertical,poolH,poolV];
  function setValues(grid,values,max=1){grid.values=values;grid.maximum=max;for(let i=0;i<values.length;i++){color.copy(base).lerp(new T.Color(grid.tint),values[i]/max);grid.mesh.setColorAt(i,color);}grid.mesh.instanceColor.needsUpdate=true;}
  function updateValues(){setValues(input,data.gray);setValues(horizontal,data.maps[0],3);setValues(vertical,data.maps[1],3);setValues(poolH,data.pooled[0],3);setValues(poolV,data.pooled[1],3);}
  function gridPose(grid,position,rotation,scale,opacity,reveal=1,depth=.05,scatter=0){
    grid.group.position.set(...position);grid.group.rotation.set(...rotation);grid.group.scale.setScalar(scale);grid.material.opacity=clamp(opacity);grid.group.visible=opacity>.001;
    if(!grid.group.visible)return;
    const n=grid.n,cell=.3;
    for(let i=0;i<n*n;i++){
      const v=grid.values[i]/grid.maximum,a=smooth(reveal*1.4-i/(n*n)*.4),x=(i%n-(n-1)/2)*cell,y=((n-1)/2-Math.floor(i/n))*cell;
      dummy.position.set(x*(1+scatter),y*(1+scatter),v*depth*.5);dummy.scale.set(.274*a,.274*a,(.045+v*depth)*a);dummy.rotation.set(0,0,0);dummy.updateMatrix();grid.mesh.setMatrixAt(i,dummy.matrix);
    }
    grid.mesh.instanceMatrix.needsUpdate=true;
  }
  const nodeMaterial=new T.MeshStandardMaterial({color:0x88f5df,emissive:0x2b5b5d,emissiveIntensity:.8,roughness:.35,transparent:true,opacity:0});
  const features=new T.InstancedMesh(geometry,nodeMaterial,72);scene.add(features);
  const packetGeometry=new T.SphereGeometry(.025,8,6),packets=[];
  for(let i=0;i<12;i++){const mesh=new T.Mesh(packetGeometry,new T.MeshBasicMaterial({color:i%2?0xb6a0ff:0x88f5df,transparent:true}));scene.add(mesh);packets.push(mesh);}
  const starsGeometry=new T.BufferGeometry(),starPositions=[];
  let seed=7341;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<160;i++)starPositions.push((random()-.5)*23,(random()-.5)*9,-4-random()*3);
  starsGeometry.setAttribute('position',new T.Float32BufferAttribute(starPositions,3));const stars=new T.Points(starsGeometry,new T.PointsMaterial({color:0x466488,size:.013,transparent:true,opacity:.48}));scene.add(stars);
  const guide=new T.GridHelper(30,60,0x1b2b44,0x132034);guide.rotation.x=Math.PI/2;guide.position.z=-4;guide.material.transparent=true;guide.material.opacity=.13;scene.add(guide);
  function pathD(points){return points.map((p,i)=>(i?'L':'M')+p.map(n=>n.toFixed(2)).join(' ')).join(' ');}
  const localInk=(strokes,w,color='currentColor')=>strokes.map(s=>`<path d="${pathD(s)}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  $('digits').innerHTML=M.labels.map((digit,i)=>`<button data-digit="${i}" aria-label="演示手写数字 ${digit}" aria-pressed="${i===state.sample}"><svg viewBox="0 0 280 280" aria-hidden="true">${localInk(M.samples[i],16)}</svg></button>`).join('');
  $('chapter-marks').innerHTML=chapters.map((c,i)=>`<button data-chapter="${i}" aria-label="第 ${i+1} 步：${c.name}"><span class="chapter-number">0${i+1} </span>${c.name}</button>`).join('');
  function svgText(x,y,text,size=12,fill='#cbd6ec',anchor='middle',opacity=1){return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${size}" text-anchor="${anchor}" opacity="${opacity}" style="fill:${fill}">${text}</text>`;}
  function project(x,y,z=0,group=null){const p=new T.Vector3(x,y,z);if(group)p.applyMatrix4(group.matrixWorld);p.project(camera);return [(p.x*.5+.5)*width,(-p.y*.5+.5)*height];}
  function line(x1,y1,x2,y2,fill=cyan,opacity=.4,dash=''){return `<path d="M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}" fill="none" stroke="${fill}" stroke-opacity="${opacity}" stroke-width="1" ${dash?`stroke-dasharray="${dash}"`:''}/>`;}
  function gridRect(grid,row,col,span,stroke=cyan){
    const n=grid.n,xx=(col-n/2)*.3,yy=(n/2-row)*.3,points=[[xx,yy],[xx+span*.3,yy],[xx+span*.3,yy-span*.3],[xx,yy-span*.3]].map(([x,y])=>project(x,y,.23,grid.group));
    return `<path d="${pathD(points)}Z" fill="${stroke}" fill-opacity=".12" stroke="${stroke}" stroke-width="1.5"/>`;
  }
  function projectedInk(strokes,amount,opacity,group=input.group,offset=[0,0],scale=1,strokeWidth=3.7){
    return strokes.map((s,i)=>{
      const p=s.map(([x,y])=>project(((x/280-.5)*4.2)*scale+offset[0],((.5-y/280)*4.2)*scale+offset[1],.3,group));
      const draw=clamp(amount*strokes.length-i);
      return `<path d="${pathD(p)}" fill="none" stroke="${cyan}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-draw}" opacity="${opacity}" filter="url(#ink-glow)"/>`;
    }).join('');
  }
  function chapterAt(t){return Math.min(7,chapters.findIndex(c=>t<c.end)===-1?7:chapters.findIndex(c=>t<c.end));}
  function chapterChange(index){
    if(state.chapter===index)return;state.chapter=index;const c=chapters[index];
    $('chapter-index').textContent=`0${index+1} / 08`;$('chapter-kicker').textContent=`0${index+1} / ${c.en}`;$('scene-title').textContent=c.title;$('scene-subtitle').textContent=c.subtitle;
    $('narration').classList.remove('enter');void $('narration').offsetWidth;$('narration').classList.add('enter');
    $('chapter-marks').querySelectorAll('button').forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    $('scene-status').textContent=`第 ${index+1} 步：${c.name}。${c.subtitle}`;$('previous').disabled=index===0;$('next').disabled=index===7;
  }
  function caption(label,equation,note){$('math-label').textContent=label;$('equation').textContent=equation;$('math-note').textContent=note;}
  function format(t){return `00:${Math.floor(t).toString().padStart(2,'0')}`.replace('00:77','01:17').replace(/00:([6-7][0-9])/,(_,s)=>'01:'+String(Number(s)-60).padStart(2,'0'));}
  const pose=(p=[0,0,0],r=[0,0,0],s=1,o=0)=>({p,r,s,o});
  function targetPoses(ch,q){
    const b=smooth(q/.25),poses=[pose(),pose(),pose(),pose(),pose()];
    if(ch===0){poses[0]=pose([0,0,0],[0,0,0],compact?1:1.1,0);}
    if(ch===1){poses[0]=pose([0,0,0],[mix(0,.12,q),mix(0,-.14,q),0],1,.93);}
    if(ch===2){poses[0]=pose([0,0,0],[.04,-.04,0],1,.95);}
    if(ch===3){poses[0]=pose(compact?[0,1.1,0]:[-2.7,0,.3],[0,-.07,0],compact?.66:.82,.97);poses[1]=pose(compact?[-1.15,-1.4,0]:[1.8,.98,0],[.05,-.08,0],compact?.46:.51,.92);poses[2]=pose(compact?[1.15,-1.4,-.1]:[3,-1.05,-.3],[.05,-.08,0],compact?.46:.51,.92);}
    if(ch===4){poses[0]=pose(compact?[-1,1.05,.7]:[-2.3,0,1],[.22,-.55,-.05],compact?.73:.9,.42);poses[1]=pose([0,compact?-.05:.1,0],[.22,-.55,-.05],compact?.8:1,.96);poses[2]=pose(compact?[1,-1.15,-.8]:[2.1,.2,-1],[.22,-.55,-.05],compact?.8:1,.96);}
    if(ch===5){poses[1]=pose([-1.6,1.05,-.2],[.12,-.12,0],compact?.5:.62,.72);poses[2]=pose([1.6,1.05,-.2],[.12,.12,0],compact?.5:.62,.72);poses[3]=pose([-1.6,-1.15,.25],[0,-.1,0],compact?.85:1.05,.98);poses[4]=pose([1.6,-1.15,.25],[0,.1,0],compact?.85:1.05,.98);}
    if(ch===6){poses[3]=pose(compact?[-.8,1.5,0]:[-3.5,0,0],[0,0,0],.5,0);poses[4]=pose(compact?[.8,1.5,0]:[-2.3,0,0],[0,0,0],.5,0);}
    if(ch===7){poses[0]=pose(compact?[0,height<240?1.15:.8,0]:[-2.3,0,0],[0,0,0],compact?(height<240?.6:.85):1,0);}
    return poses;
  }
  function animateScene(ch,q){
    const current=targetPoses(ch,q),prev=targetPoses(Math.max(0,ch-1),1),trans=smooth(q/.17);
    const reveal=ch===1?smooth(q/.48):1;
    for(let i=0;i<grids.length;i++){
      const a=prev[i],b=current[i],p=a.p.map((v,k)=>mix(v,b.p[k],trans)),r=a.r.map((v,k)=>mix(v,b.r[k],trans));
      gridPose(grids[i],p,r,mix(a.s,b.s,trans),mix(a.o,b.o,trans),i===0?reveal:1,ch===4?.3:.055,ch===1?(1-smooth(q/.42))*.18:0);
    }
    const featureOpacity=ch===6?smooth(q/.2):ch===7?1-smooth(q/.18):0;
    features.visible=featureOpacity>.001;nodeMaterial.opacity=featureOpacity;
    for(let i=0;i<72&&features.visible;i++){
      const x=compact?(i%12-5.5)*.15:-3.55+(i%12)*.16,y=compact?1.9-Math.floor(i/12)*.18:.7-Math.floor(i/12)*.25;
      dummy.position.set(x,y,.08+data.features[i]*.025);dummy.scale.set(.105,.105,.1+data.features[i]*.03);dummy.updateMatrix();features.setMatrixAt(i,dummy.matrix);color.set(i<36?cyan:violet);features.setColorAt(i,color);
    }
    if(features.visible){features.instanceMatrix.needsUpdate=true;features.instanceColor.needsUpdate=true;}
    const active=Math.min(9,Math.floor(q*10));
    packets.forEach((m,i)=>{m.visible=ch===6;if(!m.visible)return;const t=(q*8+i/12)%1;const a=compact?[-.8+(i%12)*.15,1.3]:[-1.8,.65-i*.115];const b=candidateWorld(active);m.position.set(mix(a[0],b[0],t),mix(a[1],b[1],t)+Math.sin(t*Math.PI)*.2,.2);m.material.opacity=Math.sin(t*Math.PI)*.9;});
    scene.updateMatrixWorld(true);
  }
  function candidateWorld(i){return compact?[(i%5-2)*.95,-.2-Math.floor(i/5)*1.5]:[.1+(i%5)*1.15,.85-Math.floor(i/5)*1.9];}
  function updateSVG(ch,q){
    const enter=smooth(q/.14),exit=ch===7?1:1-smooth((q-.95)/.05),p=project(0,0,0,input.group);
    let out=`<defs><filter id="ink-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><linearGradient id="beam"><stop stop-color="${cyan}" stop-opacity=".05"/><stop offset="1" stop-color="${violet}" stop-opacity=".8"/></linearGradient></defs>`;
    if(ch===0){
      out+=projectedInk(M.samples[state.sample],smooth(q/.65),1,input.group,[0,0],1,compact?5:7);
      const r=Math.min(width,height)*.42;
      out+=`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="none" stroke="${cyan}" stroke-opacity=".07" stroke-dasharray="2 10"/>`;
      out+=svgText(p[0],Math.min(height-5,p[1]+r+15),`HANDWRITTEN ${M.labels[state.sample]}  /  ${M.samples[state.sample].length} 笔`,10,dim);
      caption('01 · 手写输入',`一笔一画 → ${M.samples[state.sample].reduce((s,a)=>s+a.length,0)} 个轨迹点 (x, y)`,'连续的手写笔迹，是后面每一步计算的起点。');
    }
    if(ch===1){
      const morph=smooth(q/.32),strokes=M.samples[state.sample].map((s,i)=>s.map((p,j)=>p.map((v,k)=>mix(v,data.normalized.strokes[i][j][k],morph))));
      out+=projectedInk(strokes,1,1-smooth(q/.62),input.group,[0,0],1,5);
      const chosen=data.gray.findIndex(v=>v>0&&v<1),r=Math.floor(chosen/14),c=chosen%14;
      out+=gridRect(input,r,c,1);
      const pos=project((c-6.5)*.3,(6.5-r)*.3,.1,input.group);
      if(!compact){const ay=Math.max(22,pos[1]-35),ax=Math.min(width-55,pos[0]+89);out+=line(pos[0]+8,pos[1],ax-4,ay+5);out+=svgText(ax,ay,data.gray[chosen].toFixed(2),16,cyan,'start');}
      const b=data.normalized.bounds;
      caption('02 · 居中与采样',`14 × 14 = 196　　当前格：${Math.round(data.gray[chosen]*25)} / 25 = ${data.gray[chosen].toFixed(2)}`,`等比缩放并居中；每格取 25 个点，计算笔迹覆盖率。缩放系数 ${data.normalized.scale.toFixed(2)}。`);
    }
    if(ch===2){
      const index=Math.min(195,Math.floor(q*196)),r=Math.floor(index/14),c=index%14;out+=gridRect(input,r,c,1);
      const pixelSize=Math.abs(project(.3,0)[0]-project(0,0)[0]);
      if(pixelSize>=17){data.pixels.forEach((v,i)=>{if(i>index)return;const a=project((i%14-6.5)*.3,(6.5-Math.floor(i/14))*.3,.15,input.group);out+=svgText(a[0],a[1]+3,String(v),10,v?'#061b23':'#58708c');});}
      caption('03 · 二值化',`${data.gray[index].toFixed(2)} ${data.gray[index]>=.2?'≥':'<'} 0.20　→　${data.pixels[index]}`,`第 ${r+1} 行、第 ${c+1} 列。所有网格使用同一个阈值，得到 0 和 1。`);
    }
    if(ch===3){
      const filter=q<.5?0:1,local=(q% .5)*2,index=Math.min(143,Math.floor(local*144)),r=Math.floor(index/12),c=index%12;
      out+=gridRect(input,r,c,3,filter?violet:cyan);out+=gridRect(filter?vertical:horizontal,r,c,1,filter?violet:cyan);
      const a=project((c-5.5)*.3,(5.5-r)*.3,.1,input.group),b=project((c-5.5)*.3,(5.5-r)*.3,.1,(filter?vertical:horizontal).group);
      out+=line(a[0],a[1],b[0],b[1],filter?violet:cyan,.35,'4 5');
      for(const [g,label] of [[input,'14 × 14 输入'],[horizontal,'横边缘 · 12 × 12'],[vertical,'竖边缘 · 12 × 12']]){const pos=project(0,-g.n*.15-.23,0,g.group);out+=svgText(pos[0],pos[1],label,10,g.tint);}
      const kernel=M.kernels[filter].flat(),patch=Array.from({length:9},(_,i)=>data.pixels[(r+Math.floor(i/3))*14+c+i%3]),terms=patch.map((v,i)=>v*kernel[i]),sum=data.signed[filter][index];
      patch.forEach((v,i)=>{const pp=project((c+i%3-6.5)*.3,(6.5-r-Math.floor(i/3))*.3,.25,input.group);out+=svgText(pp[0],pp[1]+3,String(v),9,'#e7ffff');});
      const kernelX=compact?width-60:width*.47,kernelY=compact?12:height*.12,cell=compact?14:19;
      out+=svgText(kernelX+cell,Math.max(10,kernelY-8),'3 × 3',10,filter?violet:cyan);
      kernel.forEach((v,i)=>{out+=`<rect x="${kernelX+i%3*cell}" y="${kernelY+Math.floor(i/3)*cell}" width="${cell-2}" height="${cell-2}" rx="2" fill="${filter?violet:cyan}" fill-opacity=".1"/>`+svgText(kernelX+i%3*cell+(cell-2)/2,kernelY+Math.floor(i/3)*cell+cell*.7,String(v),10,filter?violet:cyan);});
      const positive=patch.filter((v,i)=>kernel[i]===1),negative=patch.filter((v,i)=>kernel[i]===-1);
      caption(`04 · ${filter?'竖':'横'}边缘滤波器 / 窗口 ${index+1} of 144`,`| (${positive.join('+')}) − (${negative.join('+')}) | = |${sum}| = ${Math.abs(sum)}`,'像素乘以对应权重，再求和、取绝对值。公式省略权重为 0 的项。');
    }
    if(ch===4){
      for(const [g,label] of [[input,'输入图像'],[horizontal,'横边缘响应'],[vertical,'竖边缘响应']]){const pos=project(0,-g.n*.15-.25,0,g.group);out+=svgText(pos[0],pos[1],label,11,g.tint);}
      caption('05 · 特征分层','1 张输入　→　2 张响应图　→　2 × 12 × 12 个数','立方体的高度对应响应强度 0～3；空间展开只为展示，计算值没有变化。');
    }
    if(ch===5){
      const index=Math.min(35,Math.floor(q*36)),r=Math.floor(index/6)*2,c=index%6*2,indices=[r*12+c,r*12+c+1,(r+1)*12+c,(r+1)*12+c+1];
      out+=gridRect(horizontal,r,c,2)+gridRect(vertical,r,c,2,violet)+gridRect(poolH,Math.floor(index/6),index%6,1)+gridRect(poolV,Math.floor(index/6),index%6,1,violet);
      for(const [a,b] of [[horizontal,poolH],[vertical,poolV]]){const p1=project(0,-1.8,0,a.group),p2=project(0,1,0,b.group);out+=line(p1[0],p1[1],p2[0],p2[1],a.tint,.5,'3 4');const pp=project(0,-1.15,0,b.group);out+=svgText(pp[0],pp[1],'6 × 6',11,b.tint);}
      const values=indices.map(i=>data.maps[0][i]);caption('06 · 最大池化',`max(${values.join(', ')}) = ${Math.max(...values)}　　36 + 36 = 72`,'高亮区域：2 × 2 窗口、步幅 2。两张 6 × 6 图按行展开，拼成 72 个特征。');
    }
    if(ch===6){
      const active=Math.min(9,Math.floor(q*10)),start=compact?project(0,1.4):project(-1.8,0),labelPos=compact?project(0,2.2):project(-2.6,1.25);
      out+=svgText(labelPos[0],labelPos[1],'72 维特征',11,cyan);
      M.labels.forEach((digit,i)=>{const c=candidateWorld(i),p=project(c[0],c[1]);out+=line(start[0],start[1],p[0],p[1],i===active?cyan:dim,i===active?.5:.1);const s=compact?36:49;out+=`<g transform="translate(${p[0]-s/2} ${p[1]-s/2}) scale(${s/280})" opacity="${i===active?1:.38}">${localInk(M.samples[i],12,i===active?cyan:'#93a5ca')}</g>`;out+=svgText(p[0],p[1]+s*.78,`D = ${data.distances[i]}`,10,i===active?cyan:dim);});
      const diff=data.features.slice(0,3).map((v,i)=>`(${v}−${M.templates[active].features[i]})²`).join(' + ');
      caption(`07 · 与手写 ${M.labels[active]} 比较`,`${diff} + … = ${data.distances[active]}`,'将 72 项平方差相加。输入与十个模板都经过完全相同的处理。');
    }
    if(ch===7){
      out+=projectedInk(data.normalized.strokes,1,enter,input.group,[0,0],1,compact?5:7);
      const winner=data.winners[0],x=compact?width*.12:width*.58,y=compact?Math.min(height*.72,height-60):height*.09,bw=compact?width*.76:width*.22;
      if(compact){
        const gap=bw/10;M.labels.forEach((digit,i)=>{const px=x+i*gap+gap/2,h=36*data.probabilities[i]*enter;out+=`<rect x="${px-7}" y="${y+36-h}" width="14" height="${Math.max(1,h)}" rx="2" fill="${i===winner?cyan:dim}" opacity=".8"/>`;out+=svgText(px,y+54,String(digit),10,i===winner?cyan:dim);});
        out+=svgText(width/2,Math.max(12,y-12),`手写 ${M.labels[winner]} · 相对分数 ${(data.probabilities[winner]*100).toFixed(1)}%`,12,cyan);
      }else{
        const gap=Math.min(25,height*.079);M.labels.forEach((digit,i)=>{const yy=y+i*gap;out+=svgText(x-17,yy+10,String(digit),12,i===winner?cyan:dim);out+=`<rect x="${x}" y="${yy}" width="${bw}" height="12" rx="2" fill="#ffffff06"/><rect x="${x}" y="${yy}" width="${Math.max(1,bw*data.probabilities[i]*enter)}" height="12" rx="2" fill="${i===winner?cyan:dim}"/>`;out+=svgText(x+bw+12,yy+10,`${(data.probabilities[i]*100).toFixed(1)}%`,11,i===winner?cyan:dim,'start');});
      }
      caption('08 · 相对分类分数',`p(${M.labels[winner]}) = exp(−${data.distances[winner]}/12) / Σ exp(−Dⱼ/12) = ${(data.probabilities[winner]*100).toFixed(1)}%`,'温度固定为 12。十类分数合计 100%；这是固定模板的教学模型，不是通用 OCR。');
    }
    overlay.innerHTML=out;
  }
  function render(force=false){
    const ch=chapterAt(state.time),c=chapters[ch],q=clamp((state.time-c.start)/(c.end-c.start));chapterChange(ch);
    if(ch===2){const index=Math.floor(q*196);for(let i=0;i<196;i++){color.copy(base).lerp(new T.Color(cyan),i<=index?data.pixels[i]:data.gray[i]);input.mesh.setColorAt(i,color);}input.mesh.instanceColor.needsUpdate=true;}
    else if(ch>=3&&input.values!==data.pixels)setValues(input,data.pixels);
    else if(ch<2&&input.values!==data.gray)setValues(input,data.gray);
    animateScene(ch,q);if(renderer)renderer.render(scene,camera);
    if(force||Math.abs(state.time-lastSvg)>.025){updateSVG(ch,q);lastSvg=state.time;}
    $('timeline').value=state.time;$('timeline').style.setProperty('--pct',`${state.time/77*100}%`);$('timecode').innerHTML=`${format(state.time)} <span>/ 01:17</span>`;
    $('play').textContent=state.playing?'Ⅱ':state.time>=77?'↺':'▶';$('play').setAttribute('aria-label',state.playing?'暂停动画':state.time>=77?'重播动画':'播放动画');
    $('film').dataset.chapter=String(ch);$('film').dataset.time=state.time.toFixed(2);$('film').dataset.renderer=renderer?'threejs':'unavailable';
  }
  function resize(){const rect=stage.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);compact=width<600;const aspect=width/height,worldH=compact?Math.max(5.8,5.6/aspect):Math.max(5.8,10.5/aspect),worldW=worldH*aspect;camera.left=-worldW/2;camera.right=worldW/2;camera.top=worldH/2;camera.bottom=-worldH/2;camera.updateProjectionMatrix();if(renderer)renderer.setSize(width,height,false);overlay.setAttribute('viewBox',`0 0 ${width} ${height}`);render(true);}
  function seek(t){state.time=clamp(t,0,77);render(true);}
  $('digits').addEventListener('click',e=>{const b=e.target.closest('[data-digit]');if(!b)return;state.sample=Number(b.dataset.digit);data=M.classify(M.templates[state.sample]);updateValues();state.time=0;state.chapter=-1;state.playing=!reduced;document.querySelectorAll('[data-digit]').forEach((el,i)=>el.setAttribute('aria-pressed',String(i===state.sample)));render(true);});
  $('play').addEventListener('click',()=>{if(state.time>=77)state.time=0;state.playing=!state.playing;render(true);});
  function jumpChapter(index){state.playing=false;const c=chapters[index];let q=index===0?.82:.36;if(index===3){const hit=data.maps[0].findIndex((v,i)=>i>=55&&v>0);if(hit>=0)q=(hit+.5)/288;}seek(c.start+(c.end-c.start)*q);}
  $('previous').addEventListener('click',()=>jumpChapter(Math.max(0,state.chapter-1)));
  $('next').addEventListener('click',()=>jumpChapter(Math.min(7,state.chapter+1)));
  $('chapter-marks').addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b)jumpChapter(Number(b.dataset.chapter));});
  $('timeline').addEventListener('input',e=>{state.playing=false;seek(Number(e.target.value));});
  $('speed').addEventListener('change',e=>state.speed=Number(e.target.value));
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('film').requestFullscreen();}catch{ $('scene-status').textContent='当前浏览器没有启用全屏；可继续在此窗口观看。';}});
  document.addEventListener('keydown',e=>{if(e.target.matches('input,select,button'))return;if(e.code==='Space'){e.preventDefault();$('play').click();}if(e.key==='ArrowRight'){e.preventDefault();$('next').click();}if(e.key==='ArrowLeft'){e.preventDefault();$('previous').click();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){state.playing=false;render(true);}});
  function loop(stamp){const dt=lastStamp?Math.min(.08,(stamp-lastStamp)/1000):0;lastStamp=stamp;if(state.playing){state.time=Math.min(77,state.time+dt*state.speed);if(state.time===77)state.playing=false;render();}requestAnimationFrame(loop);}
  new ResizeObserver(resize).observe(stage);updateValues();resize();requestAnimationFrame(loop);
})();
