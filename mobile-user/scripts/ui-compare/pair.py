# Side-by-side WEB | APP comparison images, plus contact sheets of 6 pairs each.
# usage: python3 pair.py <webdir> <appdir> <outdir>   (pairs every name present in both dirs)
import os
import sys
from PIL import Image, ImageDraw

web, app, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
names = sorted(n[:-4] for n in os.listdir(app) if n.endswith('.png') and os.path.exists(f'{web}/{n}'))
for n in names:
    w = Image.open(f'{web}/{n}.png').convert('RGB').resize((412, 915))
    a = Image.open(f'{app}/{n}.png').convert('RGB').resize((412, 915))
    im = Image.new('RGB', (412 * 2 + 12, 935), 'white')
    im.paste(w, (0, 20))
    im.paste(a, (424, 20))
    d = ImageDraw.Draw(im)
    d.text((4, 4), f'WEB  {n}', fill='black')
    d.text((428, 4), 'APP', fill='black')
    im.save(f'{out}/{n}.png')
for k in range(0, len(names), 6):
    sheet = Image.new('RGB', (3 * 418, 2 * 470), 'white')
    for i, n in enumerate(names[k:k + 6]):
        sheet.paste(Image.open(f'{out}/{n}.png').resize((418, 470)), ((i % 3) * 418, (i // 3) * 470))
    sheet.save(f'{out}/_sheet{k // 6}.png')
print('pairs:', len(names))
