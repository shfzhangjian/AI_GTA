"""Original deterministic prototype art. No Scenario jobs or paid generation.
Eight directions x eight frames, fixed feet pivot, nearest-neighbour pixel art.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import math, json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'
OUT.mkdir(exist_ok=True)
CAST = [
 ('ranger','苔痕','#9fbd7d','#dfba7b','hood'),('knight','铁誓','#a8b9be','#ca9877','helm'),
 ('witch','烬灯','#db986d','#edc984','hat'),('rogue','鸦影','#b3a6c5','#ded3b9','mask'),
 ('tinker','铜铃','#d2ad68','#8cacb0','goggles'),('oracle','霜书','#96c5d0','#e4dfc8','hood'),
 ('monk','震岳','#bba078','#c5ad76','bald'),('botanist','孢芽','#bbc684','#e8a390','mushroom'),
 ('warden','夜潮','#88aaa8','#c9aecc','veil'),('corsair','赤帆','#d18d7e','#e7d19a','bandana')]
ROWS=['se','sw','ne','nw','e','w','s','n']
ANGLE={'se':.6,'sw':2.54,'ne':-.6,'nw':-2.54,'e':0,'w':math.pi,'s':math.pi/2,'n':-math.pi/2}
def shade(c,k):
 r,g,b=tuple(bytes.fromhex(c[1:]));return tuple(int(min(255,max(0,v*k))) for v in (r,g,b))
def cell(main,accent,shape,facing,cycle,frame):
 im=Image.new('RGBA',(40,44));d=ImageDraw.Draw(im);outline='#172522';skin='#d9b794';boot='#424338'
 a=ANGLE[facing];side=abs(math.cos(a))>.9;back=facing in ['n','ne','nw'];sign=-1 if facing in ['sw','nw','w'] else 1
 phase=frame*math.pi/4;bob=round(abs(math.sin(phase))*(1.2 if cycle=='run' else .6)) if cycle in ['walk','run'] else (round((math.sin(phase)+1)*.45) if cycle=='idle' else round(math.sin(phase)*1))
 stride=round(math.sin(phase)*(3 if cycle=='run' else 2)) if cycle in ['walk','run'] else 0
 cx=20;foot=38;top=13-bob
 def poly(points,fill):d.polygon(points,fill=fill);d.line(points+[points[0]],fill=outline,width=1)
 # Back cloak and boots use the same baseline in every cell.
 poly([(cx-7,top+9),(cx+6,top+9),(cx+9,foot-5),(cx-9,foot-5)],shade(main,.67))
 for offset,leg in [(-4,stride),(3,-stride)]:
  y=foot+round(leg*.6);x=cx+offset+(sign*round(leg*.4) if side else 0)
  d.rectangle((x-2,top+19,x+1,y-1),fill=shade(main,.48));d.rectangle((x-3,y-2,x+3,y),fill=outline);d.rectangle((x-2,y-2,x+2,y-1),fill=boot)
 bodyw=5 if side else 7
 poly([(cx-bodyw,top+8),(cx+bodyw,top+8),(cx+bodyw+1,top+20),(cx-bodyw-1,top+20)],main)
 d.rectangle((cx-bodyw+1,top+9,cx-1,top+17),fill=shade(main,1.10))
 d.line((cx-bodyw,top+19,cx+bodyw,top+19),fill=accent,width=2);d.rectangle((cx-1,top+18,cx+1,top+20),fill='#e4cf93')
 arm=round(math.sin(phase)*2) if cycle in ['walk','run'] else 0
 if cycle=='attack':arm=round(math.sin(frame/7*math.pi)*5)
 for dx,dy in [(-bodyw-2,arm),(bodyw+2,-arm)]:
  poly([(cx+dx-2,top+9),(cx+dx+1,top+9),(cx+dx+2,top+17+dy),(cx+dx-1,top+18+dy)],shade(main,.8))
  d.rectangle((cx+dx-1,top+17+dy,cx+dx+1,top+19+dy),fill=skin)
 # Slight head shift is viewpoint only; all motion stays registered at the feet.
 hx=cx+(sign*2 if side else sign if facing not in ['s','n'] else 0)
 d.rectangle((hx-5,top+1,hx+5,top+8),fill=outline);d.rectangle((hx-4,top+1,hx+4,top+7),fill=skin if not back else shade(main,.72))
 if not back:
  ex=hx+sign*2 if side else hx-2;d.point((ex,top+4),fill=outline)
  if not side:d.point((hx+2,top+4),fill=outline)
  d.line((hx-1,top+7,hx+2,top+7),fill='#a17259')
 if shape in ['hood','veil']:
  poly([(hx-6,top+5),(hx-6,top),(hx-3,top-3),(hx+3,top-3),(hx+6,top),(hx+6,top+7),(hx+4,top+6),(hx+4,top+1),(hx-4,top+1),(hx-4,top+6)],shade(main,.72))
  d.line((hx-3,top-2,hx+3,top-2),fill=shade(main,1.15))
  if back:d.rectangle((hx-4,top+1,hx+4,top+9),fill=shade(main,.8));d.line((hx,top+2,hx,top+7),fill=shade(main,.66))
  if shape=='veil':d.rectangle((hx-4,top+5,hx+4,top+7),fill=shade(main,.6))
 elif shape=='helm':
  poly([(hx-6,top+6),(hx-6,top),(hx-3,top-3),(hx+3,top-3),(hx+6,top),(hx+6,top+7)],main)
  d.line((hx-4,top+3,hx+4,top+3),fill=outline,width=2);d.line((hx,top-2,hx,top+7),fill=shade(main,1.25));d.rectangle((hx-2,top-6,hx+1,top-3),fill=accent)
 elif shape=='hat':
  poly([(hx-9,top),(hx+9,top),(hx+2,top-3),(hx-1,top-10),(hx-5,top-3)],shade(main,.7));d.line((hx-6,top-1,hx+6,top-1),fill=accent,width=2)
 elif shape=='mushroom':
  d.ellipse((hx-8,top-6,hx+8,top+2),fill=outline);d.ellipse((hx-7,top-5,hx+7,top+1),fill=accent);d.rectangle((hx-3,top-4,hx-1,top-3),fill='#efdfb6');d.point((hx+4,top-1),fill='#efdfb6')
 elif shape=='mask':
  d.rectangle((hx-5,top-1,hx+5,top+1),fill=shade(main,.5));d.rectangle((hx-4,top+5,hx+4,top+8),fill=shade(main,.6));d.line((hx-2,top+5,hx+2,top+5),fill=accent)
 elif shape=='goggles':
  d.rectangle((hx-5,top-1,hx+5,top+1),fill=shade(main,.5));d.line((hx-5,top+3,hx+5,top+3),fill=accent,width=3);d.point((hx-2,top+3),fill='#dddfbb');d.point((hx+2,top+3),fill='#dddfbb')
 elif shape=='bald':
  d.arc((hx-4,top-1,hx+4,top+6),180,360,fill='#f0cfab',width=1);d.line((hx-5,top+9,hx+4,top+16),fill=accent,width=3)
 elif shape=='bandana':
  d.rectangle((hx-5,top-1,hx+5,top+1),fill=main);d.rectangle((hx+4,top+1,hx+6,top+8),fill=main);d.point((hx+1,top),fill=accent)
 if back:d.line((cx,top+11,cx,top+16),fill=shade(main,.6));d.rectangle((cx-3,top+13,cx+3,top+17),fill=shade(accent,.67))
 else:d.rectangle((cx-2,top+11,cx+1,top+13),fill=accent)
 return im.resize((80,88),Image.Resampling.NEAREST)

meta={'source':'original procedural pixel art; no paid AI generation','cell':[80,88],'pivot':[40,76],'rows':ROWS,'frames':8,'cycles':{}}
for cycle,fps in [('idle',5),('walk',8),('run',12),('attack',14)]:
 meta['cycles'][cycle]={f:{'fps':fps,'loop':cycle!='attack'} for f in ROWS}
 for ident,name,main,accent,shape in CAST:
  sheet=Image.new('RGBA',(640,704))
  for row,facing in enumerate(ROWS):
   for fr in range(8):sheet.paste(cell(main,accent,shape,facing,cycle,fr),(fr*80,row*88))
  sheet.save(OUT/f'{ident}_{cycle}.png')
(OUT/'meta.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
print('40 sprite sheets written: 10 heroes x 4 cycles x 8 directions x 8 frames.')
