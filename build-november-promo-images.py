"""Export selected clinic photographs for promotions. Originals stay unchanged.
Run: python3 build-november-promo-images.py
Pillow is required. The folders below are the local clinic photo archive.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'assets/photos'
# crop centers are normalized positions within the available crop range.
PHOTOS = [
    ('peeling-course', 'Уходовые процедуры лицо/DSCF4351.jpg', (0.5, 0.43), (0.5, 0.55)),
    ('laser-new', 'эпиляция/DSCF2685.jpg', (0.5, 0.5), (0.65, 0.5)),
    ('rf-needling', 'микроигольчатый Sylfirm/DSCF3710.jpg', (0.5, 0.28), (0.5, 0.42)),
]
for name, source, wide_center, mobile_center in PHOTOS:
    with Image.open(ROOT / 'услуги (1)' / source) as original:
        photo = ImageOps.exif_transpose(original).convert('RGB')
        for suffix, width, ratio, center in [
            ('', 2000, 767 / 485, wide_center),
            ('-1250', 1250, 767 / 485, wide_center),
            ('-650', 650, 767 / 485, wide_center),
            ('-m', 1050, 350 / 432, mobile_center),
            ('-m-700', 700, 350 / 432, mobile_center),
            ('-m-350', 350, 350 / 432, mobile_center),
        ]:
            target = OUT / f'promo-{name}{suffix}.webp'
            cropped = ImageOps.fit(photo, (width, round(width / ratio)), method=Image.Resampling.LANCZOS, centering=center)
            cropped.save(target, 'WEBP', quality=86, method=6)
        print(f'{name}: {source}')
