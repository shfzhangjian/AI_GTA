from PIL import Image,ImageDraw
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
meta=json.loads((root/'assets/meta.json').read_text(encoding='utf8'))
heroes=[p.stem[:-5] for p in (root/'assets').glob('*_idle.png')]
assert len(heroes)==10
assert meta['pivot']==[40,76] and len(meta['rows'])==8
for hero in heroes:
 for cycle in ['idle','walk','run','attack']:
  sheet=Image.open(root/f'assets/{hero}_{cycle}.png')
  assert sheet.size==(640,704) and sheet.mode=='RGBA'
  for row in range(8):
   cells=[sheet.crop((fr*80,row*88,(fr+1)*80,(row+1)*88)) for fr in range(8)]
   for cell in cells:
    bounds=cell.getbbox();assert bounds and bounds[0]>0 and bounds[1]>0 and bounds[2]<80 and bounds[3]<88,(hero,cycle,bounds)
   assert len(set(cell.tobytes() for cell in cells))>1,(hero,cycle,'static cycle')
out=root/'docs'/'ranger-8dir-preview.gif'
frames=[]
for fr in range(8):
 im=Image.new('RGB',(400,230),'#1d2c24');d=ImageDraw.Draw(im)
 for i,facing in enumerate(meta['rows']):
  sheet=Image.open(root/'assets/ranger_walk.png');cell=sheet.crop((fr*80,i*88,(fr+1)*80,(i+1)*88));x=(i%4)*100+10;y=(i//4)*112+12;im.paste(cell,(x,y),cell);d.text((x+26,y+80),facing.upper(),fill='#c6d2a1')
 frames.append(im)
frames[0].save(out,save_all=True,append_images=frames[1:],duration=125,loop=0,disposal=2)
print('40 transparent sheets validated: sizes, 8 directions, fixed pivot, unclipped cells and animated cycles. Preview:',out)
