/* Moonwake's hand-painted, hardware-independent arena renderer. */
export class Renderer2D {
  constructor(canvas) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d',{alpha:false});
    if(!this.ctx) throw new Error('Canvas2D unavailable');
    this.time=0; this.w=1; this.h=1; this.scale=20; this.cx=0; this.cy=0;
    this.floor=document.createElement('canvas'); this.resize(canvas.clientWidth||innerWidth,canvas.clientHeight||innerHeight);
  }
  resize(w,h) {
    this.w=w;this.h=h;this.dpr=Math.min(window.devicePixelRatio||1,2);
    this.canvas.width=Math.round(w*this.dpr); this.canvas.height=Math.round(h*this.dpr);
    this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';
    this.scale=Math.min(w/48,h/35); this.cx=w*.5;this.cy=h*.53;
    this.floor.width=this.canvas.width;this.floor.height=this.canvas.height;
    this.paintFloor();
  }
  p(x,z,y=0){return {x:this.cx+(x-z)*this.scale*.82,y:this.cy+(x+z)*this.scale*.42-y*this.scale};}
  aim(clientX,clientY){const r=this.canvas.getBoundingClientRect();const a=(clientX-r.left-this.cx)/(this.scale*.82),b=(clientY-r.top-this.cy)/(this.scale*.42);return{x:(a+b)/2,z:(b-a)/2};}
  poly(c,points,fill,stroke,line=1){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
  ring(c,x,z,r,color,width=1){c.beginPath();const p=this.p(x,z);c.ellipse(p.x,p.y,r*this.scale*1.16,r*this.scale*.594,0,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  tile(c,x,z,r,fill,stroke){this.poly(c,[this.p(x-r,z-r),this.p(x+r,z-r),this.p(x+r,z+r),this.p(x-r,z+r)],fill,stroke);}
  block(c,x,z,w,d,h,top,left,right){const a=this.p(x-w/2,z-d/2,h),b=this.p(x+w/2,z-d/2,h),cc=this.p(x+w/2,z+d/2,h),dd=this.p(x-w/2,z+d/2,h);this.poly(c,[dd,cc,this.p(x+w/2,z+d/2),this.p(x-w/2,z+d/2)],left);this.poly(c,[b,cc,this.p(x+w/2,z+d/2),this.p(x+w/2,z-d/2)],right);this.poly(c,[a,b,cc,dd],top,'rgba(158,206,176,.10)');}
  paintFloor(){
    const c=this.floor.getContext('2d');c.setTransform(this.dpr,0,0,this.dpr,0,0);
    let g=c.createRadialGradient(this.cx,this.cy,10,this.cx,this.cy,Math.max(this.w,this.h)*.7);g.addColorStop(0,'#182a31');g.addColorStop(.6,'#0c1c23');g.addColorStop(1,'#060d14');c.fillStyle=g;c.fillRect(0,0,this.w,this.h);
    const rand=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
    for(let i=0;i<180;i++){c.fillStyle=`rgba(103,165,159,${.03+rand(i)*.12})`;c.beginPath();c.arc(rand(i+311)*this.w,rand(i+822)*this.h,rand(i+19)*1.5+.3,0,7);c.fill();}
    // Floating slab, dressed with individual worn basalt paving stones.
    c.save();c.shadowColor='#000';c.shadowBlur=this.scale*2;c.shadowOffsetY=this.scale;this.block(c,0,0,28.6,28.6,.15,'#263c3e','#111f26','#0d1a23');c.restore();
    this.block(c,0,0,28,28,.12,'#29403e','#1a2c32','#14252c');
    for(let x=-13;x<=13;x++)for(let z=-13;z<=13;z++){
      const n=(x+14)*31+z+14,v=rand(n),border=Math.abs(x)===13||Math.abs(z)===13;
      const fill=border?['#405451','#394f4c','#344947'][Math.floor(v*3)]:['#2a3e3d','#283c3b','#2d4140','#263a3b','#304440'][Math.floor(v*5)];
      this.tile(c,x,z,.483,fill,'rgba(9,22,27,.65)');
      if(v>.72){const a=this.p(x-.38,z-.38),b=this.p(x-.04,z-.15),d=this.p(x+.15,z-.35);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(d.x,d.y);c.strokeStyle='rgba(11,25,28,.45)';c.lineWidth=.7;c.stroke();}
      if(v<.14){let p=this.p(x+.2,z-.1);c.fillStyle='rgba(107,139,85,.15)';c.beginPath();c.ellipse(p.x,p.y,this.scale*.43,this.scale*.18,-.1,0,7);c.fill();}
    }
    this.ring(c,0,0,9.4,'rgba(128,170,139,.2)',this.scale*.06);this.ring(c,0,0,9.65,'rgba(128,170,139,.1)',1);
    this.ring(c,0,0,3.4,'rgba(135,177,151,.22)',1.5);this.ring(c,0,0,3.1,'rgba(135,177,151,.12)',1);
    for(let i=0;i<12;i++){let a=i*Math.PI/6;let x=Math.cos(a)*9.4,z=Math.sin(a)*9.4;const p=this.p(x,z);c.save();c.translate(p.x,p.y);c.scale(1,.52);c.rotate(a+Math.PI/4);c.strokeStyle='rgba(175,197,151,.3)';c.lineWidth=1;c.beginPath();c.moveTo(-3,-6);c.lineTo(3,0);c.lineTo(-3,6);c.moveTo(1,-6);c.lineTo(6,-2);c.stroke();c.restore();}
    const pts=[];for(let i=0;i<8;i++){let a=i*Math.PI/4;pts.push(this.p(Math.cos(a)*2.6,Math.sin(a)*2.6));}this.poly(c,pts,null,'rgba(153,191,157,.14)');
    // Fractured boundary buttresses and luminous perimeter glyphs.
    for(let i=-12;i<=12;i+=3){for(const [x,z]of[[i,-14],[-14,i],[i,14],[14,i]]){this.block(c,x,z,1.35,1.35,.4,'#4b6057','#293d3c','#213337');}}
    for(let i=0;i<55;i++){let a=rand(i+899)*Math.PI*2,r=16+rand(i+121)*5;let x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<14.3&&Math.abs(z)<14.3)continue;this.block(c,x,z,.2+rand(i+3)*.6,.3+rand(i+4)*.5,.2+rand(i+8)*.5,'#273d3a','#15282d','#11232b');}
    // Moss and fine grasses over the rim.
    for(let i=0;i<100;i++){let side=i%4,v=rand(i+300)*27-13.5,x=side<2?v:(side===2?-13.7:13.7),z=side>=2?v:(side===0?-13.7:13.7),p=this.p(x,z);c.strokeStyle=i%3?'#456b51':'#68805a';c.lineWidth=.8;c.beginPath();c.moveTo(p.x,p.y);c.quadraticCurveTo(p.x-2,p.y-3,p.x-3,p.y-this.scale*(.15+rand(i)*.3));c.moveTo(p.x,p.y);c.lineTo(p.x+3,p.y-this.scale*.2);c.stroke();}
  }
  shadow(c,x,z,r=0.6,a=.3){let p=this.p(x,z);c.fillStyle=`rgba(0,8,15,${a})`;c.beginPath();c.ellipse(p.x,p.y,r*this.scale,r*this.scale*.42,0,0,7);c.fill();}
  crystal(c,x,z,h=1.7,color='#6edac6'){
    let p=this.p(x,z);const s=this.scale;c.save();c.shadowColor=color;c.shadowBlur=s*.7;this.poly(c,[{x:p.x,y:p.y-h*s},{x:p.x+s*.28,y:p.y-h*s*.45},{x:p.x,y:p.y-s*.1},{x:p.x-s*.27,y:p.y-h*s*.43}],color);c.shadowBlur=0;this.poly(c,[{x:p.x,y:p.y-h*s},{x:p.x,y:p.y-s*.1},{x:p.x-s*.27,y:p.y-h*s*.43}],'#318c89');c.strokeStyle='#b9ffde';c.lineWidth=1;c.beginPath();c.moveTo(p.x,p.y-h*s);c.lineTo(p.x+s*.28,p.y-h*s*.45);c.stroke();c.restore();
  }
  ruin(c,o){let x=o.x,z=o.z,r=o.r||.8;this.shadow(c,x,z,r*1.4);this.block(c,x,z,r*1.65,r*1.65,.3,'#66756a','#344948','#293d41');let n=Math.abs(Math.round(x*3+z*7));if(n%3===0){this.crystal(c,x,z,1.8);this.crystal(c,x+.42,z+.2,.8,'#91e1b5');}else{const h=1.6+(n%5)*.17;this.block(c,x,z,r*1.15,r*1.15,h,'#718179','#465b56','#344a49');this.block(c,x,z,r*1.45,r*1.45,h+.15,'#819082','#4b6059','#3a504e');let p=this.p(x,z,h+.17);c.strokeStyle='#abc0a2';c.lineWidth=1;c.beginPath();c.moveTo(p.x-r*this.scale*.5,p.y);c.lineTo(p.x+r*this.scale*.3,p.y+r*this.scale*.2);c.stroke();let q=this.p(x,z+.57*r,h*.6);c.fillStyle='#5f957b';c.fillRect(q.x-2,q.y-4,3,8);}}
  ranger(c,p){
    const s=this.scale,pt=this.p(p.x,p.z),walk=Math.sin(this.time*11)*.07,ang=p.angle||0;
    this.shadow(c,p.x,p.z,.66,.43);c.save();c.translate(pt.x,pt.y);c.scale(s,s);
    if(p.invuln>0&&Math.floor(this.time*18)%2)c.globalAlpha=.5;
    // Split cape, boots, leather tunic, arms, sculpted hood and face.
    const path=(pts,f,st)=>this.poly(c,pts.map(([x,y])=>({x,y})),f,st,.035);
    path([[-.26,-1.05],[-.57,-.18],[-.24,-.31],[.03,-.12],[.36,-.24],[.26,-1.12]],'#3c7e70','#173b3b');
    path([[-.21,-.45],[-.22,.02],[-.04,.07],[.02,-.4]],'#293337');path([[.08,-.45],[.13,.02],[.34,.02],[.27,-.5]],'#253137');
    path([[-.25,-.06],[-.33,.07],[-.04,.09],[-.04,-.04]],'#766347');path([[.12,-.06],[.12,.09],[.42,.07],[.32,-.06]],'#766347');
    path([[-.28,-1.05],[-.31,-.48],[.28,-.43],[.3,-1.03],[0,-1.2]],'#668675','#203d3c');path([[-.28,-.6],[.29,-.56],[.29,-.44],[-.3,-.48]],'#443c31');path([[-.05,-.61],[.08,-.6],[.08,-.47],[-.05,-.48]],'#d8b976');
    c.save();c.translate(-.25,-.97);c.rotate(-.35);path([[-.09,0],[-.12,.4],[.04,.45],[.11,.03]],'#658b79');path([[-.12,.33],[-.1,.51],[.07,.5],[.06,.33]],'#d4b98c');c.restore();
    path([[-.36,-1.13],[-.27,-1.6],[.03,-1.81],[.33,-1.5],[.38,-1.15],[.05,-.99]],'#3c7467','#173c3a');
    path([[-.2,-1.37],[0,-1.57],[.24,-1.37],[.17,-1.1],[-.07,-1.07]],'#172e31');path([[-.1,-1.38],[.19,-1.39],[.15,-1.12],[-.03,-1.11]],'#d1b18a');path([[-.3,-1.43],[.03,-1.67],[.3,-1.41],[.1,-1.49],[-.08,-1.38]],'#79a58a');
    c.fillStyle='#1b3133';c.fillRect(.02,-1.32,.055,.04);c.fillRect(.14,-1.32,.045,.04);path([[-.29,-1.04],[.16,-.92],[.3,-1.07],[.09,-.83],[-.28,-.95]],'#80ac88');
    // Bow rotates toward the cursor but keeps an elegant readable silhouette.
    const ax=Math.sin(ang)-Math.cos(ang),ay=(Math.sin(ang)+Math.cos(ang))*.51;let ba=Math.atan2(ay,ax);c.save();c.translate(.07,-.85);c.rotate(ba);if(p.weapon==='rock'){c.strokeStyle='#6e553b';c.lineWidth=.12;c.beginPath();c.moveTo(.25,0);c.lineTo(.92,0);c.stroke();path([[.72,-.23],[1,-.29],[1.2,-.12],[1.14,.19],[.84,.27],[.68,.1]],'#9eaa9a','#536b62');path([[.72,-.23],[1,-.29],[1.2,-.12],[.93,-.04]],'#d0d1ad');c.strokeStyle='#c7efad';c.lineWidth=.035;c.beginPath();c.moveTo(.9,-.2);c.lineTo(.97,-.06);c.lineTo(.87,.07);c.lineTo(.99,.19);c.stroke();c.fillStyle='#d8bd96';c.fillRect(.36,-.07,.19,.14);}else if(p.weapon==='magic'){c.strokeStyle='#7b6c95';c.lineWidth=.08;c.beginPath();c.moveTo(.15,0);c.lineTo(.91,0);c.stroke();c.shadowColor='#a5b7ff';c.shadowBlur=14;path([[.85,0],[1.02,-.19],[1.2,0],[1.02,.19]],'#b5c4ff','#e1e8ff');c.shadowBlur=0;c.strokeStyle='#a8bceb';c.lineWidth=.026;c.beginPath();c.arc(1.02,0,.28,-1.2,1.2);c.stroke();c.fillStyle='#d8bd96';c.fillRect(.36,-.07,.19,.14);}else{c.strokeStyle='#d4ab68';c.lineWidth=.075;c.beginPath();c.moveTo(.55,-.48);c.quadraticCurveTo(1.03,0,.55,.48);c.stroke();c.strokeStyle='#cce6c5';c.lineWidth=.018;c.beginPath();c.moveTo(.55,-.48);c.lineTo(.43,0);c.lineTo(.55,.48);c.stroke();c.strokeStyle='#a78250';c.lineWidth=.045;c.beginPath();c.moveTo(.18,0);c.lineTo(.98,0);c.stroke();path([[1.08,0],[.92,-.05],[.92,.05]],'#d6e7d3');c.fillStyle='#d8bd96';c.fillRect(.36,-.07,.19,.14);}c.restore();
    c.restore();
  }
  enemy(c,e){
    let type=e.type,s=this.scale*(type==='boss'?2:type==='brute'?1.4:type==='wisp'?.85:1),p=this.p(e.x,e.z),bob=type==='wisp'?Math.sin(this.time*4+e.x)*.15:0;
    this.shadow(c,e.x,e.z,type==='boss'?1.1:type==='brute'?.8:.5,.38);c.save();c.translate(p.x,p.y-bob*this.scale);c.scale(s,s);const path=(pts,f,st)=>this.poly(c,pts.map(([x,y])=>({x,y})),f,st,.035);
    if(type==='wisp'){c.shadowColor='#9bb1ff';c.shadowBlur=15;path([[-.42,-.7],[-.2,-1.27],[.18,-1.18],[.43,-.71],[.28,-.3],[.36,-.05],[.04,-.28],[-.2,-.05],[-.15,-.35]],'#748abc');c.shadowBlur=0;path([[-.2,-.88],[.18,-.89],[.27,-.58],[-.19,-.57]],'#24374c');c.fillStyle='#c5ffea';c.fillRect(-.11,-.77,.07,.065);c.fillRect(.11,-.77,.07,.065);}
    else{
      let boss=type==='boss',brute=type==='brute',body=boss?'#796283':brute?'#88745c':'#ad6254',dark=boss?'#392f49':brute?'#51483d':'#633f3d';
      path([[-.3,-.49],[-.37,-.03],[-.12,0],[.01,-.46]],dark);path([[.12,-.48],[.17,0],[.42,-.03],[.32,-.53]],dark);
      path([[-.4,-1.16],[-.5,-.59],[-.17,-.38],[.4,-.47],[.47,-1.11],[0,-1.38]],body,'#352e35');
      path([[-.37,-1.13],[-.68,-.94],[-.64,-.43],[-.43,-.37],[-.35,-.73]],dark);path([[.38,-1.12],[.67,-.95],[.66,-.43],[.47,-.39],[.36,-.76]],dark);
      path([[-.31,-1.11],[-.35,-1.48],[.02,-1.66],[.35,-1.43],[.26,-1.05],[0,-.98]],body);path([[-.26,-1.46],[-.48,-1.8],[-.45,-1.38],[-.23,-1.26]],'#c4b391');path([[.24,-1.46],[.49,-1.8],[.45,-1.37],[.25,-1.26]],'#b1a387');
      path([[-.26,-1.33],[-.05,-1.29],[-.09,-1.2],[-.23,-1.23]],'#ffe49a');path([[.07,-1.29],[.27,-1.33],[.22,-1.22],[.1,-1.2]],'#ffe49a');path([[-.14,-1.12],[.16,-1.12],[.09,-1.04],[-.07,-1.04]],'#2a2630');
      if(brute||boss){path([[-.5,-1.12],[-.62,-1.36],[-.28,-1.28],[-.17,-1.06]],'#8b9591');path([[.3,-1.25],[.63,-1.33],[.54,-1.04],[.22,-1.02]],'#778985');c.strokeStyle='#504436';c.lineWidth=.13;c.beginPath();c.moveTo(.62,-.43);c.lineTo(.91,-1.05);c.stroke();path([[.69,-1.06],[.8,-1.42],[1.12,-1.29],[1.16,-1.01],[.93,-.85]],'#8b9290','#4d5e60');}
      if(boss){path([[-.25,-1.55],[-.31,-1.95],[-.07,-1.75],[.05,-2.05],[.18,-1.75],[.35,-1.94],[.27,-1.55]],'#c8a76e');c.fillStyle='#b4ffde';c.beginPath();c.arc(0,-.85,.095,0,7);c.fill();}
    }
    c.restore();if(e.hp<e.maxHp){const width=this.scale*(type==='boss'?2.3:1.1),y=p.y-s*2.1;c.fillStyle='#182129';c.fillRect(p.x-width/2,y,width,3);c.fillStyle=type==='boss'?'#d7b781':'#e2917e';c.fillRect(p.x-width/2,y,width*Math.max(0,e.hp/e.maxHp),3);}
  }
  render(game,dt=0){
    this.time=Number(game.time)||this.time+dt;const c=this.ctx;c.setTransform(1,0,0,1,0,0);c.drawImage(this.floor,0,0);c.setTransform(this.dpr,0,0,this.dpr,0,0);const s=this.scale;
    // Quiet perimeter lanterns; light is kept behind actors for clarity.
    for(const [x,z]of[[-12,-12],[12,-12],[-12,12],[12,12]]){const p=this.p(x,z);let g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,s*2.5);g.addColorStop(0,'rgba(107,213,177,.12)');g.addColorStop(1,'rgba(107,213,177,0)');c.fillStyle=g;c.fillRect(p.x-s*2.5,p.y-s*2.5,s*5,s*5);this.ring(c,x,z,.6,'#5b9d87',1);}
    for(const e of game.enemies||[])if(e.tell>0){const r=e.type==='boss'?3.5:e.type==='brute'?2:1.3,p=this.p(e.x,e.z);c.fillStyle='rgba(255,106,91,.13)';c.beginPath();c.ellipse(p.x,p.y,r*s*1.16,r*s*.594,0,0,7);c.fill();this.ring(c,e.x,e.z,r,'rgba(255,132,105,.8)',2);}
    for(const e of game.effects||[]){const life=Math.max(0,e.life/(e.maxLife||.5)),r=(e.r||.7)*(1+(1-life)*1.4);c.save();c.globalAlpha=life;if(e.kind==='chain'){const a=this.p(e.x,e.z,e.y||.8),b=this.p(e.tx??e.x,e.tz??e.z,.8);c.shadowColor='#aabaff';c.shadowBlur=14;c.strokeStyle='#c4d6ff';c.lineWidth=2.5;c.beginPath();c.moveTo(a.x,a.y);for(let j=1;j<8;j++){const t=j/8,off=Math.sin(j*13.7+this.time*30)*s*.23;c.lineTo(a.x+(b.x-a.x)*t+off,a.y+(b.y-a.y)*t-off);}c.lineTo(b.x,b.y);c.stroke();c.shadowBlur=0;c.strokeStyle='#f0f6ff';c.lineWidth=1;c.stroke();}else if(e.kind==='rock'){const rr=(e.r||2.5)*(1-life*.7);this.ring(c,e.x,e.z,rr,'#dfcf9a',s*.09);this.ring(c,e.x,e.z,rr*.8,'#789c83',s*.04);for(let j=0;j<9;j++){const a=j*2.399,xx=e.x+Math.cos(a)*rr,zz=e.z+Math.sin(a)*rr;this.block(c,xx,zz,.16,.18,.15+(1-life)*.3,'#b8b79a','#6c7b68','#52675e');}}else if(e.kind==='warning'||e.kind==='shockwave'||e.kind==='nova'||e.kind==='ring'||e.kind==='dash'){this.ring(c,e.x,e.z,r,e.kind==='warning'?'#f99679':'#b4f4cb',s*.08);}else{let p=this.p(e.x,e.z,e.y||.4);c.strokeStyle=e.kind==='heal'?'#a7f3ae':'#f6d69b';c.lineWidth=2;for(let i=0;i<7;i++){const a=i*2.399+(e.x||0),rr=(1-life)*s*1.6;c.beginPath();c.moveTo(p.x+Math.cos(a)*rr*.5,p.y+Math.sin(a)*rr*.5);c.lineTo(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr);c.stroke();}}c.restore();}
    const actors=[];for(const o of game.obstacles||[])actors.push({d:o.x+o.z,draw:()=>this.ruin(c,o)});
    for(const v of game.pickups||[])actors.push({d:v.x+v.z,draw:()=>{this.shadow(c,v.x,v.z,.4,.2);const p=this.p(v.x,v.z,.45+Math.sin(this.time*3+v.x)*.1),color=v.kind==='heal'?'#8ae2a2':v.kind==='power'?'#efb679':'#9ec3ff';c.save();c.shadowBlur=18;c.shadowColor=color;this.poly(c,[{x:p.x,y:p.y-s*.33},{x:p.x+s*.24,y:p.y},{x:p.x,y:p.y+s*.33},{x:p.x-s*.24,y:p.y}],color);c.shadowBlur=0;c.fillStyle='#f1f2ce';if(v.kind==='heal'){c.fillRect(p.x-s*.035,p.y-s*.15,s*.07,s*.3);c.fillRect(p.x-s*.15,p.y-s*.035,s*.3,s*.07);}c.restore();}});
    if(game.player)actors.push({d:game.player.x+game.player.z+.01,draw:()=>this.ranger(c,game.player)});
    for(const e of game.enemies||[])actors.push({d:e.x+e.z,draw:()=>this.enemy(c,e)});
    for(const q of game.projectiles||[])actors.push({d:q.x+q.z+.2,draw:()=>{let p=this.p(q.x,q.z,q.y??.8);c.save();c.translate(p.x,p.y);const a=q.angle||0;c.rotate(Math.atan2((Math.sin(a)+Math.cos(a))*.42,(Math.sin(a)-Math.cos(a))*.82));if(q.kind==='arrow'){c.strokeStyle='#f6dba0';c.lineWidth=2;c.beginPath();c.moveTo(-s*.55,0);c.lineTo(s*.35,0);c.stroke();this.poly(c,[{x:s*.45,y:0},{x:s*.23,y:-s*.08},{x:s*.23,y:s*.08}],'#fcf5d5');c.strokeStyle='#b6d7af';c.beginPath();c.moveTo(-s*.42,0);c.lineTo(-s*.55,-s*.1);c.moveTo(-s*.4,0);c.lineTo(-s*.53,s*.1);c.stroke();}else{c.shadowColor=q.enemy?'#f4867e':'#a8f5d7';c.shadowBlur=12;c.fillStyle=q.kind==='rock'?'#9c9985':q.enemy?'#f6a08d':'#b6f8df';c.beginPath();c.arc(0,0,s*(q.kind==='rock'?.19:.12),0,7);c.fill();}c.restore();}});
    actors.sort((a,b)=>a.d-b.d);for(const a of actors)a.draw();
    // Drifting gold spores, deliberately sparse around the combat area.
    c.save();for(let i=0;i<24;i++){const x=Math.sin(i*73.3)*12,z=Math.cos(i*32.8)*12,y=.9+((this.time*.13+i*.17)%2.4),p=this.p(x,z,y);c.globalAlpha=(Math.sin(this.time*1.5+i)*.5+.5)*.5;c.fillStyle=i%3?'#bad79b':'#ffcf8d';c.beginPath();c.arc(p.x+Math.sin(this.time+i)*4,p.y,1.1,0,7);c.fill();}c.restore();
    let vign=c.createRadialGradient(this.cx,this.cy,Math.min(this.w,this.h)*.3,this.cx,this.cy,Math.max(this.w,this.h)*.7);vign.addColorStop(0,'rgba(3,10,17,0)');vign.addColorStop(1,'rgba(3,10,17,.65)');c.fillStyle=vign;c.fillRect(0,0,this.w,this.h);
  }
  dispose(){this.floor.width=1;this.floor.height=1;}
}
export default Renderer2D;
