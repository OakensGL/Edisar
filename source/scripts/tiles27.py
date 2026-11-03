# v27: tiles nuevos (se ejecuta dentro de make-tileset.py: usa L, bright, hue, T, D). DCSS (CC0) + sprites dibujados aquí (CC0).
import json, os, math
from PIL import ImageDraw, ImageOps
def blank(): return Image.new("RGBA", (32, 32), (0, 0, 0, 0))
def rect(d, x0, y0, x1, y1, c, o=None): d.rectangle([x0, y0, x1, y1], fill=c, outline=o)
def gray(im, k=1.0):
    g = ImageOps.grayscale(im.convert("RGB")).convert("RGBA"); g.putalpha(im.getchannel("A")); return bright(g, k)
def tint(im, rgb, k=0.5):
    g = gray(im); ov = Image.new("RGBA", im.size, rgb + (255,)); out = Image.blend(g, ov, k); out.putalpha(im.getchannel("A")); return out
def over(a, b): o = a.copy(); o.alpha_composite(b); return o
R = random.Random(27)
def carpet(base, dark, gold):
    im = Image.new("RGBA", (32, 32), base + (255,)); p = im.load()
    for y in range(32):
        for x in range(32):
            n = R.randint(-6, 6); c = base
            dd = (abs((x % 16) - 8) + abs((y % 16) - 8))
            if dd == 7: c = gold
            elif dd in (3, 4): c = dark
            elif (x + y) % 2 == 0 and dd < 3: c = dark
            p[x, y] = (max(0, min(255, c[0] + n)), max(0, min(255, c[1] + n)), max(0, min(255, c[2] + n)), 255)
    return im
def bridge():
    im = Image.new("RGBA", (32, 32)); p = im.load()
    for y in range(32):
        for x in range(32):
            k = y // 8; base = [(140, 98, 56), (128, 88, 50), (146, 104, 60), (122, 84, 46)][k]; n = R.randint(-7, 7)
            g = 10 if (x + k * 7) % 13 == 0 else 0
            p[x, y] = (base[0] + n - g, base[1] + n - g, base[2] + n - g, 255)
        if y % 8 == 0:
            for x in range(32): p[x, y] = (54, 34, 18, 255)
    d = ImageDraw.Draw(im)
    for k in range(4):
        for x in (4, 27): d.point((x, k * 8 + 4), fill=(60, 60, 64))
    for x in (0, 1, 30, 31):
        for y in range(32): p[x, y] = (96, 70, 38, 255) if x in (1, 30) else (70, 48, 24, 255)
    return im
