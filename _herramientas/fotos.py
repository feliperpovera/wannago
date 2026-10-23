# Convierte _originales/*.jpg en fotos/NOMBRE.webp (1600 px), fotos/NOMBRE-800.webp
# y fotos/og/NOMBRE.jpg (1200x630 para compartir). Escribe fotos/medidas.json.
# Uso (desde sitio/): python3 _herramientas/fotos.py
import json, pathlib
from PIL import Image, ImageOps

src, out = pathlib.Path('_originales'), pathlib.Path('fotos')
(out / 'og').mkdir(parents=True, exist_ok=True)
medidas = {}
for f in sorted(src.glob('*.jpg')):
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    for w, suf in ((1600, ''), (800, '-800')):
        r = im.copy(); r.thumbnail((w, w))
        r.save(out / f'{f.stem}{suf}.webp', 'WEBP', quality=64, method=6)
        if not suf: medidas[f.stem] = r.size
    ImageOps.fit(im, (1200, 630)).save(out / 'og' / f'{f.stem}.jpg', quality=70, optimize=True, progressive=True)
(out / 'medidas.json').write_text(json.dumps(medidas, indent=0))
print(len(medidas), 'fotos')
