export const TAGS={ember:{name:'余烬',color:'#f18b60',icon:'火'},frost:{name:'霜晶',color:'#a2d9dd',icon:'霜'},storm:{name:'雷鸣',color:'#e5c770',icon:'雷'},venom:{name:'菌蚀',color:'#a3c579',icon:'菌'},echo:{name:'回响',color:'#c5acd8',icon:'响'},iron:{name:'钢铁',color:'#bcc7c5',icon:'铁'}};
export const RARITIES=['普通','稀有','史诗','传说'];
export const HEROES=[
{id:'ranger',name:'苔痕',role:'遗迹游侠',color:'#9fbd7d',accent:'#dfba7b',hp:110,speed:215,weapon:'mossbow',skill:'藤蔓陷阱',skillText:'使周围敌人减速 4 秒，并造成 38 点菌蚀伤害。',cooldown:9,passive:'拾取范围 +45%，每捡起 10 枚金币恢复 4 点生命。',flavor:'她记得每一条回家的路，也记得路尽头的宝物。',tag:'venom',shape:'hood',passiveId:'collector'},
{id:'knight',name:'铁誓',role:'破城骑士',color:'#a8b9be',accent:'#ca9877',hp:155,speed:175,weapon:'oathblade',skill:'钢铁壁垒',skillText:'获得 36 点护盾，周围敌人受到 30 点冲击。',cooldown:11,passive:'受到的伤害降低 15%，攻击击退更强。',flavor:'最后一座城墙倒下之后，他仍守着那句誓言。',tag:'iron',shape:'helm',passiveId:'armor'},
{id:'witch',name:'烬灯',role:'余火术士',color:'#db986d',accent:'#edc984',hp:90,speed:205,weapon:'cinderstaff',skill:'余烬新星',skillText:'释放扩散火环，造成 65 点伤害并点燃敌人。',cooldown:10,passive:'火焰伤害 +25%，每次升级恢复 8 点生命。',flavor:'她手中的灯，是旧世界最后一粒不肯熄灭的火。',tag:'ember',shape:'hat',passiveId:'ember'},
{id:'rogue',name:'鸦影',role:'秘匣盗客',color:'#b3a6c5',accent:'#ded3b9',hp:95,speed:245,weapon:'crowdaggers',skill:'影袭',skillText:'向瞄准方向瞬移，沿途敌人受到 70 点伤害。',cooldown:8,passive:'暴击率 +15%，闪避冷却缩短 25%。',flavor:'锁是礼貌，钥匙只是其中一种回答。',tag:'echo',shape:'mask',passiveId:'critical'},
{id:'tinker',name:'铜铃',role:'遗械工匠',color:'#d2ad68',accent:'#8cacb0',hp:115,speed:195,weapon:'scrapgun',skill:'哨戒机关',skillText:'部署自动炮台 8 秒，持续射击最近的敌人。',cooldown:15,passive:'投射物伤害 +15%，武器选择额外出现 1 项。',flavor:'坏掉的文明，拆开之后也能有新的用途。',tag:'iron',shape:'goggles',passiveId:'engineer'},
{id:'oracle',name:'霜书',role:'冻时学者',color:'#96c5d0',accent:'#e4dfc8',hp:100,speed:200,weapon:'frostbook',skill:'停滞领域',skillText:'冻结附近敌人 2.5 秒，并恢复 12 点生命。',cooldown:13,passive:'霜晶减速更强，技能冷却缩短 15%。',flavor:'她读到历史的最后一页，决定把书重新打开。',tag:'frost',shape:'hood',passiveId:'frost'},
{id:'monk',name:'震岳',role:'鸣石武僧',color:'#bba078',accent:'#c5ad76',hp:130,speed:220,weapon:'thunderfist',skill:'崩山踏',skillText:'震荡地面，造成 80 点伤害并击退附近敌人。',cooldown:9,passive:'近战伤害 +20%，闪避经过敌人时造成 15 点伤害。',flavor:'脚下的废墟，比任何经文都更诚实。',tag:'storm',shape:'bald',passiveId:'melee'},
{id:'botanist',name:'孢芽',role:'菌林药师',color:'#bbc684',accent:'#e8a390',hp:105,speed:210,weapon:'sporewand',skill:'疗愈花圃',skillText:'恢复 28 点生命，周围敌人获得中毒效果。',cooldown:15,passive:'治疗量 +30%，中毒持续时间延长 50%。',flavor:'废墟不是死去的世界，它只是换了一种生长方式。',tag:'venom',shape:'mushroom',passiveId:'healer'},
{id:'warden',name:'夜潮',role:'回响守墓人',color:'#88aaa8',accent:'#c9aecc',hp:120,speed:195,weapon:'echoscythe',skill:'亡者回声',skillText:'召唤 3 枚追踪幽灵弹，各造成 45 点伤害。',cooldown:11,passive:'每击杀 8 名敌人恢复 5 点生命。',flavor:'所有遗失的名字，都有人替它们收好。',tag:'echo',shape:'veil',passiveId:'reaper'},
{id:'corsair',name:'赤帆',role:'沉城猎手',color:'#d18d7e',accent:'#e7d19a',hp:110,speed:230,weapon:'harpoon',skill:'猎物标记',skillText:'重击最近敌人 110 点，6 秒内暴击率 +25%。',cooldown:12,passive:'金币掉落 +25%，每拥有 100 金币，伤害 +5%（最多 25%）。',flavor:'海退去的地方，藏着整座城市的秘密。',tag:'storm',shape:'bandana',passiveId:'gold'}
];
// Damage, cooldown and range are explicit prototype values; every family has a distinct attack pattern.
const W=(id,name,type,tag,damage,cd,range,rarity,description,special='')=>({id,name,type,tag,damage,cd,range,rarity,description,special});
export const WEAPONS=[
W('oathblade','旧王誓剑','sword','iron',25,.46,125,0,'三段斩击，第三击伤害翻倍并扩大范围。','combo'),
W('cinderedge','烬牙','sword','ember',27,.52,130,1,'扇形斩击，点燃被击中的敌人。'),
W('frostsaber','霜潮弯刀','sword','frost',21,.38,120,1,'快速连斩，附带霜晶减速。'),
W('echoblade','折返之刃','sword','echo',32,.62,150,2,'每次斩击在身后留下第二道回响。','echo'),
W('stonehammer','钟塔重锤','hammer','iron',58,.95,165,1,'缓慢重击，造成大范围击退。'),
W('thunderhammer','雷脊','hammer','storm',50,.85,160,2,'重击时向附近敌人传导闪电。'),
W('cinderhammer','熔炉之心','hammer','ember',64,1.1,170,2,'火焰重击，形成持续燃烧区域。','field'),
W('frosthammer','静冬','hammer','frost',53,.92,155,1,'环形冲击，冻结近处敌人。'),
W('harpoon','沉城鱼叉','spear','storm',34,.58,225,0,'狭长直线穿刺，能同时命中多个目标。'),
W('rootlance','荆棘长枪','spear','venom',31,.52,215,1,'穿刺附带中毒，适合保持距离。'),
W('royallance','王庭裂枪','spear','iron',42,.70,245,2,'穿刺末端额外造成 50% 伤害。','tip'),
W('echoscythe','亡潮镰','scythe','echo',36,.68,190,1,'横扫半圆，回响追击最近目标。','echo'),
W('crowdaggers','鸦羽双匕','dagger','echo',15,.22,95,0,'短距高速双击，暴击倍率更高。','crit'),
W('venomdagger','蕈牙','dagger','venom',17,.25,100,1,'叠加中毒，连续攻击迅速消磨敌人。'),
W('thunderfist','裂石拳套','dagger','storm',22,.30,110,0,'近身快拳，附带连锁电弧。'),
W('mossbow','苔纹猎弓','bow','venom',24,.55,650,0,'发射穿透箭矢，可贯穿 2 名敌人。','pierce'),
W('frostbow','雪盲','bow','frost',22,.62,620,1,'同时射出 3 支冰箭。','triple'),
W('sunbow','落日','bow','ember',44,.9,700,3,'重型穿透火箭，命中后爆炸。','explode'),
W('scrapgun','拾荒铳','gun','iron',14,.64,480,0,'近距散射 5 枚弹丸。','shotgun'),
W('sparkpistol','铜羽连铳','gun','storm',18,.28,620,1,'快速射击，雷鸣命中会连锁。'),
W('cinderstaff','火灯杖','staff','ember',32,.7,600,0,'火球命中后爆炸，留下燃烧。','explode'),
W('sporewand','菌簇魔杖','staff','venom',25,.6,600,0,'发射 2 枚孢子弹，散布毒雾。','double'),
W('frostbook','冻时之书','book','frost',28,.65,620,0,'追踪冰晶，冻结与减速目标。','homing'),
W('echoorb','无名星盘','book','echo',35,.75,680,3,'发射 3 枚追踪回响，命中后裂解。','triple')
];
const R=(id,name,tag,rarity,effect,description)=>({id,name,tag,rarity,effect,description});
export const RELICS=[
R('ember1','焦黑灯芯','ember',0,{damage:.12},'所有伤害 +12%。'),R('ember2','不熄火种','ember',1,{burn:1},'攻击额外附带 3 秒燃烧。'),R('ember3','灰烬徽章','ember',1,{crit:.10},'暴击率 +10%。'),R('ember4','熔金心脏','ember',2,{maxhp:30,damage:.08},'最大生命 +30，伤害 +8%。'),R('ember5','燎原余页','ember',2,{explode:1},'击杀敌人触发小范围爆炸。'),R('ember6','最后的灯','ember',3,{revive:1},'本局首次倒下时以 40% 生命复活。'),
R('frost1','碎霜镜','frost',0,{cooldown:.08},'技能冷却缩短 8%。'),R('frost2','寒潮怀表','frost',1,{slow:1},'所有攻击额外减速敌人。'),R('frost3','封存的雨','frost',1,{shield:18},'每次进入房间获得 18 点护盾。'),R('frost4','冬眠茧','frost',2,{regen:1.2},'每秒恢复 1.2 生命。'),R('frost5','雪线罗盘','frost',2,{dodge:.22},'闪避冷却缩短 22%。'),R('frost6','永冬王冠','frost',3,{cooldown:.25,maxhp:20},'技能冷却缩短 25%，最大生命 +20。'),
R('storm1','断裂铜线','storm',0,{attackSpeed:.10},'攻击速度 +10%。'),R('storm2','风暴瓶','storm',1,{chain:1},'攻击产生连锁闪电，传导至 1 名敌人。'),R('storm3','旅人风铃','storm',0,{speed:.12},'移动速度 +12%。'),R('storm4','雷鸣腰扣','storm',2,{crit:.14},'暴击率 +14%。'),R('storm5','暴雨种子','storm',2,{extraShot:1},'远程武器额外发射 1 枚投射物。'),R('storm6','天穹碎片','storm',3,{chain:2,damage:.10},'闪电传导数量 +2，伤害 +10%。'),
R('venom1','苔藓绷带','venom',0,{healing:.20},'治疗效果 +20%。'),R('venom2','活菌标本','venom',1,{poison:1},'攻击附带 4 秒中毒。'),R('venom3','寻根触须','venom',0,{magnet:.5},'拾取半径 +50%。'),R('venom4','再生琥珀','venom',2,{lifeSteal:.03},'造成直接伤害时恢复伤害量的 3%。'),R('venom5','寄生芽','venom',2,{killHeal:1.5},'每次击杀恢复 1.5 生命。'),R('venom6','菌林母核','venom',3,{regen:2,poison:1},'每秒恢复 2 生命，攻击附带中毒。'),
R('echo1','破碎留声机','echo',0,{xp:.20},'获得经验 +20%。'),R('echo2','双面铜镜','echo',1,{echo:1},'每第 4 次攻击复制一次，伤害为 50%。'),R('echo3','无名吊坠','echo',0,{maxhp:20},'最大生命 +20。'),R('echo4','旧梦匣','echo',2,{choice:1},'升级选择额外出现 1 项。'),R('echo5','回声指骨','echo',2,{skillDamage:.40},'角色技能伤害 +40%。'),R('echo6','第二颗心','echo',3,{revive:1,crit:.08},'一次复活机会，暴击率 +8%。'),
R('iron1','锈色护符','iron',0,{armor:.08},'受到的伤害降低 8%。'),R('iron2','城墙铆钉','iron',1,{maxhp:35},'最大生命 +35。'),R('iron3','矿工手套','iron',0,{damage:.10,magnet:.2},'伤害 +10%，拾取半径 +20%。'),R('iron4','逆鳞甲片','iron',2,{thorns:18},'受伤时反击周围敌人 18 点伤害。'),R('iron5','旧王印玺','iron',2,{armor:.15,shield:12},'减伤 +15%，每个房间获得 12 护盾。'),R('iron6','钢铁遗骸','iron',3,{maxhp:60,armor:.10},'最大生命 +60，减伤 +10%。'),
R('wild1','贪婪钱袋','iron',1,{gold:.30},'金币获取 +30%。'),R('wild2','冒险家的赌骰','echo',2,{damage:.28,maxhp:-15},'伤害 +28%，最大生命 -15。'),R('wild3','轻羽靴','storm',1,{speed:.10,dodge:.12},'移动速度 +10%，闪避冷却缩短 12%。'),R('wild4','旅途便当','venom',0,{maxhp:15,healing:.10},'最大生命 +15，治疗效果 +10%。')
];
export const SUPPLIES=[
{id:'tea',name:'温苔茶',icon:'茶',description:'恢复 35 点生命。',action:'heal',value:35},
{id:'bomb',name:'爆裂罐',icon:'爆',description:'对瞄准位置附近敌人造成 90 伤害。',action:'bomb',value:90},
{id:'ice',name:'冻雨瓶',icon:'冰',description:'冻结所有敌人 3 秒。',action:'freeze',value:3},
{id:'elixir',name:'琥珀药剂',icon:'药',description:'6 秒内伤害 +50%。',action:'buff',value:6},
{id:'shield',name:'折叠护盾',icon:'盾',description:'获得 40 点护盾。',action:'shield',value:40},
{id:'magnet',name:'寻宝磁石',icon:'磁',description:'立即收集房间内所有掉落。',action:'magnet',value:1},
{id:'whistle',name:'风羽哨',icon:'风',description:'重置技能与闪避冷却。',action:'reset',value:1},
{id:'seed',name:'生命种',icon:'种',description:'恢复最大生命的 25%。',action:'healPercent',value:.25}
];
export const BIOMES=[
{id:'garden',name:'沉没庭院',subtitle:'泥土记住了每一个脚步',floor:['#424e42','#485346','#3f4a3f','#4b5547'],edge:'#28332d',accent:'#b5c784',boss:'苔冠守卫',bossColor:'#90ae72'},
{id:'foundry',name:'失火铸坊',subtitle:'铁与灰烬之间，还藏着心跳',floor:['#554b43','#5d5047','#51493f','#615447'],edge:'#332b28',accent:'#e0a574',boss:'熔炉巨像',bossColor:'#ca8a5d'},
{id:'archive',name:'无声书库',subtitle:'没有一段故事应该被遗忘',floor:['#434b55','#4b5260','#414956','#515765'],edge:'#292e3a',accent:'#bdb0d6',boss:'无名馆长',bossColor:'#ae9fc8'}
];
export const SETS={ember:'3 件：燃烧伤害翻倍；6 件：击杀触发火焰爆炸。',frost:'3 件：减速增强；6 件：每 8 秒冻结全场 1 秒。',storm:'3 件：额外 1 次闪电传导；6 件：攻击速度再 +25%。',venom:'3 件：中毒伤害翻倍；6 件：每秒恢复 2 生命。',echo:'3 件：技能冷却再 -15%；6 件：每 3 次攻击触发回响。',iron:'3 件：减伤再 +10%；6 件：每次进入房间获得 35 护盾。'};
