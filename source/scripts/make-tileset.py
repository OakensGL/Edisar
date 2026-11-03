# Genera assets/tileset.png (atlas 8 columnas de 32x32) a partir de Dungeon Crawl Stone Soup (CC0) + 3 sprites dibujados aquí (madera, nieve).
# Uso: python3 scripts/make-tileset.py <carpeta "Dungeon Crawl Stone Soup Full">
import sys, colorsys, random
from PIL import Image, ImageEnhance
D = sys.argv[1]
def L(p): return Image.open(f"{D}/{p}").convert("RGBA")
def bright(im, k): return ImageEnhance.Brightness(im).enhance(k)
def hue(im, dh, ds=1.0):
    px = im.load(); out = im.copy(); po = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            # solo la copa (amarillo/naranja); el tronco marrón oscuro se queda
            if s > 0.35 and v > 0.35: h = (h + dh) % 1; s = min(1, s * ds)
            r2, g2, b2 = colorsys.hsv_to_rgb(h, s, v); po[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return out
def snow(seed):
    random.seed(seed); im = Image.new("RGBA", (32, 32)); p = im.load()
    for y in range(32):
        for x in range(32):
            v = 226 + random.randint(-10, 10); p[x, y] = (v - 8, v - 2, 255, 255)
    for _ in range(14):
        x, y = random.randint(0, 30), random.randint(0, 30); p[x, y] = (196, 206, 232, 255); p[x + 1, y] = (205, 214, 238, 255)
    for _ in range(6): x, y = random.randint(0, 31), random.randint(0, 31); p[x, y] = (255, 255, 255, 255)
    return im
def planks(seed, wall=False):
    random.seed(seed); im = Image.new("RGBA", (32, 32)); p = im.load()
    base = [(122, 82, 46), (134, 92, 52), (112, 74, 42), (128, 86, 48)]
    for x in range(32):
        for y in range(32):
            k = (x // 8) if wall else (y // 8); c = base[k % 4]; n = random.randint(-6, 6)
            grain = 8 if ((y if wall else x) + k * 5) % 11 == 0 else 0
            p[x, y] = (c[0] + n - grain, c[1] + n - grain, c[2] + n - grain, 255)
    for i in range(4):
        for t in range(32):
            if wall: p[i * 8, t] = (70, 44, 24, 255)
            else: p[t, i * 8] = (78, 50, 28, 255)
        nx = random.randint(2, 29)
        if not wall: p[(nx + i * 7) % 32, i * 8 + 4] = (60, 38, 20, 255)
    if wall:
        for x in range(32): p[x, 0] = (150, 108, 64, 255); p[x, 31] = (60, 38, 20, 255); p[x, 15] = (84, 54, 30, 255)
    return im
F = "dungeon/floor/"; W = "dungeon/wall/"
T = [L(F+"grass/grass_0_new.png"), L(F+"grass/grass_1_new.png"), L(F+"grass/grass_2_new.png"), L(F+"grass/grass_flowers_yellow_1_new.png"),
     L(F+"dirt_0_new.png"), L(F+"dirt_1_new.png"),
     bright(L(F+"cobble_blood_1_new.png"), 1.65), bright(L(F+"cobble_blood_2_new.png"), 1.65),
     L(F+"white_marble_0.png"), L(F+"white_marble_1.png"),
     L(F+"sand_1.png"), L(F+"sand_2.png"),
     L("dungeon/water/deep_water.png"), L("dungeon/water/deep_water_2.png"),
     L(F+"lava_0.png"), L(F+"lava_1.png"),
     bright(L(F+"pebble_brown_0_new.png"), 1.6), bright(L(F+"pebble_brown_1_new.png"), 1.6),
     snow(1), snow(2),
     bright(L(F+"rect_gray_0_new.png"), 1.6), bright(L(F+"rect_gray_1_new.png"), 1.6),
     planks(3), planks(4),
     L(W+"stone_brick_1.png"), L(W+"stone_brick_2.png"),
     L(W+"brick_brown_0.png"), L(W+"brick_brown_1.png"),
     L(W+"sandstone_wall_0.png"), L(W+"sandstone_wall_1.png"),
     L(W+"lab-rock_0.png"), L(W+"lab-rock_1.png"),
     planks(5, True), planks(6, True),
     hue(L("dungeon/trees/tree_1_yellow.png"), 0.17, 0.95), hue(L("dungeon/trees/tree_2_yellow.png"), 0.15, 0.9),
     ImageEnhance.Color(L("dungeon/boulder.png")).enhance(0.35),
     L("monster/fungi_plants/bush_2.png"), L("monster/fungi_plants/bush_3.png"),
     L(F+"white_marble_2.png")]
exec(open(__file__.replace("make-tileset.py", "tiles27.py")).read())  # v27: más tiles (añade a T y escribe assets/tiles.json)
atlas = Image.new("RGBA", (8 * 32, ((len(T) + 7) // 8) * 32), (0, 0, 0, 0))
for i, t in enumerate(T): atlas.alpha_composite(t.resize((32, 32), Image.NEAREST), ((i % 8) * 32, (i // 8) * 32))
atlas.save(sys.argv[2] if len(sys.argv) > 2 else "assets/tileset.png", optimize=True); print(len(T), "tiles", atlas.size)
