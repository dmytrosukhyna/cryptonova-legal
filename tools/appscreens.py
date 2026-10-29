"""The app screens of the site's phone (assets/img/screens/<lang>/<tab>.webp, 720×1560) from the app's own pictures.
  python3 tools/appscreens.py <pictures>/screens/iphone13pm assets/img/screens
The pictures come from the app repo's draft release «screens-<run>» (iPhone 13 Pro Max, 1284×2778, five languages); 29.10.2026:
screens-40757126728 (build 48/49, the new emblem and the new split). Each is scaled to 1560 high and centre-cropped to 720 wide."""
import sys, os
from PIL import Image
SRC, DST = sys.argv[1], sys.argv[2]
MAP = {"home": "08_home_public", "demo": "11_home_demo_created", "fut": "19_futures_top", "spot": "16_spot_portfolio",
       "nova": "22b_nova_greeting_topics", "review": "21b_b45_nova_review_pick", "buy": "08c_home_buy_now",
       "learn": "23_learn_levels", "piggy": "28_piggy_not_started", "connect": "13_connect_intro"}
tot = 0
for l in ["en", "ru", "uk", "el", "es"]:
    for tab, f in MAP.items():
        im = Image.open(os.path.join(SRC, l, f + ".png")).convert("RGB")
        w, h = im.size
        nw = round(w * 1560 / h)              # scale to 1560 high (no distortion), then centre-crop to 720 wide
        im = im.resize((nw, 1560), Image.LANCZOS)
        x0 = (nw - 720) // 2
        im = im.crop((x0, 0, x0 + 720, 1560))
        out = os.path.join(DST, l, tab + ".webp")
        im.save(out, "WEBP", quality=80, method=6)
        tot += os.path.getsize(out)
print("total KB", tot // 1024)
