"""  python3 tools/novaparts.py <the owner's NOVA AI picture, 1254×1254 with alpha> assets/img/nova-parts.webp
The owner's NOVA AI picture cut into the parts the live emblem animates: the glowing «N» core and the four coins.
   Sheet 512×256 (WebP, alpha): core at 0,0 (256×256, its glass interior, radius 0.715 of the sphere), coins 128×128 at
   256,0 BTC · 384,0 ETH · 256,128 SOL · 384,128 BNB (the disc with its rim, radius 50 of 64)."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
src = Image.open(sys.argv[1]).convert("RGBA")
out = sys.argv[2]
sheet = Image.new("RGBA", (512, 256), (0, 0, 0, 0))


def disc(cx, cy, half, r_in, r_out, size):
    crop = src.crop((round(cx - half), round(cy - half), round(cx + half), round(cy + half)))
    n = crop.size[0]
    m = Image.new("L", (n * 4, n * 4), 0)
    k = 4 * n / (2 * half)
    ImageDraw.Draw(m).ellipse((2 * n - r_out * k, 2 * n - r_out * k, 2 * n + r_out * k, 2 * n + r_out * k), fill=255)
    m = m.resize((n, n), Image.LANCZOS).filter(ImageFilter.GaussianBlur((r_out - r_in) / 2.2))
    a = np.minimum(np.array(crop.split()[3]), np.array(m))
    crop.putalpha(Image.fromarray(a.astype("uint8")))
    return crop.resize((size, size), Image.LANCZOS)


# the core: the sphere is centred at 634,621 (radius ≈165); its interior up to 118 px is free of the orbit lines
sheet.paste(disc(634, 621, 128, 108, 120, 256), (0, 0))
for (x, y), (px, py) in zip([(328.5, 295.5), (1123.5, 510.5), (307.5, 874.5), (988.5, 898.5)], [(256, 0), (384, 0), (256, 128), (384, 128)]):
    sheet.paste(disc(x, y, 64, 47, 53, 128), (px, py))
sheet.save(out, "WEBP", quality=86, method=6)
print(out)
