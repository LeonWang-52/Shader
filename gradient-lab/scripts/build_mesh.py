"""Bake reference color control points into GLSL; no image texture at runtime."""
from pathlib import Path
from PIL import Image, ImageFilter
import shutil
import sys
root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv)>1 else root / 'reference/color.png'
if source.resolve() != (root / 'reference/color.png').resolve():
    shutil.copyfile(source, root / 'reference/color.png')
im = Image.open(source).convert('RGB').filter(ImageFilter.GaussianBlur(9))
w,h=20,14
colors=[]
for y in range(h):
    for x in range(w):
        c=im.getpixel((round(x*(im.width-1)/(w-1)), round(y*(im.height-1)/(h-1))))
        colors.append('    vec3('+', '.join(f'{v/255:.5f}' for v in c)+')')
(root/'shaders/mesh.glsl').write_text('// Reference-derived sRGB control points, top-to-bottom.\nconst ivec2 GRID = ivec2(20, 14);\nconst vec3 COLORS[280] = vec3[280](\n'+',\n'.join(colors)+'\n);\n')

p = root / "shaders"
(p / "fragment.glsl").write_text("#version 300 es\nprecision highp float;\n" + (p / "mesh.glsl").read_text() + "\n" + (p / "effect.glsl").read_text())
