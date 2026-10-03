export const HEROES = [
  {id:'lin',name:'林墨',title:'街头游侠',color:'#ffbc55',coat:0x202c42,trim:0xffbd59,hp:5,ammo:115,damage:1,skill:'金色弹幕',description:'均衡射手 · 充能后释放穿透弹幕',bio:'旧城长大的少年，用一把双枪守住回家的路。'},
  {id:'su',name:'苏晴',title:'赤焰先锋',color:'#ff718e',coat:0xce3d59,trim:0xffd993,hp:4,ammo:130,damage:1.18,skill:'赤焰爆发',description:'火力强化 · 爆发期间伤害提升',bio:'身穿赤色运动夹克的机械师，精准与勇气并存。'},
  {id:'chen',name:'陈龙',title:'青岚守卫',color:'#66ead3',coat:0x157b78,trim:0x91ead4,hp:6,ammo:105,damage:1,skill:'青岚护盾',description:'额外生命 · 爆发期间获得护盾',bio:'青岚行动队的老队长，总会挡在大家前面。'}
];
export const LEVELS = [
  {id:1,name:'落日天街',tag:'第一章',subtitle:'从天街出发，夺回霓城',color:0xffb178,length:250,speed:9.5,bossHP:140,boss:'巨臂阿魁',enemyHP:2,seed:71},
  {id:2,name:'灯影长桥',tag:'第二章',subtitle:'穿越灯火，守住长桥',color:0xff91ac,length:285,speed:10,bossHP:200,boss:'铁面魁首',enemyHP:3,seed:117},
  {id:3,name:'青岚街区',tag:'第三章',subtitle:'旧城的风，吹向战场',color:0x78d4c6,length:320,speed:10.5,bossHP:260,boss:'青毒霸主',enemyHP:3,seed:219},
  {id:4,name:'云端集市',tag:'第四章',subtitle:'越过云海，突破重围',color:0xb3b9ff,length:350,speed:11,bossHP:320,boss:'狂暴巨魁',enemyHP:4,seed:384},
  {id:5,name:'赤霞城门',tag:'第五章',subtitle:'城门已近，寸步不让',color:0xff8462,length:380,speed:11.5,bossHP:380,boss:'赤霞暴君',enemyHP:4,seed:456},
  {id:6,name:'霓城之巅',tag:'终章',subtitle:'最后一战，让霓城重获新生',color:0xf6c560,length:410,speed:12,bossHP:460,boss:'镇城尸王',enemyHP:5,seed:679}
];
export const LANES=[-2.65,0,2.65];
export const GATE_INFO={ammo:{text:'+60 弹药',sub:'补给',color:0x17cddb},gun:{text:'+1 双枪',sub:'武器升级',color:0x269dff},rate:{text:'×2 射速',sub:'火力提升',color:0x27d684},damage:{text:'+1 威力',sub:'伤害提升',color:0xf2bc4c},heal:{text:'+1 生命',sub:'生命恢复',color:0x37d3ac},loss:{text:'−35 弹药',sub:'危险',color:0xf24a68}};
