"""Prepare vector lettering and SVG drone coordinates; no runtime bitmap assets."""
from pathlib import Path
import json
import os
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parent
font_path = os.environ.get('YUSHAN_TITLE_FONT', 'C:/Windows/Fonts/msyh.ttc')
font = TTFont(font_path, fontNumber=0)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
units = font['head'].unitsPerEm

def outlines(value, size):
    cursor = 0
    result = []
    for character in value:
        name = cmap.get(ord(character))
        if not name:
            continue
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        result.append({'d': pen.getCommands(), 'x': round(cursor, 3), 'scale': size / units})
        cursor += glyphs[name].width * size / units + size * .08
    return {'glyphs': result, 'width': cursor}

def dots(value):
    # This tiny temporary glyph mask is converted to coordinate data only.
    f = ImageFont.truetype(os.environ.get('YUSHAN_DOT_FONT', 'C:/Windows/Fonts/simhei.ttf'), 18)
    im = Image.new('L', (len(value)*21, 22), 0)
    draw = ImageDraw.Draw(im)
    for i, ch in enumerate(value):
        draw.text((i*21, 0), ch, font=f, fill=255, stroke_width=0)
    return [[x, y] for y in range(im.height) for x in range(im.width) if im.getpixel((x,y)) > 105]

data = {
    'title': outlines('今夜，走慢一点。', 32),
    'intro': outlines('一座会呼吸的像素小城', 10),
    'subtitle': outlines('沿着雨山湖，收集一城灯火。', 12),
    'love': outlines('我爱马鞍山雨山湖', 18),
    'ending': outlines('把心意写进夜空，把灯火留在湖面。', 12),
    'dots': dots('我爱马鞍山雨山湖')
}
(ROOT/'lettering.js').write_text('window.YUSHAN_LETTERING = '+json.dumps(data, ensure_ascii=False, separators=(',', ':'))+';\n', encoding='utf-8')
print('Drone text points:', len(data['dots']))
