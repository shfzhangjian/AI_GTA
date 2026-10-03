import {dockPose, parkingPose, pickupPose, workPose, waitingPose, arrivalMotion, departureMotion, forkMotion, sampleMotion, moveAlong} from './traffic.js';
export const PRODUCTS = [
  {id:'box',name:'标准纸箱 · 中号',en:'Cardboard Box',description:'中号瓦楞纸箱',color:0xd2aa75,unit:'箱',weight:12},
  {id:'container',name:'周转塑料箱',en:'Plastic Container',description:'可循环使用的塑料周转箱',color:0x5478eb,unit:'箱',weight:18},
  {id:'helmet',name:'工业安全帽',en:'Safety Helmet',description:'工业作业头部防护用品',color:0xf6c456,unit:'箱',weight:8},
  {id:'tape',name:'包装胶带',en:'Packing Tape',description:'货物封装用胶带',color:0xe8bd85,unit:'箱',weight:10},
  {id:'led',name:'发光二极管照明面板',en:'LED Panel',description:'节能照明面板',color:0xe1d7ba,unit:'箱',weight:24},
  {id:'gloves',name:'丁腈防护手套',en:'Nitrile Gloves',description:'耐磨防护手套',color:0x5c83e8,unit:'箱',weight:9},
  {id:'frozen',name:'冷冻食品',en:'Frozen Produce',description:'低温储运食品',color:0x9dcfc7,unit:'箱',weight:28},
  {id:'water',name:'瓶装饮用水',en:'Spring Water',description:'瓶装饮用水',color:0xc4dee8,unit:'箱',weight:32}
];
export const SITES = [
  {id:'WH-01',name:'河畔物流中心',en:'Riverside Hub',cn:'河畔物流中心',type:'城市配送仓',address:'新泽西州纽瓦克市河滨路 12 号',capacity:1800,stock:1412,docks:3,forks:3,w:17,d:10,h:4.8,roof:0x265ce0,products:['box','container','helmet','tape'],outbound:23,putaway:15,onTime:96.6},
  {id:'WH-02',name:'北门分拨中心',en:'Northgate DC',cn:'北门分拨中心',type:'区域分拨仓',address:'新泽西州纽瓦克市北门大道 48 号',capacity:4200,stock:3310,docks:6,forks:5,w:29,d:13,h:6.4,roof:0xdce5f6,products:['led','box','container','gloves'],outbound:21,putaway:35,onTime:98.2},
  {id:'WH-03',name:'东港冷链中心',en:'Eastport Cold Chain',cn:'东港冷链中心',type:'恒温冷链仓',address:'新泽西州伊丽莎白市港湾路 7 号',capacity:1400,stock:990,docks:4,forks:4,w:24,d:13,h:6,roof:0xf0f4fb,products:['frozen','water','gloves','container'],outbound:31,putaway:28,onTime:96.2},
  {id:'WH-04',name:'南区交叉转运站',en:'Southfield Cross-Dock',cn:'南区交叉转运站',type:'交叉转运仓',address:'新泽西州林登市工业大道 201 号',capacity:1600,stock:610,docks:6,forks:5,w:26,d:14,h:6,roof:0x5788ed,products:['water','tape','led','helmet'],outbound:28,putaway:20,onTime:96.2},
  {id:'WH-05',name:'西门智能仓',en:'Westgate Robotics Hub',cn:'西门智能仓',type:'自动化物流仓',address:'新泽西州纽瓦克市创新路 66 号',capacity:2300,stock:1730,docks:5,forks:5,w:27,d:14,h:6.5,roof:0xe2e9f7,products:['led','box','gloves','helmet'],outbound:33,putaway:25,onTime:95.9}
];
export const CARRIERS = [{name:'仓流智控',color:0x456ef0},{name:'蓝峰物流',color:0x1e4484},{name:'北线物流',color:0x36a491},{name:'货浪物流',color:0xed9653}];
export const STATUS = {queued:'待调度',arriving:'驶入月台',departing:'驶离园区',reserved:'待车辆到位',returning:'返回待命区',loading:'装车中',transit:'运输中',unloading:'卸货中',delivered:'已签收',cancelled:'已取消',idle:'空闲',working:'作业中',charging:'充电中'};
export const KEY = 'waretrack-v1';
const clone = v=>structuredClone(v);
export const product = id=>PRODUCTS.find(p=>p.id===id);
export function seedState(){
  const state={version:1,siteId:'WH-01',clock:9*3600+40*60,speed:1,paused:false,nextId:78500,sites:{},shipments:[],events:[],settings:{labels:true,shadows:true,autoRotate:false},revision:0};
  SITES.forEach((site,si)=>{
    const inventory=site.products.map((id,pi)=>({productId:id,qty:[Math.round(site.stock*.36),Math.round(site.stock*.24),Math.round(site.stock*.07),0][pi],min:pi===2?Math.round(site.stock*.09):60}));
    inventory[3].qty=site.stock-inventory.slice(0,3).reduce((a,p)=>a+p.qty,0);
    const forks=Array.from({length:site.forks},(_,fi)=>({id:`FL-${String(si*5+fi+1).padStart(2,'0')}`,battery:fi===2?24:86-fi*12,status:fi===2?'charging':'idle',jobId:null,moves:18+fi*7}));
    state.sites[site.id]={inventory,forks,outbound:site.outbound,putaway:site.putaway};
    for(let j=0;j<Math.min(site.docks,3);j++){
      const id=`SHP-${78442+si*3+j}`;
      const status=j===0?'loading':j===1?'unloading':'transit';
      const shipment={id,truckId:`TRK-${2051+si*87+j*118}`,siteId:site.id,carrier:j%4,customer:['阿特拉斯零售','阳谷生鲜','都市供应链'][j],destination:['宾夕法尼亚州费城','新泽西州泽西市','纽约州纽约市'][j],productId:site.products[j],qty:6+j*2,status,progress:j===0?.32:j===1?.1:.66,stageElapsed:0,dock:j===2?null:j+1,forkId:j<2?forks[j].id:null,direction:j===1?'inbound':'outbound',created:state.clock-800-j*400,stageStarted:state.clock-100,reserved:status==='loading',travelSeconds:130+si*20,timeline:[state.clock-800-j*400,state.clock-500-j*150,j===0?null:state.clock-300,j===0?null:state.clock-100,null]};
      state.shipments.push(shipment);
      if(j<2){forks[j].status='working';forks[j].jobId=id;}
    }
  });
  state.events=[{id:'welcome',time:state.clock,kind:'info',text:'早班交接完成，5 个园区已就绪。',read:false},{id:'lowstock',time:state.clock-120,kind:'warning',text:'河畔物流中心：工业安全帽低于安全库存。',read:false}];
  return state;
}
export function totalStock(state,siteId){return state.sites[siteId].inventory.reduce((n,i)=>n+i.qty,0)}
export function activeShipments(state,siteId){return state.shipments.filter(s=>s.siteId===siteId&&!['delivered','cancelled'].includes(s.status))}
export function reservedStock(state,siteId,productId){return state.shipments.filter(s=>s.siteId===siteId&&s.productId===productId&&s.reserved).reduce((n,s)=>n+s.qty,0)}
export function availableStock(state,siteId,productId){const item=state.sites[siteId].inventory.find(i=>i.productId===productId);return (item?.qty||0)-reservedStock(state,siteId,productId)}
export function inboundReserved(state,siteId){return state.shipments.filter(s=>s.siteId===siteId&&s.direction==='inbound'&&!['departing','delivered','cancelled'].includes(s.status)).reduce((n,s)=>n+s.qty,0)}
function validateVehicleMotion(v){
  if(v.pose&&(!Number.isFinite(v.pose.x)||!Number.isFinite(v.pose.z)||!Number.isFinite(v.pose.yaw)))throw Error('车辆位置无效');
  if(!v.motion)return;
  const m=v.motion;
  if(!Array.isArray(m.points)||m.points.length<1||m.points.length>300||m.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.z))||!Number.isFinite(m.distance)||!Number.isFinite(m.length)||m.distance<0||m.distance>m.length+.00001||!Number.isFinite(m.speed)||m.speed<0||!Number.isFinite(m.cruise)||m.cruise<=0||m.cruise>10||typeof m.waiting!=='boolean')throw Error('车辆路径无效');
}
export function validateState(s){
  if(!s||s.version!==1||!SITES.some(x=>x.id===s.siteId)||!s.sites||!Array.isArray(s.shipments)||!Array.isArray(s.events)||!s.settings)throw Error('不是有效的 仓流智控 存档');
  if(!Number.isFinite(s.clock)||![1,5,15].includes(s.speed)||typeof s.paused!=='boolean'||!Number.isInteger(s.nextId)||s.nextId<78500||!Number.isInteger(s.revision)||s.revision<0)throw Error('存档的模拟参数无效');
  for(const key of ['labels','shadows','autoRotate'])if(typeof s.settings[key]!=='boolean')throw Error('显示设置无效');
  if(s.shipments.length>5000||s.events.length>80)throw Error('存档记录数超过限制');
  for(const ev of s.events)if(!ev||typeof ev.text!=='string'||!['info','warning','success'].includes(ev.kind)||!Number.isFinite(ev.time)||typeof ev.read!=='boolean')throw Error('通知数据无效');
  const ids=new Set(),forkIds=new Set();
  for(const cfg of SITES){const site=s.sites[cfg.id]; if(!site||!Array.isArray(site.inventory)||!Array.isArray(site.forks)||site.forks.length!==cfg.forks)throw Error('园区数据不完整');
    if(!Number.isInteger(site.outbound)||site.outbound<0||!Number.isInteger(site.putaway)||site.putaway<0)throw Error('运营统计无效');
    if(site.inventory.length!==cfg.products.length||new Set(site.inventory.map(i=>i.productId)).size!==cfg.products.length)throw Error('库存商品数据不完整');
    for(const i of site.inventory)if(!cfg.products.includes(i.productId)||!Number.isInteger(i.qty)||i.qty<0||!Number.isInteger(i.min)||i.min<0)throw Error('库存数据无效');
    if(totalStock(s,cfg.id)>cfg.capacity)throw Error('库存超过容量');
    for(const f of site.forks){validateVehicleMotion(f);if(typeof f.id!=='string'||!/^FL-\d{2,8}$/.test(f.id)||forkIds.has(f.id)||!['idle','working','charging','reserved','returning'].includes(f.status)||!Number.isFinite(f.battery)||f.battery<0||f.battery>100||!Number.isInteger(f.moves)||f.moves<0)throw Error('叉车数据无效');forkIds.add(f.id);}
  }
  for(const sh of s.shipments){
    validateVehicleMotion(sh);
    if(sh.handled!==undefined&&(!Number.isInteger(sh.handled)||sh.handled<0||sh.handled>sh.qty))throw Error('搬运进度无效');
    const cfg=SITES.find(c=>c.id===sh.siteId);
    if(!cfg||typeof sh.id!=='string'||!/^SHP-\d{4,12}$/.test(sh.id)||ids.has(sh.id)||typeof sh.truckId!=='string'||!/^TRK-\d{4,12}$/.test(sh.truckId)||!cfg.products.includes(sh.productId)||!Number.isInteger(sh.qty)||sh.qty<1||!['queued','arriving','loading','departing','transit','unloading','delivered','cancelled'].includes(sh.status)||!['inbound','outbound'].includes(sh.direction)||!Number.isFinite(sh.progress)||sh.progress<0||sh.progress>1||!Number.isInteger(sh.carrier)||sh.carrier<0||sh.carrier>3||!Number.isFinite(sh.travelSeconds)||sh.travelSeconds<1||typeof sh.destination!=='string'||typeof sh.customer!=='string')throw Error('运输单数据无效');
    if(!Number.isFinite(sh.created)||!Number.isFinite(sh.stageStarted)||!Number.isFinite(sh.stageElapsed))throw Error('任务时间无效');
    if(sh.timeline&&(!Array.isArray(sh.timeline)||sh.timeline.length!==5||sh.timeline.some(t=>t!==null&&!Number.isFinite(t))))throw Error('运输时间线无效');
    ids.add(sh.id);
    if(sh.dock!==null&&(!Number.isInteger(sh.dock)||sh.dock<1||sh.dock>cfg.docks))throw Error('月台分配无效');
    if(['arriving','loading','unloading'].includes(sh.status)&&(!sh.dock||!sh.forkId))throw Error('作业资源缺失');
    if(Boolean(sh.reserved)!==(sh.direction==='outbound'&&['queued','arriving','loading'].includes(sh.status)))throw Error('预留库存无效');
  }
  for(const cfg of SITES){
    const working=s.shipments.filter(sh=>sh.siteId===cfg.id&&['arriving','loading','unloading'].includes(sh.status));
    const dockJobs=s.shipments.filter(sh=>sh.siteId===cfg.id&&sh.dock!==null);
    if(new Set(dockJobs.map(sh=>sh.dock)).size!==dockJobs.length||new Set(working.map(sh=>sh.forkId)).size!==working.length)throw Error('作业资源冲突');
    for(const sh of working){const f=s.sites[cfg.id].forks.find(f=>f.id===sh.forkId);if(!f||f.jobId!==sh.id||!['working','reserved'].includes(f.status))throw Error('叉车任务不一致');}
    for(const f of s.sites[cfg.id].forks)if(['working','reserved'].includes(f.status)&&!working.some(sh=>sh.id===f.jobId))throw Error('叉车任务缺失');
    for(const p of cfg.products)if(availableStock(s,cfg.id,p)<0)throw Error('预留库存超过实际库存');
    if(totalStock(s,cfg.id)+inboundReserved(s,cfg.id)>cfg.capacity)throw Error('入库预留超过园区容量');
  }
  return s;
}
export class WarehouseStore {
  constructor(state=seedState()){this.state=clone(validateState(state));this.prepareTraffic();this.listeners=new Set();this.saveError=false;}
  prepareTraffic(){
    for(const cfg of SITES){
      const site=this.state.sites[cfg.id];
      site.forks.forEach((f,i)=>{f.pose??=parkingPose(cfg,i);f.carrying??=false;});
      this.state.shipments.filter(sh=>sh.siteId===cfg.id).forEach((sh,i)=>{
        sh.pose??=sh.dock?dockPose(cfg,sh.dock):waitingPose(cfg,i);
        sh.handled??=Math.floor(sh.progress*sh.qty);
        if(sh.status==='arriving'&&!sh.motion)sh.motion=arrivalMotion(cfg,sh.dock,sh.pose);
        if(['loading','unloading'].includes(sh.status)){
          const f=site.forks.find(f=>f.id===sh.forkId);
          if(f&&!f.motion)this.forkLeg(sh,f,'pickup');
        }
      });
    }
  }
  forkLeg(sh,f,leg){
    const cfg=SITES.find(s=>s.id===sh.siteId);
    const stock=pickupPose(cfg,Number(f.id.slice(3))%3),bay=workPose(cfg,sh.dock);
    const destination=sh.direction==='outbound'?(leg==='pickup'?stock:bay):(leg==='pickup'?bay:stock);
    f.leg=leg;f.motion=forkMotion(cfg,f.pose,destination);f.status='working';
  }
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
  emit(reason='change'){this.state.revision++;for(const fn of this.listeners)fn(this.state,reason);}
  event(text,kind='info'){this.state.events.unshift({id:`EV-${this.state.nextId++}`,time:this.state.clock,text,kind,read:false});this.state.events=this.state.events.slice(0,80);}
  changeSite(id){if(!this.state.sites[id])throw Error('园区不存在');this.state.siteId=id;this.emit();}
  createShipment(input){
    const siteId=input.siteId||this.state.siteId, cfg=SITES.find(s=>s.id===siteId),qty=Number(input.qty),direction=input.direction||'outbound';
    if(!cfg||!cfg.products.includes(input.productId))throw Error('请选择园区中的商品');
    if(!['inbound','outbound'].includes(direction))throw Error('运输类型无效');
    if(!Number.isInteger(qty)||qty<1||qty>1000)throw Error('数量应为 1–1000 之间的整数');
    if(!input.destination?.trim()||!input.customer?.trim())throw Error('请填写目的地与客户');
    if(!Number.isInteger(Number(input.carrier))||Number(input.carrier)<0||Number(input.carrier)>3)throw Error('承运商无效');
    if(direction==='outbound'&&availableStock(this.state,siteId,input.productId)<qty)throw Error('可用库存不足，已扣除其他运输单的预留数量');
    if(direction==='inbound'&&totalStock(this.state,siteId)+inboundReserved(this.state,siteId)+qty>cfg.capacity)throw Error('入库数量超过剩余容量（含在途预留）');
    while(this.state.shipments.some(s=>s.id===`SHP-${this.state.nextId}`))this.state.nextId++;
    const n=this.state.nextId++,sh={id:`SHP-${n}`,truckId:`TRK-${n-75000}`,siteId,carrier:Number(input.carrier),customer:input.customer.trim().slice(0,100),destination:input.destination.trim().slice(0,150),productId:input.productId,qty,direction,status:'queued',progress:0,stageElapsed:0,dock:null,forkId:null,created:this.state.clock,stageStarted:this.state.clock,reserved:direction==='outbound',travelSeconds:140,timeline:[this.state.clock,null,null,null,null]};
    sh.pose=waitingPose(cfg,this.state.shipments.filter(s=>s.siteId===siteId&&s.status==='queued').length);sh.handled=0;
    this.state.shipments.unshift(sh);this.event(`${sh.id} 已创建 · ${direction==='inbound'?'入库':'出库'} ${qty} 托盘`);this.emit();return sh;
  }
  dispatch(id,dockNumber,forkId){
    const sh=this.state.shipments.find(s=>s.id===id);if(!sh||sh.status!=='queued')throw Error('仅待调度的运输单可分配资源');
    const cfg=SITES.find(s=>s.id===sh.siteId),site=this.state.sites[sh.siteId];
    const used=new Set(activeShipments(this.state,sh.siteId).filter(s=>s.dock!==null).map(s=>s.dock));
    const dock=dockNumber?Number(dockNumber):Array.from({length:cfg.docks},(_,i)=>i+1).find(d=>!used.has(d));
    if(!dock||dock<1||dock>cfg.docks||!Number.isInteger(dock)||used.has(dock))throw Error('没有可用月台，请等待作业完成');
    const fork=site.forks.find(f=>forkId?f.id===forkId:f.status==='idle'&&f.battery>=20);
    if(!fork||fork.status!=='idle'||fork.battery<20)throw Error('没有可用叉车，请先等待作业或充电完成');
    sh.timeline??=[sh.created,null,null,null,null];sh.timeline[1]=null;
    sh.dock=dock;sh.forkId=fork.id;sh.status='arriving';sh.motion=arrivalMotion(cfg,dock,sh.pose);sh.handled=0;sh.stageStarted=this.state.clock;sh.progress=0;fork.status='reserved';fork.jobId=sh.id;
    this.event(`${sh.truckId} → 月台 ${dock} · ${fork.id} 正在${STATUS[sh.status]}`,'success');this.emit();
  }
  releaseFork(sh){
    const cfg=SITES.find(s=>s.id===sh.siteId),site=this.state.sites[sh.siteId];
    const f=site.forks.find(f=>f.id===sh.forkId);
    if(f){f.status='returning';f.jobId=null;f.carrying=false;f.moves+=sh.handled||0;f.leg='return';f.motion=forkMotion(cfg,f.pose,parkingPose(cfg,site.forks.indexOf(f)));}
    sh.forkId=null;
  }
  cancelShipment(id){
    const sh=this.state.shipments.find(s=>s.id===id);
    if(!sh||!['queued','loading','arriving'].includes(sh.status))throw Error('该运输单当前不能取消');
    if(sh.forkId)this.releaseFork(sh);
    sh.reserved=false;sh.status='cancelled';sh.progress=0;sh.motion=null;sh.dock=null;
    this.event(`${sh.id} 已取消，预留库存已释放`,'warning');this.emit();
  }
  replenish(siteId,productId,qty){qty=Number(qty);const item=this.state.sites[siteId]?.inventory.find(i=>i.productId===productId),cfg=SITES.find(s=>s.id===siteId);if(!item||!Number.isInteger(qty)||qty<1)throw Error('请输入有效的整数数量');if(totalStock(this.state,siteId)+inboundReserved(this.state,siteId)+qty>cfg.capacity)throw Error('补货后将超过园区容量（含在途预留）');item.qty+=qty;this.state.sites[siteId].putaway+=qty;this.event(`${product(productId).name} 补货 ${qty} 托盘`,'success');this.emit();}
  chargeFork(siteId,id){const f=this.state.sites[siteId]?.forks.find(f=>f.id===id);if(!f||['working','reserved','returning'].includes(f.status))throw Error('叉车作业中，完成任务后才能充电');if(f.status==='charging'){if(f.battery<20)throw Error('电量不足 20%，请继续充电');f.status='idle';}else f.status='charging';this.emit();}
  tick(seconds){
    if(this.state.paused)return;
    let remaining=Math.max(0,Math.min(seconds,5))*this.state.speed;
    // Short deterministic steps also preserve spacing at 15× simulation speed.
    while(remaining>1e-8){const dt=Math.min(.1,remaining);this.stepTraffic(dt);remaining-=dt;}
    this.emit('tick');
  }
  stepTraffic(dt){
    this.state.clock+=dt;
    for(const cfg of SITES){
      const site=this.state.sites[cfg.id];
      const jobs=this.state.shipments.filter(s=>s.siteId===cfg.id);
      const moving=jobs.filter(s=>['arriving','departing'].includes(s.status));
      // Reserve the shared truck lane for one complete maneuver. Waiting trucks
      // remain outside the gate; dock reservations stay held until exit clears.
      let owner=moving.find(s=>s.id===site.laneOwner);
      owner??=moving.find(s=>s.motion?.distance>0)||moving.find(s=>s.status==='departing')||moving.at(-1);
      site.laneOwner=owner?.id||null;
      for(const sh of jobs){
        if(['arriving','departing'].includes(sh.status)){
          if(!sh.motion)continue;
          const ahead=sampleMotion(sh.motion,Math.min(sh.motion.length,sh.motion.distance+2.5));
          const crossingFork=site.forks.some(f=>f.pose&&f.motion&&!f.motion.waiting&&Math.hypot(ahead.x-f.pose.x,ahead.z-f.pose.z)<2.2&&Math.hypot(sh.pose.x-f.pose.x,sh.pose.z-f.pose.z)>Math.hypot(ahead.x-f.pose.x,ahead.z-f.pose.z));
          sh.motion.waiting=sh!==owner||crossingFork;
          const done=moveAlong(sh.motion,dt);sh.pose=sampleMotion(sh.motion);sh.progress=sh.motion.distance/sh.motion.length;
          if(!done)continue;
          if(sh.status==='arriving'){
            sh.status=sh.direction==='inbound'?'unloading':'loading';sh.progress=0;sh.motion=null;sh.pose=dockPose(cfg,sh.dock);sh.timeline[1]=this.state.clock;
            const f=site.forks.find(f=>f.id===sh.forkId);this.forkLeg(sh,f,'pickup');
            this.event(`${sh.truckId} 已停靠月台 ${sh.dock}，开始${STATUS[sh.status]}`,'success');
          }else{
            sh.dock=null;sh.motion=null;
            sh.status=sh.direction==='inbound'?'delivered':'transit';sh.progress=sh.direction==='inbound'?1:0;
            if(sh.direction==='inbound'){sh.timeline[3]=this.state.clock;sh.timeline[4]=this.state.clock;}
            else sh.timeline[3]=this.state.clock;
            this.event(`${sh.truckId} 已驶出园区${sh.direction==='outbound'?'，开始配送':''}`,'success');
          }
          sh.stageStarted=this.state.clock;site.laneOwner=null;
        }else if(sh.status==='transit'){
          sh.progress=Math.min(1,sh.progress+dt/sh.travelSeconds);
          if(sh.progress>=1-1e-9){sh.status='delivered';sh.progress=1;sh.stageStarted=this.state.clock;sh.timeline??=[sh.created,null,null,null,null];sh.timeline[4]=this.state.clock;this.event(`${sh.id} 已送达 ${sh.destination}`,'success');}
        }
      }
      for(const f of site.forks){
        if(f.status==='charging'){f.battery=Math.min(100,f.battery+dt*.24);if(f.battery>=100){f.status='idle';this.event(`${f.id} 已充满电，可分配新任务`,'success');}continue;}
        if(!f.motion||!['working','returning'].includes(f.status))continue;
        // Give way to trucks and to a forklift ahead in the same direction.
        const here=f.pose,next=sampleMotion(f.motion,Math.min(f.motion.length,f.motion.distance+1.35));
        const truckBlocked=moving.some(sh=>sh.pose&&sh.motion?.speed>.01&&Math.hypot(next.x-sh.pose.x,next.z-sh.pose.z)<2.45);
        const forkBlocked=site.forks.some(other=>other!==f&&other.pose&&other.motion&&['working','returning'].includes(other.status)&&Math.hypot(next.x-other.pose.x,next.z-other.pose.z)<1.05&&(other.motion.waiting?other.id<f.id:true)&&Math.hypot(here.x-other.pose.x,here.z-other.pose.z)>Math.hypot(next.x-other.pose.x,next.z-other.pose.z));
        f.motion.waiting=truckBlocked||forkBlocked;
        const done=moveAlong(f.motion,dt);f.pose=sampleMotion(f.motion);f.battery=Math.max(0,f.battery-dt*.018);
        if(!done)continue;
        if(f.status==='returning'){f.motion=null;f.status=f.battery<20?'charging':'idle';continue;}
        const sh=jobs.find(s=>s.id===f.jobId);if(!sh)continue;
        if(f.leg==='pickup'){f.carrying=true;this.forkLeg(sh,f,'dropoff');continue;}
        f.carrying=false;sh.handled=Math.min(sh.qty,sh.handled+1);sh.progress=sh.handled/sh.qty;
        if(sh.handled<sh.qty){this.forkLeg(sh,f,'pickup');continue;}
        const stock=site.inventory.find(i=>i.productId===sh.productId);
        if(sh.direction==='outbound'){stock.qty-=sh.qty;sh.reserved=false;site.outbound++;sh.timeline??=[sh.created,sh.created,null,null,null];sh.timeline[2]=this.state.clock;}
        else{stock.qty+=sh.qty;site.putaway+=sh.qty;sh.timeline??=[sh.created,sh.created,null,null,null];sh.timeline[2]=this.state.clock;}
        this.releaseFork(sh);sh.status='departing';sh.progress=0;sh.stageStarted=this.state.clock;sh.motion=departureMotion(cfg,sh.dock,sh.pose);
        this.event(`${sh.truckId} 装卸完成，正在驶离月台`,'success');
      }
    }
  }
  setSimulation({paused=this.state.paused,speed=this.state.speed}){if(![1,5,15].includes(speed))throw Error('无效速度');this.state.paused=paused;this.state.speed=speed;this.emit();}
  markRead(){this.state.events.forEach(e=>e.read=true);this.emit();}
  setSetting(key,value){if(!Object.hasOwn(this.state.settings,key))return;this.state.settings[key]=Boolean(value);this.emit();}
  restore(data){this.state=clone(validateState(data));this.prepareTraffic();this.emit();}
  reset(){this.state=seedState();this.prepareTraffic();this.emit();}
  save(storage){try{storage.setItem(KEY,JSON.stringify(this.state));this.saveError=false;return true;}catch{this.saveError=true;return false;}}
}
