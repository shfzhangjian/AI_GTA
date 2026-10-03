import { outline,rooms,walls,windows,doors,passages,furnishings,roomArea,doorPose } from './data.js';
import { bathLayout } from './bathroom.js';
import { roomSlides } from './kitchen-dining.js';
const points = p => p.map(v=>v.join(',')).join(' ');
const rect=(x,y,w,h,cls='plan-fixture',rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}"/>`;
const line=(a,b,c,d,color='#abb29f',width=1)=>`<path d="M${a},${b}L${c},${d}" stroke="${color}" stroke-width="${width}" fill="none"/>`;
function symbols(f){
  const [x,y,x2,y2]=f.rect,w=x2-x,h=y2-y,cx=x+w/2,cy=y+h/2;
  let content='';
  if(f.type==='rug')return rect(x,y,w,h,'plan-green',2);
  if(f.type==='plant') {content=`<circle cx="${cx}" cy="${cy}" r="${Math.min(w,h)*.34}" fill="#d9e3cc" stroke="#a4b790"/>`;for(let i=0;i<9;i++){const a=i*Math.PI*2/9;content+=`<ellipse cx="${cx+Math.cos(a)*w*.23}" cy="${cy+Math.sin(a)*h*.23}" rx="${w*.08}" ry="${h*.23}" fill="#adbc9b" transform="rotate(${i*40+90} ${cx+Math.cos(a)*w*.23} ${cy+Math.sin(a)*h*.23})"/>`;}return content;}
  if(f.type==='studybed')return rect(x,y,w,h,'plan-fixture',3)+rect(x+3,y+5,w-6,h-8,'plan-green',2)+rect(x,y,w,4,'plan-fixture',1);
  if(['bed','masterbed'].includes(f.type)){const single=f.single;content=rect(x,y,w,h,'plan-fixture',3)+rect(x+3,y+28,w-6,h-31,'plan-green',2)+line(x+3,y+h*.72,x2-3,y+h*.72);const pillowWidth=single?w*.6:w/2-8;for(const px of single?[cx-pillowWidth/2]:[x+5,cx+2])content+=rect(px,y+5,pillowWidth,22,'plan-fixture',4);if(f.type==='masterbed')for(const yy of [y+h*.25,y+h*.66])content+=rect(x2+1,yy,4,40,'plan-green',2);return content;}
  if(['masternight','masterdrawer'].includes(f.type))return rect(x,y,w,h,'plan-fixture',3)+line(x+3,y2-5,x2-3,y2-5);
  if(f.type==='masterbay')return rect(x,y,w,h,'plan-fixture')+rect(x+3,y+9,w-6,h-18,'plan-green',5);
  if(f.type==='masterstorage')return rect(x,y+6,w*.53,h-6,'plan-green',4)+rect(x+w*.58,y,w*.42,h,'plan-fixture',2);
  if(f.type==='masterfan')return rect(x,y,w,h,'plan-fixture',2)+`<circle cx="${cx}" cy="${cy}" r="${w*.38}" class="plan-green"/>`;
  if(f.type==='masterac')return rect(x,y2-6,w,6,'plan-green',3);
  if(f.type==='studybookcase'){content=rect(x,y,w,h,'plan-fixture');for(let i=0;i<4;i++){content+=rect(x+i*w/4+2,y+3,w/4-4,h-6,'plan-green',1);for(let j=0;j<6;j++)content+=line(x+i*w/4+5+j*4,y+7,x+i*w/4+5+j*4,y2-5);}return `<g aria-label="四门玻璃书柜"><title>${f.name}</title>${content}</g>`;}
  if(f.type==='studydesk'){const split=x+140;content=rect(x,y2-41,140,41)+rect(split,y2-28,w-140,28)+rect(x+63,y2-26,24,5,'plan-green');content+=`<circle cx="${x+67}" cy="${y+15}" r="13" class="plan-fixture"/>`+rect(x+128,y2-26,38,22,'plan-green',2);for(const px of [x2-69,x2-39])content+=rect(px,y2-26,23,21,'plan-green');content+=`<circle cx="${x2-29}" cy="${y2-17}" r="8" class="plan-fixture"/>`;return `<g aria-label="实拍长书桌与透明收纳架"><title>${f.name}</title>${content}</g>`;}
  if(f.type==='studyfiling')return rect(x,y,w,h)+rect(x+4,y+3,w-8,h-6,'plan-green',1);
  if(f.type==='studybay')return rect(x,y,w,h,'plan-fixture');
  if(f.type==='studyac')return rect(x,y2-6,w,6,'plan-green',2);
  if(f.type==='studyaccessories')return `<circle cx="${x2-12}" cy="${y2-12}" r="10" class="plan-fixture"/>`+line(x+6,y+2,x+6,y2-2)+rect(x+10,y+3,15,23,'plan-green',2);
  if(f.type==='sofa'||f.type==='armchair'){
    const vertical=f.type==='sofa'&&w<h;
    content=rect(x,y,w,h,'plan-fixture',7);
    content+=rect(x+6,y+6,w-12,h-12,'plan-green',4);
    if(vertical){const bx=f.rot>0?x:x2-8;content+=rect(bx,y+2,8,h-4,'plan-fixture',3);for(let i=1;i<3;i++)content+=line(x+8,y+h*i/3,x2-8,y+h*i/3);}
    else {content+=rect(x+3,y2-9,w-6,8,'plan-fixture',3);for(let i=1;i<(w>100?3:2);i++)content+=line(x+w*i/(w>100?3:2),y+7,x+w*i/(w>100?3:2),y2-10);}
    return content;
  }
  if(f.type==='dining'){content=rect(x+w*.18,y+h*.22,w*.64,h*.56,'plan-fixture',3);for(const px of [x+w*.3,x+w*.66])for(const py of [y,y2-15])content+=rect(px-10,py,22,15,'plan-green',3);for(const px of [x,x2-16])content+=rect(px,cy-11,16,22,'plan-green',3);content+=`<circle cx="${cx}" cy="${cy}" r="8" fill="#aebd9a"/>`;return content;}
  if(f.type==='kitchen'){content=rect(x,y,w,37)+rect(x,y+37,37,h-37)+rect(x2-37,y+37,37,h-37);content+=rect(cx-29,y+5,61,29,'plan-green',2);for(const bx of [cx-15,cx+17])content+=`<circle cx="${bx}" cy="${y+19}" r="8" fill="none" stroke="#90988e"/>`;content+=rect(x+6,y+47,26,45,'plan-green',3)+rect(x2-32,y+59,27,29,'plan-green',2);return content;}
  if(f.type==='diningcabinet')return rect(x,y,w,h)+rect(x2-40,y,40,h,'plan-green')+line(x,y+4,x2-40,y+4);
  if(f.type==='diningstorage')return rect(x,y,w,h,'plan-green',2);
  if(f.type==='bathroom'){const [a,b]=bathLayout.corner,[rx,rz]=bathLayout.shower;content=`<path d="M${a},${b}h${rx}A${rx},${rz} 0 0 1 ${a},${b+rz}Z" class="plan-green"/><path d="M${a+rx*.707},${b+rz*.707}l3,3" stroke="#6b786b"/>`+rect(a+10,b+5,21,20,'plan-fixture',2);content+=rect(x2-35,y+3,26,12,'plan-fixture',2)+`<ellipse cx="${x2-22}" cy="${y+33}" rx="13" ry="19" class="plan-fixture"/>`;content+=rect(x,y2-59,33,58,'plan-fixture',3)+`<ellipse cx="${x+17}" cy="${y2-33}" rx="11" ry="17" class="plan-green"/>`+line(x+3,y2-54,x+3,y2-5);for(const yy of [y+50,y+80,y+103])content+=`<circle cx="${x2-4}" cy="${yy}" r="4" class="plan-green"/>`;return `<g aria-label="实拍卫生间 · 弧形淋浴房与白色洗漱柜">${content}</g>`;}
  if(f.type==='closet'){content=rect(x,y,28,h)+rect(x+28,y,w-28,28)+rect(x+28,y2-28,w-28,28);for(let i=0;i<22;i++)content+=line(x+5,y+i*h/22,x+24,y+i*h/22);for(let i=0;i<16;i++)content+=line(x+28+i*(w-28)/16,y+4,x+28+i*(w-28)/16,y+25)+line(x+28+i*(w-28)/16,y2-25,x+28+i*(w-28)/16,y2-4);return content;}
  if(f.type==='computerdesk'){
    const front=y2-41;
    content=rect(x,front,w,41,'plan-fixture',2)+rect(cx-32,front+5,66,28,'plan-green',2);
    content+=rect(cx-30,y2-16,47,4,'plan-fixture',1)+line(cx-6,y2-12,cx-6,y2-7)+line(cx-15,y2-7,cx+3,y2-7);
    content+=rect(cx-23,front+8,30,10,'plan-fixture',1)+`<ellipse cx="${cx+18}" cy="${front+13}" rx="3" ry="5" class="plan-fixture"/>`;
    content+=rect(x2-26,front+2,19,29,'plan-green',2)+rect(cx-17,y+4,34,29,'plan-green',5)+rect(cx-16,y+2,32,6,'plan-fixture',3);
    content+=line(cx-21,y+12,cx-21,y+27)+line(cx+21,y+12,cx+21,y+27);
    return `<g aria-label="电脑桌、显示器、键鼠、主机与办公椅"><title>电脑工作区</title>${content}</g>`;
  }
  if(f.type==='desk'||f.type==='workdesk'){content=rect(x,y,w,h*.45)+rect(cx-13,y+h*.64,26,22,'plan-green',4)+rect(cx-13,y+5,26,17,'plan-green',1)+line(cx-15,y+23,cx+15,y+23);return content;}
  if(f.type==='side')return rect(x,y,w,h)+`<circle cx="${cx}" cy="${cy}" r="${w*.25}" class="plan-green"/>`;
  if(f.type==='coffee')return rect(x,y,w,h,'plan-fixture',2)+rect(x+8,y+8,w-16,h-16,'plan-green',1);
  if(f.type==='tv')return rect(x,y,w,h,'plan-fixture',2)+rect(x+23,y+8,w-46,5,'plan-green');
  if(f.type==='laundry')return rect(x,y,w,h)+line(cx,y,cx,y2)+`<circle cx="${x+w*.25}" cy="${cy}" r="${h*.28}" class="plan-green"/><ellipse cx="${x+w*.76}" cy="${cy}" rx="${w*.17}" ry="${h*.27}" class="plan-green"/>`;
  if(f.type==='utility')return rect(x,y,w,31)+rect(x,y2-32,w,32)+`<ellipse cx="${cx}" cy="${y2-17}" rx="16" ry="11" class="plan-green"/>`;
  content=rect(x,y,w,h);
  const n=Math.max(2,Math.round(Math.max(w,h)/45));for(let i=1;i<n;i++){if(w>h)content+=line(x+w*i/n,y,x+w*i/n,y2);else content+=line(x,y+h*i/n,x2,y+h*i/n);}
  return content;
}
export function createPlan(mini=false) {
  const shapes=rooms.map(r=>`<polygon class="${mini?'mini-room':'plan-room'}" data-plan-room="${r.id}" points="${points(r.poly)}" fill="${r.id==='bath'?'#e8dbc5':r.id==='study'?'#d9c8be':r.kind==='private'?'#eee9dc':r.kind==='balcony'?'#e4e8d9':'#f0f0e6'}" stroke="#dfe3d5" stroke-width="1"/>`).join('');
  if(mini)return `<svg viewBox="190 285 1020 770" aria-label="户型导航地图"><polygon points="${points(outline)}" fill="#edeedf" stroke="#aab89e" stroke-width="5"/>${shapes}<path id="mini-direction" fill="#56784833"/><circle id="mini-player" class="player" cx="692" cy="920" r="13"/></svg>`;
  let content=`<polygon points="${points(outline)}" fill="#eeeee3" stroke="#adb89d" stroke-width="2"/>${shapes}`;
  content+=`<g class="plan-furniture">${furnishings.filter(f=>f.type==='rug').map(symbols).join('')}${furnishings.filter(f=>f.type!=='rug').map(symbols).join('')}</g>`;
  content+=walls.map(([a,b,c,d,t])=>rect(Math.min(a,c)- (a===c?t/2:0),Math.min(b,d)-(b===d?t/2:0),a===c?t:Math.abs(c-a),b===d?t:Math.abs(d-b),'plan-wall')).join('');
  content+=windows.map(w=> w.axis==='z'?rect(w.x-4,w.z-w.w/2,8,w.w,'plan-green'):rect(w.x-w.w/2,w.z-4,w.w,8,'plan-green')).join('');
  content+=doors.map(d=>{const pose=doorPose(d),swing=Array.from({length:17},(_,i)=>doorPose(d,d.angle*i/16).tip);return `<g aria-label="${d.name}${d.id==='bath'||d.id==='study'?' · 向内开启并贴近侧墙':''}"><path d="M${pose.hinge.join(',')}L${pose.tip.join(',')}M${swing.map(p=>p.join(',')).join('L')}" stroke="#a3ad96" stroke-width="1" fill="none"/></g>`;}).join('');
  content+=`<rect x="${690-.70*963/14.44/2}" y="480" width="${.70*963/14.44}" height="3" fill="#545b49"><title>走廊挂画</title></rect>`;
  content+=passages.filter(p=>p.x!==789).map(p=>p.axis==='z'?line(p.x-1,p.z-p.w/2,p.x-1,p.z+p.w/2):line(p.x-p.w/2,p.z,p.x+p.w/2,p.z)).join('');
  content+=roomSlides.map(p=>`<g aria-label="${p.name}">${p.axis==='x'?rect(p.x-p.w/2,p.z-3,p.w/2,3,'plan-green')+`<g data-room-slide="${p.id}" transform="translate(${-p.w/2} 0)">${rect(p.x,p.z+2,p.w/2,3,'plan-green')}</g>`:rect(p.x-3,p.z,3,p.w/2,'plan-green')+`<g data-room-slide="${p.id}" transform="translate(0 ${p.w/2})">${rect(p.x+2,p.z-p.w/2,3,p.w/2,'plan-green')}</g>`}</g>`).join('');
  content+=`<g id="plan-cabinet-entry" aria-label="衣帽间推拉柜门 · 已左右滑开">${rect(794,317,7,42)}${rect(794,425,7,42)}<path d="M792 359V425" stroke="#b3a48b" stroke-width="1"/><g data-cabinet-leaf="-1" transform="translate(0 -35)">${rect(801,358,3,35,'plan-green')}</g><g data-cabinet-leaf="1" transform="translate(0 35)">${rect(801,391,3,35,'plan-green')}</g><path d="M807 381V367l-3 4m3-4 3 4M807 403v14l-3-4m3 4 3-4" stroke="#88778d" stroke-width="1.2" fill="none"/></g>`;
  content+=`<g id="plan-labels">${rooms.map(r=>`<text class="plan-label" x="${r.label[0]}" y="${r.label[1]}" text-anchor="middle">${r.name}</text><text class="plan-area" x="${r.label[0]}" y="${r.label[1]+15}" text-anchor="middle">${roomArea(r).toFixed(1)} m²</text>`).join('')}</g>`;
  content+=`<g stroke="#aab29d" stroke-width=".8" fill="none"><path d="M217 262v25M1180 262v25M217 273H1180M1230 303h25M1230 1028h25M1243 303v725"/><path d="m691 960 8-13 8 13m-8-13v24"/></g><text class="plan-dimension" x="699" y="264" text-anchor="middle">14440 mm</text><text class="plan-dimension" x="1260" y="667" text-anchor="middle" transform="rotate(90 1260 667)">10870 mm</text><text class="plan-label" x="699" y="990" text-anchor="middle">入口</text>`;
  content+=`<image class="blueprint-overlay" id="plan-blueprint" href="${window.__DRAWINGS?.furniture||'/public/drawings/furniture.jpg'}" x="0" y="0" width="1600" height="1280" style="display:none"/>`;
  return `<svg viewBox="165 245 1130 850" aria-label="按图纸重建的户型平面图" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}
