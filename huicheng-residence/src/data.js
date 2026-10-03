// Blueprint coordinates are preserved so that the plan and model share one source.
// 963 image pixels / 14.44 m. Positive Z points toward the bottom of the drawing.
export const SCALE = 963 / 14.44;
export const HEIGHT = 2.77;
export const X = p => (p - 698.5) / SCALE;
export const Z = p => (p - 665.5) / SCALE;
export const M = pixels => pixels / SCALE;
export const outline = [[257,371],[625,371],[625,303],[1073,303],[1073,323],[1113,323],[1113,474],[1073,474],[1073,537],[1153,537],[1153,763],[1180,763],[1180,1004],[1073,1004],[1073,1028],[738,1028],[738,941],[345,941],[345,731],[431,731],[431,621],[257,621],[257,570],[217,570],[217,422],[257,422]];
export const rooms = [
  {id:'living',name:'客厅',en:'LIVING ROOM',kind:'public',poly:[[754,746],[1058,746],[1058,1012],[754,1012]],label:[908,818],spawn:[947,788],yaw:2.85,desc:'三面围合沙发、中央茶几、电视矮柜，连接景观阳台。',items:'组合沙发 · 茶几 · 电视柜 · 台灯 · 绿植',material:'暖灰石材 / 米白织物'},
  {id:'dining',name:'餐厅',en:'DINING ROOM',kind:'public',poly:[[447,746],[738,746],[738,925],[447,925]],label:[555,887],spawn:[559,765],yaw:Math.PI,pitch:-.10,desc:'按实拍重建整排白色餐边柜、端部高柜及黑白相框照片墙，保留书籍、收纳盒与桌面台灯。玻璃推拉门分别连通厨房和生活阳台。',items:'白色餐边长柜 · 高柜 · 实拍照片墙 · 六人餐桌 · 台灯与书籍 · 波纹玻璃收纳柜 · 圆形灯具 · 双处玻璃推拉门',material:'白色木纹柜 / 灰米色墙面 / 浅色地砖 / 黑白相框'},
  {id:'kitchen',name:'厨房',en:'KITCHEN',kind:'service',poly:[[447,621],[646,621],[646,731],[447,731]],label:[552,683],spawn:[561,729],yaw:0,pitch:-.19,desc:'按实拍重建白色吊柜、灰色地柜和浅色操作台：窗边单槽不锈钢水池、双眼燃气灶、黑色侧吸油烟机，右侧微波炉与小家电收纳区。',items:'白色吊柜 · 灰色地柜 · 单槽水池 · 双眼灶 · 炒锅与汤锅 · 侧吸油烟机 · 微波炉 · 烤箱 · 水壶 · 调味瓶与挂架',material:'白色亮面瓷砖 / 灰色柜门 / 浅色石材台面 / 银色五金'},
  {id:'master',name:'主卧',en:'PRIMARY BEDROOM',kind:'private',poly:[[793,320],[1058,320],[1058,543],[793,543]],label:[966,463],spawn:[809,510],yaw:-.90,pitch:-.09,desc:'按实拍重建米色软包床、紫色波纹床头墙、流苏窗帘与深红木地板。西侧花纹柜门左右推拉，打开后可走入衣帽间。',items:'软包双人床 · 床头柜 · 床边护栏 · 花形水晶灯 · 流苏窗帘 · 空调 · 风扇 · 收纳柜 · 衣帽间推拉柜门',material:'深红木地板 / 米色皮革 / 紫色波纹墙纸'},
  {id:'bedroom',name:'次卧',en:'SECOND BEDROOM',kind:'private',poly:[[738,553],[998,553],[998,738],[738,738]],label:[912,707],spawn:[944,700],yaw:0.2,desc:'沿北墙布置床与床头柜，西侧设衣柜，东侧留出活动空间并连接休闲阳台。',items:'双人床 · 衣柜 · 床头柜 · 通往阳台的通道',material:'浅橡木 / 雾蓝织物'},
  {id:'study',name:'书房',en:'STUDY',kind:'private',poly:[[273,387],[519,387],[519,533],[589,533],[589,605],[273,605]],label:[384,482],spawn:[398,440],yaw:Math.PI+.16,pitch:-.16,desc:'按实拍重建：北侧四门玻璃书柜与白色收纳床，窗边两段式长书桌，门旁四层收纳柜。桌面保留学习用品并稍作整理。',items:'玻璃书柜 · 白色收纳床 · 蓝色凉感床垫 · 长书桌 · 平板 · 地球仪 · 透明收纳架 · 木凳 · 空调',material:'深红木地板 / 灰米色墙面 / 白色家具 / 灰色窗帘'},
  {id:'wardrobe',name:'衣帽间',en:'WALK-IN CLOSET',kind:'private',poly:[[653,320],[784,320],[784,466],[653,466]],label:[716,394],spawn:[739,405],yaw:1.57,desc:'从主卧的白木纹花饰推拉柜门进入。靠近柜门按 E 或点击门扇，左右滑开后穿过柜体通道；内部保留三面挂衣与收纳。',items:'左右推拉柜门 · 挂衣架 · 抽屉柜 · 衣物 · 收纳盒',material:'白木纹 / 深色花饰腰线 / 深红木地板'},
  {id:'bath',name:'卫生间',en:'BATHROOM',kind:'service',poly:[[528,387],[645,387],[645,522],[528,522]],label:[585,449],spawn:[609,499],yaw:1.10,pitch:-.27,desc:'按实拍重建米色石纹瓷砖、花饰腰线、弧形玻璃淋浴房和黑色方形花洒。白色洗漱柜、实时镜面、毛巾架、挂墙脸盆、吹风机与日用品保留实际生活细节。',items:'弧形淋浴房 · 黑色顶喷与手持花洒 · 三层角架 · 白色洗漱柜 · 镜柜 · 毛巾架 · 挂墙脸盆 · 小风扇 · 吹风机 · 坐便器',material:'米色亮面石纹砖 / 花纹腰线 / 白色柜体 / 黑色与银色五金'},
  {id:'balcony',name:'景观阳台',en:'VIEW BALCONY',kind:'balcony',poly:[[1075,778],[1164,778],[1164,988],[1075,988]],label:[1121,861],spawn:[1119,866],yaw:1.57,desc:'长条景观阳台，南侧洗衣机与洗衣池，连接客厅。',items:'洗衣机 · 洗衣池 · 窗帘 · 绿植',material:'灰色防滑砖 / 白色铝框'},
  {id:'leisure',name:'休闲阳台',en:'LEISURE BALCONY',kind:'balcony',poly:[[1014,553],[1137,553],[1137,764],[1074,764],[1074,733],[1014,733]],label:[1072,648],spawn:[1050,650],yaw:-1.57,desc:'家具与绿植已清空，保留完整的阳台活动空间和落地窗。',items:'开放活动空间 · 落地窗 · 纱帘',material:'浅灰地砖 / 白色铝框'},
  {id:'utility',name:'生活阳台',en:'UTILITY BALCONY',kind:'balcony',poly:[[361,746],[431,746],[431,925],[361,925]],label:[395,838],spawn:[395,840],yaw:0,desc:'餐厅西侧生活阳台，北端储物柜与南端水池。',items:'储物柜 · 洗衣池 · 窗帘',material:'防滑砖 / 白色柜体'}
];
export const roomArea = r => Math.abs(r.poly.reduce((a,p,i)=>{const q=r.poly[(i+1)%r.poly.length];return a+p[0]*q[1]-q[0]*p[1]},0))/2/SCALE**2;
export const modeledArea = roomArea({poly:outline});
// [x1,z1,x2,z2,thickness]; windows and doors are genuine wall openings.
export const walls = [
  [257,379,519,379,24], [265,379,265,434,24],[265,554,265,613,24],[265,613,583,613,24],
  [519,387,519,526,12],[519,526,590,526,12],[591,522,591,540,12],
  [591,601,651,601,12],
  [527,379,559,379,24],[607,379,633,379,24],[633,359,633,387,24],[645,387,645,525,12],
  [633,311,789,311,24],[789,311,1065,311,24],[633,311,633,359,24],
  [645,473,735,473,12],[735,473,789,473,12],[789,320,789,359,12],[789,425,789,473,12],
  [798,544,1004,544,14],
  [1065,311,1065,339,24],[1065,461,1065,552,24],
  [1105,331,1105,467,12],[1065,331,1105,331,12],[1065,467,1105,467,12],
  [1065,475,1105,475,12],[1105,475,1105,538,12],[1065,538,1145,538,24],
  [735,544,735,665,14],[735,725,735,738,14],[735,742,1004,742,12],
  [1005,552,1005,597,14],[1005,695,1005,742,14],
  [1005,545,1145,545,14],[1145,545,1145,763,24],
  [1013,740,1067,740,14],[1067,740,1067,778,14],[1145,771,1172,771,24],
  [1172,771,1172,995,24],[1067,995,1172,995,24],
  [1067,778,1067,808,24],[1067,950,1067,1020,24],[746,1020,1067,1020,24],
  [746,933,746,1020,24],[725,933,746,933,24],[353,933,659,933,24],
  [353,739,353,933,24],[353,739,438,739,16],[438,739,438,774,24],
  [438,892,438,933,24],[438,613,438,654,24],[438,710,438,739,24],
  [438,613,651,613,16],[651,613,651,740,12],[438,736,487,736,12],[586,736,651,736,12],
  [225,430,225,562,12],[225,430,265,430,12],[225,562,265,562,12]
];
// Wall openings: location, width/height, sill, orientation, style.
export const windows = [
  {x:583,z:379,w:48,sill:.62,h:1.77,axis:'x',style:'bath'},
  {x:265,z:494,w:120,sill:.55,h:1.85,axis:'z',style:'bay'},
  {x:1065,z:400,w:122,sill:.55,h:1.85,axis:'z',style:'bay'},
  {x:438,z:682,w:56,sill:1.03,h:1.47,axis:'z',style:'kitchen'},
  {x:1145,z:654,w:190,sill:.35,h:2.1,axis:'z',style:'balcony'},
  {x:1172,z:883,w:204,sill:.35,h:2.1,axis:'z',style:'balcony'},
  {x:353,z:838,w:164,sill:.65,h:1.8,axis:'z',style:'balcony'}
];
export const doors = [
  {id:'entry',name:'入户门',x:692,z:933,w:66,axis:'x',hinge:1,angle:-1.35},
  {id:'study',name:'书房门',x:591,z:570,w:60,axis:'z',hinge:1,angle:-Math.PI/2},
  {id:'bath',name:'卫生间门',x:618,z:528,w:54,axis:'x',hinge:1,angle:-Math.PI/2,foldOffset:[-11,-6]},
  {id:'bedroom',name:'次卧门',x:735,z:695,w:60,axis:'z',hinge:1,angle:1.37}
];
export const passages = [
  {x:537,z:736,w:98,axis:'x'}, {x:438,z:833,w:118,axis:'z'},
  {x:1067,z:879,w:142,axis:'z'}, {x:1005,z:646,w:98,axis:'z'},
  {x:789,z:392,w:66,axis:'z'}
];
// Door swing in blueprint coordinates, including the inset needed to fold inside the jamb.
export function doorPose(d,angle=d.angle) {
  const rotation=angle+(d.axis==='z'?Math.PI/2:0),fold=Math.abs(Math.sin(angle));
  const hinge=[d.x+(d.axis==='x'?d.hinge*d.w/2:0)+(d.foldOffset?.[0]||0)*fold,d.z+(d.axis==='z'?-d.hinge*d.w/2:0)+(d.foldOffset?.[1]||0)*fold];
  return {hinge,tip:[hinge[0]-d.hinge*d.w*Math.cos(rotation),hinge[1]+d.hinge*d.w*Math.sin(rotation)],rotation};
}
export const furnishings = [
  {type:'sofa',name:'三人沙发',room:'living',rect:[818,952,962,1004],rot:Math.PI},
  {type:'sofa',name:'双人沙发 · 西',room:'living',rect:[765,850,818,947],rot:Math.PI/2},
  {type:'sofa',name:'双人沙发 · 东',room:'living',rect:[965,850,1018,947],rot:-Math.PI/2},
  {type:'coffee',name:'中央茶几',room:'living',rect:[846,868,938,930]},
  {type:'rug',name:'客厅地毯',room:'living',rect:[774,816,1009,1003]},
  {type:'tv',name:'电视矮柜',room:'living',rect:[821,747,968,793]},
  {type:'side',name:'边几与台灯',room:'living',rect:[773,959,814,1000]},
  {type:'side',name:'边几与台灯',room:'living',rect:[970,959,1010,1000]},
  {type:'plant',name:'绿植',room:'living',rect:[751,745,789,786]},
  {type:'plant',name:'绿植',room:'living',rect:[1002,748,1043,789]},
  {type:'plant',name:'落地绿植',room:'living',rect:[1005,974,1046,1015]},
  {type:'dining',name:'六人餐桌',room:'dining',rect:[475,771,625,881]},
  {type:'diningcabinet',name:'实拍餐边长柜与端部白色高柜 · 书籍与日用品',room:'dining',rect:[447,902,646,925]},
  {type:'diningstorage',name:'波纹玻璃收纳高柜 · 地图与挂袋',room:'dining',rect:[447,748,474,774]},
  {type:'kitchen',name:'实拍厨房 · 单槽水池、双眼灶、侧吸油烟机与小家电',room:'kitchen',rect:[447,621,646,731]},
  {type:'masterbed',name:'主卧米色软包床 · 床品、星星与床边双护栏',room:'master',rect:[835,325,955,461]},
  {type:'masternight',name:'米色双抽屉床头柜 · 书籍与充电用品',room:'master',rect:[801,327,834,359]},
  {type:'masterdrawer',name:'床侧浅紫色收纳抽屉柜',room:'master',rect:[961,327,994,357]},
  {type:'masterbay',name:'主卧窗台 · 被褥收纳',room:'master',rect:[1065,340,1100,458]},
  {type:'masterstorage',name:'黄色拉杆箱与白色小收纳柜',room:'master',rect:[1012,483,1050,534]},
  {type:'masterfan',name:'白色循环风扇与低柜',room:'master',rect:[968,505,1000,535]},
  {type:'masterac',name:'主卧香槟色壁挂空调',room:'master',rect:[982,525,1050,539]},
  {type:'closet',name:'三面衣柜',room:'wardrobe',rect:[654,322,783,461]},
  {type:'bed',name:'次卧双人床',room:'bedroom',rect:[815,556,917,687],color:'blue'},
  {type:'rug',name:'床边地毯',room:'bedroom',rect:[801,560,930,697]},
  {type:'side',name:'次卧床头柜',room:'bedroom',rect:[781,556,815,591]},
  {type:'wardrobe',name:'次卧衣柜',room:'bedroom',rect:[740,556,778,650]},
  {type:'studybookcase',name:'四门玻璃书柜 · 书籍、玩具与挂历',room:'study',rect:[278,392,418,423]},
  {type:'studybed',name:'白色收纳床 · 平整蓝色凉感垫',room:'study',rect:[423,395,512,530]},
  {type:'studydesk',name:'窗边长书桌 · 平板、台灯、书籍、地球仪与透明收纳架',room:'study',rect:[284,526,533,602]},
  {type:'studyfiling',name:'四层波纹收纳柜 · 打印机与摄像头',room:'study',rect:[539,574,583,602]},
  {type:'studybay',name:'书房飘窗与窗台',room:'study',rect:[231,437,266,552]},
  {type:'studyac',name:'书房壁挂空调 · 插座与管线',room:'study',rect:[302,588,370,602]},
  {type:'studyaccessories',name:'空气净化器 · 折叠支架与收纳包',room:'study',rect:[278,431,330,460]},
  {type:'bathroom',name:'实拍卫生间 · 弧形淋浴房、白色洗漱柜与生活用品',room:'bath',rect:[529,388,644,522]},
  {type:'laundry',name:'洗衣机与洗衣池',room:'balcony',rect:[1076,945,1162,988]},
  {type:'utility',name:'阳台储物与水池',room:'utility',rect:[362,748,430,925]},
  {type:'ac',name:'空调外机',room:'master',rect:[1077,478,1105,533]}
];
export function pointInPoly(x,z,poly) {
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const a=poly[i],b=poly[j];
    if(((a[1]>z)!==(b[1]>z)) && x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
export const tourStops = [
  {name:'玄关 · 回家',p:[698,902],look:[886,872]},
  {name:'客厅 · 围坐与交谈',p:[937,806],look:[889,933]},
  {name:'景观阳台 · 日光',p:[1120,869],look:[1121,953]},
  {name:'餐厅 · 餐边柜与实拍照片墙',p:[559,765],look:[534,919]},
  {name:'厨房 · 窗边水池与双眼灶',p:[561,729],look:[552,630]},
  {name:'书房 · 实景收纳与休憩',p:[386,538],look:[401,402]},
  {name:'主卧 · 实景床品与流苏窗帘',p:[809,510],look:[984,397]},
  {name:'衣帽间 · 柜门后的收纳',p:[816,392],look:[705,392],openDoor:'wardrobe-entry'},
  {name:'次卧 · 休憩',p:[951,696],look:[862,601]},
  {name:'休闲阳台 · 开阔与日光',p:[1052,650],look:[1134,630]},
  {name:'卫生间 · 实景瓷砖与弧形淋浴房',p:[609,499],look:[550,444]},
  {name:'生活阳台 · 家务角',p:[395,833],look:[395,756]}
];