def ruined():
    im = L("dungeon/wall/stone_brick_1.png").copy(); p = im.load(); top = [R.randint(6, 14) for _ in range(5)]
    for x in range(32):
        t = int(top[x * 4 // 32] + (top[min(4, x * 4 // 32 + 1)] - top[x * 4 // 32]) * ((x * 4 % 32) / 32))
        for y in range(t): p[x, y] = (0, 0, 0, 0)
        p[x, t] = (80, 80, 84, 255)
    for x in range(9, 15):
        for y in range(18, 23): p[x, y] = (40, 40, 44, 255)
    d = ImageDraw.Draw(im)
    for _ in range(5): x = R.randint(2, 28); d.rectangle([x, 28, x + 2, 30], fill=(130, 130, 134))
    return im
def hedge():
    im = Image.new("RGBA", (32, 32), (30, 80, 30, 255)); d = ImageDraw.Draw(im)
    for _ in range(70):
        x, y = R.randint(-2, 31), R.randint(-2, 31); c = R.choice([(38, 96, 36), (52, 120, 44), (28, 70, 28), (64, 140, 52)]); d.ellipse([x, y, x + 4, y + 3], fill=c)
    for x in range(32): d.point((x, 0), fill=(90, 160, 70)); d.point((x, 31), fill=(18, 46, 18))
    return im
def ifence():
    im = blank(); d = ImageDraw.Draw(im)
    for y in (10, 25): rect(d, 0, y, 31, y + 1, (52, 52, 58)); d.line([0, y, 31, y], fill=(110, 110, 120))
    for x in (2, 10, 18, 26):
        rect(d, x, 5, x + 2, 30, (44, 44, 50)); d.line([x, 5, x, 30], fill=(120, 120, 132)); d.polygon([(x - 1, 6), (x + 1, 1), (x + 3, 6)], fill=(70, 70, 78))
    return im
def wfence():
    im = blank(); d = ImageDraw.Draw(im)
    for y in (9, 19): rect(d, 0, y, 31, y + 4, (150, 104, 58), (84, 56, 30))
    for x in (3, 24): rect(d, x, 4, x + 4, 30, (126, 86, 46), (70, 46, 24)); d.line([x + 1, 5, x + 1, 29], fill=(170, 124, 74))
    return im
def padlock(im):
    o = im.copy(); d = ImageDraw.Draw(o); d.arc([12, 12, 20, 22], 180, 360, fill=(90, 90, 96), width=2); rect(d, 11, 17, 21, 26, (214, 170, 40), (110, 80, 10)); d.point((16, 21), fill=(40, 30, 0)); d.line([16, 22, 16, 24], fill=(40, 30, 0)); return o
def ladder():
    im = blank(); d = ImageDraw.Draw(im); rect(d, 6, 4, 25, 30, (20, 16, 14)); 
    for x in (8, 21): rect(d, x, 0, x + 2, 31, (150, 104, 56), (80, 52, 26))
    for y in range(3, 32, 6): rect(d, 9, y, 22, y + 1, (170, 120, 66), (90, 60, 30))
    return im
def table():
    im = blank(); d = ImageDraw.Draw(im); d.ellipse([3, 24, 29, 31], fill=(0, 0, 0, 70))
    for x in (5, 24): rect(d, x, 16, x + 2, 28, (96, 62, 32), (60, 38, 18))
    rect(d, 2, 7, 29, 17, (158, 110, 62), (82, 52, 26)); d.line([3, 8, 28, 8], fill=(196, 146, 92)); d.line([3, 14, 28, 14], fill=(130, 88, 48)); return im
def chair():
    im = blank(); d = ImageDraw.Draw(im); d.ellipse([7, 26, 25, 31], fill=(0, 0, 0, 70))
    rect(d, 9, 3, 22, 16, (130, 86, 46), (70, 44, 22)); rect(d, 11, 6, 20, 13, (90, 58, 30))
    for x in (12, 15, 18): d.line([x, 6, x, 13], fill=(150, 104, 58))
    rect(d, 8, 16, 23, 21, (156, 108, 60), (74, 48, 24))
    for x in (9, 21): rect(d, x, 21, x + 1, 29, (96, 62, 32))
    return im
def bed(c):
    im = blank(); d = ImageDraw.Draw(im); rect(d, 4, 1, 27, 30, (110, 72, 38), (60, 38, 18)); rect(d, 6, 4, 25, 10, (236, 232, 224), (170, 164, 156))
    rect(d, 6, 11, 25, 28, c, tuple(max(0, v - 60) for v in c)); d.line([6, 12, 25, 12], fill=tuple(min(255, v + 50) for v in c))
    for y in (16, 21, 26): d.line([7, y, 24, y], fill=tuple(max(0, v - 30) for v in c))
    return im
def shelf():
    im = blank(); d = ImageDraw.Draw(im); rect(d, 2, 1, 29, 30, (100, 66, 34), (56, 34, 16))
    for k, y in enumerate((3, 12, 21)):
        rect(d, 4, y, 27, y + 7, (50, 32, 16)); x = 4
        while x < 26:
            w = R.randint(2, 3); h = R.randint(5, 7); c = R.choice([(160, 40, 40), (40, 80, 150), (60, 120, 60), (180, 150, 60), (110, 60, 130), (200, 200, 190)])
            rect(d, x, y + 7 - h, x + w - 1, y + 7, c); x += w + (1 if R.random() < 0.3 else 0)
        rect(d, 3, y + 8, 28, y + 8, (140, 96, 52))
    return im
def barrel():
    im = blank(); d = ImageDraw.Draw(im); d.ellipse([6, 26, 26, 31], fill=(0, 0, 0, 80)); d.ellipse([7, 4, 24, 29], fill=(140, 92, 48), outline=(70, 44, 20))
    rect(d, 8, 7, 23, 26, (140, 92, 48))
    for x in (11, 15, 19): d.line([x, 6, x, 27], fill=(112, 72, 36))
    for y in (9, 22): rect(d, 7, y, 24, y + 1, (60, 60, 66))
    d.ellipse([8, 3, 23, 9], fill=(176, 126, 72), outline=(90, 58, 28)); d.line([9, 8, 22, 8], fill=(100, 64, 30)); return im
def column():
    im = blank(); d = ImageDraw.Draw(im); d.ellipse([6, 27, 26, 31], fill=(0, 0, 0, 80)); rect(d, 7, 25, 24, 29, (206, 202, 194), (120, 116, 110))
    rect(d, 10, 6, 21, 25, (222, 218, 210), (130, 126, 120))
    for x in (12, 15, 18): d.line([x, 7, x, 24], fill=(176, 172, 164))
    d.line([20, 7, 20, 24], fill=(150, 146, 140)); rect(d, 7, 2, 24, 6, (230, 226, 218), (130, 126, 120)); return im
def bones():
    im = blank(); d = ImageDraw.Draw(im); W = (232, 226, 206); O = (110, 104, 90)
    for (x0, y0, x1, y1) in ((4, 22, 16, 26), (14, 14, 26, 18), (6, 10, 10, 20)):
        d.line([x0, y0, x1, y1], fill=O, width=4); d.line([x0, y0, x1, y1], fill=W, width=2)
        for (x, y) in ((x0, y0), (x1, y1)): d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=W, outline=O)
    d.ellipse([18, 20, 28, 29], fill=W, outline=O); d.rectangle([20, 27, 26, 30], fill=W, outline=O); d.point((21, 24), fill=(30, 26, 20)); d.point((25, 24), fill=(30, 26, 20)); d.rectangle([20, 23, 22, 25], fill=(40, 34, 28)); d.rectangle([24, 23, 26, 25], fill=(40, 34, 28))
    return im
def flowers():
    im = blank(); d = ImageDraw.Draw(im)
    for _ in range(7):
        x, y = R.randint(4, 27), R.randint(6, 26); c = R.choice([(230, 60, 60), (250, 220, 60), (250, 250, 250), (170, 90, 220), (250, 140, 40)])
        d.line([x, y + 1, x, y + 5], fill=(40, 120, 40)); d.point((x - 1, y + 3), fill=(60, 150, 50))
        for (dx, dy) in ((0, -1), (-1, 0), (1, 0), (0, 1)): d.point((x + dx, y + dy), fill=c)
        d.point((x, y), fill=(250, 230, 120))
    return im
def shrooms():
    im = blank(); d = ImageDraw.Draw(im)
    for (x, y, r) in ((10, 20, 5), (21, 16, 4), (17, 25, 3)):
        rect(d, x - 1, y, x + 1, y + r + 2, (236, 228, 206), (150, 140, 120)); d.pieslice([x - r, y - r, x + r, y + r], 180, 360, fill=(200, 40, 36), outline=(110, 20, 16))
        d.point((x - r // 2, y - r // 2), fill=(255, 255, 255)); d.point((x + r // 2, y - 1), fill=(255, 255, 255))
    return im
def log():
    im = blank(); d = ImageDraw.Draw(im); d.ellipse([2, 24, 30, 30], fill=(0, 0, 0, 70)); rect(d, 3, 14, 25, 25, (104, 70, 38), (58, 38, 18))
    for y in (17, 21): d.line([5, y, 23, y], fill=(78, 50, 26))
    d.ellipse([21, 13, 30, 26], fill=(186, 146, 96), outline=(90, 60, 30)); d.ellipse([24, 16, 27, 23], outline=(140, 100, 60)); d.point((10, 13), fill=(60, 120, 40)); d.point((11, 12), fill=(60, 120, 40)); return im
def cactus():
    im = blank(); d = ImageDraw.Draw(im); G = (60, 140, 60); O = (24, 70, 30); d.ellipse([8, 27, 24, 31], fill=(0, 0, 0, 70))
    d.rounded_rectangle([13, 3, 19, 30], 3, fill=G, outline=O); d.rounded_rectangle([5, 9, 10, 19], 2, fill=G, outline=O); rect(d, 8, 16, 14, 19, G); d.line([8, 19, 13, 19], fill=O)
    d.rounded_rectangle([22, 6, 27, 16], 2, fill=G, outline=O); rect(d, 18, 13, 24, 16, G); d.line([19, 16, 24, 16], fill=O)
    for (x, y) in ((15, 7), (17, 12), (15, 18), (17, 24), (7, 12), (24, 9)): d.point((x, y), fill=(200, 230, 160))
    d.line([15, 4, 15, 29], fill=(90, 170, 80)); return im
def stones():
    im = blank(); d = ImageDraw.Draw(im)
    for (x, y, w, h) in ((5, 20, 6, 4), (14, 24, 5, 3), (20, 15, 7, 5), (10, 10, 4, 3), (24, 26, 4, 3)):
        d.ellipse([x, y + 1, x + w, y + h + 1], fill=(0, 0, 0, 70)); d.ellipse([x, y, x + w, y + h], fill=(142, 138, 130), outline=(80, 76, 70)); d.point((x + 1, y + 1), fill=(200, 196, 188))
    return im
def tallgrass():
    im = blank(); d = ImageDraw.Draw(im)
    for _ in range(26):
        x = R.randint(2, 29); h = R.randint(10, 24); lean = R.randint(-4, 4); c = R.choice([(46, 120, 40), (70, 150, 50), (34, 96, 32), (96, 170, 60)])
        d.line([x, 30, x + lean, 30 - h], fill=c, width=1)
    return im
def palm():
    im = blank(); d = ImageDraw.Draw(im); d.ellipse([8, 27, 26, 31], fill=(0, 0, 0, 70))
    pts = [(17, 30), (17, 24), (16, 18), (15, 12)]
    for i in range(len(pts) - 1): d.line([pts[i], pts[i + 1]], fill=(120, 84, 46), width=4)
    for y in (26, 21, 16): d.line([14, y, 19, y], fill=(84, 56, 28))
    for a in (200, 240, 290, 330, 20, 160):
        r = math.radians(a); x1 = 15 + math.cos(r) * 13; y1 = 11 + math.sin(r) * 7 + 3
        d.line([15, 11, x1, y1], fill=(40, 120, 40), width=3); d.line([15, 11, x1, y1], fill=(80, 170, 60), width=1)
    d.ellipse([13, 10, 17, 14], fill=(110, 70, 30)); return im
F = "dungeon/floor/"; Wd = "dungeon/wall/"
def dryg(i):
    im = L(F + f"grass/grass_{i}_new.png"); px = im.load()
    for y in range(32):
        for x in range(32):
            r, g, b, a = px[x, y]; h, s2, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255); r2, g2, b2 = colorsys.hsv_to_rgb(0.13, s2 * 0.75, min(1, v * 1.35)); px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return im
def bmarb(i):
    w = L(F + f"white_marble_{i}.png"); inv = ImageOps.invert(w.convert("RGB")).convert("RGBA"); return tint(bright(inv, 0.55), (40, 36, 44), 0.25)
door = L("dungeon/doors/closed_door.png")
NEW = [  # (KEY, nombre, categoría, capa, sprites, walk, shot, under, extra)
 ("DRYG", "Hierba seca", "suelos", "floor", [dryg(0), dryg(1), dryg(2)], 1, 0, None, {}),
 ("FLOWG", "Hierba con flores", "suelos", "floor", [L(F + "grass/grass_flowers_red_1_new.png"), L(F + "grass/grass_flowers_blue_1_new.png"), L(F + "grass/grass_flowers_yellow_2_new.png")], 1, 0, None, {}),
 ("MUD", "Barro", "suelos", "floor", [bright(L(F + "mud_0.png"), 1.35), bright(L(F + "mud_1.png"), 1.35)], 1, 0, None, {}),
 ("ICE", "Hielo", "suelos", "floor", [L(F + "ice_0_new.png"), L(F + "ice_1_new.png")], 1, 0, None, {}),
 ("BMARB", "Mármol negro", "suelos", "floor", [bmarb(0), bmarb(1)], 1, 0, None, {}),
 ("CARPR", "Alfombra roja", "suelos", "floor", [carpet((150, 28, 34), (100, 14, 22), (220, 170, 60))], 1, 0, None, {}),
 ("CARPB", "Alfombra azul", "suelos", "floor", [carpet((34, 56, 140), (20, 32, 92), (220, 190, 80))], 1, 0, None, {}),
 ("BRIDGE", "Puente de tablas", "suelos", "floor", [bridge()], 1, 0, None, {}),
 ("GRAVEL", "Grava", "suelos", "floor", [L(F + "floor_sand_rock_0.png"), L(F + "floor_sand_rock_1.png")], 1, 0, None, {}),
 ("MOSS", "Musgo", "suelos", "floor", [bright(L(F + "moss_0.png"), 1.7), bright(L(F + "moss_1.png"), 1.7)], 1, 0, None, {}),
 ("CWALL", "Muro de castillo", "muros", "obj", [L(Wd + "brick_gray_0.png"), L(Wd + "brick_gray_1.png")], 0, 1, "STONEF", {}),
 ("RUIN", "Muro en ruinas", "muros", "obj", [ruined()], 0, 1, "GRASS", {}),
 ("MWALL", "Muro de mármol", "muros", "obj", [L(Wd + "marble_wall_1.png"), L(Wd + "marble_wall_2.png")], 0, 1, "TEMPLE", {}),
 ("HEDGE", "Seto", "muros", "obj", [hedge()], 0, 1, "GRASS", {}),
 ("IFENCE", "Verja de hierro", "muros", "obj", [ifence()], 0, 0, "GRASS", {}),
 ("WFENCE", "Valla de madera", "muros", "obj", [wfence()], 0, 0, "GRASS", {}),
 ("VWALL", "Muro con enredadera", "muros", "obj", [L(Wd + "brick_brown-vines_1.png"), L(Wd + "brick_brown-vines_2.png")], 0, 1, "STONEF", {}),
 ("DOORW", "Puerta de madera", "puertas", "obj", [door], 1, 0, "STONEF", {}),
 ("DOORO", "Puerta abierta", "puertas", "obj", [L("dungeon/doors/open_door.png")], 1, 0, "STONEF", {}),
 ("DOORI", "Puerta de hierro", "puertas", "obj", [tint(door, (90, 96, 110), 0.25)], 1, 0, "STONEF", {}),
 ("GATE", "Reja (cerrada)", "puertas", "obj", [gray(L("dungeon/doors/gate_closed_middle.png"), 1.1)], 0, 0, "STONEF", {}),
 ("DOORL", "Puerta con llave (cerrada)", "puertas", "obj", [padlock(door)], 0, 1, "STONEF", {}),
 ("STUP", "Escalera de subida", "puertas", "obj", [L("dungeon/gateways/stone_stairs_up.png")], 1, 0, "STONEF", {"stair": 1}),
 ("STDN", "Escalera de bajada", "puertas", "obj", [L("dungeon/gateways/stone_stairs_down.png")], 1, 0, "STONEF", {"stair": 1}),
 ("LADDER", "Escalera de mano", "puertas", "obj", [ladder()], 1, 0, "STONEF", {"stair": 1}),
 ("HOLE", "Agujero", "puertas", "obj", [L("dungeon/traps/shaft.png")], 1, 0, "CAVE", {"stair": 1}),
 ("TABLE", "Mesa", "muebles", "obj", [table()], 0, 0, "WOODF", {}),
 ("CHAIR", "Silla", "muebles", "obj", [chair()], 0, 0, "WOODF", {}),
 ("BED", "Cama", "muebles", "obj", [bed((170, 40, 44)), bed((50, 80, 160))], 0, 0, "WOODF", {}),
 ("SHELF", "Estantería de libros", "muebles", "obj", [shelf(), shelf()], 0, 1, "WOODF", {}),
 ("BARREL", "Barril", "muebles", "obj", [barrel()], 0, 0, "WOODF", {}),
 ("CRATE", "Caja", "muebles", "obj", [L("dungeon/large_box.png")], 0, 0, "WOODF", {}),
 ("CHEST", "Cofre", "muebles", "obj", [L("dungeon/chest.png")], 0, 0, "WOODF", {}),
 ("CHEST2", "Cofre grande", "muebles", "obj", [L("dungeon/chest_2_closed.png")], 0, 0, "WOODF", {}),
 ("TORCH", "Antorcha (encendida)", "deco", "obj", [L(Wd + f"torches/torch_{i}.png") for i in (1, 2, 3, 4)], 0, 0, "STONEF", {"anim": 1, "light": 1}),
 ("FOUNT", "Fuente", "deco", "obj", [L("dungeon/blue_fountain.png"), L("dungeon/blue_fountain_2.png")], 0, 0, "STONEF", {"anim": 1}),
 ("STATA", "Estatua de ángel", "deco", "obj", [L("dungeon/statues/statue_angel.png")], 0, 1, "STONEF", {}),
 ("STATS", "Estatua de piedra", "deco", "obj", [L("dungeon/statues/granite_statue.png")], 0, 1, "STONEF", {}),
 ("COLUMN", "Columna", "deco", "obj", [column()], 0, 1, "TEMPLE", {}),
 ("COLR", "Columna rota", "deco", "obj", [L("dungeon/statues/crumbled_column.png")], 0, 0, "STONEF", {}),
 ("ALTAR", "Altar", "deco", "obj", [L("dungeon/altars/altar_zin.png")], 0, 0, "TEMPLE", {}),
 ("BANNER", "Estandarte", "deco", "obj", [L(Wd + "banners/banner_1.png")], 0, 0, "STONEF", {}),
 ("BONES", "Huesos", "deco", "obj", [bones()], 1, 0, "CAVE", {}),
 ("SKEL", "Esqueleto", "deco", "obj", [L("monster/undead/skeletons/skeleton_humanoid_small_new.png")], 1, 0, "CAVE", {}),
 ("FLOWERS", "Flores", "natu", "obj", [flowers(), flowers()], 1, 0, "GRASS", {}),
 ("SHROOM", "Setas", "natu", "obj", [shrooms()], 1, 0, "GRASS", {}),
 ("LOG", "Tronco caído", "natu", "obj", [log()], 0, 0, "GRASS", {}),
 ("CACTUS", "Cactus", "natu", "obj", [cactus()], 0, 0, "SAND", {}),
 ("STONES", "Piedritas", "natu", "obj", [stones()], 1, 0, "GRASS", {}),
 ("TALLG", "Hierba alta", "natu", "obj", [tallgrass(), tallgrass()], 1, 0, "GRASS", {}),
 ("DEADT", "Árbol seco", "natu", "obj", [gray(L("dungeon/trees/tree_1_lightred.png"), 0.8), gray(L("dungeon/trees/tree_2_lightred.png"), 0.8)], 0, 1, "GRASS", {}),
 ("PALM", "Palmera", "natu", "obj", [palm()], 0, 1, "SAND", {}),
 ("BRIAR", "Matorral", "natu", "obj", [L("monster/fungi_plants/briar_patch.png")], 0, 0, "GRASS", {}),
]
cat_old = {"floor": "suelos"}
meta = []; nid = 21
for key, n, cat, layer, sprs, walk, shot, under, ex in NEW:
    idx = []
    for sp in sprs: idx.append(len(T)); T.append(sp.resize((32, 32), Image.NEAREST) if sp.size != (32, 32) else sp)
    a = sprs[0].getchannel("A"); ov = any(v < 250 for v in a.getdata())
    r = g = b = n2 = 0
    for (pr, pg, pb, pa) in sprs[0].convert("RGBA").getdata():
        if pa > 128: r += pr; g += pg; b += pb; n2 += 1
    col = "#%02x%02x%02x" % (r // max(1, n2), g // max(1, n2), b // max(1, n2))
    meta.append(dict(key=key, id=nid, n=n, cat=cat, layer=layer, spr=idx, walk=bool(walk), shot=bool(shot), under=under, ov=ov, c=col, **{k: bool(v) for k, v in ex.items()})); nid += 1
json.dump(meta, open(os.path.join(os.path.dirname(os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else "assets/x")), "tiles.json"), "w"), ensure_ascii=False, indent=0)
print("v27 tiles:", len(meta), "ids 21 ..", nid - 1)
# v27: lava nueva (dibujada aquí): magma brillante naranja/rojo/amarillo, 4 fotogramas que fluyen y se repiten sin costuras.
def lava_frame(t):
    im = Image.new("RGBA", (32, 32)); p = im.load(); TAU = 2 * math.pi; ph = t * TAU / 4
    def lerp(a, b, k): return tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3))
    PAL = [(0.0, (70, 8, 0)), (0.28, (150, 20, 0)), (0.45, (220, 60, 0)), (0.62, (255, 120, 10)), (0.8, (255, 190, 40)), (1.0, (255, 245, 170))]
    for y in range(32):
        for x in range(32):
            u = (math.sin(TAU * (x + y) / 32 + ph) + 0.7 * math.sin(TAU * (x - y) / 32 - ph + 1.3) + 0.5 * math.sin(TAU * (2 * x + y) / 32 + ph * 2 + 2.1)) / 2.2
            w = (math.sin(TAU * (x - y) / 32 + ph + 0.4) + math.sin(TAU * (x + 2 * y) / 32 - ph * 2 + 2.6) * 0.8) / 1.8
            v = 0.52 + 0.3 * u
            if u < -0.5: v = 0.12 + (u + 1) * 0.35   # costra oscura que se enfría
            cr = max(0.0, 1 - abs(w) / 0.14)
            if cr > 0: v = max(v, 0.7 + 0.3 * cr)    # grietas de magma muy brillante
            v = max(0.0, min(1.0, v))
            for i in range(len(PAL) - 1):
                if PAL[i][0] <= v <= PAL[i + 1][0]: c = lerp(PAL[i][1], PAL[i + 1][1], (v - PAL[i][0]) / (PAL[i + 1][0] - PAL[i][0])); break
            p[x, y] = c + (255,)
    return im
LV = [lava_frame(i) for i in range(4)]
T[14] = LV[0]; T[15] = LV[1]; lava_idx = [14, 15, len(T), len(T) + 1]; T.extend(LV[2:])
json.dump({"lava": lava_idx}, open(os.path.join(os.path.dirname(os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else "assets/x")), "tiles-extra.json"), "w"))
