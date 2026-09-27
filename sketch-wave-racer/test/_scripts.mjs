// 导引实验：8fps 满舵键盘下，什么样的"玩家剧本"能稳定跑一圈？
// 输出对比：lap 是否计、resets、圈速。产品代码只读。
global.window={addEventListener(){},devicePixelRatio:1};
global.document={getElementById:()=>null,createElement:()=>({getContext:()=>({fillRect(){},set fillStyle(v){}}),width:0,height:0})};
global.localStorage={getItem:()=>null,setItem(){}};
global.performance={now:()=>0};
const {Track,HALF_WIDTH}=await import('../src/track/Track.js');
const {RaceState}=await import('../src/race/RaceState.js');
const {BoatController}=await import('../src/boat/BoatController.js');
const track=new Track();

function run(script, label, fps=8){
  const group={position:{copy(){},set(){}},rotation:{set(){}},scale:{set(){}},add(){},traverse(){}};
  const keys=new Set();
  const boat=new BoatController(group,{isDown:a=>keys.has(a)});
  const start=track.startLine;
  const p=start.pos.clone().addScaledVector(start.tangent,-6);
  boat.setPose(p, Math.atan2(-start.tangent.x,-start.tangent.z));
  const race=new RaceState(track,[{id:'p',label:'P',color:0,boat}]);
  const e=race.entries[0];
  const dt=1/fps;
  const st={phase:0,errS:0};
  const resets=[];const laps=[];
  for(let i=0;i<Math.ceil(240*fps)&&!e.finished;i++){
    const near=track.nearest(boat.position.x,boat.position.z);
    script(e,near,boat,keys,st,i);
    boat.update(dt,i*dt); race.update(dt);
    if(race.event?.type==='reset')resets.push(+race.time.toFixed(1));
    if(race.event?.type==='lap')laps.push(+race.time.toFixed(1));
  }
  console.log(label.padEnd(44), 'laps='+JSON.stringify(laps), 'resets='+resets.length, e.finished?'FIN':'');
  return e;
}

// S1: 外法线判定转向（tangent=(-tz,tx) 恒左法线）+ 前瞻 25m + 内线偏 6
run((e,near,boat,keys,st)=>{
  const la=25, inner=6;
  const tp=track.pointAt(near.t+la/track.length);
  const tt=track.tangentAt(near.t+la/track.length);
  // 左法线 = (-tz, tx)
  const tx=tp.x-tt.z*inner, tz=tp.y!==undefined?tp.z+tt.x*inner:0;
  const want=Math.atan2(-(tx-boat.position.x),-(tz-boat.position.z));
  let err=Math.atan2(Math.sin(want-boat.heading),Math.cos(want-boat.heading));
  keys.clear();
  if(Math.abs(err)<0.3)keys.add('throttle');
  if(err>0.04)keys.add('right'); else if(err<-0.04)keys.add('left');
},'S1 la=25 inner=6 leftnormal 满舵');

// S2: 同 S1 但弯道降速（|err|>0.25 松油门）
run((e,near,boat,keys,st)=>{
  const la=25, inner=8;
  const tp=track.pointAt(near.t+la/track.length);
  const tt=track.tangentAt(near.t+la/track.length);
  const tx=tp.x-tt.z*inner, tz=tp.z+tt.x*inner;
  const want=Math.atan2(-(tx-boat.position.x),-(tz-boat.position.z));
  let err=Math.atan2(Math.sin(want-boat.heading),Math.cos(want-boat.heading));
  keys.clear();
  if(Math.abs(err)<0.25)keys.add('throttle');
  if(err>0.04)keys.add('right'); else if(err<-0.04)keys.add('left');
},'S2 la=25 inner=8 弯收油');

// S3: 前瞻 35m，内偏 10
run((e,near,boat,keys,st)=>{
  const la=35, inner=10;
  const tp=track.pointAt(near.t+la/track.length);
  const tt=track.tangentAt(near.t+la/track.length);
  const tx=tp.x-tt.z*inner, tz=tp.z+tt.x*inner;
  const want=Math.atan2(-(tx-boat.position.x),-(tz-boat.position.z));
  let err=Math.atan2(Math.sin(want-boat.heading),Math.cos(want-boat.heading));
  keys.clear();
  if(Math.abs(err)<0.3)keys.add('throttle');
  if(err>0.04)keys.add('right'); else if(err<-0.04)keys.add('left');
},'S3 la=35 inner=10');

// S4: 沿中心线 t+前瞻 直接追"线点+内偏"，且预转向：目标取更前方
run((e,near,boat,keys,st)=>{
  const la=14, inner=7;
  const tp=track.pointAt(near.t+la/track.length);
  const tt=track.tangentAt(near.t+la/track.length);
  const tx=tp.x-tt.z*inner, tz=tp.z+tt.x*inner;
  const want=Math.atan2(-(tx-boat.position.x),-(tz-boat.position.z));
  let err=Math.atan2(Math.sin(want-boat.heading),Math.cos(want-boat.heading));
  st.errS+=(err-st.errS)*0.4;
  keys.clear();
  if(Math.abs(st.errS)<0.35)keys.add('throttle');
  // 比例点按舵
  st.phase+=Math.min(1,Math.abs(st.errS)*1.6);
  if(st.phase>=1){st.phase-=1; if(st.errS>0.02)keys.add('right'); else if(st.errS<-0.02)keys.add('left');}
},'S4 la=14 inner=7 比例舵');

// S5: S2 但 30fps（真实软渲染帧率）
run((e,near,boat,keys,st)=>{
  const la=25, inner=8;
  const tp=track.pointAt(near.t+la/track.length);
  const tt=track.tangentAt(near.t+la/track.length);
  const tx=tp.x-tt.z*inner, tz=tp.z+tt.x*inner;
  const want=Math.atan2(-(tx-boat.position.x),-(tz-boat.position.z));
  let err=Math.atan2(Math.sin(want-boat.heading),Math.cos(want-boat.heading));
  keys.clear();
  if(Math.abs(err)<0.25)keys.add('throttle');
  if(err>0.04)keys.add('right'); else if(err<-0.04)keys.add('left');
},'S5 =S2 @30fps', 30);
