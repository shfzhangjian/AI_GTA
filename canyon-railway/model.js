export const STATIONS = [
  {id:'pine', name:'松谷镇', x:-11,z:1, kind:'小镇', makes:'grain', accepts:['wood','ore'], color:'#6797ab'},
  {id:'canyon',name:'红岩镇',x:0,z:1,kind:'中心城镇',makes:'mail',accepts:['grain','wood','ore'],color:'#d18a4e'},
  {id:'forest',name:'松林木场',x:-12,z:-8,kind:'林场',makes:'wood',accepts:['mail'],color:'#68946c'},
  {id:'mine',name:'铜溪矿场',x:11,z:-7,kind:'矿场',makes:'ore',accepts:['wood','grain','mail'],color:'#a77359'},
  {id:'ranch',name:'金穗牧场',x:-4,z:10,kind:'农场',makes:'grain',accepts:['mail','wood'],color:'#cca34d'},
  {id:'silver',name:'银泉镇',x:13,z:7,kind:'河畔小镇',makes:'mail',accepts:['grain','wood','ore'],color:'#6e9c95'},
];
export const GOODS={grain:{name:'粮食',price:75,color:'#d4ad54'},wood:{name:'木材',price:90,color:'#99633c'},ore:{name:'铜矿',price:120,color:'#a4745c'},mail:{name:'邮件',price:55,color:'#e1dfbe'}};
export const CONTRACTS=[{id:'wood',name:'新镇的第一批木材',desc:'将木材运到红岩镇，帮助小镇扩建。',good:'wood',to:'canyon',amount:12,reward:2200},{id:'grain',name:'矿工的午餐',desc:'将粮食送往铜溪矿场。',good:'grain',to:'mine',amount:16,reward:2800},{id:'ore',name:'穿越峡谷的铜矿',desc:'把铜矿运过河流，送到银泉镇。',good:'ore',to:'silver',amount:18,reward:3600}];
export const key=(x,z)=>`${x},${z}`;
export const coords=k=>k.split(',').map(Number);
export const riverX=z=>6+Math.sin(z*.23)*1.2;
export const isRiver=(x,z)=>Math.abs(x-riverX(z))<1.15;
export const inside=(x,z)=>x>=-18&&x<=18&&z>=-13&&z<=13;
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
export const LANDMARKS=[[-47,-29,6,10],[-36,-34,7,12],[-23,-39,7,9],[-4,-34,6,11],[12,-38,5,10],[39,-34,7,11],[53,-21,6,13],[54,1,6,10],[52,25,7,11],[38,39,8,13],[16,41,6,8],[-20,40,5,7],[-49,20,6,12],[-56,-3,7,13],[-63,-25,10,16]];
export const blocked=(x,z)=>LANDMARKS.some(([lx,lz,r])=>Math.hypot(x*2.8-lx,z*2.8-lz)<r+.6)||STATIONS.some(s=>{
  const dx=x-s.x,dz=z-s.z,town=['pine','canyon','silver'].includes(s.id);
  return (dx>=-2&&dx<=2&&dz>=-3&&dz<=-1)||(['pine','canyon'].includes(s.id)&&Math.abs(dx)<=2&&dz>=2&&dz<=3)||(town&&dx===3&&dz>=-2&&dz<=-1)||(town&&dx===-3&&dz===2)||(s.id==='ranch'&&dx>=2&&dx<=4&&dz>=-2&&dz<=-1);
});
export function newGame(){
  const tracks={};for(const s of STATIONS)for(let dx=-3;dx<=3;dx++)tracks[key(s.x+dx,s.z)]='rail';for(let x=-11;x<=0;x++)tracks[key(x,1)]='rail';
  return {version:1,money:6800,score:0,elapsed:0,day:1,tracks,stocks:Object.fromEntries(STATIONS.map(s=>[s.id,24])),trains:[{id:1,name:'拓荒者 01',from:'pine',to:'canyon',progress:0,direction:1,dwell:1,cargo:0,good:'grain',level:1,condition:100,deliveries:0,status:'装货中'}],contracts:{wood:0,grain:0,ore:0},claimed:[],deliveries:0,revenue:0,spent:0,production:0,nextId:2,won:false};
}
export function railPath(state,start,end){
  const first=key(start.x,start.z),goal=key(end.x,end.z);if(!state.tracks[first]||!state.tracks[goal])return null;
  const queue=[first],prev=new Map([[first,null]]);
  for(let i=0;i<queue.length;i++){const k=queue[i];if(k===goal){const path=[];for(let n=k;n;n=prev.get(n))path.push(coords(n));return path.reverse();}const [x,z]=coords(k);for(const [dx,dz] of dirs){const n=key(x+dx,z+dz);if(state.tracks[n]&&!prev.has(n)){prev.set(n,k);queue.push(n);}}}return null;
}
export function planTrack(state,start,end,bridge=false){
  const first=key(start.x,start.z),goal=key(end.x,end.z);
  if(!inside(start.x,start.z)||!inside(end.x,end.z)||blocked(end.x,end.z))return {error:'这里无法铺设铁路，请选择空地或车站。'};
  if(!state.tracks[first]&&!STATIONS.some(s=>s.x===start.x&&s.z===start.z))return {error:'请从现有铁轨或车站开始铺设。'};
  const open=[first],cost=new Map([[first,0]]),prev=new Map([[first,null]]);let found=false;
  while(open.length){open.sort((a,b)=>cost.get(a)+dist(a)-cost.get(b)-dist(b));const k=open.shift();if(k===goal){found=true;break;}const [x,z]=coords(k);for(const [dx,dz] of dirs){const nx=x+dx,nz=z+dz,n=key(nx,nz);if(!inside(nx,nz)||blocked(nx,nz)||(!bridge&&isRiver(nx,nz))||(dz!==0&&STATIONS.some(s=>(s.x===x&&s.z===z)||(s.x===nx&&s.z===nz))))continue;const parent=prev.get(k),[px,pz]=parent?coords(parent):[x-dx,z-dz],turn=(x-px!==dx||z-pz!==dz)?.48:0;const c=cost.get(k)+(state.tracks[n]?0.15:isRiver(nx,nz)?4:1)+turn;if(c<(cost.get(n)??Infinity)){cost.set(n,c);prev.set(n,k);if(!open.includes(n))open.push(n);}}}
  function dist(k){const [x,z]=coords(k);return (Math.abs(x-end.x)+Math.abs(z-end.z))*.15;}
  if(!found)return {error:bridge?'路线无法到达，请换一个位置。':'路线需要跨河。请改用「铁路桥」工具。'};
  const path=[];for(let n=goal;n;n=prev.get(n))path.push(coords(n));path.reverse();
  const fresh=path.filter(([x,z])=>!state.tracks[key(x,z)]),price=fresh.reduce((n,[x,z])=>n+(isRiver(x,z)?240:60),0);
  return {path,fresh,price,bridges:fresh.filter(([x,z])=>isRiver(x,z)).length};
}
export function buildTrack(state,plan){
  if(!plan||plan.error||!plan.fresh?.length)return {error:'请先选择一段新路线。'};
  if(plan.price>state.money)return {error:'资金不足，等待运输收入后再试。'};
  for(const [x,z] of plan.fresh)state.tracks[key(x,z)]=isRiver(x,z)?'bridge':'rail';state.money-=plan.price;state.spent+=plan.price;state.score+=plan.fresh.length*5;return {ok:true};
}
export function removeTrack(state,x,z){
  const k=key(x,z);if(!state.tracks[k])return {error:'这里没有铁轨。'};
  if(STATIONS.some(s=>s.x===x&&s.z===z))return {error:'车站轨道需要保留。'};
  const old=state.tracks[k];delete state.tracks[k];
  if(state.trains.some(t=>!railPath(state,STATIONS.find(s=>s.id===t.from),STATIONS.find(s=>s.id===t.to)))){state.tracks[k]=old;return {error:'这段轨道正在用于运营。请先调整列车路线。'};}
  const refund=old==='bridge'?120:30;state.money+=refund;return {ok:true,refund};
}
export function setRoute(state,t,from,to){
  if(from===to)return {error:'请选择两个不同的车站。'};
  const a=STATIONS.find(s=>s.id===from),b=STATIONS.find(s=>s.id===to);
  if(!a||!b||!railPath(state,a,b))return {error:'两站还未连通，请先修建铁路。'};
  if(!b.accepts.includes(a.makes)&&!a.accepts.includes(b.makes))return {error:'这两站没有可运输的供需组合。'};
  Object.assign(t,{from,to,progress:0,direction:1,cargo:0,good:a.makes,dwell:2,status:'装货中'});return {ok:true};
}
export function buyTrain(state,from='pine',to='canyon'){
  const price=1800+Math.max(0,state.trains.length-1)*600;
  if(state.trains.length>=6)return {error:'车队已满：最多运营 6 列火车。'};
  if(state.money<price)return {error:'资金不足，继续运输可以赚取金币。'};
  const t={id:state.nextId,name:`拓荒者 ${String(state.nextId).padStart(2,'0')}`,level:1,condition:100,deliveries:0};const result=setRoute(state,t,from,to);if(result.error)return result;
  state.nextId++;state.trains.push(t);state.money-=price;state.spent+=price;return {ok:true,train:t};
}
export function upgradeTrain(state,t){const price=t.level*1600;if(t.level>=3)return {error:'这列火车已经达到最高等级。'};if(state.money<price)return {error:'资金不足。'};state.money-=price;state.spent+=price;t.level++;t.condition=100;return {ok:true};}
export function repairTrain(state,t){const price=Math.ceil((100-t.condition)*8);if(price===0)return {error:'列车状态良好，无需保养。'};if(state.money<price)return {error:'资金不足。'};state.money-=price;state.spent+=price;t.condition=100;return {ok:true,price};}
export function claimContract(state,id){const c=CONTRACTS.find(c=>c.id===id);if(!c||state.claimed.includes(id)||state.contracts[id]<c.amount)return {error:'合同尚未完成或奖励已领取。'};state.money+=c.reward;state.score+=500;state.claimed.push(id);return {ok:true,reward:c.reward};}
export function tick(state,dt){
  const events=[];if(!(dt>0)||!Number.isFinite(dt))return events;
  state.elapsed+=dt;state.day=1+Math.floor(state.elapsed/45);state.production+=dt;
  while(state.production>=5){state.production-=5;for(const s of STATIONS)state.stocks[s.id]=Math.min(80,state.stocks[s.id]+3);}
  for(const t of state.trains){
    const a=STATIONS.find(s=>s.id===t.from),b=STATIONS.find(s=>s.id===t.to),path=railPath(state,a,b);
    if(!path){t.status='等待接通';continue;}
    const source=t.direction===1?a:b,target=t.direction===1?b:a;
    if(t.condition<=0){t.status='需要保养';continue;}
    if(t.dwell>0){t.dwell=Math.max(0,t.dwell-dt);t.status='装卸货物';if(t.dwell===0){t.good=source.makes;t.cargo=target.accepts.includes(source.makes)?Math.min(state.stocks[source.id],4+t.level*2):0;state.stocks[source.id]-=t.cargo;}continue;}
    t.status=t.cargo?'运输中':'返程中';t.condition=Math.max(0,t.condition-dt*.014);
    t.progress+=dt*(1.12+t.level*.24)*(t.condition<20?.65:1)/Math.max(1,path.length-1);
    if(t.progress>=1){
      if(t.cargo>0&&target.accepts.includes(t.good)){const income=t.cargo*GOODS[t.good].price;state.money+=income;state.revenue+=income;state.deliveries+=t.cargo;t.deliveries++;state.score+=t.cargo*15;
        for(const c of CONTRACTS)if(c.good===t.good&&c.to===target.id)state.contracts[c.id]+=t.cargo;
        events.push({type:'delivery',income,amount:t.cargo,good:t.good,to:target.id,train:t.id});
      }t.progress=0;t.direction*=-1;t.cargo=0;t.dwell=2.8;t.status='装卸货物';
    }
  }
  if(!state.won&&state.claimed.length===CONTRACTS.length&&STATIONS.every(s=>railPath(state,STATIONS[0],s))){state.won=true;events.push({type:'win'});}
  return events;
}
export function restore(raw){
  try{const s=typeof raw==='string'?JSON.parse(raw):raw;if(s?.version!==1||!Number.isFinite(s.money)||s.money<0||!Array.isArray(s.trains)||!s.trains.length||s.trains.length>6||!s.tracks||typeof s.tracks!=='object'||!Array.isArray(s.claimed))return null;
    if(Object.entries(s.tracks).some(([k,v])=>!/^[-\d]+,[-\d]+$/.test(k)||!inside(...coords(k))||!['rail','bridge'].includes(v)))return null;
    if(s.trains.some(t=>![t.progress,t.condition,t.level,t.direction,t.dwell,t.cargo].every(Number.isFinite)||!STATIONS.some(a=>a.id===t.from)||!STATIONS.some(a=>a.id===t.to)||t.from===t.to||t.progress<0||t.progress>1||t.level<1||t.level>3||Math.abs(t.direction)!==1))return null;
    if(!s.stocks||STATIONS.some(a=>!Number.isFinite(s.stocks[a.id]))||!s.contracts||CONTRACTS.some(c=>!Number.isFinite(s.contracts[c.id]))||![s.elapsed,s.production,s.score,s.deliveries,s.nextId,s.revenue,s.spent].every(Number.isFinite))return null;return s;
  }catch{return null;}
}
