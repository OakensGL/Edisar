# v27.2: añade al atlas existente (assets/tileset.png) los sprites 116.. : Tierra de ceniza (3 variantes, dibujada aquí, CC0),
# puerta de hierro abierta y reja abierta (DCSS, CC0). Uso: python3 scripts/tiles272.py <carpeta "Dungeon Crawl Stone Soup Full"> [assets/tileset.png]
import sys, random
from PIL import Image, ImageEnhance, ImageOps
D = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else "assets/tileset.png"
def L(p): return Image.open(f"{D}/{p}").convert("RGBA")
def bright(im, k): return ImageEnhance.Brightness(im).enhance(k)
def gray(im, k=1.0):
    g = ImageOps.grayscale(im.convert("RGB")).convert("RGBA"); g.putalpha(im.getchannel("A")); return bright(g, k)
def tint(im, rgb, k=0.5):
    g = gray(im); ov = Image.new("RGBA", im.size, rgb + (255,)); out = Image.blend(g, ov, k); out.putalpha(im.getchannel("A")); return out
def ash(seed):  # mismo aspecto que el suelo del Bosque Muerto (cqcGround en el juego): ceniza oscura con motas, hierba muerta y algún hueso
    R = random.Random(seed); im = Image.new("RGBA", (32, 32), (52, 48, 45, 255)); p = im.load()
    C = [(42, 38, 36), (66, 60, 56), (76, 69, 63), (45, 41, 38), (87, 80, 73)]
    for _ in range(90):
        x, y = R.randrange(32), R.randrange(32); c = R.choice(C); p[x, y] = c + (255,)
    for k in range(7):
        x, y = R.randrange(29), R.randrange(29); c = C[k % 5]
        for dx in range(3 if k % 2 else 2):
            for dy in range(2): p[x + dx, y + dy] = c + (255,)
    if seed % 3 != 2:  # hierba muerta
        tx, ty = R.randrange(4, 26), R.randrange(8, 26)
        for (dx, h) in ((0, 3), (2, 4), (4, 2)):
            for dy in range(h): p[tx + dx, ty - dy] = (94, 82, 56, 255)
    if seed % 3 == 2:  # huesito
        bx, by = R.randrange(8, 20), R.randrange(12, 22)
        for dx in range(4):
            for dy in range(3): p[bx + dx, by + dy] = (200, 192, 176, 255)
        p[bx + 1, by + 1] = (26, 22, 20, 255); p[bx + 3, by + 1] = (26, 22, 20, 255)
    return im
NEW = [ash(1), ash(2), ash(5), tint(L("dungeon/doors/open_door.png"), (90, 96, 110), 0.25), gray(L("dungeon/doors/gate_open_middle.png"), 1.1)]
at = Image.open(OUT).convert("RGBA"); first = 116; n = first + len(NEW); rows = (n + 7) // 8
out = Image.new("RGBA", (8 * 32, max(at.size[1], rows * 32)), (0, 0, 0, 0)); out.alpha_composite(at.crop((0, 0, 256, min(at.size[1], (first + 7) // 8 * 32))), (0, 0))
for i in range(first, at.size[1] // 32 * 8):  # limpia los huecos 116.. por si se vuelve a ejecutar
    out.paste(Image.new("RGBA", (32, 32), (0, 0, 0, 0)), ((i % 8) * 32, (i // 8) * 32))
for k, t in enumerate(NEW): i = first + k; out.alpha_composite(t.resize((32, 32), Image.NEAREST), ((i % 8) * 32, (i // 8) * 32))
out.save(OUT, optimize=True); print("tileset", out.size, "sprites", first, "..", n - 1)
