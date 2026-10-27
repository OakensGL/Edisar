import { Fragment, Page, useEffect, useRef, useState, useGrokTheme } from "grok/canvas";
import type { CSSProperties, ChangeEvent, PointerEvent as RPointerEvent } from "grok/canvas";

// ===================== Tipos =====================
type Dir = 0 | 1 | 2 | 3;
type Elem = "ice" | "fire" | "energy" | "earth" | "dark" | "arrow" | "star" | "holy" | "phys";
type ClassId = "druid" | "sorc" | "warlock" | "knight" | "archer" | "rogue";
type HatStyle = "hood" | "pointy" | "horns" | "cap" | "mask" | "helm";
type Look = "staff" | "bow" | "sword" | "axe" | "club" | "dagger" | "none";
type MonId = string;
type MoveAct = "up" | "down" | "left" | "right" | "ul" | "ur" | "dl" | "dr";
type Action = MoveAct | "power1" | "power2" | "power3" | "power4" | "hpPot" | "manaPot" | "attack" | "nextTarget" | "clearTarget" | "shop" | "afk" | "map" | "fullscreen" | "keys" | "coins" | "mount";
type Binds = Record<Action, string[]>;
type Slot = "head" | "body" | "legs" | "feet" | "weapon" | "off" | "amulet" | "ring";
type WType = "sword" | "axe" | "club" | "dagger" | "rod" | "wand" | "staff" | "bow" | "shield" | "quiver" | "orb" | "armor" | "jewel";
type Rarity = "com" | "rar" | "epi" | "hea";
type SkillId = "magic" | "melee" | "dist" | "shield";
type School = "magic" | "melee" | "dist" | "level";
type PKind = "strike" | "area" | "heal" | "hot" | "wave" | "field" | "drain" | "dot" | "summon" | "spin" | "buff" | "slow" | "dash" | "blink" | "smoke";
type StatKey = "atk" | "def" | "arm" | "magic" | "hp" | "mana" | "speed";
type Stats = Record<StatKey, number>;

interface ItemDef { id: string; name: string; slot: Slot; wt: WType; lvl: number; voc: ClassId[] | null; price: number; atk: number; def: number; arm: number; magic: number; hp: number; mana: number; speed: number; range: number; elem: Elem; }
interface ItemOpt { atk?: number; def?: number; arm?: number; magic?: number; hp?: number; mana?: number; speed?: number; range?: number; elem?: Elem; }
interface Inst { uid: number; id: string; rar: Rarity; }
interface Power { name: string; words: string; kind: PKind; elem: Elem; mana: number; cd: number; min: number; max: number; range: number; school: School; dur: number; leech: number; hits: number; aoe: number; }
interface ClassDef {
  id: ClassId; name: string; desc: string; robe: string; trim: string; hat: HatStyle;
  hpBase: number; hpPer: number; manaBase: number; manaPer: number; manaRegen: number; manaRegenPer: number; hpRegen: number; hpRegenPer: number;
  crit: number; evade: number; skMul: Record<SkillId, number>; powers: Power[]; starter: string[]; offName: string;
}
interface MonDef { id: MonId; name: string; hp: number; exp: number; atk: number; speed: number; gold: number; respawn: number; armored: boolean; drop: number; dropN: number; lootLvl: number; rar: [number, number, number]; }
interface Mover { x: number; y: number; fx: number; fy: number; moveStart: number; moveDur: number; face: Dir; }
interface Mon extends Mover {
  id: number; def: MonDef; hp: number; alive: boolean; respawnAt: number; deadAt: number; sx: number; sy: number;
  nextMove: number; nextAtk: number; angryUntil: number; slowUntil: number; dotUntil: number; dotNext: number; dotMin: number; dotMax: number; calmUntil: number;
}
interface SkillVal { lvl: number; tries: number; }
interface Player extends Mover {
  name: string; hp: number; mana: number; level: number; exp: number; gold: number; hpPot: number; manaPot: number;
  eq: Record<Slot, Inst | null>; bag: Inst[]; nextAuto: number; nextPotion: number; cd: number[]; gcd: number; hitAt: number;
  sk: Record<SkillId, SkillVal>; defUntil: number; evadeUntil: number; hotUntil: number; hotNext: number; hotMin: number; hotMax: number; critNext: boolean;
}
interface Proj { sx: number; sy: number; ex: number; ey: number; born: number; dur: number; elem: Elem; dmg: number; target: number; leech: number; slow: number; }
interface Floater { x: number; y: number; text: string; color: string; born: number; }
interface AreaFx { cells: Array<[number, number]>; elem: Elem; born: number; }
interface Field { x: number; y: number; until: number; next: number; min: number; max: number; elem: Elem; }
interface Ground { x: number; y: number; inst: Inst; until: number; boss?: boolean; mine?: number; }
interface LootToast { title: string; lines: Array<[string, string]>; note: string; at: number; }
interface Minion extends Mover { until: number; nextAtk: number; min: number; max: number; }
interface Game {
  cls: ClassDef; tiles: Uint8Array; p: Player; mons: Mon[]; projs: Proj[]; floats: Floater[]; fx: AreaFx[];
  fields: Field[]; ground: Ground[]; minion: Minion | null; st: Stats;
  target: number; log: string[]; status: string; statusAt: number; statusColor: string;
  heldDirs: MoveAct[]; pending: [number, number] | null; walkGoal: { x: number; y: number; open: boolean } | null;
  nextRegen: number; camX: number; camY: number; zone: string; deaths: number; kills: number; nextUid: number;
  shopOpen: boolean; shopMsg: string; bigMap: boolean; mini: HTMLCanvasElement | null;
  afk: boolean; afkNext: number; afkStart: number; afkExp: number; afkGold: number; afkKills: number; afkLoot: number;
  chase: boolean;
}

// ===================== Constantes =====================
const TS = 32; let VW_T = 21; let VH_T = 13; let VW = TS * VW_T; let VH = TS * VH_T; // la vista cambia en pantalla completa (setView)
const OY = 32; const OW_W = 96; const OW_H = 72 + OY; const HW = 64, HH = 48, NH = 12;
const MW = OW_W + 4 * HW; const MH = Math.max(OW_H, 3 * HH); const EXP_RATE = 5; const DIAG_MUL = 1.4; const BAG_MAX = 20;
const GRASS = 0, TREE = 1, WATER = 2, WALL = 3, FLOOR = 4, TEMPLE = 5, ROCK = 6, CAVE = 7, SAND = 8, PATH = 9, BOULDER = 10, PORTAL = 11, MARBLE = 12, HWALL = 13;
const TX0 = 40, TY0 = 28 + OY, TX1 = 56, TY1 = 40 + OY, TEMPLE_X = 44, TEMPLE_Y = 31 + OY, NPC_X = 53, NPC_Y = 31 + OY;
const PLAYER_T = -7;
const NPC_NAME = "Rosa la mercader";
const HP_POT_PRICE = 50, MANA_POT_PRICE = 50;
const SLOT = 32, SLOT_GAP = 4, SLOT_N = 6;
const BAR_W = SLOT_N * SLOT + (SLOT_N - 1) * SLOT_GAP;
const HUD_RES = 200; // ancho (px del lienzo) que suele ocupar el HUD a la derecha
let BAR_X = Math.round((VW - HUD_RES - BAR_W) / 2);
let BAR_Y = VH - SLOT - 10;
// Tamaño de la vista en px lógicos (normal 672×416; en pantalla completa se adapta a la ventana)
function setView(w: number, h: number): void {
  VW = Math.max(320, Math.round(w)); VH = Math.max(240, Math.round(h)); VW_T = Math.ceil(VW / TS); VH_T = Math.ceil(VH / TS);
  BAR_Y = VH - SLOT - 10; BAR_X = Math.max(84, Math.round((VW - HUD_RES - BAR_W) / 2));
}
const SLOT_ACTS: Action[] = ["power1", "power2", "power3", "power4", "hpPot", "manaPot"];
const SLOTS: Slot[] = ["head", "body", "legs", "feet", "weapon", "off", "amulet", "ring"];
const STAT_KEYS: StatKey[] = ["atk", "def", "arm", "magic", "hp", "mana", "speed"];
const SLOT_NAMES: Record<Slot, string> = { head: "Casco", body: "Armadura", legs: "Piernas", feet: "Botas", weapon: "Arma", off: "Escudo", amulet: "Amuleto", ring: "Anillo" };
const SKILL_NAMES: Record<SkillId, string> = { magic: "Nivel mágico", melee: "Combate cuerpo a cuerpo", dist: "Combate a distancia", shield: "Escudo" };
const SKILL_IDS: SkillId[] = ["magic", "melee", "dist", "shield"];
const RAR: Record<Rarity, { n: string; m: number; c: string; sell: number }> = {
  com: { n: "Común", m: 1, c: "#d8d8d8", sell: 1 },
  rar: { n: "Raro", m: 1.25, c: "#4aa3ff", sell: 2.5 },
  epi: { n: "Épico", m: 1.55, c: "#c07bff", sell: 6 },
  hea: { n: "Heaven", m: 2, c: "#fff0a8", sell: 20 },
};
const ELEM_COLOR: Record<Elem, string> = { ice: "#9be8ff", fire: "#ff8a2a", energy: "#c07bff", earth: "#7ad13a", dark: "#b070ff", arrow: "#e0c08a", star: "#d0d6de", holy: "#fff2a0", phys: "#f4f4f4" };
const WT_INT: Partial<Record<WType, number>> = { sword: 1600, axe: 2000, club: 1800, dagger: 1100, rod: 2000, wand: 2000, staff: 2000, bow: 1800 };

const ACTIONS: Array<{ id: Action; label: string }> = [
  { id: "up", label: "Mover arriba" }, { id: "down", label: "Mover abajo" }, { id: "left", label: "Mover a la izquierda" }, { id: "right", label: "Mover a la derecha" },
  { id: "ul", label: "Diagonal arriba-izquierda" }, { id: "ur", label: "Diagonal arriba-derecha" }, { id: "dl", label: "Diagonal abajo-izquierda" }, { id: "dr", label: "Diagonal abajo-derecha" },
  { id: "power1", label: "Poder 1" }, { id: "power2", label: "Poder 2" }, { id: "power3", label: "Poder 3" }, { id: "power4", label: "Poder 4" },
  { id: "hpPot", label: "Poción de vida" }, { id: "manaPot", label: "Poción de maná" },
  { id: "attack", label: "Atacar al más cercano" }, { id: "nextTarget", label: "Siguiente objetivo" }, { id: "clearTarget", label: "Quitar objetivo / cerrar" },
  { id: "shop", label: "Abrir tienda" }, { id: "afk", label: "Modo AFK" }, { id: "map", label: "Mapa completo" }, { id: "fullscreen", label: "Pantalla completa" }, { id: "keys", label: "Ventana de atajos" }, { id: "coins", label: "Tienda de Edisar Coins" }, { id: "mount", label: "Montar / desmontar" },
];
const DEFAULT_BINDS: Binds = {
  up: ["KeyW", "ArrowUp", "Numpad8"], down: ["KeyS", "ArrowDown", "Numpad2"], left: ["KeyA", "ArrowLeft", "Numpad4"], right: ["KeyD", "ArrowRight", "Numpad6"],
  ul: ["KeyQ", "Numpad7"], ur: ["KeyE", "Numpad9"], dl: ["KeyZ", "Numpad1"], dr: ["KeyC", "Numpad3"],
  power1: ["F1", "Digit1"], power2: ["F2", "Digit2"], power3: ["F3", "Digit3"], power4: ["F4", "Digit4"],
  hpPot: ["F5", "Digit5"], manaPot: ["F6", "Digit6"], attack: ["Space"], nextTarget: ["Tab"], clearTarget: ["Escape"],
  shop: ["KeyT", "Enter"], afk: ["KeyG"], map: ["KeyM"], fullscreen: ["KeyP"], keys: ["KeyH"], coins: ["KeyK"], mount: ["KeyR"],
};
const MOVE_VEC: Record<MoveAct, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], ul: [-1, -1], ur: [1, -1], dl: [-1, 1], dr: [1, 1] };
const DIRS8: Array<[number, number]> = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]];

// ===================== Objetos =====================
const DR: ClassId[] = ["druid"], SO: ClassId[] = ["sorc"], WA: ClassId[] = ["warlock"], KN: ClassId[] = ["knight"], AR: ClassId[] = ["archer"], RO: ClassId[] = ["rogue"];
const CASTERS: ClassId[] = ["druid", "sorc", "warlock"], PHYS: ClassId[] = ["knight", "archer", "rogue"];
function it(id: string, name: string, slot: Slot, wt: WType, lvl: number, voc: ClassId[] | null, price: number, o: ItemOpt): ItemDef {
  return { id, name, slot, wt, lvl, voc, price, atk: o.atk ?? 0, def: o.def ?? 0, arm: o.arm ?? 0, magic: o.magic ?? 0, hp: o.hp ?? 0, mana: o.mana ?? 0, speed: o.speed ?? 0, range: o.range ?? 1, elem: o.elem ?? "phys" };
}
const ITEMS: ItemDef[] = [
  it("rod1", "Vara de escarcha", "weapon", "rod", 1, DR, 0, { atk: 13, range: 4, elem: "ice" }),
  it("rod2", "Vara helada", "weapon", "rod", 8, DR, 400, { atk: 21, range: 4, elem: "ice" }),
  it("rod3", "Vara de luz lunar", "weapon", "rod", 15, DR, 1200, { atk: 31, range: 4, elem: "ice", magic: 1 }),
  it("rod4", "Vara glacial", "weapon", "rod", 25, DR, 3000, { atk: 44, range: 4, elem: "ice", magic: 2 }),
  it("wand1", "Varita de brasas", "weapon", "wand", 1, SO, 0, { atk: 14, range: 4, elem: "fire" }),
  it("wand2", "Varita de dragón", "weapon", "wand", 8, SO, 400, { atk: 22, range: 4, elem: "fire" }),
  it("wand3", "Varita volcánica", "weapon", "wand", 15, SO, 1200, { atk: 33, range: 4, elem: "fire", magic: 1 }),
  it("wand4", "Varita infernal", "weapon", "wand", 25, SO, 3000, { atk: 47, range: 4, elem: "fire", magic: 2 }),
  it("stf1", "Bastón sombrío", "weapon", "staff", 1, WA, 0, { atk: 13, range: 4, elem: "dark" }),
  it("stf2", "Varita de huesos", "weapon", "staff", 8, WA, 400, { atk: 21, range: 4, elem: "dark" }),
  it("stf3", "Bastón del vacío", "weapon", "staff", 15, WA, 1200, { atk: 31, range: 4, elem: "dark", magic: 1 }),
  it("stf4", "Bastón abisal", "weapon", "staff", 25, WA, 3000, { atk: 44, range: 4, elem: "dark", magic: 2 }),
  it("swd1", "Espada corta", "weapon", "sword", 1, KN, 0, { atk: 14 }),
  it("swd2", "Espada larga", "weapon", "sword", 8, KN, 350, { atk: 22 }),
  it("swd3", "Espada de caballero", "weapon", "sword", 15, KN, 1100, { atk: 32 }),
  it("swd4", "Espada real", "weapon", "sword", 25, KN, 2800, { atk: 45 }),
  it("axe1", "Hacha", "weapon", "axe", 5, KN, 250, { atk: 20 }),
  it("axe2", "Hacha de batalla", "weapon", "axe", 15, KN, 1300, { atk: 37 }),
  it("axe3", "Hacha del verdugo", "weapon", "axe", 25, KN, 3200, { atk: 53 }),
  it("clb1", "Maza", "weapon", "club", 5, KN, 250, { atk: 17 }),
  it("clb2", "Martillo de guerra", "weapon", "club", 15, KN, 1250, { atk: 33 }),
  it("clb3", "Martillo del trueno", "weapon", "club", 25, KN, 3100, { atk: 47 }),
  it("bow1", "Arco corto", "weapon", "bow", 1, AR, 0, { atk: 14, range: 5, elem: "arrow" }),
  it("bow2", "Arco de caza", "weapon", "bow", 8, AR, 400, { atk: 22, range: 5, elem: "arrow" }),
  it("bow3", "Arco élfico", "weapon", "bow", 15, AR, 1200, { atk: 32, range: 6, elem: "arrow" }),
  it("bow4", "Arco del fénix", "weapon", "bow", 25, AR, 3000, { atk: 45, range: 6, elem: "fire" }),
  it("dag1", "Daga", "weapon", "dagger", 1, RO, 0, { atk: 11 }),
  it("dag2", "Daga de acero", "weapon", "dagger", 8, RO, 350, { atk: 18 }),
  it("dag3", "Kris venenoso", "weapon", "dagger", 15, RO, 1100, { atk: 27, elem: "earth" }),
  it("dag4", "Colmillo sombrío", "weapon", "dagger", 25, RO, 2800, { atk: 38, elem: "dark" }),
  it("shd1", "Escudo de madera", "off", "shield", 1, KN, 0, { def: 8 }),
  it("shd2", "Escudo de acero", "off", "shield", 8, KN, 300, { def: 14 }),
  it("shd3", "Escudo de corona", "off", "shield", 15, KN, 1000, { def: 21 }),
  it("shd4", "Escudo del dragón", "off", "shield", 25, KN, 2600, { def: 29, arm: 1 }),
  it("qv1", "Carcaj", "off", "quiver", 1, AR, 0, { atk: 2 }),
  it("qv2", "Carcaj élfico", "off", "quiver", 12, AR, 800, { atk: 5, speed: 5 }),
  it("orb1", "Orbe de aprendiz", "off", "orb", 1, CASTERS, 0, { magic: 1, mana: 20 }),
  it("orb2", "Orbe arcano", "off", "orb", 12, CASTERS, 900, { magic: 2, mana: 60 }),
  it("orb3", "Orbe estelar", "off", "orb", 22, CASTERS, 2400, { magic: 4, mana: 120 }),
  it("ldg1", "Daga zurda", "off", "dagger", 8, RO, 500, { atk: 4 }),
  it("ldg2", "Sai de sombra", "off", "dagger", 20, RO, 1800, { atk: 8, speed: 5 }),
  it("hd1", "Gorro de cuero", "head", "armor", 1, null, 20, { arm: 1 }),
  it("hd2", "Casco de hierro", "head", "armor", 8, PHYS, 250, { arm: 3 }),
  it("hd3", "Sombrero de mago", "head", "armor", 8, CASTERS, 250, { arm: 1, magic: 1 }),
  it("hd4", "Casco de cruzado", "head", "armor", 20, KN, 1500, { arm: 6 }),
  it("hd5", "Corona de escarcha", "head", "armor", 25, CASTERS, 3500, { arm: 3, magic: 3 }),
  it("bd1", "Armadura de cuero", "body", "armor", 1, null, 30, { arm: 3 }),
  it("bd2", "Cota de malla", "body", "armor", 8, PHYS, 400, { arm: 6 }),
  it("bd3", "Túnica mágica", "body", "armor", 8, CASTERS, 400, { arm: 3, mana: 40 }),
  it("bd4", "Armadura de placas", "body", "armor", 20, KN, 1800, { arm: 10 }),
  it("bd5", "Armadura élfica", "body", "armor", 20, PHYS, 1700, { arm: 7, speed: 5 }),
  it("bd6", "Manto de las estrellas", "body", "armor", 25, CASTERS, 3600, { arm: 5, mana: 100, magic: 2 }),
  it("lg1", "Pantalón de cuero", "legs", "armor", 1, null, 20, { arm: 1 }),
  it("lg2", "Grebas de malla", "legs", "armor", 8, PHYS, 300, { arm: 3 }),
  it("lg3", "Faldar mágico", "legs", "armor", 8, CASTERS, 300, { arm: 2, mana: 20 }),
  it("lg4", "Grebas de placas", "legs", "armor", 20, KN, 1400, { arm: 6 }),
  it("ft1", "Botas de cuero", "feet", "armor", 1, null, 15, { arm: 1 }),
  it("ft2", "Botas de hierro", "feet", "armor", 10, PHYS, 300, { arm: 2 }),
  it("ft3", "Botas de velocidad", "feet", "armor", 15, null, 2500, { arm: 1, speed: 20 }),
  it("am1", "Amuleto de vida", "amulet", "jewel", 5, null, 400, { hp: 30 }),
  it("am2", "Amuleto arcano", "amulet", "jewel", 12, CASTERS, 900, { mana: 50, magic: 1 }),
  it("am3", "Amuleto del guerrero", "amulet", "jewel", 12, PHYS, 900, { atk: 3, hp: 40 }),
  it("rg1", "Anillo de poder", "ring", "jewel", 8, null, 600, { atk: 2, magic: 1 }),
  it("rg2", "Anillo de velocidad", "ring", "jewel", 10, null, 1200, { speed: 12 }),
  it("rg3", "Anillo vital", "ring", "jewel", 18, null, 1500, { hp: 60, mana: 30 }),
];
const ITEM: Record<string, ItemDef> = {};
for (const d of ITEMS) ITEM[d.id] = d;
// Botín de las 12 Casas (solo se consigue cazando; no se vende en la tienda)
interface ItemDef { loot?: boolean; }
const TIER_LV = [30, 38, 46, 54, 62];
const TIER_N = ["de bronce celeste", "de plata lunar", "de oro solar", "de oricalco", "del Zodiaco"];
function addLoot(d: ItemDef): void { d.loot = true; ITEMS.push(d); ITEM[d.id] = d; }
function addTier(t: number): void {
  const L = TIER_LV[t] ?? 30, nm = TIER_N[t] ?? "", a = Math.round(1.45 * L + 8), k = t + 1, pr = Math.round(60 * L);
  const add = (id: string, name: string, slot: Slot, wt: WType, voc: ClassId[] | null, o: ItemOpt): void => addLoot(it(`${id}_t${k}`, `${name} ${nm}`, slot, wt, L, voc, pr, o));
  add("rod", "Vara", "weapon", "rod", DR, { atk: a, range: 4, elem: "ice", magic: 2 + t });
  add("wand", "Varita", "weapon", "wand", SO, { atk: a + 3, range: 4, elem: "fire", magic: 2 + t });
  add("stf", "Bastón", "weapon", "staff", WA, { atk: a, range: 4, elem: "dark", magic: 2 + t });
  add("swd", "Espada", "weapon", "sword", KN, { atk: a + 2 });
  add("axe", "Hacha", "weapon", "axe", KN, { atk: a + 10 });
  add("clb", "Martillo", "weapon", "club", KN, { atk: a + 5 });
  add("bow", "Arco", "weapon", "bow", AR, { atk: a + 1, range: 6, elem: t >= 2 ? "holy" : "arrow" });
  add("dag", "Daga", "weapon", "dagger", RO, { atk: a - 6, elem: t >= 3 ? "dark" : "phys" });
  add("shd", "Escudo", "off", "shield", KN, { def: 32 + t * 5, arm: 1 + t });
  add("qv", "Carcaj", "off", "quiver", AR, { atk: 7 + t * 2, speed: 5 });
  add("orb", "Orbe", "off", "orb", CASTERS, { magic: 4 + t, mana: 140 + t * 50 });
  add("ldg", "Sai", "off", "dagger", RO, { atk: 10 + t * 3, speed: 6 });
  add("hdp", "Yelmo", "head", "armor", PHYS, { arm: 7 + t, hp: 20 * k });
  add("hdc", "Tiara", "head", "armor", CASTERS, { arm: 3 + t, magic: 2 + Math.floor(t / 2), mana: 30 * k });
  add("bdp", "Coraza", "body", "armor", PHYS, { arm: 11 + t * 2, hp: 40 * k });
  add("bdc", "Túnica", "body", "armor", CASTERS, { arm: 6 + t, mana: 80 * k, magic: 2 + Math.floor(t / 2) });
  add("lgp", "Grebas", "legs", "armor", PHYS, { arm: 7 + t, hp: 15 * k });
  add("lgc", "Faldar", "legs", "armor", CASTERS, { arm: 3 + t, mana: 40 * k });
  add("ft", "Botas", "feet", "armor", null, { arm: 2 + t, speed: 8 + t * 3 });
  add("am", "Amuleto", "amulet", "jewel", null, { hp: 40 * k, mana: 30 * k, magic: 1 });
  add("rg", "Anillo", "ring", "jewel", null, { atk: 2 + t, magic: 1 + Math.floor(t / 2), hp: 25 * k });
}
for (let t = 0; t < TIER_LV.length; t++) addTier(t);
addLoot(it("gemini_gold", "Armadura Dorada de Géminis", "body", "armor", 60, null, 6000, { arm: 22, hp: 180, mana: 180, magic: 4, atk: 6, speed: 10 }));


// ===================== Vocaciones =====================
function pw(name: string, words: string, kind: PKind, elem: Elem, mana: number, cd: number, min: number, max: number, range: number, school: School, o?: { dur?: number; leech?: number; hits?: number; aoe?: number }): Power {
  return { name, words, kind, elem, mana, cd, min, max, range, school, dur: o?.dur ?? 0, leech: o?.leech ?? 0, hits: o?.hits ?? 1, aoe: o?.aoe ?? 0 };
}
const ARMOR_START = ["hd1", "bd1", "lg1", "ft1"];
const CLASSES: Record<ClassId, ClassDef> = {
  druid: {
    id: "druid", name: "Druida", desc: "Hielo y curación: el mejor sanador.", robe: "#2f7a4a", trim: "#9be8ff", hat: "hood",
    hpBase: 150, hpPer: 5, manaBase: 100, manaPer: 30, manaRegen: 2, manaRegenPer: 0.5, hpRegen: 1, hpRegenPer: 0.15, crit: 0.03, evade: 0,
    skMul: { magic: 1, melee: 2.5, dist: 2.5, shield: 2 }, starter: ["rod1", "orb1", ...ARMOR_START], offName: "Orbe",
    powers: [
      pw("Golpe de hielo", "exori frigo", "strike", "ice", 20, 2000, 18, 32, 4, "magic"),
      pw("Avalancha", "adori mas frigo", "area", "ice", 55, 2000, 20, 36, 5, "magic", { aoe: 1 }),
      pw("Curación intensa", "exura gran", "heal", "holy", 40, 1000, 70, 100, 0, "magic"),
      pw("Regeneración", "exura gran sio", "hot", "holy", 50, 12000, 12, 16, 0, "magic", { dur: 8000 }),
    ],
  },
  sorc: {
    id: "sorc", name: "Hechicero", desc: "Fuego puro: el mayor daño mágico, sin curación propia.", robe: "#8a2a14", trim: "#ffb02a", hat: "pointy",
    hpBase: 150, hpPer: 5, manaBase: 100, manaPer: 30, manaRegen: 2, manaRegenPer: 0.5, hpRegen: 1, hpRegenPer: 0.15, crit: 0.03, evade: 0,
    skMul: { magic: 1, melee: 2.5, dist: 2.5, shield: 2 }, starter: ["wand1", "orb1", ...ARMOR_START], offName: "Orbe",
    powers: [
      pw("Golpe de fuego", "exori flam", "strike", "fire", 20, 2000, 20, 36, 4, "magic"),
      pw("Explosión ígnea", "adori gran flam", "area", "fire", 60, 2000, 26, 46, 5, "magic"),
      pw("Ola de fuego", "exevo flam hur", "wave", "fire", 70, 4000, 30, 52, 0, "magic"),
      pw("Campo de fuego", "adevo grav flam", "field", "fire", 40, 6000, 8, 14, 5, "magic", { dur: 6000 }),
    ],
  },
  warlock: {
    id: "warlock", name: "Brujo", desc: "Oscuridad y robo de vida, con maldiciones y un esbirro.", robe: "#2a1a33", trim: "#b070ff", hat: "horns",
    hpBase: 155, hpPer: 6, manaBase: 95, manaPer: 28, manaRegen: 2, manaRegenPer: 0.45, hpRegen: 1, hpRegenPer: 0.15, crit: 0.03, evade: 0,
    skMul: { magic: 1, melee: 2.5, dist: 2.5, shield: 2 }, starter: ["stf1", "orb1", ...ARMOR_START], offName: "Orbe",
    powers: [
      pw("Drenar vida", "exori vita", "drain", "dark", 22, 2000, 18, 32, 4, "magic", { leech: 0.6 }),
      pw("Maldición", "utori mort", "dot", "dark", 30, 6000, 8, 12, 4, "magic", { dur: 8000 }),
      pw("Invocar esbirro", "utevo res", "summon", "dark", 80, 30000, 10, 18, 0, "magic", { dur: 20000 }),
      pw("Nube oscura", "adori mas mort", "area", "dark", 55, 2000, 22, 40, 5, "magic"),
    ],
  },
  knight: {
    id: "knight", name: "Caballero", desc: "Tanque cuerpo a cuerpo: mucha vida, escudo y golpes fuertes.", robe: "#7d838f", trim: "#c9a227", hat: "helm",
    hpBase: 185, hpPer: 15, manaBase: 40, manaPer: 5, manaRegen: 1, manaRegenPer: 0.15, hpRegen: 2, hpRegenPer: 0.3, crit: 0.05, evade: 0,
    skMul: { magic: 3, melee: 1, dist: 2, shield: 1 }, starter: ["swd1", "shd1", ...ARMOR_START], offName: "Escudo",
    powers: [
      pw("Golpe brutal", "exori ico", "strike", "phys", 15, 2000, 28, 48, 1, "melee"),
      pw("Golpe giratorio", "exori", "spin", "phys", 30, 4000, 26, 44, 0, "melee"),
      pw("Postura defensiva", "utamo tempo", "buff", "phys", 40, 20000, 0, 0, 0, "level", { dur: 8000 }),
      pw("Curación menor", "exura ico", "heal", "holy", 25, 1000, 50, 80, 0, "level"),
    ],
  },
  archer: {
    id: "archer", name: "Arquero", desc: "Arco de largo alcance sin gastar maná; ralentiza y salta.", robe: "#6b4a24", trim: "#e0c08a", hat: "cap",
    hpBase: 165, hpPer: 10, manaBase: 60, manaPer: 15, manaRegen: 1.5, manaRegenPer: 0.3, hpRegen: 1, hpRegenPer: 0.2, crit: 0.06, evade: 0.03,
    skMul: { magic: 3, melee: 2, dist: 1, shield: 1.5 }, starter: ["bow1", "qv1", ...ARMOR_START], offName: "Carcaj",
    powers: [
      pw("Disparo potente", "exori san", "strike", "arrow", 15, 2000, 26, 42, 6, "dist"),
      pw("Lluvia de flechas", "exevo mas san", "area", "arrow", 45, 2500, 20, 36, 6, "dist"),
      pw("Flecha ralentizadora", "exori gel", "slow", "ice", 20, 5000, 16, 26, 6, "dist", { dur: 5000 }),
      pw("Salto atrás", "utani hur", "dash", "phys", 20, 6000, 0, 0, 0, "level"),
    ],
  },
  rogue: {
    id: "rogue", name: "Pícaro", desc: "Ninja veloz: críticos, evasión, teletransporte y humo.", robe: "#1e1e24", trim: "#cc3333", hat: "mask",
    hpBase: 165, hpPer: 10, manaBase: 55, manaPer: 12, manaRegen: 1.5, manaRegenPer: 0.3, hpRegen: 1, hpRegenPer: 0.2, crit: 0.15, evade: 0.1,
    skMul: { magic: 3, melee: 1.1, dist: 1.3, shield: 1.6 }, starter: ["dag1", ...ARMOR_START], offName: "Mano izq.",
    powers: [
      pw("Dagas veloces", "exori tox", "strike", "phys", 15, 1500, 14, 24, 1, "melee", { hits: 2 }),
      pw("Lanzar shuriken", "exori kunai", "strike", "star", 15, 2000, 20, 34, 4, "dist"),
      pw("Paso sombrío", "utani umbra", "blink", "dark", 25, 8000, 0, 0, 5, "level"),
      pw("Bomba de humo", "utana fumus", "smoke", "phys", 35, 20000, 0, 0, 0, "level", { dur: 4000 }),
    ],
  },
};
const CLASS_ORDER: ClassId[] = ["druid", "sorc", "warlock", "knight", "archer", "rogue"];

// ===================== Monstruos =====================
const MONS: Record<MonId, MonDef> = {
  rat: { id: "rat", name: "Rata", hp: 20, exp: 5, atk: 8, speed: 650, gold: 4, respawn: 15000, armored: false, drop: 0.03, dropN: 1, lootLvl: 5, rar: [0, 0, 0] },
  rotworm: { id: "rotworm", name: "Gusano podrido", hp: 65, exp: 40, atk: 22, speed: 900, gold: 17, respawn: 25000, armored: false, drop: 0.06, dropN: 1, lootLvl: 10, rar: [0.1, 0.01, 0] },
  troll: { id: "troll", name: "Troll", hp: 50, exp: 20, atk: 20, speed: 520, gold: 12, respawn: 20000, armored: false, drop: 0.07, dropN: 1, lootLvl: 10, rar: [0.12, 0.02, 0] },
  wasp: { id: "wasp", name: "Avispa", hp: 35, exp: 24, atk: 18, speed: 380, gold: 8, respawn: 20000, armored: false, drop: 0.06, dropN: 1, lootLvl: 12, rar: [0.12, 0.02, 0] },
  mino: { id: "mino", name: "Minotauro", hp: 100, exp: 50, atk: 40, speed: 560, gold: 25, respawn: 30000, armored: true, drop: 0.1, dropN: 1, lootLvl: 20, rar: [0.2, 0.05, 0.003] },
  guard: { id: "guard", name: "Guardia minotauro", hp: 185, exp: 160, atk: 75, speed: 600, gold: 50, respawn: 45000, armored: true, drop: 0.15, dropN: 1, lootLvl: 30, rar: [0.25, 0.08, 0.01] },
  boss: { id: "boss", name: "Rey Minotauro", hp: 1500, exp: 1500, atk: 130, speed: 620, gold: 400, respawn: 180000, armored: true, drop: 1, dropN: 2, lootLvl: 99, rar: [0.45, 0.3, 0.15] },
};
const SPAWNS: Array<[MonId, number, number]> = [
  ["rat", 36, 24], ["rat", 60, 24], ["rat", 36, 44], ["rat", 60, 44], ["rat", 44, 23], ["rat", 52, 45], ["rat", 34, 34], ["rat", 62, 30],
  ["rotworm", 30, 42], ["rotworm", 63, 40], ["rotworm", 48, 16], ["rotworm", 40, 50], ["rotworm", 32, 20], ["rotworm", 62, 20],
  ["troll", 12, 12], ["troll", 18, 18], ["troll", 10, 24], ["troll", 22, 10], ["troll", 18, 28], ["troll", 8, 16],
  ["wasp", 50, 60], ["wasp", 60, 62], ["wasp", 70, 58], ["wasp", 80, 64], ["wasp", 45, 66], ["wasp", 75, 66],
  ["mino", 72, 13], ["mino", 75, 18], ["mino", 71, 17], ["mino", 80, 23], ["mino", 85, 26], ["mino", 79, 27],
  ["guard", 84, 7], ["guard", 89, 10], ["guard", 86, 12], ["boss", 91, 22],
];

// ===================== Más vida en las zonas de caza =====================
for (const k of Object.keys(MONS)) { const d = MONS[k]; if (d) d.respawn = Math.round(d.respawn * 0.4); }
const EXTRA_SPAWNS: Array<[MonId, number, number]> = [
  ["rat", 38, 26], ["rat", 58, 26], ["rat", 40, 46], ["rat", 56, 46], ["rat", 33, 30], ["rat", 63, 37], ["rat", 46, 20], ["rat", 52, 49],
  ["rotworm", 28, 46], ["rotworm", 66, 42], ["rotworm", 44, 12], ["rotworm", 52, 12], ["rotworm", 36, 16], ["rotworm", 60, 16], ["rotworm", 30, 26],
  ["troll", 8, 10], ["troll", 14, 20], ["troll", 20, 24], ["troll", 24, 14], ["troll", 10, 30], ["troll", 26, 6], ["troll", 6, 22],
  ["wasp", 55, 62], ["wasp", 65, 60], ["wasp", 72, 62], ["wasp", 85, 60], ["wasp", 40, 64], ["wasp", 90, 66], ["wasp", 60, 68], ["wasp", 78, 58],
  ["mino", 70, 12], ["mino", 74, 14], ["mino", 76, 16], ["mino", 78, 22], ["mino", 82, 26], ["mino", 84, 22], ["mino", 87, 27],
  ["guard", 83, 9], ["guard", 90, 7], ["guard", 88, 12],
];
function monDef(id: string): MonDef | undefined { return MONS[id]; }

// ===================== Las 12 Casas del Zodiaco =====================
type Body = "quad" | "crab" | "scorp" | "fish" | "ghost" | "golem" | "plant" | "centaur" | "crystal" | "warrior" | "saint" | "shadow";
type Horn = "curl" | "bull" | "goat" | "mane" | "none";
interface MonLook { body: Body; c1: string; c2: string; c3: string; s: number; horn: Horn; glyph: string; alpha: number; }
type SpecKind = "nova" | "line" | "pull" | "freeze" | "poison" | "blink" | "summon" | "ranged" | "clones" | "banish";
interface Special { kind: SpecKind; name: string; cd: number; r: number; tele: number; }
interface BossDef { specials: Special[]; phase2: string; clone: string; }
interface MonDef { house?: number; look?: MonLook; boss?: BossDef; afk?: number; atkMs?: number; }
interface HouseQuest { kind: "kill" | "item"; n: number; item: string; }
interface HouseDef { n: number; name: string; glyph: string; tint: string; elem: Elem; rec: number; mons: Array<[string, MonLook]>; boss: string; look: MonLook; specials: Special[]; quest: HouseQuest; }
function lk(body: Body, c1: string, c2: string, c3: string, s?: number, horn?: Horn, alpha?: number): MonLook { return { body, c1, c2, c3, s: s ?? 1, horn: horn ?? "none", glyph: "", alpha: alpha ?? 1 }; }
function saint(c3: string, glyph: string, horn?: Horn, c1?: string, c2?: string): MonLook { return { body: "saint", c1: c1 ?? "#ffd34d", c2: c2 ?? "#a8721a", c3, s: 1.4, horn: horn ?? "none", glyph, alpha: 1 }; }
function sp(kind: SpecKind, name: string, cd: number, r?: number, tele?: number): Special { return { kind, name, cd, r: r ?? 2, tele: tele ?? 1000 }; }
function hq(kind: "kill" | "item", n: number, item?: string): HouseQuest { return { kind, n, item: item ?? "" }; }
const HOUSES: HouseDef[] = [
  { n: 1, name: "Aries", glyph: "♈", tint: "#e0b050", elem: "holy", rec: 3, boss: "Mu de Aries", look: saint("#c060c0", "♈", "curl"),
    mons: [["Carnero dorado", lk("quad", "#f2ead8", "#8a7a5a", "#d8a040", 1, "curl")], ["Cordero furioso", lk("quad", "#fff8ee", "#a08a6a", "#e0b050", 0.8, "curl")], ["Muro de cristal vivo", lk("crystal", "#bfe8ff", "#6aa8d8", "#ffffff", 1.1)]],
    specials: [sp("nova", "Revolución Estelar", 7000, 2), sp("summon", "Llamado del rebaño", 16000)], quest: hq("item", 8, "Fragmentos de oricalco") },
  { n: 2, name: "Tauro", glyph: "♉", tint: "#c87a3a", elem: "earth", rec: 7, boss: "Aldebarán de Tauro", look: saint("#8a4a1a", "♉", "bull"),
    mons: [["Toro de Tauro", lk("quad", "#6a4426", "#3a2414", "#e8dcc0", 1.05, "bull")], ["Becerro bravo", lk("quad", "#8a5a32", "#4a2a14", "#e8dcc0", 0.8, "bull")], ["Coloso astado", lk("quad", "#4a2a18", "#2a1408", "#fff0d0", 1.3, "bull")]],
    specials: [sp("line", "Gran Cuerno", 6000, 5, 800), sp("nova", "Embestida del toro", 9000, 2), sp("summon", "Estampida", 18000)], quest: hq("kill", 24) },
  { n: 3, name: "Cáncer", glyph: "♋", tint: "#4a9a7a", elem: "dark", rec: 11, boss: "Máscara Mortal de Cáncer", look: saint("#2a6a5a", "♋"),
    mons: [["Cangrejo gigante", lk("crab", "#c0503a", "#7a2a1a", "#ffd0a0")], ["Alma del Yomotsu", lk("ghost", "#9fd8c0", "#1a3a30", "#ffffff", 1, "none", 0.8)], ["Cangrejo acorazado", lk("crab", "#6a3a5a", "#3a1a2a", "#d0a0c0", 1.2)]],
    specials: [sp("pull", "Ondas Infernales", 9000, 7), sp("nova", "Fuegos fatuos", 7000, 2), sp("summon", "Almas en pena", 15000)], quest: hq("item", 9, "Máscaras del Yomotsu") },
  { n: 4, name: "Leo", glyph: "♌", tint: "#e0a020", elem: "energy", rec: 15, boss: "Aioria de Leo", look: saint("#c06010", "♌", "mane"),
    mons: [["León dorado", lk("quad", "#d8a040", "#8a5a1a", "#7a3a10", 1.05, "mane")], ["Leona veloz", lk("quad", "#e0c080", "#9a7a40", "#5a3a10", 0.85)], ["Guerrero león", lk("warrior", "#c08a2a", "#ffd34d", "#7a3a10")]],
    specials: [sp("nova", "Plasma Relámpago", 6000, 3, 700), sp("blink", "Colmillo del León", 10000)], quest: hq("kill", 28) },
  { n: 5, name: "Virgo", glyph: "♍", tint: "#d890d0", elem: "holy", rec: 20, boss: "Shaka de Virgo", look: saint("#e08a30", "♍"),
    mons: [["Monje del loto", lk("warrior", "#e08a30", "#ffe0a0", "#7a3a10")], ["Espíritu de loto", lk("ghost", "#ffb0e0", "#5a1a50", "#ffffff", 1, "none", 0.85)], ["Guardián del Sala", lk("golem", "#d8d0c0", "#8a8070", "#ffd34d")]],
    specials: [sp("freeze", "Tesoro del Cielo", 12000, 6), sp("nova", "Rendición Divina", 8000, 3), sp("blink", "Seis Reencarnaciones", 11000)], quest: hq("item", 10, "Pétalos de loto") },
  { n: 6, name: "Libra", glyph: "♎", tint: "#7ab0d0", elem: "earth", rec: 25, boss: "Dohko de Libra", look: saint("#2a8a4a", "♎"),
    mons: [["Guardián de la balanza", lk("golem", "#a8b8c8", "#5a6a7a", "#ffd34d")], ["Dragón de Rozan", lk("quad", "#3a9a5a", "#1a5a2a", "#ffd34d", 0.9, "goat")], ["Armero de Libra", lk("warrior", "#5a7a9a", "#ffd34d", "#2a3a4a", 1.1)]],
    specials: [sp("nova", "Cien Dragones", 8000, 3), sp("line", "Dragón Naciente", 7000, 6, 800), sp("summon", "Dragones de Rozan", 15000)], quest: hq("kill", 30) },
  { n: 7, name: "Escorpio", glyph: "♏", tint: "#d03030", elem: "fire", rec: 30, boss: "Milo de Escorpio", look: saint("#a01010", "♏"),
    mons: [["Escorpión rojo", lk("scorp", "#c02a2a", "#6a1010", "#ffb070")], ["Escorpión de arena", lk("scorp", "#d8b060", "#8a6a2a", "#3a2a10", 0.8)], ["Emperador escorpión", lk("scorp", "#4a1a3a", "#2a0a1a", "#ff3030", 1.3)]],
    specials: [sp("poison", "Aguja Escarlata", 5000, 5), sp("nova", "Antares", 9000, 2), sp("summon", "Nido de escorpiones", 16000)], quest: hq("item", 11, "Agujas escarlata") },
  { n: 8, name: "Sagitario", glyph: "♐", tint: "#e0c060", elem: "holy", rec: 35, boss: "Aioros de Sagitario", look: saint("#e0c060", "♐"),
    mons: [["Centauro arquero", lk("centaur", "#8a5a32", "#5a3a1e", "#e0c08a")], ["Corcel alado", lk("quad", "#f0f0f0", "#a0a0a0", "#ffd34d", 0.9)], ["Guardián de la flecha", lk("warrior", "#c8a040", "#ffe9a8", "#6a4a10", 1.1)]],
    specials: [sp("ranged", "Flecha Dorada", 2500, 6), sp("nova", "Trueno Atómico", 9000, 3), sp("summon", "Carga de centauros", 15000)], quest: hq("kill", 32) },
  { n: 9, name: "Capricornio", glyph: "♑", tint: "#9a9ab8", elem: "phys", rec: 40, boss: "Shura de Capricornio", look: saint("#5a5a8a", "♑", "goat"),
    mons: [["Cabra montés", lk("quad", "#a8a090", "#5a5040", "#e8e0d0", 1, "goat")], ["Espadachín de Excalibur", lk("warrior", "#4a4a6a", "#dfe6ee", "#ffd34d")], ["Gólem de obsidiana", lk("golem", "#2a2a34", "#14141a", "#9a6aff", 1.15)]],
    specials: [sp("line", "Excalibur", 5500, 7, 800), sp("nova", "Salto de la cabra", 9000, 2), sp("blink", "Filo veloz", 12000)], quest: hq("item", 12, "Fragmentos de Excalibur") },
  { n: 10, name: "Acuario", glyph: "♒", tint: "#60c0f0", elem: "ice", rec: 46, boss: "Camus de Acuario", look: saint("#3a8ac0", "♒"),
    mons: [["Elemental de hielo", lk("crystal", "#9be8ff", "#3a8ac0", "#ffffff")], ["Espíritu de la aurora", lk("ghost", "#a0fff0", "#0a3a3a", "#ffffff", 1, "none", 0.8)], ["Coloso helado", lk("golem", "#c8f0ff", "#6aa8c8", "#2a6a9a", 1.2)]],
    specials: [sp("freeze", "Ejecución Aurora", 10000, 6), sp("nova", "Polvo de Diamante", 7000, 3), sp("line", "Ataúd de Hielo", 9000, 6, 800)], quest: hq("kill", 36) },
  { n: 11, name: "Piscis", glyph: "♓", tint: "#e070a0", elem: "earth", rec: 52, boss: "Afrodita de Piscis", look: saint("#d02060", "♓"),
    mons: [["Hombre pez", lk("fish", "#3a8a9a", "#1a4a5a", "#a0f0e0")], ["Rosa diabólica", lk("plant", "#d02040", "#2a6a2a", "#ff90b0")], ["Tritón abisal", lk("fish", "#2a3a7a", "#101a3a", "#60c0ff", 1.25)]],
    specials: [sp("poison", "Rosas Diabólicas", 6000, 5), sp("ranged", "Rosa Piraña", 3000, 5), sp("summon", "Jardín de rosas", 14000), sp("nova", "Rosa Sangrienta", 10000, 2)], quest: hq("item", 13, "Rosas negras") },
  { n: 12, name: "Géminis", glyph: "♊", tint: "#9a7aff", elem: "dark", rec: 60, boss: "Saga de Géminis", look: saint("#3a5aff", "♊"),
    mons: [["Sombra gemela", lk("shadow", "#3a2a5a", "#140a24", "#b070ff")], ["Reflejo del espejo", lk("shadow", "#d8e0ff", "#7a80a0", "#ffffff", 1, "none", 0.75)], ["Coloso de otra dimensión", lk("ghost", "#4a1a6a", "#1a0a2a", "#ff60ff", 1.35)]],
    specials: [sp("clones", "Ilusión gemela", 14000), sp("nova", "Explosión de Galaxias", 8000, 3), sp("ranged", "Satán Imperial", 4000, 5)], quest: hq("kill", 40) },
];
const KANON = "Kanon de Géminis";
const HSTAT = HOUSES.map((H: HouseDef) => ({ hp: Math.round(32 + 2.8 * Math.pow(H.rec, 1.45)), atk: Math.round(13 + 3.4 * H.rec) }));
for (const H of HOUSES) {
  const i = H.n - 1, R = H.rec; const st = HSTAT[i] ?? { hp: 50, atk: 20 };
  const MUL: Array<[number, number, number, number]> = [[1, 1, 1, 560], [0.6, 0.75, 0.6, 380], [1.8, 1.3, 1.9, 760]];
  H.mons.forEach((ms: [string, MonLook], k: number) => {
    const mu = MUL[k] ?? [1, 1, 1, 560]; const id = `h${H.n}${"abc".charAt(k)}`; const b = ms[1].body;
    MONS[id] = { id, name: ms[0], hp: Math.round(st.hp * mu[0]), exp: Math.round(st.hp * mu[2] * 0.4 * (1 + 0.06 * i)), atk: Math.round(st.atk * mu[1]), speed: Math.round(mu[3] * (1 - i * 0.015)), gold: Math.round(4 + R * 1.6 * mu[2]),
      respawn: 7000, armored: b === "golem" || b === "crystal" || b === "crab" || b === "scorp", drop: (0.06 + i * 0.004) * (k === 2 ? 1.5 : 1), dropN: 1, lootLvl: R + 8,
      rar: [0.12 + i * 0.012, 0.025 + i * 0.006, 0.002 + i * 0.0012], house: H.n, look: ms[1], afk: Math.max(1, R - 2) };
  });
  const bhp = Math.round(st.hp * (30 + 1.5 * i)), batk = Math.round(st.atk * 1.35);
  MONS[`h${H.n}boss`] = { id: `h${H.n}boss`, name: H.boss, hp: bhp, exp: Math.round(bhp * 0.25), atk: batk, speed: 520, gold: Math.round(150 + R * 25), respawn: 240000, armored: true, drop: 1, dropN: 2 + Math.floor(i / 4), lootLvl: R + 12,
    rar: [0.4, 0.22 + 0.02 * i, 0.03 + 0.025 * i], house: H.n, look: H.look, atkMs: 1500, boss: { specials: H.specials, phase2: H.n === NH ? "h12boss2" : "", clone: H.n === NH ? "h12clone1" : "" } };
  if (H.n === NH) {
    const k2hp = Math.round(bhp * 0.65), k2atk = Math.round(batk * 1.15); const kl = saint("#7a0a3a", "♊", "none", "#c8a030", "#5a3a0a");
    MONS.h12boss2 = { id: "h12boss2", name: KANON, hp: k2hp, exp: Math.round(k2hp * 0.4), atk: k2atk, speed: 500, gold: 1200, respawn: 240000, armored: true, drop: 1, dropN: 4, lootLvl: R + 12, rar: [0.35, 0.3, 0.33], house: H.n, look: kl, atkMs: 1400,
      boss: { specials: [sp("banish", "Otra Dimensión", 11000, 6), sp("nova", "Explosión de Galaxias", 7000, 4), sp("clones", "Ilusión gemela", 12000)], phase2: "", clone: "h12clone2" } };
    const c1: MonDef = { id: "h12clone1", name: H.boss, hp: Math.round(st.hp * 0.6), exp: 0, atk: Math.round(batk * 0.45), speed: 520, gold: 0, respawn: 0, armored: false, drop: 0, dropN: 0, lootLvl: 1, rar: [0, 0, 0], house: H.n, look: { ...H.look, alpha: 0.93 } };
    MONS.h12clone1 = c1;
    MONS.h12clone2 = { ...c1, id: "h12clone2", name: KANON, hp: Math.round(st.hp * 0.7), atk: Math.round(k2atk * 0.45), look: { ...kl, alpha: 0.93 } };
  }
}
const ROWS = [28, 23, 18, 13, 8, 3];
interface Door { x: number; y: number; ox: number; oy: number; }
const DOORS: Door[] = HOUSES.map((H: HouseDef): Door => { const k = Math.floor((H.n - 1) / 2), first = (H.n - 1) % 2 === 0, row = ROWS[k] ?? 3; const x = first === (k % 2 === 0) ? 30 : 64; return { x, y: row - 1, ox: x, oy: row }; });

// ===================== Utilidades =====================

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hash(x: number, y: number): number { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; }
function roll(min: number, max: number): number { const a = Math.min(min, max); return a + Math.floor(Math.random() * (Math.abs(max - min) + 1)); }
function clamp(v: number, lo: number, hi: number): number { return !isFinite(v) ? lo : v < lo ? lo : v > hi ? hi : v; }
function cheb(ax: number, ay: number, bx: number, by: number): number { return Math.max(Math.abs(ax - bx), Math.abs(ay - by)); }
function dxOf(d: Dir): number { return d === 1 ? 1 : d === 3 ? -1 : 0; }
function dyOf(d: Dir): number { return d === 2 ? 1 : d === 0 ? -1 : 0; }
function dirFrom(dx: number, dy: number): Dir { if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 1 : 3; return dy >= 0 ? 2 : 0; }
function isMove(a: Action): a is MoveAct { return Object.prototype.hasOwnProperty.call(MOVE_VEC, a); }
function cloneBinds(b: Binds): Binds { const out = { ...b }; for (const a of ACTIONS) out[a.id] = [...b[a.id]]; return out; }
function actionFor(b: Binds, code: string): Action | null { for (const a of ACTIONS) if (b[a.id].includes(code)) return a.id; return null; }
function assignKey(b: Binds, act: Action, code: string, mode: "set" | "add"): void {
  for (const a of ACTIONS) b[a.id] = b[a.id].filter((c: string) => c !== code);
  b[act] = mode === "add" ? [...b[act], code] : [code];
}
const KEY_NAMES: Record<string, string> = { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Escape: "Esc", Space: "Espacio", Tab: "Tab", Enter: "Enter", Backspace: "Retroceso", ShiftLeft: "Shift", ShiftRight: "Shift der.", ControlLeft: "Ctrl", ControlRight: "Ctrl der.", AltLeft: "Alt", AltRight: "Alt der." };
function keyLabel(code: string): string {
  const n = KEY_NAMES[code]; if (n) return n;
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return `Num ${code.slice(6)}`;
  return code;
}
function moveVec(held: MoveAct[]): [number, number] | null {
  for (let i = held.length - 1; i >= 0; i--) { const a = held[i]; if (a === "ul" || a === "ur" || a === "dl" || a === "dr") return MOVE_VEC[a]; }
  let dx = 0, dy = 0;
  if (held.includes("left")) dx -= 1; if (held.includes("right")) dx += 1; if (held.includes("up")) dy -= 1; if (held.includes("down")) dy += 1;
  return dx === 0 && dy === 0 ? null : [dx, dy];
}
function expFor(L: number): number { return Math.round((50 / 3) * (L * L * L - 6 * L * L + 17 * L - 12)); }
function levelFor(exp: number): number { let L = 1; while (L < 500 && expFor(L + 1) <= exp) L++; return L; }
function walkable(t: number): boolean { return t === GRASS || t === FLOOR || t === TEMPLE || t === CAVE || t === SAND || t === PATH || t === MARBLE || t === PORTAL; }
function blocksShot(t: number): boolean { return t === TREE || t === WALL || t === ROCK || t === BOULDER || t === HWALL; }
function regionOf(x: number, y: number): number { if (x < OW_W) return 0; const c = Math.floor((x - OW_W) / HW), r = Math.floor(y / HH); return clamp(r * 4 + c + 1, 1, NH); }
function regionRect(r: number): [number, number, number, number] { if (r <= 0) return [0, 0, OW_W, OW_H]; const i = r - 1; return [OW_W + (i % 4) * HW, Math.floor(i / 4) * HH, HW, HH]; }
function inRect(q: [number, number, number, number], x: number, y: number): boolean { return x >= q[0] && x <= q[2] && y >= q[1] && y <= q[3]; }
function isSafe(x: number, y: number): boolean { return x >= TX0 && x <= TX1 && y >= TY0 && y <= TY1; }

// ===================== Mapa =====================
// Santuario: camino en zigzag al norte de la villa con las 12 puertas
function buildSanctuary(m: Uint8Array): void {
  const set = (x: number, y: number, t: number): void => { if (x >= 0 && y >= 0 && x < OW_W && y < OY + 4) m[y * MW + x] = t; };
  const rect = (x0: number, y0: number, x1: number, y1: number, t: number): void => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t); };
  rect(0, 0, OW_W - 1, OY - 1, ROCK);
  ROWS.forEach((row: number, k: number) => { rect(20, row, 77, row + 1, PATH); const nx = ROWS[k + 1]; if (nx !== undefined) { const cx = k % 2 === 0 ? 76 : 20; rect(cx, nx, cx + 1, row + 1, PATH); } });
  rect(48, (ROWS[0] ?? 28) + 2, 49, OY + 3, PATH);
  for (const d of DOORS) set(d.x, d.y, PORTAL);
}
// Cada casa: 12 salas enlazadas en serpentina (entrada abajo a la izquierda, templo del guardián arriba a la derecha)
interface HouseRT { x0: number; y0: number; entry: [number, number]; exit: [number, number]; boss: [number, number]; room: [number, number, number, number]; spawns: Array<[string, number, number]>; }
const HRT: HouseRT[] = [];
function buildHouse(m: Uint8Array, n: number): void {
  const [x0, y0] = regionRect(n); const r = rng(9000 + n * 77);
  const set = (x: number, y: number, t: number): void => { if (x >= x0 && y >= y0 && x < x0 + HW && y < y0 + HH) m[y * MW + x] = t; };
  const get = (x: number, y: number): number => m[y * MW + x] ?? HWALL;
  for (let y = y0; y < y0 + HH; y++) for (let x = x0; x < x0 + HW; x++) set(x, y, HWALL);
  const rooms: Array<[number, number, number, number]> = []; const order: Array<[number, number]> = [];
  for (let row = 2; row >= 0; row--) for (let k = 0; k < 4; k++) order.push([row % 2 === 0 ? k : 3 - k, row]);
  order.forEach((c: [number, number], i: number) => {
    const big = i === order.length - 1; const w = big ? 14 : 8 + Math.floor(r() * 6), h = big ? 13 : 7 + Math.floor(r() * 6);
    const rx = x0 + c[0] * 16 + 1 + Math.floor(r() * (15 - w)), ry = y0 + c[1] * 16 + 1 + Math.floor(r() * (15 - h));
    rooms.push([rx, ry, rx + w - 1, ry + h - 1]);
    for (let y = ry; y < ry + h; y++) for (let x = rx; x < rx + w; x++) set(x, y, MARBLE);
    if (w >= 10 && h >= 9 && i > 0) for (const [px, py] of [[rx + 2, ry + 2], [rx + w - 3, ry + 2], [rx + 2, ry + h - 3], [rx + w - 3, ry + h - 3]] as Array<[number, number]>) set(px, py, HWALL);
  });
  const ctr = (k: number): [number, number] => { const q = rooms[k] ?? [x0 + 2, y0 + 2, x0 + 4, y0 + 4]; return [Math.floor((q[0] + q[2]) / 2), Math.floor((q[1] + q[3]) / 2)]; };
  const carve = (a: [number, number], b: [number, number]): void => {
    const hl = (y: number, x1: number, x2: number): void => { for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) { set(x, y, MARBLE); set(x, y + 1, MARBLE); } };
    const vl = (x: number, y1: number, y2: number): void => { for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) { set(x, y, MARBLE); set(x + 1, y, MARBLE); } };
    if (r() < 0.5) { hl(a[1], a[0], b[0]); vl(b[0], a[1], b[1]); } else { vl(a[0], a[1], b[1]); hl(b[1], a[0], b[0]); }
  };
  for (let i = 0; i < rooms.length - 1; i++) carve(ctr(i), ctr(i + 1));
  for (let i = 0; i < 4; i++) if (r() < 0.45) carve(ctr(i), ctr(7 - i));
  for (let j = 5; j < 8; j++) if (r() < 0.45) carve(ctr(j), ctr(15 - j));
  const s0 = rooms[0] ?? [x0 + 2, y0 + 2, x0 + 6, y0 + 6]; const exit: [number, number] = [s0[0], s0[1]]; set(exit[0], exit[1], PORTAL);
  const bossXY = ctr(rooms.length - 1); const spawns: Array<[string, number, number]> = []; const used = new Set<number>();
  for (let i = 1; i < rooms.length; i++) {
    const q = rooms[i]; if (!q) continue; const last = i === rooms.length - 1;
    const want = last ? 2 : 3 + Math.floor(((q[2] - q[0] + 1) * (q[3] - q[1] + 1)) / 32);
    for (let k = 0, tries = 0; k < want && tries < 80; tries++) {
      const x = q[0] + Math.floor(r() * (q[2] - q[0] + 1)), y = q[1] + Math.floor(r() * (q[3] - q[1] + 1));
      if (get(x, y) !== MARBLE || used.has(y * MW + x) || cheb(x, y, bossXY[0], bossXY[1]) <= 1) continue;
      const v = r(); spawns.push([`h${n}${last || v >= 0.85 ? "c" : v < 0.55 ? "a" : "b"}`, x, y]); used.add(y * MW + x); k++;
    }
  }
  spawns.push([`h${n}boss`, bossXY[0], bossXY[1]]);
  HRT[n - 1] = { x0, y0, entry: ctr(0), exit, boss: bossXY, room: rooms[rooms.length - 1] ?? s0, spawns };
}
let MAP_CACHE: Uint8Array | null = null;
function buildMap(): Uint8Array {
  if (MAP_CACHE) return MAP_CACHE;
  const big = new Uint8Array(MW * MH).fill(ROCK);
  buildOverworld(big); buildSanctuary(big); for (const H of HOUSES) buildHouse(big, H.n);
  MAP_CACHE = big; return big;
}
// Mundo exterior: se genera con las coordenadas de siempre (96×72) y se desplaza OY casillas al sur
function buildOverworld(big: Uint8Array): Uint8Array {
  const BW = OW_W + 4 * HW; const MW = OW_W, MH = 72, TX0 = 40, TY0 = 28, TX1 = 56, TY1 = 40; const r = rng(1337); const m = big;
  const set = (x: number, y: number, t: number): void => { if (x >= 0 && y >= 0 && x < MW && y < MH) m[(y + OY) * BW + x] = t; };
  const get = (x: number, y: number): number => m[(y + OY) * BW + x] ?? ROCK;
  const rect = (x0: number, y0: number, x1: number, y1: number, t: number): void => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t); };
  rect(0, 0, MW - 1, MH - 1, GRASS);
  rect(36, 56, MW - 1, MH - 1, SAND);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const ex = (x - 24) / 9, ey = (y - 52) / 6; if (ex * ex + ey * ey <= 1) set(x, y, WATER); }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (x >= TX0 - 3 && x <= TX1 + 3 && y >= TY0 - 3 && y <= TY1 + 3) continue;
    const t = get(x, y);
    if (t === GRASS) { if (r() < (x < 32 && y < 32 ? 0.16 : 0.06)) set(x, y, TREE); } else if (t === SAND && r() < 0.025) set(x, y, BOULDER);
  }
  rect(68, 3, 93, 30, ROCK);
  rect(68, 15, 72, 15, CAVE); rect(70, 11, 77, 19, CAVE); rect(77, 15, 81, 15, CAVE); rect(80, 15, 80, 21, CAVE);
  rect(77, 21, 88, 28, CAVE); rect(86, 13, 86, 21, CAVE); rect(82, 5, 91, 13, CAVE);
  rect(89, 25, 89, 25, CAVE); rect(90, 17, 92, 28, CAVE); // sala del jefe
  set(73, 13, ROCK); set(76, 18, ROCK); set(82, 24, ROCK); set(85, 25, ROCK); set(85, 9, ROCK); set(88, 7, ROCK);
  rect(TX0, TY0, TX1, TY1, WALL); rect(TX0 + 1, TY0 + 1, TX1 - 1, TY1 - 1, FLOOR); rect(42, 30, 46, 33, TEMPLE); rect(48, 36, 49, 37, WATER);
  set(48, TY0, FLOOR); set(48, TY1, FLOOR); set(TX0, 34, FLOOR); set(TX1, 34, FLOOR);
  rect(48, 4, 48, TY0 - 1, PATH); rect(48, TY1 + 1, 48, MH - 3, PATH); rect(3, 34, TX0 - 1, 34, PATH); rect(14, 6, 14, 33, PATH);
  rect(TX1 + 1, 34, 66, 34, PATH); rect(66, 15, 66, 33, PATH); set(67, 15, PATH);
  for (let x = 0; x < MW; x++) { set(x, 0, TREE); set(x, 1, TREE); set(x, MH - 1, TREE); set(x, MH - 2, TREE); }
  for (let y = 0; y < MH; y++) { set(0, y, TREE); set(1, y, TREE); set(MW - 1, y, TREE); set(MW - 2, y, TREE); }
  return m;
}
function tileAt(g: Game, x: number, y: number): number { if (x < 0 || y < 0 || x >= MW || y >= MH) return ROCK; return g.tiles[y * MW + x] ?? ROCK; }
function zoneName(g: Game, x: number, y: number): string {
  const r = regionOf(x, y);
  if (r > 0) { const H = HOUSES[r - 1], rt = HRT[r - 1]; if (!H) return "Santuario"; return rt && inRect(rt.room, x, y) ? `${H.glyph} Templo de ${H.boss.split(" de ")[0] ?? H.boss}` : `${H.glyph} Casa de ${H.name}`; }
  if (y < OY) return "Santuario: camino de las 12 Casas";
  const oy = y - OY;
  if (isSafe(x, y)) return "Villa Esmeralda (zona segura)";
  if (tileAt(g, x, y) === CAVE) return x >= 89 && oy >= 16 ? "Trono del Rey Minotauro" : "Cueva del Minotauro";
  if (oy >= 56 && x >= 36) return "Desierto de las Avispas";
  if (x < 32 && oy < 34) return "Bosque de los Trolls";
  return "Praderas de Esmeralda";
}
function monAt(g: Game, x: number, y: number): Mon | null { for (const m of regionMons(g, x, y)) if (m.alive && m.x === x && m.y === y) return m; return null; }
function findMon(g: Game, id: number): Mon | null { if (id < 0) return null; for (const m of g.mons) if (m.id === id) return m; return null; }
function canPlayerEnter(g: Game, x: number, y: number): boolean { if (!walkable(tileAt(g, x, y))) return false; if (isNpcAt(x, y)) return false; return monAt(g, x, y) === null; }
function canMonEnter(g: Game, x: number, y: number): boolean {
  const t = tileAt(g, x, y);
  if (!walkable(t) || t === PORTAL || isSafe(x, y)) return false;
  if (g.p.x === x && g.p.y === y) return false;
  if (g.minion && g.minion.x === x && g.minion.y === y) return false;
  return monAt(g, x, y) === null;
}
function los(g: Game, x0: number, y0: number, x1: number, y1: number): boolean {
  let x = x0, y = y0; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (let i = 0; i < 64; i++) {
    if (x === x1 && y === y1) return true;
    if (!(x === x0 && y === y0) && blocksShot(tileAt(g, x, y))) return false;
    const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; }
  }
  return true;
}
// BFS acotado, 8 direcciones; en diagonal solo importa la casilla destino. Los portales solo cuentan si son la meta.
const BFS_PREV = new Int32Array(MW * MH);
const BFS_Q = new Int32Array(MW * MH);
const OCC = new Uint8Array(MW * MH);
function bfsStep(g: Game, sx: number, sy: number, goal: (x: number, y: number) => boolean, maxNodes: number): [number, number] | null {
  if (goal(sx, sy)) return null;
  BFS_PREV.fill(-1); OCC.fill(0);
  for (const m of regionMons(g, sx, sy)) if (m.alive) OCC[m.y * MW + m.x] = 1;
  OCC[NPC_Y * MW + NPC_X] = 1; OCC[DARIO_Y * MW + DARIO_X] = 1; OCC[DEPOT_Y * MW + DEPOT_X] = 1; OCC[STABLE_Y * MW + STABLE_X] = 1;
  const start = sy * MW + sx; BFS_PREV[start] = start;
  let head = 0, tail = 0, found = -1; BFS_Q[tail++] = start;
  while (head < tail && head < maxNodes && found < 0) {
    const cur = BFS_Q[head++] ?? start; const cx = cur % MW, cy = (cur - cx) / MW;
    for (const [dx, dy] of DIRS8) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      const ni = ny * MW + nx; const t = tileAt(g, nx, ny);
      if ((BFS_PREV[ni] ?? 0) !== -1 || (OCC[ni] ?? 0) === 1 || !walkable(t)) continue;
      const isGoal = goal(nx, ny);
      if (t === PORTAL && !isGoal) continue;
      BFS_PREV[ni] = cur;
      if (isGoal) { found = ni; break; }
      if (tail < BFS_Q.length) BFS_Q[tail++] = ni;
    }
  }
  if (found < 0) return null;
  let c = found, guard = 0;
  while ((BFS_PREV[c] ?? start) !== start && guard++ < MW * MH) c = BFS_PREV[c] ?? start;
  const fx = c % MW, fy = (c - fx) / MW;
  return [fx - sx, fy - sy];
}

// ===================== Lógica: estadísticas y objetos =====================
function istat(i: Inst, k: StatKey): number { const d = ITEM[i.id]; if (!d) return 0; const v = d[k]; return v > 0 ? Math.round(v * RAR[i.rar].m) : 0; }
function refreshStats(g: Game): void {
  const st: Stats = { atk: 0, def: 0, arm: 0, magic: 0, hp: 0, mana: 0, speed: 0 };
  for (const s of SLOTS) { const i = g.p.eq[s]; if (!i) continue; for (const k of STAT_KEYS) { if (s === "weapon" && k === "atk") continue; st[k] += istat(i, k); } }
  g.st = st; g.p.hp = Math.min(g.p.hp, maxHp(g)); g.p.mana = Math.min(g.p.mana, maxMana(g));
}
function maxHp(g: Game): number { return g.cls.hpBase + (g.p.level - 1) * g.cls.hpPer + g.st.hp; }
function maxMana(g: Game): number { return g.cls.manaBase + (g.p.level - 1) * g.cls.manaPer + g.st.mana; }
function stepTime(g: Game): number { return Math.max(110, 250 - g.p.level * 2 - g.st.speed * 1.5); }
interface WInfo { atk: number; range: number; interval: number; mana: number; elem: Elem; wt: WType | "fist"; school: School; }
function weaponInfo(g: Game): WInfo {
  const w = g.p.eq.weapon; const d = w ? ITEM[w.id] : undefined;
  if (!w || !d) return { atk: 6 + g.st.atk, range: 1, interval: 2000, mana: 0, elem: "phys", wt: "fist", school: "melee" };
  const magic = d.wt === "rod" || d.wt === "wand" || d.wt === "staff";
  return { atk: istat(w, "atk") + g.st.atk, range: d.range, interval: WT_INT[d.wt] ?? 2000, mana: magic ? Math.ceil(d.lvl / 8) : 0, elem: d.elem, wt: d.wt, school: magic ? "magic" : d.wt === "bow" ? "dist" : "melee" };
}
function lookOf(g: Game): Look {
  const w = weaponInfo(g).wt;
  return w === "rod" || w === "wand" || w === "staff" ? "staff" : w === "bow" ? "bow" : w === "sword" ? "sword" : w === "axe" ? "axe" : w === "club" ? "club" : w === "dagger" ? "dagger" : "none";
}
function hasShield(g: Game): boolean { const o = g.p.eq.off; const d = o ? ITEM[o.id] : undefined; return !!d && d.wt === "shield"; }
function itemName(i: Inst): string { const d = ITEM[i.id]; const b = d ? d.name : i.id; return i.rar === "com" ? b : `${b} (${RAR[i.rar].n})`; }
function itemDesc(i: Inst): string {
  const d = ITEM[i.id]; if (!d) return "";
  const parts: string[] = [];
  const add = (k: StatKey, label: string): void => { const v = istat(i, k); if (v) parts.push(`${label} ${v}`); };
  add("atk", "Ataque"); add("def", "Defensa"); add("arm", "Armadura"); add("magic", "Magia +"); add("hp", "Vida +"); add("mana", "Maná +"); add("speed", "Velocidad +");
  if (d.slot === "weapon") parts.push(`alcance ${d.range}`);
  if (d.wt === "sword") parts.push("equilibrada"); if (d.wt === "axe") parts.push("lenta pero fuerte"); if (d.wt === "club") parts.push("+30 % contra blindados"); if (d.wt === "dagger" && d.slot === "weapon") parts.push("muy rápida");
  parts.push(`nivel ${d.lvl}`);
  parts.push(d.voc ? d.voc.map((v: ClassId) => CLASSES[v].name).join("/") : "todas las vocaciones");
  return parts.join(" · ");
}
function canUse(g: Game, d: ItemDef): boolean { return (d.voc === null || d.voc.includes(g.cls.id)) && g.p.level >= d.lvl; }
// ===== Comparación de objetos (tooltip estilo Diablo/WoW) =====
type CmpKey = StatKey | "aps" | "range";
const CMP_LABEL: Record<CmpKey, string> = { atk: "Ataque", aps: "Ataques/min", range: "Alcance", def: "Defensa", arm: "Armadura", magic: "Magia", hp: "Vida", mana: "Maná", speed: "Velocidad" };
const CMP_ORDER: CmpKey[] = ["atk", "aps", "range", "def", "arm", "magic", "hp", "mana", "speed"];
// Peso de cada estadística según la vocación (magos: magia/maná; caballero: armadura/vida; arquero y pícaro: daño)
const MAGE_W: Record<CmpKey, number> = { atk: 0.6, aps: 0, range: 0.5, def: 0.6, arm: 2, magic: 6, hp: 0.1, mana: 0.15, speed: 0.4 };
const VOC_W: Record<ClassId, Record<CmpKey, number>> = {
  druid: MAGE_W, sorc: MAGE_W, warlock: MAGE_W,
  knight: { atk: 2, aps: 0, range: 0.3, def: 1.2, arm: 3.5, magic: 1, hp: 0.2, mana: 0.03, speed: 0.4 },
  archer: { atk: 2.5, aps: 0, range: 1, def: 0.6, arm: 2, magic: 1, hp: 0.12, mana: 0.06, speed: 0.5 },
  rogue: { atk: 2.5, aps: 0, range: 0.3, def: 0.8, arm: 2.2, magic: 1, hp: 0.14, mana: 0.05, speed: 0.6 },
};
function cmpStats(i: Inst): Record<CmpKey, number> {
  const d = ITEM[i.id]; const o: Record<CmpKey, number> = { atk: 0, aps: 0, range: 0, def: 0, arm: 0, magic: 0, hp: 0, mana: 0, speed: 0 };
  for (const k of STAT_KEYS) o[k] = istat(i, k);
  if (d && d.slot === "weapon") { o.aps = Math.round(60000 / (WT_INT[d.wt] ?? 2000)); o.range = d.range; }
  return o;
}
// Puntaje para tu vocación; en armas el ataque cuenta por golpe y por velocidad (daño por minuto)
function itemScore(g: Game, i: Inst): number {
  const d = ITEM[i.id]; const w = VOC_W[g.cls.id]; const s = cmpStats(i); let t = 0;
  for (const k of CMP_ORDER) { if (k === "aps") continue; const v = k === "atk" && d && d.slot === "weapon" ? (s.atk * s.aps) / 30 : s[k]; t += w[k] * v; }
  return t;
}
interface CmpRow { k: CmpKey; label: string; a: number; b: number; d: number; }
type Verdict = "better" | "worse" | "mixed" | "equal" | "empty" | "same";
interface ItemCmp { inst: Inst; def: ItemDef; cur: Inst | null; vocOk: boolean; lvlOk: boolean; rows: CmpRow[]; verdict: Verdict; mixedRows: boolean; score: number; curScore: number; }
function compareItem(g: Game, i: Inst): ItemCmp | null {
  const d = ITEM[i.id]; if (!d) return null; const cur = g.p.eq[d.slot];
  const vocOk = d.voc === null || d.voc.includes(g.cls.id); const lvlOk = g.p.level >= d.lvl;
  const a = cmpStats(i), b = cur ? cmpStats(cur) : null; const rows: CmpRow[] = [];
  for (const k of CMP_ORDER) {
    if ((k === "aps" || k === "range") && d.slot !== "weapon") continue;
    const va = a[k], vb = b ? b[k] : 0; if (va === 0 && vb === 0) continue;
    rows.push({ k, label: CMP_LABEL[k], a: va, b: vb, d: va - vb });
  }
  const score = itemScore(g, i), curScore = cur ? itemScore(g, cur) : 0;
  const up = rows.some((r: CmpRow) => r.d > 0), dn = rows.some((r: CmpRow) => r.d < 0);
  let verdict: Verdict;
  if (cur && cur.uid === i.uid) verdict = "same";
  else if (!cur) verdict = "empty";
  else if (!up && !dn) verdict = "equal";
  else if (up && !dn) verdict = "better";
  else if (dn && !up) verdict = "worse";
  else { const rel = (score - curScore) / Math.max(1, Math.abs(curScore)); verdict = rel > 0.05 ? "better" : rel < -0.05 ? "worse" : "mixed"; }
  return { inst: i, def: d, cur, vocOk, lvlOk, rows, verdict, mixedRows: up && dn, score, curScore };
}
// ¿Te conviene? (para el ▲ verde en mochila y tienda): sólo si puedes usarlo ya
function isUpgrade(g: Game, i: Inst): boolean { const c = compareItem(g, i); return !!c && c.vocOk && c.lvlOk && (c.verdict === "better" || c.verdict === "empty"); }
function verdictText(c: ItemCmp): string {
  const n = c.cur ? (ITEM[c.cur.id]?.name ?? "") : ""; const first = n.split(" ")[0] ?? ""; const tu = `${first.endsWith("s") ? "tus" : "tu"} ${n}`;
  switch (c.verdict) {
    case "better": return c.mixedRows ? `▲ Mejor en conjunto que ${tu}` : `▲ Mejor que ${tu}`;
    case "worse": return c.mixedRows ? `▼ Peor en conjunto que ${tu}` : `▼ Peor que ${tu}`;
    case "mixed": return `◆ Mixto frente a ${tu}`;
    case "equal": return `= Igual que ${tu}`;
    case "empty": return "Ranura vacía: ▲ mejora";
    default: return "Equipado";
  }
}
function sellValue(i: Inst): number { const d = ITEM[i.id]; return Math.max(5, Math.floor((d && d.price > 0 ? d.price : 40) * 0.35 * RAR[i.rar].sell)); }
function drawPos(e: Mover, now: number): [number, number] { const k = clamp((now - e.moveStart) / Math.max(1, e.moveDur), 0, 1); return [e.fx + (e.x - e.fx) * k, e.fy + (e.y - e.fy) * k]; }
function walkPhase(e: Mover, now: number): number { const k = (now - e.moveStart) / Math.max(1, e.moveDur); if (k >= 1 || k < 0) return 0; return k < 0.5 ? 1 : 2; }

// ===================== Lógica: partida =====================
interface QuestSt { e: boolean; k: number; b: boolean; d: boolean; }
interface Warn { cells: Array<[number, number]>; at: number; born: number; min: number; max: number; elem: Elem; name: string; }
interface Game { byRegion: Mon[][]; nextMonId: number; cleared: number; quests: QuestSt[]; bossKills: number[]; warns: Warn[]; returnAt: number; afkBoss: boolean; hudPad: number; lootToast: LootToast | null; exitPortal: [number, number, number] | null; carry: Inst[]; }
interface Game { miniZoom?: number; }
interface Player { hpPot2: number; manaPot2: number; slowUntil: number; poisonUntil: number; poisonNext: number; poisonDmg: number; }
interface Mon { spec: number[]; enraged: boolean; temp: boolean; }
function makeMon(id: number, def: MonDef, x: number, y: number): Mon {
  return { id, def, hp: def.hp, alive: true, respawnAt: 0, deadAt: 0, x, y, fx: x, fy: y, sx: x, sy: y, moveStart: 0, moveDur: 1, face: 2, nextMove: 0, nextAtk: 0, angryUntil: 0, slowUntil: 0, dotUntil: 0, dotNext: 0, dotMin: 0, dotMax: 0, calmUntil: 0, spec: [], enraged: false, temp: false };
}
function indexMons(g: Game): void { const br: Mon[][] = []; for (let r = 0; r <= NH; r++) br.push([]); for (const m of g.mons) br[regionOf(m.sx, m.sy)]?.push(m); g.byRegion = br; }
function regionMons(g: Game, x: number, y: number): Mon[] { return g.byRegion[regionOf(x, y)] ?? g.mons; }
// Monstruo temporal (invocaciones, clones, segunda fase): no reaparece
function spawnTemp(g: Game, def: MonDef | undefined, x: number, y: number, now: number): Mon | null {
  if (!def) return null; let spot: [number, number] | null = null;
  for (let r = 0; r <= 3 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r; dx++) { const nx = x + dx, ny = y + dy; if (regionOf(nx, ny) === regionOf(x, y) && canMonEnter(g, nx, ny)) { spot = [nx, ny]; break; } }
  if (!spot) return null;
  if (g.mons.length > 900) { g.mons = g.mons.filter((m: Mon) => !m.temp || m.alive); indexMons(g); }
  const m = makeMon(g.nextMonId++, def, spot[0], spot[1]); m.temp = true; m.angryUntil = now + 20000; m.nextMove = now + 300; m.nextAtk = now + 900;
  g.mons.push(m); g.byRegion[regionOf(spot[0], spot[1])]?.push(m); return m;
}
// Al salir o morir: desaparecen invocaciones/clones y los guardianes se recuperan
function resetRegion(g: Game, r: number): void {
  if (r <= 0) return; let any = false;
  for (const m of g.byRegion[r] ?? []) {
    if (m.temp) { if (m.alive) { m.alive = false; m.respawnAt = Infinity; } any = true; continue; }
    if (m.def.boss && m.alive) { m.hp = m.def.hp; m.enraged = false; m.spec = []; m.angryUntil = 0; m.x = m.sx; m.y = m.sy; m.fx = m.sx; m.fy = m.sy; }
  }
  if (any) { g.mons = g.mons.filter((m: Mon) => !m.temp || m.alive); indexMons(g); }
  g.warns = [];
  if (g.exitPortal && regionOf(g.exitPortal[0], g.exitPortal[1]) === r) closeExitPortal(g);
  const left = g.ground.filter((gi: Ground) => !!gi.boss && regionOf(gi.x, gi.y) === r);
  if (left.length > 0) { g.carry.push(...left.map((gi: Ground) => gi.inst)); g.ground = g.ground.filter((gi: Ground) => !left.includes(gi)); }
}
// Ancho visible del mapa (lo que no tapa el HUD de la derecha), en px del lienzo
function viewW(g: Game): number { return clamp(VW - g.hudPad, VW * 0.4, VW); }
function teleport(g: Game, x: number, y: number, now: number): void {
  const p = g.p; p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = now; p.moveDur = 1;
  g.walkGoal = null; g.pending = null; g.target = -1; g.chase = false; g.projs = []; g.minion = null; g.warns = []; g.fields = [];
  g.zone = zoneName(g, x, y);
  dropCarry(g, x, y, now);
}
function newGame(cls: ClassDef, name: string): Game {
  const tiles = buildMap(); const used = new Set<number>(); const mons: Mon[] = [];
  const okSpot = (x: number, y: number): boolean => { if (x < 0 || y < 0 || x >= MW || y >= MH) return false; return walkable(tiles[y * MW + x] ?? ROCK) && tiles[y * MW + x] !== PORTAL && !isSafe(x, y) && !used.has(y * MW + x); };
  let id = 0;
  const all: Array<[MonId, number, number]> = [...SPAWNS, ...EXTRA_SPAWNS].map((s: [MonId, number, number]): [MonId, number, number] => [s[0], s[1], s[2] + OY]);
  for (const rt of HRT) if (rt) for (const s of rt.spawns) all.push(s);
  for (const [mid, x0, y0] of all) {
    let fx = -1, fy = -1;
    for (let r = 0; r <= 6 && fx < 0; r++) for (let dy = -r; dy <= r && fx < 0; dy++) for (let dx = -r; dx <= r; dx++) if (okSpot(x0 + dx, y0 + dy) && regionOf(x0 + dx, y0 + dy) === regionOf(x0, y0)) { fx = x0 + dx; fy = y0 + dy; break; }
    if (fx < 0) continue;
    const def = (MONS as Record<string, MonDef | undefined>)[mid]; if (!def) continue; used.add(fy * MW + fx);
    mons.push(makeMon(id++, def, fx, fy));
  }
  const eq: Record<Slot, Inst | null> = { head: null, body: null, legs: null, feet: null, weapon: null, off: null, amulet: null, ring: null };
  let uid = 1;
  for (const sid of cls.starter) { const d = ITEM[sid]; if (d) eq[d.slot] = { uid: uid++, id: sid, rar: "com" }; }
  const g: Game = {
    cls, tiles, mons, projs: [], floats: [], fx: [], fields: [], ground: [], minion: null, st: { atk: 0, def: 0, arm: 0, magic: 0, hp: 0, mana: 0, speed: 0 },
    p: { name, x: TEMPLE_X, y: TEMPLE_Y, fx: TEMPLE_X, fy: TEMPLE_Y, moveStart: 0, moveDur: 1, face: 2, hp: cls.hpBase, mana: cls.manaBase, level: 1, exp: 0, gold: 50, hpPot: 3, manaPot: 3,
      eq, bag: [], nextAuto: 0, nextPotion: 0, cd: [0, 0, 0, 0], gcd: 0, hitAt: -9999,
      sk: { magic: { lvl: 0, tries: 0 }, melee: { lvl: 10, tries: 0 }, dist: { lvl: 10, tries: 0 }, shield: { lvl: 10, tries: 0 } },
      defUntil: 0, evadeUntil: 0, hotUntil: 0, hotNext: 0, hotMin: 0, hotMax: 0, critNext: false,
      hpPot2: 0, manaPot2: 0, slowUntil: 0, poisonUntil: 0, poisonNext: 0, poisonDmg: 0 },
    target: -1, log: [`¡Bienvenido a Edisar, ${name}! Sal de la ciudad y caza ratas para empezar.`, "Al norte de la villa, el Santuario guarda las 12 Casas del Zodiaco (pestaña «Misiones»)."],
    status: "Pulsa Espacio para atacar al monstruo más cercano.", statusAt: performance.now(), statusColor: "#ffffff",
    heldDirs: [], pending: null, walkGoal: null, nextRegen: 0, camX: 0, camY: 0, zone: "Villa Esmeralda (zona segura)", deaths: 0, kills: 0, nextUid: uid,
    shopOpen: false, shopMsg: "", bigMap: false, mini: null, afk: false, afkNext: 0, afkStart: 0, afkExp: 0, afkGold: 0, afkKills: 0, afkLoot: 0, chase: false,
    byRegion: [], nextMonId: id, cleared: 0, quests: HOUSES.map((): QuestSt => ({ e: false, k: 0, b: false, d: false })), bossKills: HOUSES.map(() => 0), warns: [], returnAt: 0, afkBoss: false, hudPad: 0, lootToast: null, exitPortal: null, carry: [],
  };
  indexMons(g);
  refreshStats(g); g.p.hp = maxHp(g); g.p.mana = maxMana(g); g.mini = buildMini(tiles);
  return g;
}
function setStatus(g: Game, text: string, now: number, color?: string): void { g.status = text; g.statusAt = now; g.statusColor = color ?? "#ffffff"; }
function addLog(g: Game, text: string): void { g.log.unshift(text); if (g.log.length > 7) g.log.length = 7; }
function addFloat(g: Game, x: number, y: number, text: string, color: string, now: number): void { g.floats.push({ x, y, text, color, born: now }); if (g.floats.length > 70) g.floats.shift(); }
function pfloat(g: Game, text: string, color: string, now: number, dy?: number): void { addFloat(g, g.p.x * TS + 16, g.p.y * TS + (dy ?? 4), text, color, now); }

// ===================== Lógica: habilidades =====================
function skillNeed(g: Game, k: SkillId): number {
  const s = g.p.sk[k]; const mul = g.cls.skMul[k];
  return Math.max(1, k === "magic" ? Math.round(60 * Math.pow(1.25, s.lvl) * mul) : Math.round(15 * Math.pow(1.12, s.lvl - 10) * mul));
}
function trainSkill(g: Game, k: SkillId, amt: number, now: number): void {
  if (!(amt > 0)) return;
  const s = g.p.sk[k]; s.tries += amt;
  let guard = 0;
  while (guard < 5 && s.tries >= skillNeed(g, k)) {
    s.tries -= skillNeed(g, k); s.lvl++; guard++;
    setStatus(g, `Avanzaste a ${SKILL_NAMES[k]} ${s.lvl}.`, now, "#7dffb0"); addLog(g, `¡${SKILL_NAMES[k]} sube a ${s.lvl}!`);
    pfloat(g, `${SKILL_NAMES[k]} ${s.lvl}`, "#7dffb0", now, -18);
  }
  s.tries = Math.min(s.tries, skillNeed(g, k) - 1);
}
function skillPct(g: Game, k: SkillId): number { return clamp(g.p.sk[k].tries / skillNeed(g, k), 0, 1); }
function powerMul(g: Game, school: School): number {
  const lv = 1 + (g.p.level - 1) * 0.03; const sk = g.p.sk;
  if (school === "magic") return lv * (1 + (sk.magic.lvl + g.st.magic) * 0.06);
  if (school === "melee") return lv * (1 + Math.max(0, sk.melee.lvl - 10) * 0.04);
  if (school === "dist") return lv * (1 + Math.max(0, sk.dist.lvl - 10) * 0.04);
  return lv;
}

// ===================== Lógica: combate =====================
function addExp(g: Game, amt: number, now: number): void {
  const p = g.p; p.exp += amt; if (g.afk) g.afkExp += amt;
  const nl = levelFor(p.exp);
  if (nl > p.level) {
    const old = p.level; p.level = nl; p.hp = maxHp(g); p.mana = maxMana(g);
    setStatus(g, `Subiste del nivel ${old} al nivel ${nl}.`, now, "#ffe066"); addLog(g, `¡Subiste al nivel ${nl}!`); pfloat(g, `¡NIVEL ${nl}!`, "#ffe066", now, -16);
  }
}
function rollItem(g: Game, def: MonDef): Inst | null {
  let pool = ITEMS.filter((d: ItemDef) => d.lvl <= def.lootLvl && d.id !== "gemini_gold");
  if (def.house) { const hi = pool.filter((d: ItemDef) => d.lvl >= def.lootLvl - 18); if (hi.length > 0 && Math.random() < 0.75) pool = hi; }
  if (Math.random() < 0.7) { const mine = pool.filter((d: ItemDef) => d.voc === null || d.voc.includes(g.cls.id)); if (mine.length > 0) pool = mine; }
  const d = pool[Math.floor(Math.random() * pool.length)]; if (!d) return null;
  const [pr, pe, ph] = def.rar; const r = Math.random();
  let rar: Rarity = r < ph ? "hea" : r < ph + pe ? "epi" : r < ph + pe + pr ? "rar" : "com";
  if ((def.id === "boss" || def.boss) && rar === "com") rar = "rar";
  return { uid: g.nextUid++, id: d.id, rar };
}
// Botín de jefes y premios: a la mochila; si está llena, a tus pies (no desaparece en 30 min ni lo borra el límite del suelo)
const BOSS_LOOT_MS = 1800000;
function giveItem(g: Game, inst: Inst, x: number, y: number, now: number): boolean {
  if (g.p.bag.length < bagMax(g)) { g.p.bag.push(inst); return true; }
  g.ground.push({ x, y, inst, until: now + BOSS_LOOT_MS, boss: true }); return false;
}
function pushToast(g: Game, title: string, lines: Array<[string, string]>, note: string, now: number): void {
  const t = g.lootToast;
  if (t && now - t.at < 15000) { t.lines = [...t.lines, ["— " + title, "#ffe066"] as [string, string], ...lines].slice(-12); if (note) t.note = note; t.at = now; }
  else g.lootToast = { title, lines: lines.slice(0, 12), note, at: now };
}
function bossLoot(g: Game, m: Mon, items: Inst[], now: number): void {
  const p = g.p; const same = regionOf(p.x, p.y) === regionOf(m.x, m.y); const fx = same ? p.x : m.x, fy = same ? p.y : m.y;
  const lines: Array<[string, string]> = []; let floor = 0;
  for (const inst of items) { const inBag = giveItem(g, inst, fx, fy, now); if (!inBag) floor++; lines.push([`${inBag ? "🎒" : "⬇"} ${itemName(inst)}`, RAR[inst.rar].c]); }
  if (items.some((i: Inst) => i.rar === "hea")) addFloat(g, m.x * TS + 16, m.y * TS - 34, "¡HEAVEN!", RAR.hea.c, now);
  addFloat(g, m.x * TS + 16, m.y * TS - 20, `🎁 ${items.length} objetos`, "#ffe066", now);
  addLog(g, `🎁 Botín de ${m.def.name}: ${items.map(itemName).join(", ")}${floor > 0 ? ` (${floor} a tus pies: mochila llena)` : " (en tu mochila)"}`);
  pushToast(g, `🎁 Botín de ${m.def.name}`, lines, floor > 0 ? "Mochila llena: lo marcado con ⬇ está a tus pies. Libera espacio y se recoge solo." : "Todo fue directo a tu mochila.", now);
}
// Botín de jefe que quedó en el suelo de una casa: viaja contigo al salir (portal, regreso o muerte)
function dropCarry(g: Game, x: number, y: number, now: number): void {
  if (g.carry.length === 0) return; const items = g.carry; g.carry = []; let floor = 0;
  for (const inst of items) if (!giveItem(g, inst, x, y, now)) floor++;
  addLog(g, `🎁 Trajiste el botín del guardián: ${items.map(itemName).join(", ")}${floor > 0 ? ` (${floor} a tus pies)` : " (en tu mochila)"}`);
  pushToast(g, "🎁 Botín del guardián (lo trajiste contigo)", items.map((i: Inst): [string, string] => [itemName(i), RAR[i.rar].c]), floor > 0 ? "Mochila llena: está a tus pies." : "", now);
}
function killMon(g: Game, m: Mon, now: number): void {
  const p = g.p; m.alive = false; m.hp = 0; m.deadAt = now; m.respawnAt = m.temp ? Infinity : now + m.def.respawn; g.kills++;
  const exp = Math.round(m.def.exp * EXP_RATE * expMul(g)); const gold = Math.floor(Math.random() * (m.def.gold + 1));
  p.gold += gold; if (g.afk) { g.afkGold += gold; g.afkKills++; }
  if (exp > 0) addFloat(g, m.x * TS + 16, m.y * TS - 8, `+${exp} exp`, "#ffffff", now);
  if (gold > 0) addFloat(g, m.x * TS + 16, m.y * TS + 6, `+${gold} oro`, "#ffd34d", now);
  if (exp > 0) addLog(g, `Mataste: ${m.def.name}. +${exp} exp${gold > 0 ? `, +${gold} oro` : ""}`); else addFloat(g, m.x * TS + 16, m.y * TS - 8, "¡Era una ilusión!", "#c8b0ff", now);
  const bigBoss = !!m.def.boss || m.def.id === "boss"; const got: Inst[] = [];
  if (bigBoss || Math.random() < m.def.drop) {
    for (let k = 0; k < m.def.dropN; k++) {
      const inst = rollItem(g, m.def); if (!inst) continue;
      if (bigBoss) { got.push(inst); continue; }
      g.ground.push({ x: m.x, y: m.y, inst, until: now + 120000 });
      const nm = itemName(inst);
      if (inst.rar === "hea") { setStatus(g, `¡¡HEAVEN!! ${m.def.name} soltó ${nm}`, now, RAR.hea.c); addLog(g, `✨ Botín HEAVEN: ${nm}`); addFloat(g, m.x * TS + 16, m.y * TS - 20, "¡HEAVEN!", RAR.hea.c, now); }
      else if (inst.rar === "epi") { setStatus(g, `¡Botín épico! ${nm}`, now, RAR.epi.c); addLog(g, `Botín épico: ${nm}`); }
      else addLog(g, `Botín en el suelo: ${nm}`);
    }
  }
  if (got.length > 0) bossLoot(g, m, got, now);
  if (bigBoss) { coinDrop(g, m, now); mountDrop(g, m, now); }
  if (g.target === m.id) g.target = -1;
  addExp(g, exp, now);
  if (m.def.house) houseKill(g, m, now);
}
// ===================== Las Casas: misiones y guardianes =====================
function questReward(n: number): { exp: number; gold: number; item: string } {
  const H = HOUSES[n - 1]; const R = H ? H.rec : 1;
  return { exp: Math.round((expFor(R + 3) - expFor(R)) * 0.5), gold: Math.round(150 * Math.pow(n, 1.5)), item: n === NH ? "Armadura Dorada de Géminis (Heaven)" : n >= 4 ? "objeto épico de tu vocación" : "objeto raro de tu vocación" };
}
function rewardItem(g: Game, maxLvl: number, rar: Rarity): Inst | null {
  const pool = ITEMS.filter((d: ItemDef) => d.id !== "gemini_gold" && d.lvl <= maxLvl && (d.voc === null || d.voc.includes(g.cls.id))).sort((a: ItemDef, b: ItemDef) => b.lvl - a.lvl);
  const top = pool.slice(0, 8); const d = top[Math.floor(Math.random() * top.length)]; if (!d) return null;
  return { uid: g.nextUid++, id: d.id, rar };
}
function checkQuest(g: Game, n: number, now: number): void {
  const H = HOUSES[n - 1], q = g.quests[n - 1]; if (!H || !q || q.d) return;
  if (!(q.e && q.k >= H.quest.n && q.b)) return;
  q.d = true; const rw = questReward(n);
  g.p.gold += rw.gold;
  const inst: Inst | null = n === NH ? { uid: g.nextUid++, id: "gemini_gold", rar: "hea" } : rewardItem(g, H.rec + 6, n >= 4 ? "epi" : "rar");
  if (inst) { const inBag = giveItem(g, inst, g.p.x, g.p.y, now); pushToast(g, `📜 Premio de misión: Casa de ${H.name}`, [[`${inBag ? "🎒" : "⬇"} ${itemName(inst)}`, RAR[inst.rar].c], [`+${rw.exp.toLocaleString("es-MX")} exp · +${rw.gold.toLocaleString("es-MX")} oro`, "#ffd34d"]], inBag ? "" : "Mochila llena: el premio está a tus pies.", now); }
  setStatus(g, `📜 ¡Misión de la Casa de ${H.name} completada! +${rw.exp} exp, +${rw.gold} oro${inst ? `, ${itemName(inst)}` : ""}`, now, n === NH ? RAR.hea.c : "#7dffb0");
  addLog(g, `📜 Misión completada: Casa de ${H.name}. Premio: ${rw.exp} exp, ${rw.gold} oro${inst ? `, ${itemName(inst)}` : ""}.`);
  addExp(g, rw.exp, now);
}
function clearHouse(g: Game, n: number, now: number): void {
  const H = HOUSES[n - 1], q = g.quests[n - 1]; if (!H || !q) return;
  q.b = true; g.bossKills[n - 1] = (g.bossKills[n - 1] ?? 0) + 1; const first = g.cleared < n; if (first) g.cleared = n; if (first) coinGain(g, COIN_HOUSE, `Casa de ${H.name} superada`, now);
  const nx = HOUSES[n];
  setStatus(g, `🏆 ¡${H.boss} ha caído!${first ? (nx ? ` Se abrió la Casa de ${nx.name}.` : " ¡Superaste las 12 Casas!") : ""}`, now, "#ffe066");
  addLog(g, `🏆 Venciste a ${H.boss}.${first && nx ? ` Ahora puedes entrar a la Casa de ${nx.name} (nivel ${nx.rec}).` : ""}`);
  addFloat(g, g.p.x * TS + 16, g.p.y * TS - 26, "¡VICTORIA!", "#ffe066", now);
  checkQuest(g, n, now);
  g.returnAt = now + RETURN_MS; openExitPortal(g, n);
  addLog(g, `Regresarás al templo en ${RETURN_MS / 1000} s. Pisa el portal ✦ junto a ti para salir cuando quieras.`);
}
const RETURN_MS = 20000;
// Portal de salida temporal junto al jugador tras vencer al guardián
function openExitPortal(g: Game, n: number): void {
  const p = g.p; if (regionOf(p.x, p.y) !== n) return; closeExitPortal(g);
  for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = p.x + dx, y = p.y + dy; if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || regionOf(x, y) !== n || tileAt(g, x, y) !== MARBLE) continue;
    if (monAt(g, x, y) || g.ground.some((gi: Ground) => gi.x === x && gi.y === y)) continue;
    g.exitPortal = [x, y, MARBLE]; g.tiles[y * MW + x] = PORTAL; return;
  }
}
function closeExitPortal(g: Game): void { const e = g.exitPortal; if (!e) return; g.tiles[e[1] * MW + e[0]] = e[2]; g.exitPortal = null; }
function houseKill(g: Game, m: Mon, now: number): void {
  const n = m.def.house ?? 0; const H = HOUSES[n - 1], q = g.quests[n - 1]; if (!H || !q) return;
  const bd = m.def.boss;
  if (!bd) {
    if (m.def.exp > 0 && !q.d && q.k < H.quest.n) {
      if (H.quest.kind === "kill") q.k++;
      else if (Math.random() < 0.3) { q.k++; addLog(g, `Encontraste: ${H.quest.item} (${q.k}/${H.quest.n}).`); addFloat(g, m.x * TS + 16, m.y * TS - 20, `${H.quest.item} ${q.k}/${H.quest.n}`, "#ffe9a8", now); }
      checkQuest(g, n, now);
    }
    return;
  }
  for (const o of g.byRegion[n] ?? []) if (o.temp && o.alive && o !== m) { o.alive = false; o.respawnAt = Infinity; }
  if (bd.phase2) {
    const k = spawnTemp(g, MONS[bd.phase2], m.x, m.y, now);
    if (k) { k.angryUntil = now + 60000; setStatus(g, `¡${k.def.name} aparece! El verdadero gemelo quiere venganza.`, now, "#ff6ad0"); addLog(g, `⚠ Segunda fase: ${k.def.name}.`); addFloat(g, k.x * TS + 16, k.y * TS - 24, "¡FASE 2!", "#ff6ad0", now); return; }
  }
  clearHouse(g, n, now);
}
function damageMon(g: Game, m: Mon, dmg: number, now: number, elem: Elem, crit?: boolean): void {
  if (!m.alive || !(dmg > 0)) return;
  m.hp -= dmg; m.angryUntil = now + 15000;
  addFloat(g, m.x * TS + 16, m.y * TS + 4, crit ? `${dmg}!` : String(dmg), crit ? "#ffe066" : ELEM_COLOR[elem], now);
  if (m.hp <= 0) killMon(g, m, now);
}
function hitMon(g: Game, m: Mon, dmg: number, elem: Elem, now: number, leech: number): void {
  if (!m.alive) return;
  const p = g.p; let crit = false;
  if (p.critNext) { crit = true; p.critNext = false; } else crit = Math.random() < g.cls.crit;
  const d = Math.max(1, Math.round(crit ? dmg * 1.8 : dmg));
  damageMon(g, m, d, now, elem, crit);
  if (leech > 0) { const h = Math.round(d * leech); p.hp = Math.min(maxHp(g), p.hp + h); pfloat(g, `+${h}`, "#5cff7a", now); }
}
function die(g: Game, now: number): void {
  const p = g.p; const loss = Math.floor(p.exp * 0.1); const reg = regionOf(p.x, p.y);
  p.exp = Math.max(0, p.exp - loss); p.level = levelFor(p.exp); p.hp = maxHp(g); p.mana = maxMana(g);
  resetRegion(g, reg); p.slowUntil = 0; p.poisonUntil = 0; g.returnAt = 0;
  p.x = TEMPLE_X; p.y = TEMPLE_Y; p.fx = TEMPLE_X; p.fy = TEMPLE_Y; p.moveStart = 0; p.face = 2;
  g.target = -1; g.projs = []; g.heldDirs = []; g.pending = null; g.walkGoal = null; g.minion = null; g.deaths++; g.zone = "Villa Esmeralda (zona segura)"; g.chase = false; g.warns = [];
  if (g.afk) { g.afk = false; addLog(g, "El modo AFK se apagó al morir."); }
  setStatus(g, `¡Has muerto! Perdiste ${loss} de experiencia. Despiertas en el templo.`, now, "#ff8080"); addLog(g, `Moriste y perdiste ${loss} exp.`);
  dropCarry(g, TEMPLE_X, TEMPLE_Y, now);
}
function hurtPlayer(g: Game, dmg: number, now: number): void {
  const p = g.p;
  if (!(dmg > 0)) { pfloat(g, "fallo", "#9fb4c8", now); return; }
  p.hp -= dmg; p.hitAt = now; pfloat(g, String(dmg), "#ff4040", now);
  if (p.hp <= 0) die(g, now);
}
function monsterAttack(g: Game, m: Mon, now: number): void {
  const p = g.p; const raw = roll(0, Math.round(m.def.atk * (m.enraged ? 1.2 : 1))); const sh = hasShield(g);
  if (sh) trainSkill(g, "shield", 1, now);
  const ev = g.cls.evade + (now < p.evadeUntil ? 0.4 : 0);
  if (ev > 0 && Math.random() < ev) { pfloat(g, "esquiva", "#c8d0ff", now); return; }
  if (sh && Math.random() < clamp((g.st.def + p.sk.shield.lvl * 1.2) / 160, 0, 0.45)) { pfloat(g, "bloqueo", "#9fd0ff", now); return; }
  let dmg = raw - roll(Math.floor(g.st.arm / 2), g.st.arm);
  if (now < p.defUntil) dmg = Math.floor(dmg * 0.5);
  hurtPlayer(g, dmg, now);
}
// Golpe especial de un guardián: la armadura protege la mitad y no se puede bloquear con escudo
function specialHit(g: Game, raw: number, now: number): void {
  const p = g.p; const ev = (g.cls.evade + (now < p.evadeUntil ? 0.4 : 0)) * 0.5;
  if (ev > 0 && Math.random() < ev) { pfloat(g, "esquiva", "#c8d0ff", now); return; }
  let dmg = Math.round(raw) - roll(Math.floor(g.st.arm / 4), Math.floor(g.st.arm / 2));
  if (now < p.defUntil) dmg = Math.floor(dmg * 0.5);
  hurtPlayer(g, dmg, now);
}
function fire(g: Game, t: Mon, dmg: number, elem: Elem, now: number, leech: number, slow: number): void {
  const [sx, sy] = drawPos(g.p, now); const d = cheb(g.p.x, g.p.y, t.x, t.y);
  g.projs.push({ sx, sy, ex: t.x, ey: t.y, born: now, dur: 90 + d * 55, elem, dmg, target: t.id, leech, slow });
  g.p.face = dirFrom(t.x - g.p.x, t.y - g.p.y);
}
function targetNearest(g: Game, now: number): void {
  const p = g.p;
  const vis = regionMons(g, p.x, p.y).filter((m: Mon) => m.alive && Math.abs(m.x - p.x) <= 7 && Math.abs(m.y - p.y) <= 5)
    .sort((a: Mon, b: Mon) => (cheb(p.x, p.y, a.x, a.y) - cheb(p.x, p.y, b.x, b.y)) || (a.id - b.id));
  if (vis.length === 0) { setStatus(g, "No hay monstruos a la vista.", now); return; }
  const idx = vis.findIndex((m: Mon) => m.id === g.target);
  const nm = idx < 0 ? vis[0] : vis[(idx + 1) % vis.length];
  if (nm) g.target = nm.id;
}
type PotKind = "hp" | "mana" | "hp2" | "mana2";
const POT_KINDS: PotKind[] = ["hp", "mana", "hp2", "mana2"];
const POT: Record<PotKind, { n: string; price: number; min: number; max: number; hp: boolean; icon: string }> = {
  hp: { n: "Poción de vida", price: HP_POT_PRICE, min: 125, max: 175, hp: true, icon: "❤️" },
  mana: { n: "Poción de maná", price: MANA_POT_PRICE, min: 75, max: 125, hp: false, icon: "💧" },
  hp2: { n: "Poción de vida fuerte", price: 140, min: 300, max: 450, hp: true, icon: "💖" },
  mana2: { n: "Gran poción de maná", price: 120, min: 180, max: 260, hp: false, icon: "🔷" },
};
function potCount(p: Player, k: PotKind): number { return k === "hp" ? p.hpPot : k === "mana" ? p.manaPot : k === "hp2" ? p.hpPot2 : p.manaPot2; }
function addPot(p: Player, k: PotKind, n: number): void { if (k === "hp") p.hpPot += n; else if (k === "mana") p.manaPot += n; else if (k === "hp2") p.hpPot2 += n; else p.manaPot2 += n; }
function hpPots(p: Player): number { return p.hpPot + p.hpPot2; }
function manaPots(p: Player): number { return p.manaPot + p.manaPot2; }
// Usa la poción fuerte si te falta mucho (o si ya no tienes normales)
function usePotion(g: Game, kind: "hp" | "mana", now: number): boolean {
  const p = g.p;
  if (now < p.nextPotion) { setStatus(g, "Estás agotado.", now); return false; }
  const strong: PotKind = kind === "hp" ? "hp2" : "mana2";
  const missing = kind === "hp" ? maxHp(g) - p.hp : maxMana(g) - p.mana;
  const k: PotKind = potCount(p, strong) > 0 && (potCount(p, kind) <= 0 || missing >= (kind === "hp" ? 300 : 200)) ? strong : kind;
  if (potCount(p, k) <= 0) { setStatus(g, `No te quedan pociones de ${kind === "hp" ? "vida" : "maná"}.`, now); return false; }
  addPot(p, k, -1); const a = roll(POT[k].min, POT[k].max);
  if (POT[k].hp) { p.hp = Math.min(maxHp(g), p.hp + a); pfloat(g, `+${a}`, "#5cff7a", now); }
  else { p.mana = Math.min(maxMana(g), p.mana + a); pfloat(g, `+${a}`, "#6fa8ff", now); }
  p.nextPotion = now + 1000; pfloat(g, "Aaah...", "#ffe066", now, -10);
  return true;
}

// ===================== Lógica: inventario y tienda =====================
function equipItem(g: Game, idx: number, now: number): void {
  const p = g.p; const i = p.bag[idx]; if (!i) return; const d = ITEM[i.id]; if (!d) return;
  if (d.voc && !d.voc.includes(g.cls.id)) { setStatus(g, `Tu vocación no puede usar ${d.name}.`, now); return; }
  if (p.level < d.lvl) { setStatus(g, `Necesitas nivel ${d.lvl} para usar ${d.name}.`, now); return; }
  p.bag.splice(idx, 1); const old = p.eq[d.slot]; if (old) p.bag.push(old);
  p.eq[d.slot] = i; refreshStats(g); setStatus(g, `Equipaste ${itemName(i)}.`, now, RAR[i.rar].c);
}
function unequip(g: Game, slot: Slot, now: number): void {
  const p = g.p; const i = p.eq[slot]; if (!i) return;
  if (p.bag.length >= bagMax(g)) { setStatus(g, "Tu mochila está llena.", now); return; }
  p.bag.push(i); p.eq[slot] = null; refreshStats(g); setStatus(g, `Te quitaste ${itemName(i)}.`, now);
}
// Tirar objetos al suelo y arrastrar (mochila ↔ equipo ↔ suelo)
const DROP_RANGE = 3, DROP_LOCK_MS = 10000, DROP_KEEP_MS = 600000;
type DragSrc = { kind: "bag"; uid: number } | { kind: "eq"; slot: Slot; uid: number } | { kind: "floor"; gi: Ground };
type DropDst = { kind: "bag"; k: number } | { kind: "eq"; slot: Slot } | { kind: "tile"; x: number; y: number } | { kind: "feet" };
function dropTileOk(g: Game, x: number, y: number): boolean {
  const p = g.p; const t = tileAt(g, x, y);
  return walkable(t) && t !== PORTAL && cheb(x, y, p.x, p.y) <= DROP_RANGE && regionOf(x, y) === regionOf(p.x, p.y) && !(x === NPC_X && (y === NPC_Y || y === NPC_Y - 1)) && !(x === DARIO_X && (y === DARIO_Y || y === DARIO_Y - 1)) && !(x === DEPOT_X && y === DEPOT_Y) && !(x === STABLE_X && (y === STABLE_Y || y === STABLE_Y - 1));
}
// Tira un objeto de la mochila (número = índice) o del equipo (ranura). Si la casilla no sirve o está lejos, cae a tus pies.
function dropItem(g: Game, from: number | Slot, x: number | null, y: number | null, now: number): boolean {
  const p = g.p; let inst: Inst | null = null;
  if (typeof from === "number") { inst = p.bag[from] ?? null; if (!inst) return false; p.bag.splice(from, 1); }
  else { inst = p.eq[from]; if (!inst) return false; p.eq[from] = null; refreshStats(g); }
  let tx = p.x, ty = p.y; const asked = x !== null && y !== null; let far = false;
  if (x !== null && y !== null) { if (dropTileOk(g, x, y)) { tx = x; ty = y; } else far = !(x === p.x && y === p.y); }
  g.ground.push({ x: tx, y: ty, inst, until: now + DROP_KEEP_MS, mine: now + DROP_LOCK_MS });
  const feet = tx === p.x && ty === p.y;
  addLog(g, `⬇ Tiraste ${itemName(inst)}${feet ? " a tus pies" : " al suelo"}.`);
  setStatus(g, `Tiraste ${itemName(inst)}${feet ? " a tus pies" : " al suelo"}.${asked && far ? " (Muy lejos o no se puede: quedó a tus pies.)" : ""}`, now, RAR[inst.rar].c);
  return true;
}
function reorderBag(g: Game, from: number, to: number): boolean {
  const b = g.p.bag; const it = b[from]; if (!it) return false;
  const k = clamp(to, 0, b.length - 1); if (k === from) return false;
  b.splice(from, 1); b.splice(k, 0, it); return true;
}
// Recoger a mano (arrastrando del suelo a la mochila): sin espera, pero a 3 casillas como máximo
function pickUpHand(g: Game, gi: Ground, now: number): boolean {
  const p = g.p;
  if (!g.ground.includes(gi)) return false;
  if (cheb(gi.x, gi.y, p.x, p.y) > DROP_RANGE || regionOf(gi.x, gi.y) !== regionOf(p.x, p.y)) { setStatus(g, "Está demasiado lejos para recogerlo.", now); return false; }
  if (p.bag.length >= bagMax(g)) { setStatus(g, "Tu mochila está llena.", now); return false; }
  p.bag.push(gi.inst); g.ground = g.ground.filter((o: Ground) => o !== gi);
  setStatus(g, `Recogiste: ${itemName(gi.inst)}.`, now, RAR[gi.inst.rar].c); return true;
}
function floorAt(g: Game, x: number, y: number): Ground | null {
  let r: Ground | null = null; for (const gi of g.ground) if (gi.x === x && gi.y === y) r = gi; return r;
}
// Aplica el resultado de soltar un objeto arrastrado; devuelve false si no pasó nada (cancelado)
function applyDrop(g: Game, src: DragSrc, dst: DropDst | null, now: number): boolean {
  const p = g.p; if (!dst) return false;
  if (src.kind === "floor") {
    if (dst.kind !== "bag") return false;
    if (!pickUpHand(g, src.gi, now)) return false;
    if (dst.k < p.bag.length - 1) reorderBag(g, p.bag.length - 1, dst.k);
    return true;
  }
  if (src.kind === "bag") {
    const idx = p.bag.findIndex((i: Inst) => i.uid === src.uid); if (idx < 0) return false;
    if (dst.kind === "bag") return dst.k < bagMax(g) && reorderBag(g, idx, dst.k);
    if (dst.kind === "eq") {
      const it = p.bag[idx]; const d = it ? ITEM[it.id] : undefined; if (!it || !d) return false;
      if (d.slot !== dst.slot) { setStatus(g, `${d.name} no va en esa ranura.`, now); return false; }
      equipItem(g, idx, now); return p.eq[dst.slot]?.uid === src.uid;
    }
    return dropItem(g, idx, dst.kind === "tile" ? dst.x : null, dst.kind === "tile" ? dst.y : null, now);
  }
  const cur = p.eq[src.slot]; if (!cur || cur.uid !== src.uid) return false;
  if (dst.kind === "eq") return false;
  if (dst.kind === "bag") { unequip(g, src.slot, now); const k = p.bag.findIndex((i: Inst) => i.uid === src.uid); if (k < 0) return false; if (dst.k < k) reorderBag(g, k, dst.k); return true; }
  return dropItem(g, src.slot, dst.kind === "tile" ? dst.x : null, dst.kind === "tile" ? dst.y : null, now);
}
// Lo que tiraste no se recoge solo: ni el AFK (nunca), ni quedándote parado encima; al pisarlo de nuevo tú, sólo pasados 10 s
function autoPick(g: Game, gi: Ground, now: number, stand: boolean): boolean { return gi.mine === undefined ? afkWants(g, gi.inst) : (!stand && !g.afk && now >= gi.mine); }
function buyItem(g: Game, id: string): void {
  const d = ITEM[id]; if (!d) return;
  if (g.p.gold < d.price) { g.shopMsg = "No tienes suficiente oro."; return; }
  if (g.p.bag.length >= bagMax(g)) { g.shopMsg = "Tu mochila está llena."; return; }
  g.p.gold -= d.price; g.p.bag.push({ uid: g.nextUid++, id, rar: "com" });
  g.shopMsg = `Compraste ${d.name} por ${d.price} oro.`; addLog(g, g.shopMsg);
}
function buyPotion(g: Game, kind: PotKind, n: number): void {
  const price = POT[kind].price * n;
  if (g.p.gold < price) { g.shopMsg = "No tienes suficiente oro."; return; }
  g.p.gold -= price; addPot(g.p, kind, n);
  g.shopMsg = `Compraste ${n} × ${POT[kind].n} por ${price} oro.`;
}
function sellItem(g: Game, idx: number): void {
  const i = g.p.bag[idx]; if (!i) return; const v = sellValue(i);
  g.p.bag.splice(idx, 1); g.p.gold += v; g.shopMsg = `Vendiste ${itemName(i)} por ${v} oro.`; addLog(g, g.shopMsg);
}
function requestShop(g: Game, now: number): void {
  const p = g.p; const d = cheb(p.x, p.y, NPC_X, NPC_Y);
  if (d <= 4) { g.shopOpen = true; g.shopMsg = ""; g.walkGoal = null; return; }
  if (isSafe(p.x, p.y) || d <= 12) { g.walkGoal = { x: NPC_X, y: NPC_Y, open: true }; cs(g).exWalk = false; g.chase = false; setStatus(g, `Caminando hacia ${NPC_NAME}...`, now); return; }
  setStatus(g, `La tienda está en Villa Esmeralda, con ${NPC_NAME}.`, now);
}
function pickUp(g: Game, x: number, y: number, now: number, stand?: boolean): void {
  const here = g.ground.filter((gi: Ground) => gi.x === x && gi.y === y && autoPick(g, gi, now, !!stand));
  for (const gi of here) {
    if (g.p.bag.length >= bagMax(g)) { setStatus(g, "Tu mochila está llena.", now); break; }
    g.p.bag.push(gi.inst); g.ground = g.ground.filter((o: Ground) => o !== gi); if (g.afk) g.afkLoot++;
    setStatus(g, `Recogiste: ${itemName(gi.inst)}.`, now, RAR[gi.inst.rar].c);
  }
}
function afterMove(g: Game, now: number): void {
  const p = g.p;
  if (tileAt(g, p.x, p.y) === PORTAL) { usePortal(g, now); return; }
  const z = zoneName(g, p.x, p.y);
  if (z !== g.zone) { g.zone = z; setStatus(g, `Entraste a: ${z}`, now); }
  pickUp(g, p.x, p.y, now);
}
function houseOpen(g: Game, n: number): boolean { return n <= g.cleared + 1; }
function usePortal(g: Game, now: number): void {
  const p = g.p; const r = regionOf(p.x, p.y);
  if (r > 0) {
    const d = DOORS[r - 1], H = HOUSES[r - 1]; if (!d || !H) return;
    // Salir siempre al templo de la villa (antes caía justo bajo la puerta y, con la tecla aún pulsada, volvía a entrar)
    resetRegion(g, r); g.returnAt = 0; g.heldDirs = []; teleport(g, TEMPLE_X, TEMPLE_Y, now); setStatus(g, `Saliste de la Casa de ${H.name}: estás en el templo de Villa Esmeralda.`, now, "#7dffb0"); return;
  }
  const i = DOORS.findIndex((d: Door) => d.x === p.x && d.y === p.y); const H = HOUSES[i], rt = HRT[i], dr = DOORS[i];
  if (!H || !rt || !dr) return;
  if (!houseOpen(g, H.n)) {
    const back = p.fx === p.x && p.fy === p.y ? [dr.ox, dr.oy] : [p.fx, p.fy];
    p.x = back[0] ?? dr.ox; p.y = back[1] ?? dr.oy; p.fx = p.x; p.fy = p.y; p.moveStart = 0; g.walkGoal = null;
    const prev = HOUSES[H.n - 2];
    setStatus(g, `🔒 La Casa de ${H.name} está sellada: primero vence a ${prev ? prev.boss : "al guardián anterior"}.`, now, "#ff9a5a"); return;
  }
  const q = g.quests[i]; if (q && !q.e) { q.e = true; addLog(g, `📜 Misión: entraste a la Casa de ${H.name}.`); }
  teleport(g, rt.entry[0], rt.entry[1], now);
  setStatus(g, `${H.glyph} Casa de ${H.name} — nivel recomendado ${H.rec}${p.level < H.rec ? " (¡cuidado, eres de nivel menor!)" : ""}`, now, p.level < H.rec ? "#ff9a5a" : "#ffe066");
  addLog(g, `Entraste a la Casa de ${H.name}. El portal de la entrada te devuelve al templo de Villa Esmeralda.`);
  checkQuest(g, H.n, now);
}

// ===================== Lógica: poderes =====================
function sgn(v: number): number { return v > 0 ? 1 : v < 0 ? -1 : 0; }
function physMul(g: Game, m: Mon, elem: Elem): number {
  if (!m.def.armored) return 1; if (weaponInfo(g).wt === "club") return 1.3; return elem === "phys" || elem === "arrow" || elem === "star" ? 0.85 : 1;
}
function curTarget(g: Game): Mon | null { const t = findMon(g, g.target); return t && t.alive ? t : null; }
function inReach(g: Game, t: Mon, range: number): boolean { const d = cheb(g.p.x, g.p.y, t.x, t.y); return d <= range && (d <= 1 || los(g, g.p.x, g.p.y, t.x, t.y)); }
function circle(cx: number, cy: number, r2: number): Array<[number, number]> {
  const out: Array<[number, number]> = []; const r = Math.ceil(Math.sqrt(r2));
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r2) out.push([cx + dx, cy + dy]);
  return out;
}
function hitCells(g: Game, cells: Array<[number, number]>, min: number, max: number, elem: Elem, now: number, melee: boolean): void {
  g.fx.push({ cells, elem, born: now }); if (g.fx.length > 30) g.fx.shift();
  const set = new Set<number>(cells.map((c: [number, number]) => c[1] * MW + c[0]));
  for (const m of g.mons) if (m.alive && set.has(m.y * MW + m.x)) hitMon(g, m, roll(min, max) * (melee ? physMul(g, m, elem) : 1), elem, now, 0);
}
function castPower(g: Game, i: number, now: number): boolean {
  const p = g.p; const pw = g.cls.powers[i]; if (!pw) return false;
  if (now < (p.cd[i] ?? 0)) { setStatus(g, `${pw.name}: en enfriamiento (${Math.ceil(((p.cd[i] ?? 0) - now) / 1000)} s).`, now); return false; }
  if (now < p.gcd) return false;
  if (p.mana < pw.mana) { setStatus(g, `No tienes suficiente maná para ${pw.name}.`, now); return false; }
  const mul = powerMul(g, pw.school); const wAtk = pw.school === "melee" || pw.school === "dist" ? weaponInfo(g).atk * 0.5 : 0;
  const lo = Math.round(pw.min * mul + wAtk), hi = Math.round(pw.max * mul + wAtk);
  const t = curTarget(g); const offensive = pw.kind === "strike" || pw.kind === "drain" || pw.kind === "slow" || pw.kind === "dot" || pw.kind === "blink";
  if (offensive && (!t || !inReach(g, t, pw.range))) { setStatus(g, t ? "El objetivo está fuera de alcance." : "Necesitas un objetivo (Espacio).", now); return false; }
  if (offensive && isSafe(p.x, p.y)) { setStatus(g, "No puedes atacar en la zona segura.", now); return false; }
  switch (pw.kind) {
    case "strike": case "drain": case "slow": {
      if (!t) return false;
      for (let h = 0; h < pw.hits; h++) {
        const dmg = roll(lo, hi) * (pw.school === "magic" ? 1 : physMul(g, t, pw.elem));
        if (pw.range <= 1) { hitMon(g, t, dmg, pw.elem, now, pw.leech); g.fx.push({ cells: [[t.x, t.y]], elem: pw.elem, born: now }); }
        else fire(g, t, Math.round(dmg), pw.elem, now + h * 120, pw.leech, pw.kind === "slow" ? pw.dur : 0);
      }
      if (pw.school === "melee") trainSkill(g, "melee", 2, now); if (pw.school === "dist") trainSkill(g, "dist", 2, now);
      break;
    }
    case "area": {
      const c: [number, number] = t && inReach(g, t, pw.range) ? [t.x, t.y] : [p.x, p.y];
      const self = c[0] === p.x && c[1] === p.y; // Avalancha (aoe): 5×5 sobre el objetivo / radio 3 a tu alrededor
      hitCells(g, circle(c[0], c[1], self ? (pw.aoe > 0 ? 10 : 5) : (pw.aoe > 0 ? 8 : 2)), lo, hi, pw.elem, now, pw.school !== "magic");
      if (pw.school === "dist") trainSkill(g, "dist", 2, now); break;
    }
    case "wave": {
      if (t) p.face = dirFrom(t.x - p.x, t.y - p.y);
      const dx = dxOf(p.face), dy = dyOf(p.face); const cells: Array<[number, number]> = [];
      for (let k = 1; k <= 4; k++) { const w = k === 1 ? 0 : 1; for (let j = -w; j <= w; j++) cells.push([p.x + dx * k + dy * j, p.y + dy * k + dx * j]); }
      hitCells(g, cells, lo, hi, pw.elem, now, false); break;
    }
    case "spin": hitCells(g, circle(p.x, p.y, 2).filter((c: [number, number]) => c[0] !== p.x || c[1] !== p.y), lo, hi, pw.elem, now, true); trainSkill(g, "melee", 2, now); break;
    case "field": {
      const c: [number, number] = t && inReach(g, t, pw.range) ? [t.x, t.y] : [p.x + dxOf(p.face) * 2, p.y + dyOf(p.face) * 2];
      for (const [x, y] of circle(c[0], c[1], 2)) {
        if (!walkable(tileAt(g, x, y)) || isSafe(x, y)) continue;
        g.fields = g.fields.filter((f: Field) => f.x !== x || f.y !== y);
        g.fields.push({ x, y, until: now + pw.dur, next: now, min: lo, max: hi, elem: pw.elem });
      }
      if (g.fields.length > 60) g.fields.splice(0, g.fields.length - 60); break;
    }
    case "heal": { const a = roll(lo, hi); p.hp = Math.min(maxHp(g), p.hp + a); pfloat(g, `+${a}`, "#5cff7a", now); g.fx.push({ cells: [[p.x, p.y]], elem: "holy", born: now }); break; }
    case "hot": p.hotUntil = now + pw.dur; p.hotNext = now + 1000; p.hotMin = lo; p.hotMax = hi; setStatus(g, "Regeneración activa.", now, "#5cff7a"); break;
    case "dot": if (!t) return false; t.dotUntil = now + pw.dur; t.dotNext = now + 1000; t.dotMin = lo; t.dotMax = hi; t.angryUntil = now + 15000; g.fx.push({ cells: [[t.x, t.y]], elem: pw.elem, born: now }); break;
    case "summon": {
      let spot: [number, number] | null = null;
      for (const [dx, dy] of DIRS8) { const x = p.x + dx, y = p.y + dy; if (canPlayerEnter(g, x, y) && !isSafe(x, y)) { spot = [x, y]; break; } }
      if (!spot) { setStatus(g, "No hay espacio para invocar.", now); return false; }
      g.minion = { x: spot[0], y: spot[1], fx: spot[0], fy: spot[1], moveStart: 0, moveDur: 1, face: 2, until: now + pw.dur, nextAtk: now + 800, min: lo, max: hi };
      setStatus(g, "¡Un esbirro sombrío te sirve!", now, "#b070ff"); break;
    }
    case "buff": p.defUntil = now + pw.dur; setStatus(g, "Postura defensiva: daño recibido -50 %.", now, "#9fd0ff"); break;
    case "dash": {
      let dx = -dxOf(p.face), dy = -dyOf(p.face); if (t) { dx = sgn(p.x - t.x); dy = sgn(p.y - t.y); if (dx === 0 && dy === 0) dx = 1; }
      let nx = p.x, ny = p.y; for (let k = 0; k < 3; k++) { if (!canPlayerEnter(g, nx + dx, ny + dy)) break; nx += dx; ny += dy; }
      if (nx === p.x && ny === p.y) { setStatus(g, "No hay espacio para saltar.", now); return false; }
      p.fx = p.x; p.fy = p.y; p.x = nx; p.y = ny; p.moveStart = now; p.moveDur = 160; afterMove(g, now); break;
    }
    case "blink": {
      if (!t) return false; let best: [number, number] | null = null; let bd = -1;
      const pref: [number, number] = [t.x + sgn(t.x - p.x), t.y + sgn(t.y - p.y)];
      if (canPlayerEnter(g, pref[0], pref[1]) && !isSafe(pref[0], pref[1])) best = pref;
      else for (const [dx, dy] of DIRS8) { const x = t.x + dx, y = t.y + dy; const d = cheb(x, y, p.x, p.y); if (canPlayerEnter(g, x, y) && !isSafe(x, y) && d > bd) { bd = d; best = [x, y]; } }
      if (!best) { setStatus(g, "No hay hueco detrás del objetivo.", now); return false; }
      g.fx.push({ cells: [[p.x, p.y]], elem: "dark", born: now });
      p.x = best[0]; p.y = best[1]; p.fx = p.x; p.fy = p.y; p.moveStart = 0; p.face = dirFrom(t.x - p.x, t.y - p.y); p.critNext = true;
      setStatus(g, "Paso sombrío: tu próximo golpe será crítico.", now, "#b070ff"); afterMove(g, now); break;
    }
    case "smoke": {
      for (const m of g.mons) if (m.alive && cheb(m.x, m.y, p.x, p.y) <= 7) { m.calmUntil = now + pw.dur; m.angryUntil = 0; }
      p.evadeUntil = now + pw.dur; g.target = -1; g.fx.push({ cells: circle(p.x, p.y, 5), elem: "star", born: now });
      setStatus(g, "¡Bomba de humo! Los monstruos te pierden de vista.", now, "#d0d6de"); break;
    }
  }
  p.mana -= pw.mana; p.cd[i] = now + pw.cd; p.gcd = now + 900;
  trainSkill(g, "magic", pw.mana, now);
  addFloat(g, p.x * TS + 16, p.y * TS - 12, pw.words, "#ffe9a8", now);
  return true;
}
function autoAttack(g: Game, now: number): void {
  const p = g.p; const t = curTarget(g); if (!t || now < p.nextAuto || isSafe(p.x, p.y)) return;
  const w = weaponInfo(g); if (!inReach(g, t, w.range)) return;
  if (w.mana > 0 && p.mana < w.mana) return;
  const base = roll(Math.ceil(w.atk * 0.4), Math.max(1, w.atk)) * powerMul(g, w.school);
  p.nextAuto = now + w.interval; p.face = dirFrom(t.x - p.x, t.y - p.y);
  if (w.school === "magic") { p.mana -= w.mana; trainSkill(g, "magic", w.mana, now); fire(g, t, Math.round(base), w.elem, now, 0, 0); return; }
  const dmg = Math.round(base * physMul(g, t, w.elem));
  if (w.range > 1) { trainSkill(g, "dist", 1, now); fire(g, t, dmg, w.elem, now, 0, 0); }
  else { trainSkill(g, "melee", 1, now); hitMon(g, t, dmg, w.elem, now, 0); }
}

// ===================== Lógica: movimiento =====================
function tryStep(g: Game, dx: number, dy: number, now: number): boolean {
  const p = g.p; if (dx === 0 && dy === 0) return false;
  p.face = dirFrom(dx, dy);
  const nx = p.x + dx, ny = p.y + dy;
  if (!canPlayerEnter(g, nx, ny)) return false;
  p.fx = p.x; p.fy = p.y; p.x = nx; p.y = ny; p.moveStart = now; p.moveDur = (stepTime(g) / mountMul(g)) * (dx !== 0 && dy !== 0 ? DIAG_MUL : 1) * (now < p.slowUntil ? 1.8 : 1);
  afterMove(g, now); return true;
}
function walkStep(g: Game, now: number): void {
  const wg = g.walkGoal; if (!wg) return; const p = g.p;
  const goal = (x: number, y: number): boolean => wg.open ? cheb(x, y, wg.x, wg.y) <= (wg.x === DEPOT_X && wg.y === DEPOT_Y ? 1 : 2) : x === wg.x && y === wg.y;
  if (goal(p.x, p.y)) { g.walkGoal = null; if (wg.open) { const c = cs(g); if (wg.x === DEPOT_X && wg.y === DEPOT_Y) { if (depotNear(g)) { dep(g).open = true; dep(g).msg = ""; } } else if (wg.x === STABLE_X && wg.y === STABLE_Y) { mt(g).open = true; mt(g).msg = ""; if (g.dep) g.dep.open = false; } else if (c.exWalk) { c.exWalk = false; c.exOpen = true; c.msg = ""; } else { g.shopOpen = true; g.shopMsg = ""; } } return; }
  const st = bfsStep(g, p.x, p.y, goal, 20000);
  if (!st || !tryStep(g, st[0], st[1], now)) { g.walkGoal = null; setStatus(g, "No hay camino hasta allí.", now); }
}
function clickTile(g: Game, x: number, y: number, now: number): void {
  if (Math.abs(x - NPC_X) <= 0 && Math.abs(y - NPC_Y) <= 0) { requestShop(g, now); return; }
  if (x === DARIO_X && y === DARIO_Y) { requestExchange(g, now); return; }
  if (x === DEPOT_X && y === DEPOT_Y) { requestDepot(g, now); return; }
  if (x === STABLE_X && y === STABLE_Y) { requestStable(g, now); return; }
  const m = monAt(g, x, y); if (m) { g.target = m.id; g.chase = true; return; }
  if (walkable(tileAt(g, x, y))) { g.walkGoal = { x, y, open: false }; g.pending = null; g.chase = false; }
}
function greedyMove(g: Game, e: Mover, tx: number, ty: number, ok: (x: number, y: number) => boolean): [number, number] | null {
  let best: [number, number] | null = null; let bd = cheb(e.x, e.y, tx, ty) * 10 + Math.abs(e.x - tx) + Math.abs(e.y - ty);
  for (const [dx, dy] of DIRS8) {
    const x = e.x + dx, y = e.y + dy; if (!ok(x, y)) continue;
    const d = cheb(x, y, tx, ty) * 10 + Math.abs(x - tx) + Math.abs(y - ty);
    if (d < bd) { bd = d; best = [dx, dy]; }
  }
  void g; return best;
}
function moveMover(e: Mover, dx: number, dy: number, dur: number, now: number): void {
  e.fx = e.x; e.fy = e.y; e.x += dx; e.y += dy; e.moveStart = now; e.moveDur = dur * (dx !== 0 && dy !== 0 ? DIAG_MUL : 1); e.face = dirFrom(dx, dy);
}
function atkInterval(m: Mon): number { return (m.def.atkMs ?? (m.def.id === "boss" ? 1500 : 2000)) * (m.enraged ? 0.65 : 1); }
function stepMon(g: Game, m: Mon, now: number): void {
  const p = g.p;
  if (!m.alive) {
    if (m.temp) return;
    if (now >= m.respawnAt && !(p.x === m.sx && p.y === m.sy) && monAt(g, m.sx, m.sy) === null && cheb(p.x, p.y, m.sx, m.sy) > 3) {
      m.alive = true; m.hp = m.def.hp; m.x = m.sx; m.y = m.sy; m.fx = m.sx; m.fy = m.sy; m.moveStart = 0; m.angryUntil = 0; m.dotUntil = 0; m.slowUntil = 0; m.calmUntil = 0; m.enraged = false; m.spec = [];
    }
    return;
  }
  if (m.dotUntil > now && now >= m.dotNext) { m.dotNext = now + 1000; damageMon(g, m, roll(m.dotMin, m.dotMax), now, "dark"); if (!m.alive) return; }
  const d = cheb(m.x, m.y, p.x, p.y); const calm = now < m.calmUntil;
  const aggro = !calm && !isSafe(p.x, p.y) && (d <= 6 || now < m.angryUntil);
  if (m.def.boss && aggro && d <= 10 && bossThink(g, m, now, d)) return;
  if (aggro && d <= 1) {
    if (now >= m.nextAtk) { m.nextAtk = now + atkInterval(m); m.face = dirFrom(p.x - m.x, p.y - m.y); monsterAttack(g, m, now); }
    return;
  }
  if (now < m.nextMove || now < m.moveStart + m.moveDur) return;
  const spd = m.def.speed * (now < m.slowUntil ? 1.8 : 1) * (m.enraged ? 0.8 : 1);
  if (aggro) {
    const st = greedyMove(g, m, p.x, p.y, (x: number, y: number) => canMonEnter(g, x, y));
    if (st) moveMover(m, st[0], st[1], spd, now);
    m.nextMove = now + spd * (st && st[0] !== 0 && st[1] !== 0 ? DIAG_MUL : 1);
    if (m.nextAtk < now + 400) m.nextAtk = now + 400;
  } else {
    m.nextMove = now + spd * 2 + Math.random() * spd * 3;
    const [dx, dy] = DIRS8[Math.floor(Math.random() * 8)] ?? [0, 1];
    const x = m.x + dx, y = m.y + dy;
    if (cheb(x, y, m.sx, m.sy) <= 4 && canMonEnter(g, x, y)) moveMover(m, dx, dy, spd, now);
  }
}
// ===================== Guardianes dorados: ataques especiales =====================
function bossThink(g: Game, m: Mon, now: number, d: number): boolean {
  const bd = m.def.boss; if (!bd) return false;
  if (!m.enraged && m.hp < m.def.hp * 0.3) {
    m.enraged = true; addFloat(g, m.x * TS + 16, m.y * TS - 28, "¡FURIA!", "#ff4040", now);
    setStatus(g, `¡${m.def.name} entra en FURIA! Ataca más rápido y más fuerte.`, now, "#ff6060"); addLog(g, `⚠ ${m.def.name} enfurece.`);
  }
  if (m.spec.length !== bd.specials.length) m.spec = bd.specials.map((s: Special, k: number) => now + s.cd * (0.4 + 0.15 * k));
  for (let k = 0; k < bd.specials.length; k++) {
    const s = bd.specials[k]; if (!s || now < (m.spec[k] ?? 0) || !specUsable(g, m, s, d)) continue;
    m.spec[k] = now + s.cd * (m.enraged ? 0.75 : 1);
    doSpecial(g, m, s, now, d); return true;
  }
  return false;
}
function tempCount(g: Game, m: Mon, clones: boolean): number { let c = 0; for (const o of regionMons(g, m.x, m.y)) if (o.alive && o.temp && !o.def.boss && (o.def.exp === 0) === clones) c++; return c; }
function specUsable(g: Game, m: Mon, s: Special, d: number): boolean {
  switch (s.kind) {
    case "nova": return d <= s.r + 1;
    case "line": return d <= s.r;
    case "pull": return d >= 2 && d <= s.r;
    case "freeze": case "poison": return d <= s.r;
    case "blink": return d >= 2;
    case "summon": return tempCount(g, m, false) < 4;
    case "ranged": return d >= 2 && d <= s.r && los(g, m.x, m.y, g.p.x, g.p.y);
    case "clones": return tempCount(g, m, true) < 4;
    case "banish": return d <= 3;
  }
  return false;
}
function freeNear(g: Game, x: number, y: number, ok: (x: number, y: number) => boolean): [number, number] | null {
  void g;
  for (const [dx, dy] of DIRS8) { const nx = x + dx, ny = y + dy; if (ok(nx, ny)) return [nx, ny]; }
  return null;
}
function doSpecial(g: Game, m: Mon, s: Special, now: number, d: number): void {
  const p = g.p; const A = m.def.atk * (m.enraged ? 1.2 : 1); const H = HOUSES[(m.def.house ?? 1) - 1]; const elem: Elem = H ? H.elem : "phys";
  const shout = (): void => { addFloat(g, m.x * TS + 16, m.y * TS - 30, `¡${s.name}!`, "#ffd34d", now); setStatus(g, `${m.def.name}: «¡${s.name}!»`, now, "#ffd34d"); };
  const warn = (cells: Array<[number, number]>, tele: number, lo: number, hi: number): void => { g.warns.push({ cells, at: now + tele, born: now, min: Math.round(A * lo), max: Math.round(A * hi), elem, name: s.name }); if (g.warns.length > 12) g.warns.shift(); };
  const pOk = (x: number, y: number): boolean => canPlayerEnter(g, x, y) && tileAt(g, x, y) !== PORTAL && regionOf(x, y) === regionOf(m.x, m.y);
  shout(); m.face = dirFrom(p.x - m.x, p.y - m.y);
  switch (s.kind) {
    case "nova": warn(circle(m.x, m.y, s.r * s.r + s.r).filter((c: [number, number]) => walkable(tileAt(g, c[0], c[1]))), s.tele, 0.6, 1.1); break;
    case "line": {
      const dx = sgn(p.x - m.x), dy = sgn(p.y - m.y); const cells: Array<[number, number]> = [];
      for (let k = 1; k <= s.r; k++) { const cx = m.x + dx * k, cy = m.y + dy * k; cells.push([cx, cy], [cx - dy, cy + dx], [cx + dy, cy - dx]); }
      warn(cells, s.tele, 0.8, 1.4); break;
    }
    case "ranged": warn([[p.x, p.y]], 650, 0.7, 1.2); g.fx.push({ cells: [[m.x, m.y]], elem, born: now }); break;
    case "pull": {
      const spot = freeNear(g, m.x + sgn(p.x - m.x), m.y + sgn(p.y - m.y), pOk) ?? freeNear(g, m.x, m.y, pOk);
      if (spot) { p.fx = spot[0]; p.fy = spot[1]; p.x = spot[0]; p.y = spot[1]; p.moveStart = 0; g.walkGoal = null; }
      g.fx.push({ cells: [[p.x, p.y]], elem, born: now }); specialHit(g, roll(Math.round(A * 0.3), Math.round(A * 0.6)), now); break;
    }
    case "freeze": p.slowUntil = now + 4000; g.fx.push({ cells: circle(p.x, p.y, 1), elem: "ice", born: now }); pfloat(g, "¡Lento!", "#9be8ff", now, -14); specialHit(g, roll(Math.round(A * 0.3), Math.round(A * 0.6)), now); break;
    case "poison": p.poisonUntil = now + 8000; p.poisonNext = now + 1000; p.poisonDmg = Math.max(1, Math.round(A * 0.12)); g.fx.push({ cells: [[p.x, p.y]], elem: "earth", born: now }); pfloat(g, "¡Veneno!", "#7ad13a", now, -14); break;
    case "blink": {
      const spot = freeNear(g, p.x, p.y, (x: number, y: number) => canMonEnter(g, x, y) && regionOf(x, y) === regionOf(m.x, m.y));
      if (spot) { g.fx.push({ cells: [[m.x, m.y]], elem, born: now }); m.x = spot[0]; m.y = spot[1]; m.fx = spot[0]; m.fy = spot[1]; m.moveStart = 0; }
      specialHit(g, roll(Math.round(A * 0.6), Math.round(A * 1.1)), now); m.nextAtk = now + atkInterval(m); break;
    }
    case "summon": {
      const n = m.def.house ?? 1; for (let k = 0; k < 2; k++) spawnTemp(g, MONS[`h${n}${k === 0 ? "a" : "b"}`], m.x, m.y, now); break;
    }
    case "clones": {
      const cd = MONS[m.def.boss?.clone ?? ""]; const made: Mon[] = [];
      for (let k = 0; k < 2; k++) { const c = spawnTemp(g, cd, m.x, m.y, now); if (c) made.push(c); }
      const sw = made[0];
      if (sw && Math.random() < 0.5) { const tx = sw.x, ty = sw.y; sw.x = m.x; sw.y = m.y; sw.fx = m.x; sw.fy = m.y; m.x = tx; m.y = ty; m.fx = tx; m.fy = ty; m.moveStart = 0; sw.moveStart = 0; }
      if (g.target === m.id && Math.random() < 0.5) { g.target = -1; setStatus(g, "¡Ilusión! Ya no sabes cuál es el verdadero…", now, "#c8b0ff"); }
      break;
    }
    case "banish": {
      const rt = HRT[(m.def.house ?? 1) - 1]; let spot: [number, number] | null = null;
      if (rt) for (let t = 0; t < 40 && !spot; t++) { const x = rt.room[0] + Math.floor(Math.random() * (rt.room[2] - rt.room[0] + 1)), y = rt.room[1] + Math.floor(Math.random() * (rt.room[3] - rt.room[1] + 1)); if (pOk(x, y) && cheb(x, y, m.x, m.y) >= 4) spot = [x, y]; }
      if (spot) { g.fx.push({ cells: [[p.x, p.y]], elem: "dark", born: now }); p.x = spot[0]; p.y = spot[1]; p.fx = spot[0]; p.fy = spot[1]; p.moveStart = 0; g.walkGoal = null; }
      specialHit(g, roll(Math.round(A * 0.4), Math.round(A * 0.7)), now); break;
    }
  }
  void d;
}
function stepMinion(g: Game, now: number): void {
  const mi = g.minion; if (!mi) return; const p = g.p;
  if (now >= mi.until) { g.minion = null; addLog(g, "Tu esbirro se desvanece."); return; }
  const t = curTarget(g) ?? g.mons.find((m: Mon) => m.alive && cheb(m.x, m.y, mi.x, mi.y) <= 1 && now < m.angryUntil) ?? null;
  if (t && cheb(t.x, t.y, mi.x, mi.y) <= 1) {
    if (now >= mi.nextAtk) { mi.nextAtk = now + 1500; mi.face = dirFrom(t.x - mi.x, t.y - mi.y); hitMon(g, t, roll(mi.min, mi.max), "dark", now, 0); }
    return;
  }
  if (now < mi.moveStart + mi.moveDur) return;
  const ok = (x: number, y: number): boolean => walkable(tileAt(g, x, y)) && monAt(g, x, y) === null && !(x === p.x && y === p.y) && !isNpcAt(x, y);
  const [tx, ty] = t && cheb(t.x, t.y, p.x, p.y) <= 8 ? [t.x, t.y] : [p.x, p.y];
  if (!t && cheb(mi.x, mi.y, p.x, p.y) <= 1) return;
  const st = greedyMove(g, mi, tx, ty, ok); if (st) moveMover(mi, st[0], st[1], 300, now);
}
function toggleAfk(g: Game, now: number): void {
  g.afk = !g.afk; g.walkGoal = null;
  if (g.afk) { g.afkStart = now; g.afkNext = now; g.afkExp = 0; g.afkGold = 0; g.afkKills = 0; g.afkLoot = 0; setStatus(g, "Modo AFK activado: cazando solo.", now, "#7dffb0"); addLog(g, "AFK activado."); }
  else { setStatus(g, "Modo AFK desactivado.", now); addLog(g, "AFK desactivado."); }
}
function afkRate(g: Game, now: number): number { const h = (now - g.afkStart) / 3600000; return h > 0.0005 ? Math.round(g.afkExp / h) : 0; }
// @@AFK
function afkReady(g: Game, i: number, now: number, reserve: number): boolean {
  const pw = g.cls.powers[i]; if (!pw) return false;
  return now >= (g.p.cd[i] ?? 0) && now >= g.p.gcd && g.p.mana >= pw.mana + reserve;
}
const AFK_MIN_LVL: Record<string, number> = { rat: 1, rotworm: 4, troll: 3, wasp: 5, mino: 14, guard: 22, boss: 40 };
function afkOk(g: Game, m: Mon): boolean {
  const r = regionOf(m.x, m.y); if (r !== regionOf(g.p.x, g.p.y)) return false;
  if ((m.def.boss || m.def.id === "boss") && !g.afkBoss && r > 0) return false;
  const rt = HRT[r - 1]; if (r > 0 && rt && inRect(rt.room, m.x, m.y) && !g.afkBoss) return false;
  return g.p.level >= (AFK_MIN_LVL[m.def.id] ?? m.def.afk ?? 1) || now0(m);
}
function now0(m: Mon): boolean { return m.angryUntil > performance.now() && cheb(m.x, m.y, m.sx, m.sy) < 99 && m.def.id !== "boss"; }
function afkThink(g: Game, now: number): void {
  const p = g.p; const mhp = Math.max(1, maxHp(g)), mmp = Math.max(1, maxMana(g)); const pows = g.cls.powers;
  // 1) Curarse
  if (p.hp < mhp * 0.55) {
    const hi = pows.findIndex((pw: Power) => pw.kind === "heal");
    if (hi >= 0 && afkReady(g, hi, now, 0)) { castPower(g, hi, now); return; }
    const ti = pows.findIndex((pw: Power) => pw.kind === "hot");
    if (ti >= 0 && p.hotUntil < now && afkReady(g, ti, now, 0)) { castPower(g, ti, now); return; }
    if (hpPots(p) > 0 && now >= p.nextPotion) { usePotion(g, "hp", now); return; }
  }
  if (p.hp < mhp * 0.25) { const si = pows.findIndex((pw: Power) => pw.kind === "smoke" || pw.kind === "buff"); if (si >= 0 && afkReady(g, si, now, 0)) { castPower(g, si, now); return; } }
  if (p.mana < mmp * 0.25 && manaPots(p) > 0 && now >= p.nextPotion) { usePotion(g, "mana", now); return; }
  const free = now >= p.moveStart + p.moveDur;
  const near = regionMons(g, p.x, p.y);
  const nearAggro = near.some((m: Mon) => m.alive && cheb(m.x, m.y, p.x, p.y) <= 1);
  // 2) Recoger botín
  if (!nearAggro && p.bag.length < bagMax(g) && g.ground.length > 0) {
    let best: Ground | null = null; let bd = 99;
    for (const gi of g.ground) { if (gi.mine !== undefined || !afkWants(g, gi.inst)) continue; const d = cheb(gi.x, gi.y, p.x, p.y); if (d <= 7 && d < bd && regionOf(gi.x, gi.y) === regionOf(p.x, p.y)) { bd = d; best = gi; } }
    if (best) { if (!g.walkGoal) g.walkGoal = { x: best.x, y: best.y, open: false }; return; }
  }
  // 3) Elegir objetivo
  let t = curTarget(g);
  if (!t || cheb(t.x, t.y, p.x, p.y) > 10 || (!!t.def.boss && !g.afkBoss)) {
    t = null; let bd = 99;
    for (const m of near) {
      if (!m.alive || isSafe(m.x, m.y) || !afkOk(g, m)) continue;
      const d = cheb(m.x, m.y, p.x, p.y); if (d < bd && d <= 10) { bd = d; t = m; }
    }
    g.target = t ? t.id : -1;
  }
  const w = weaponInfo(g);
  if (t) {
    const d = cheb(t.x, t.y, p.x, p.y); const reserve = mmp * 0.2;
    // 4) Poderes ofensivos
    for (let i = 0; i < pows.length; i++) {
      const pw = pows[i]; if (!pw || !afkReady(g, i, now, reserve) || isSafe(p.x, p.y)) continue;
      const k = pw.kind;
      const ok = (k === "strike" || k === "drain" || k === "slow" || k === "dot" || k === "area" || k === "field") ? inReach(g, t, pw.range) && !(k === "dot" && t.dotUntil > now)
        : k === "spin" ? d <= 1 : k === "wave" ? d <= 3 : k === "summon" ? !g.minion && d <= 5 : k === "buff" ? d <= 1 && p.hp < mhp * 0.7 : false;
      if (ok) { castPower(g, i, now); return; }
    }
    if (!free) return;
    // 5) Acercarse o alejarse
    if (w.range >= 3 && d <= 1 && p.hp < mhp * 0.6) {
      let bx = 0, by = 0, bs = 0;
      for (const [dx, dy] of DIRS8) { const x = p.x + dx, y = p.y + dy; if (!canPlayerEnter(g, x, y) || isSafe(x, y)) continue; const s = cheb(x, y, t.x, t.y); if (s > bs) { bs = s; bx = dx; by = dy; } }
      if (bs > 1) { tryStep(g, bx, by, now); return; }
    }
    if (!inReach(g, t, w.range)) {
      const tt = t; const rng = Math.min(w.range, 4);
      const st = bfsStep(g, p.x, p.y, (x: number, y: number) => cheb(x, y, tt.x, tt.y) <= rng && !isSafe(x, y) && (rng <= 1 || los(g, x, y, tt.x, tt.y)), 2500);
      if (st) tryStep(g, st[0], st[1], now); else g.target = -1;
    }
    return;
  }
  // 6) Sin objetivo: ir hacia el monstruo vivo más cercano del mapa
  if (!free || g.walkGoal) return;
  let goal: Mon | null = null; let gd = 999;
  for (const m of near) { if (!m.alive || !afkOk(g, m)) continue; const d = cheb(m.x, m.y, p.x, p.y); if (d < gd) { gd = d; goal = m; } }
  if (!goal) return; const gm = goal;
  const st = bfsStep(g, p.x, p.y, (x: number, y: number) => cheb(x, y, gm.x, gm.y) <= 3 && !isSafe(x, y), 5000);
  if (st) tryStep(g, st[0], st[1], now);
}
// @@ENDAFK
function runAction(g: Game, a: Action, now: number): void {
  switch (a) {
    case "power1": castPower(g, 0, now); break; case "power2": castPower(g, 1, now); break;
    case "power3": castPower(g, 2, now); break; case "power4": castPower(g, 3, now); break;
    case "hpPot": usePotion(g, "hp", now); break; case "manaPot": usePotion(g, "mana", now); break;
    case "attack": case "nextTarget": targetNearest(g, now); g.chase = true; break;
    case "clearTarget": if (g.shopOpen || g.bigMap || (!!g.cs && (g.cs.open || g.cs.exOpen)) || (!!g.dep && g.dep.open) || (!!g.mt && g.mt.open)) { g.shopOpen = false; g.bigMap = false; if (g.cs) { g.cs.open = false; g.cs.exOpen = false; } if (g.dep) g.dep.open = false; if (g.mt) g.mt.open = false; } else { g.target = -1; g.walkGoal = null; g.chase = false; } break;
    case "shop": if (g.shopOpen) g.shopOpen = false; else requestShop(g, now); break;
    case "afk": toggleAfk(g, now); break;
    case "map": g.bigMap = !g.bigMap; break;
    case "coins": { const c = cs(g); c.open = !c.open; c.msg = ""; break; }
    case "mount": toggleMount(g, now); break;
    default: break;
  }
}

// ===================== Persecución cuerpo a cuerpo (modo chase) =====================
function isChaser(g: Game): boolean { return (g.cls.id === "knight" || g.cls.id === "rogue") && weaponInfo(g).range <= 1; }
function chaseStep(g: Game, now: number): void {
  const t = curTarget(g); if (!t || !isChaser(g)) return; const p = g.p;
  const d = cheb(p.x, p.y, t.x, t.y); if (d <= 1) return;
  if (d > 14) { g.chase = false; setStatus(g, "El objetivo está demasiado lejos para perseguirlo.", now); return; }
  const tt = t;
  const st = bfsStep(g, p.x, p.y, (x: number, y: number) => cheb(x, y, tt.x, tt.y) <= 1 && !isSafe(x, y), 2500);
  if (st) tryStep(g, st[0], st[1], now);
}

// ===================== Edisar Coins (tienda de PRUEBA: sin pagos reales) =====================
// Prototipo: las coins sólo se ganan jugando (guardianes, casas superadas) o con el botón «Modo prueba». No hay pagos, formularios ni enlaces.
const COIN_GOLD = 10000; // 1 Edisar Coin = 10 000 de oro (Cambista Darío)
const DARIO_X = 51, DARIO_Y = 36 + OY; const DARIO_NAME = "Cambista Darío";
const COIN_HOUSE = 5, COIN_TEST = 100; const PREM_DAYS = 30, PREM_EXP = 0.1, XP_BOOST = 0.5, XP_BOOST_MS = 3600000, XP_BOOST_MAX = 5 * 3600000;
const BAG_STEP = 6, BAG_BUYS = 2, BAG_CAP = 20 + BAG_STEP * BAG_BUYS;
type CoinCat = "cosmetic" | "mount" | "premium" | "util";
interface Outfit { id: string; n: string; robe: string; trim: string; price: number; }
interface Aura { id: string; n: string; c: [number, number, number]; price: number; }
interface NameCol { id: string; n: string; c: string; price: number; }
type MountKind = "donkey" | "horse" | "wolf" | "dragon" | "boar" | "bull" | "lion" | "pegasus";
interface MountDef { id: string; n: string; price: number; speed: number; src: "gold" | "coins" | "boss"; kind: MountKind; body: string; dark: string; mane: string; mon?: string; chance?: number; } // speed = % más rápido montado
const OUTFITS: Outfit[] = [
  { id: "o_carmesi", n: "Túnica carmesí", robe: "#8a1c2a", trim: "#ffd34d", price: 40 },
  { id: "o_noche", n: "Manto de medianoche", robe: "#1c2a5a", trim: "#9be8ff", price: 40 },
  { id: "o_bosque", n: "Ropaje del bosque", robe: "#2f6a2a", trim: "#e0c08a", price: 40 },
  { id: "o_nieve", n: "Atuendo de nieve", robe: "#e8eef4", trim: "#4aa3ff", price: 60 },
  { id: "o_sombra", n: "Vestidura de sombra", robe: "#24182e", trim: "#c07bff", price: 60 },
  { id: "o_dorado", n: "Atavío dorado", robe: "#b8862a", trim: "#fff0a8", price: 90 },
];
const AURAS: Aura[] = [
  { id: "a_oro", n: "Aura dorada", c: [255, 211, 77], price: 80 },
  { id: "a_hielo", n: "Aura de escarcha", c: [155, 232, 255], price: 80 },
  { id: "a_fuego", n: "Aura ígnea", c: [255, 120, 40], price: 80 },
  { id: "a_vacio", n: "Aura del vacío", c: [176, 112, 255], price: 120 },
];
const NAMECOLS: NameCol[] = [
  { id: "n_oro", n: "Nombre dorado", c: "#ffd34d", price: 30 },
  { id: "n_cielo", n: "Nombre celeste", c: "#7ec8ff", price: 30 },
  { id: "n_rosa", n: "Nombre rosa", c: "#ff9ad8", price: 30 },
  { id: "n_heaven", n: "Nombre Heaven", c: "#fff0a8", price: 60 },
];
const MOUNTS: MountDef[] = [
  { id: "m_burro", n: "Burro de carga", price: 1500, speed: 20, src: "gold", kind: "donkey", body: "#8a8279", dark: "#4a443e", mane: "#3a342e" },
  { id: "m_caballo", n: "Caballo pardo", price: 150, speed: 25, src: "coins", kind: "horse", body: "#8a5a32", dark: "#4a2e16", mane: "#2a1a0c" },
  { id: "m_lobo", n: "Lobo de las nieves", price: 250, speed: 30, src: "coins", kind: "wolf", body: "#e4ecf2", dark: "#8a9aa8", mane: "#c8d4de" },
  { id: "m_dragon", n: "Dragoncillo de fuego", price: 400, speed: 35, src: "coins", kind: "dragon", body: "#c8402a", dark: "#6a1a10", mane: "#ffb040" },
  { id: "m_jabali", n: "Jabalí de guerra", price: 0, speed: 25, src: "boss", mon: "boss", chance: 0.1, kind: "boar", body: "#5a3a26", dark: "#2a1a10", mane: "#1a100a" },
  { id: "m_toro", n: "Toro de Tauro", price: 0, speed: 30, src: "boss", mon: "h2boss", chance: 0.12, kind: "bull", body: "#6a4426", dark: "#3a2414", mane: "#d8a93a" },
  { id: "m_leon", n: "León de Nemea", price: 0, speed: 35, src: "boss", mon: "h4boss", chance: 0.08, kind: "lion", body: "#d8a040", dark: "#8a5a1a", mane: "#8a3a10" },
  { id: "m_corcel", n: "Corcel de Sagitario", price: 0, speed: 40, src: "boss", mon: "h8boss", chance: 0.06, kind: "pegasus", body: "#f4f0e8", dark: "#a8a090", mane: "#ffd34d" },
];
type UtilId = "premium" | "bag" | "scroll" | "scroll5" | "xp" | "rename";
const UTILS: Record<UtilId, { n: string; d: string; price: number; icon: string }> = {
  premium: { n: `Premium ${PREM_DAYS} días`, d: `+${Math.round(PREM_EXP * 100)}% de experiencia por cazar y los objetos raros, épicos y Heaven brillan en el suelo.`, price: 250, icon: "👑" },
  bag: { n: `Mochila ampliada (+${BAG_STEP} casillas)`, d: `Más espacio en la mochila (hasta ${BAG_CAP} casillas).`, price: 150, icon: "🎒" },
  scroll: { n: "Pergamino de regreso", d: "Te lleva al templo de Villa Esmeralda (no funciona dentro de las Casas).", price: 3, icon: "📜" },
  scroll5: { n: "Pergaminos de regreso ×5", d: "Paquete de 5 pergaminos.", price: 12, icon: "📜" },
  xp: { n: "Poción de experiencia (1 h)", d: `+${Math.round(XP_BOOST * 100)}% de experiencia por cazar durante 1 hora de juego (se acumula hasta 5 h).`, price: 25, icon: "⚗️" },
  rename: { n: "Cambio de nombre", d: "Elige un nombre nuevo para tu personaje.", price: 100, icon: "✒️" },
};
interface CoinState {
  coins: number; owned: string[]; outfit: string; aura: string; ncol: string; premUntil: number; xpLeft: number; xpT: number; bagX: number; scrolls: number; afkMin: Rarity;
  open: boolean; exOpen: boolean; exWalk: boolean; msg: string; msgBad: boolean; earned: number;
}
interface Game { cs?: CoinState; }
function newCS(): CoinState { return { coins: 0, owned: [], outfit: "", aura: "", ncol: "", premUntil: 0, xpLeft: 0, xpT: 0, bagX: 0, scrolls: 0, afkMin: "com", open: false, exOpen: false, exWalk: false, msg: "", msgBad: false, earned: 0 }; }
function cs(g: Game): CoinState { if (!g.cs) g.cs = newCS(); return g.cs; }
function bagMax(g: Game): number { return BAG_MAX + (g.cs ? g.cs.bagX : 0); }
function isNpcAt(x: number, y: number): boolean { return (x === NPC_X && y === NPC_Y) || (x === DARIO_X && y === DARIO_Y) || (x === DEPOT_X && y === DEPOT_Y) || (x === STABLE_X && y === STABLE_Y); }
function premOn(g: Game, wall?: number): boolean { return !!g.cs && g.cs.premUntil > (wall ?? Date.now()); }
function expMul(g: Game): number { const c = g.cs; if (!c) return 1; return 1 + (premOn(g) ? PREM_EXP : 0) + (c.xpLeft > 0 ? XP_BOOST : 0); }
const RAR_RANK: Record<Rarity, number> = { com: 0, rar: 1, epi: 2, hea: 3 };
const AFK_MINS: Rarity[] = ["com", "rar", "epi"];
const AFK_MIN_LABEL: Record<Rarity, string> = { com: "Todo", rar: "Solo azul, morado y Heaven", epi: "Solo morado y Heaven", hea: "Solo Heaven" };
function afkWants(g: Game, inst: Inst): boolean { return !g.afk || !g.cs || RAR_RANK[inst.rar] >= RAR_RANK[g.cs.afkMin]; }
function setAfkMin(g: Game, r: Rarity): void { cs(g).afkMin = r; addLog(g, `AFK recoge: ${AFK_MIN_LABEL[r]}.`); }
function coinMsg(g: Game, text: string, bad?: boolean): void { const c = cs(g); c.msg = text; c.msgBad = !!bad; if (!bad) addLog(g, `🪙 ${text}`); }
function coinGain(g: Game, n: number, why: string, now: number): void {
  if (n <= 0) return; const c = cs(g); c.coins += n; c.earned += n;
  pfloat(g, `+${n} 🪙`, "#ffd34d", now, -26); addLog(g, `🪙 +${n} Edisar Coins (${why}).`);
}
// Jefes: pequeña probabilidad de soltar coins; cada Casa superada por primera vez da coins
function coinDrop(g: Game, m: Mon, now: number): void {
  const chance = m.def.boss ? 0.2 : 0.05; if (Math.random() >= chance) return;
  coinGain(g, m.def.boss ? 1 + Math.floor(Math.random() * 3) : 1, `botín de ${m.def.name}`, now);
}
function coinTest(g: Game, now: number): void { coinGain(g, COIN_TEST, "modo prueba", now); coinMsg(g, `Modo prueba: +${COIN_TEST} Edisar Coins.`); }
function owns(g: Game, id: string): boolean { return !!g.cs && g.cs.owned.includes(id); }
function cosmeticPrice(id: string): number { const o = OUTFITS.find((x: Outfit) => x.id === id) ?? AURAS.find((x: Aura) => x.id === id) ?? NAMECOLS.find((x: NameCol) => x.id === id); return o ? o.price : -1; }
function cosmeticName(id: string): string { const o = OUTFITS.find((x: Outfit) => x.id === id) ?? AURAS.find((x: Aura) => x.id === id) ?? NAMECOLS.find((x: NameCol) => x.id === id); return o ? o.n : id; }
function spend(g: Game, price: number): boolean {
  const c = cs(g); if (!(price > 0) || c.coins < price) { coinMsg(g, `No tienes suficientes Edisar Coins (cuesta ${price}, tienes ${c.coins}).`, true); return false; }
  c.coins -= price; return true;
}
function buyCosmetic(g: Game, id: string): boolean {
  const price = cosmeticPrice(id); if (price < 0) return false;
  if (owns(g, id)) { coinMsg(g, "Ya lo tienes.", true); return false; }
  if (!spend(g, price)) return false;
  cs(g).owned.push(id); wearCosmetic(g, id, true); coinMsg(g, `Compraste ${cosmeticName(id)} por ${price} coins.`); return true;
}
function wearCosmetic(g: Game, id: string, on: boolean): void {
  const c = cs(g); if (on && !owns(g, id)) return;
  const v = on ? id : "";
  if (OUTFITS.some((x: Outfit) => x.id === id)) c.outfit = v; else if (AURAS.some((x: Aura) => x.id === id)) c.aura = v; else if (NAMECOLS.some((x: NameCol) => x.id === id)) c.ncol = v;
}
function buyUtil(g: Game, u: UtilId, now: number, newName?: string): boolean {
  const c = cs(g); const it = UTILS[u];
  if (u === "bag" && c.bagX >= BAG_STEP * BAG_BUYS) { coinMsg(g, "Tu mochila ya tiene el tamaño máximo.", true); return false; }
  if (u === "xp" && c.xpLeft + XP_BOOST_MS > XP_BOOST_MAX) { coinMsg(g, "Ya tienes el máximo de 5 h de poción de experiencia.", true); return false; }
  let nm = "";
  if (u === "rename") { nm = (newName ?? "").trim().replace(/\s+/g, " "); if (!/^[A-Za-zÀ-ÿ0-9 ]{2,16}$/.test(nm)) { coinMsg(g, "Escribe un nombre de 2 a 16 letras o números.", true); return false; } if (nm === g.p.name) { coinMsg(g, "Ese ya es tu nombre.", true); return false; } }
  if (!spend(g, it.price)) return false;
  if (u === "premium") { const base = Math.max(Date.now(), c.premUntil); c.premUntil = base + PREM_DAYS * 86400000; coinMsg(g, `¡Premium activo hasta el ${new Date(c.premUntil).toLocaleDateString("es-MX")}!`); }
  else if (u === "bag") { c.bagX += BAG_STEP; coinMsg(g, `Mochila ampliada: ahora tiene ${bagMax(g)} casillas.`); }
  else if (u === "scroll" || u === "scroll5") { const n = u === "scroll" ? 1 : 5; c.scrolls += n; coinMsg(g, `Compraste ${n} pergamino${n > 1 ? "s" : ""} de regreso (tienes ${c.scrolls}).`); }
  else if (u === "xp") { c.xpLeft += XP_BOOST_MS; coinMsg(g, `Poción de experiencia activa: ${Math.round(c.xpLeft / 60000)} min restantes.`); }
  else if (u === "rename") { const old = g.p.name; g.p.name = nm; coinMsg(g, `Ahora te llamas ${nm} (antes ${old}).`); setStatus(g, `¡Ahora te llamas ${nm}!`, now, "#ffd34d"); }
  return true;
}
function readScroll(g: Game, now: number): boolean {
  const c = cs(g); if (c.scrolls <= 0) { setStatus(g, "No tienes pergaminos de regreso (Tienda de Coins).", now); return false; }
  if (regionOf(g.p.x, g.p.y) > 0) { setStatus(g, "El pergamino no funciona dentro de las Casas.", now, "#ff9a5a"); return false; }
  if (isSafe(g.p.x, g.p.y) && cheb(g.p.x, g.p.y, TEMPLE_X, TEMPLE_Y) <= 1) { setStatus(g, "Ya estás en el templo.", now); return false; }
  c.scrolls--; g.heldDirs = []; teleport(g, TEMPLE_X, TEMPLE_Y, now); setStatus(g, "📜 El pergamino te llevó al templo de Villa Esmeralda.", now, "#7dffb0"); addLog(g, `📜 Pergamino de regreso usado (quedan ${c.scrolls}).`); return true;
}
// Cambista Darío: coins ↔ oro (1 coin = 10 000 de oro)
function exCoinsToGold(g: Game, n: number): boolean {
  const c = cs(g); n = Math.floor(n); if (!(n >= 1)) return false;
  if (n > c.coins) { coinMsg(g, `No tienes ${n} coins (tienes ${c.coins}).`, true); return false; }
  c.coins -= n; g.p.gold += n * COIN_GOLD; coinMsg(g, `Cambiaste ${n} coin${n > 1 ? "s" : ""} por ${(n * COIN_GOLD).toLocaleString("es-MX")} de oro.`); return true;
}
function exGoldToCoins(g: Game, n: number): boolean {
  const c = cs(g); n = Math.floor(n); if (!(n >= 1)) return false;
  if (n * COIN_GOLD > g.p.gold) { coinMsg(g, `Necesitas ${(n * COIN_GOLD).toLocaleString("es-MX")} de oro (tienes ${g.p.gold.toLocaleString("es-MX")}).`, true); return false; }
  g.p.gold -= n * COIN_GOLD; c.coins += n; coinMsg(g, `Cambiaste ${(n * COIN_GOLD).toLocaleString("es-MX")} de oro por ${n} coin${n > 1 ? "s" : ""}.`); return true;
}
function requestExchange(g: Game, now: number): void {
  const p = g.p; const d = cheb(p.x, p.y, DARIO_X, DARIO_Y); const c = cs(g);
  if (d <= 2) { c.exOpen = true; c.msg = ""; g.walkGoal = null; g.shopOpen = false; return; }
  if (isSafe(p.x, p.y) || d <= 12) { g.walkGoal = { x: DARIO_X, y: DARIO_Y, open: true }; c.exWalk = true; g.chase = false; setStatus(g, `Caminando hacia ${DARIO_NAME}...`, now); return; }
  setStatus(g, `${DARIO_NAME} cambia coins y oro en Villa Esmeralda, junto a la fuente.`, now);
}
function coinTick(g: Game, now: number): void {
  const c = g.cs; if (!c) return;
  if (c.xpLeft > 0) { const dt = c.xpT > 0 ? clamp(now - c.xpT, 0, 1000) : 0; c.xpLeft = Math.max(0, c.xpLeft - dt); if (c.xpLeft === 0) setStatus(g, "Se acabó la poción de experiencia.", now); }
  c.xpT = now;
  if (c.exOpen && (g.shopOpen || cheb(g.p.x, g.p.y, DARIO_X, DARIO_Y) > 6)) c.exOpen = false; // una ventana de NPC a la vez
}
function outfitColors(g: Game): [string, string] { const o = g.cs ? OUTFITS.find((x: Outfit) => x.id === g.cs?.outfit) : undefined; return o ? [o.robe, o.trim] : [g.cls.robe, g.cls.trim]; }
function nameColor(g: Game): string { const n = g.cs ? NAMECOLS.find((x: NameCol) => x.id === g.cs?.ncol) : undefined; return n ? n.c : "#7dff7d"; }
function drawAura(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, now: number): void {
  const a = AURAS.find((v: Aura) => v.id === id); if (!a) return; const [r, gg, b] = a.c; const k = 0.5 + 0.5 * Math.sin(now / 300);
  const gr = ctx.createRadialGradient(x + 16, y + 20, 3, x + 16, y + 20, 20); gr.addColorStop(0, `rgba(${r},${gg},${b},${0.35 + 0.25 * k})`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x + 16, y + 20, 19, 17, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 4; i++) { const t = now / 700 + i * 1.57; ctx.fillStyle = `rgba(${r},${gg},${b},0.85)`; ctx.fillRect(x + 16 + Math.cos(t) * 13 - 1, y + 18 + Math.sin(t) * 6 - ((now / 20 + i * 9) % 18) + 6, 2, 2); }
}
// Guardado de la tienda (campo opcional «cs» en el código; partidas antiguas = 0 coins)
interface SaveCS { coins: number; owned: string[]; outfit: string; aura: string; ncol: string; premUntil: number; xpLeft: number; bagX: number; scrolls: number; afkMin: Rarity; earned: number; }
interface SaveData { cs?: SaveCS; }
function saveCS(g: Game): SaveCS { const c = cs(g); return { coins: c.coins, owned: [...c.owned], outfit: c.outfit, aura: c.aura, ncol: c.ncol, premUntil: c.premUntil, xpLeft: Math.round(c.xpLeft), bagX: c.bagX, scrolls: c.scrolls, afkMin: c.afkMin, earned: c.earned }; }
function readCS(v: unknown): SaveCS {
  const d = newCS(); const out: SaveCS = { coins: 0, owned: [], outfit: "", aura: "", ncol: "", premUntil: 0, xpLeft: 0, bagX: 0, scrolls: 0, afkMin: d.afkMin, earned: 0 };
  if (!isObj(v)) return out;
  out.coins = intIn(v["coins"], 0, 1e9) ?? 0; out.earned = intIn(v["earned"], 0, 1e12) ?? 0;
  const ow = v["owned"]; if (Array.isArray(ow)) out.owned = ow.filter((s: unknown): s is string => typeof s === "string" && cosmeticPrice(s) > 0).filter((s: string, i: number, a: string[]) => a.indexOf(s) === i);
  const pickOwned = (k: string, list: Array<{ id: string }>): string => { const s = v[k]; return typeof s === "string" && out.owned.includes(s) && list.some((x: { id: string }) => x.id === s) ? s : ""; };
  out.outfit = pickOwned("outfit", OUTFITS); out.aura = pickOwned("aura", AURAS); out.ncol = pickOwned("ncol", NAMECOLS);
  out.premUntil = numIn(v["premUntil"], 0, 1e15) ?? 0; out.xpLeft = numIn(v["xpLeft"], 0, XP_BOOST_MAX) ?? 0;
  const bx = intIn(v["bagX"], 0, BAG_STEP * BAG_BUYS); out.bagX = bx !== null && bx % BAG_STEP === 0 ? bx : 0;
  out.scrolls = intIn(v["scrolls"], 0, 1e5) ?? 0;
  const am = v["afkMin"]; out.afkMin = typeof am === "string" && (AFK_MINS as string[]).includes(am) ? (am as Rarity) : "com";
  return out;
}
function loadCS(g: Game, s: SaveCS | undefined): void {
  const c = cs(g); if (!s) return;
  c.coins = s.coins; c.owned = [...s.owned]; c.outfit = s.outfit; c.aura = s.aura; c.ncol = s.ncol; c.premUntil = s.premUntil; c.xpLeft = s.xpLeft; c.bagX = s.bagX; c.scrolls = s.scrolls; c.afkMin = s.afkMin; c.earned = s.earned;
}

// ===================== Monturas (estilo Tibia) =====================
// Se compran con Edisar Coins, una barata con oro (Tomás, en el establo del pueblo) y otras se doman venciendo a ciertos jefes.
const STABLE_X = 41, STABLE_Y = 39 + OY; const STABLE_NAME = "Tomás, el mozo de cuadra";
interface MountState { owned: string[]; active: string; riding: boolean; open: boolean; msg: string; msgBad: boolean; flip: boolean; }
interface Game { mt?: MountState; }
function mt(g: Game): MountState { if (!g.mt) g.mt = { owned: [], active: "", riding: false, open: false, msg: "", msgBad: false, flip: false }; return g.mt; }
function mountDef(id: string): MountDef | undefined { return MOUNTS.find((m: MountDef) => m.id === id); }
function ownsMount(g: Game, id: string): boolean { return !!g.mt && g.mt.owned.includes(id); }
function riding(g: Game): MountDef | null { const s = g.mt; if (!s || !s.riding || !s.owned.includes(s.active)) return null; return mountDef(s.active) ?? null; }
// Sólo cambia cuánto dura cada paso: el camino, las colisiones y las diagonales son las mismas
function mountMul(g: Game): number { const d = riding(g); return d ? 1 + d.speed / 100 : 1; }
function mtMsg(g: Game, text: string, bad?: boolean): void { const s = mt(g); s.msg = text; s.msgBad = !!bad; }
function mountHow(d: MountDef): string {
  if (d.src === "coins") return `Tienda de Edisar Coins: 🪙 ${d.price}`;
  if (d.src === "gold") return `${STABLE_NAME}: 💰 ${d.price.toLocaleString("es-MX")} de oro`;
  const m = MONS[d.mon ?? ""]; return `Se doma al vencer a ${m ? m.name : "un jefe"} (${Math.round((d.chance ?? 0) * 100)}% por victoria)`;
}
function toggleMount(g: Game, now: number): void {
  const s = mt(g);
  if (s.riding) { s.riding = false; setStatus(g, "Te bajaste de la montura.", now); return; }
  const first = s.owned[0];
  if (first === undefined) { s.open = true; mtMsg(g, "Aún no tienes monturas: cómpralas con Tomás o en la Tienda de Coins, o dómalas venciendo jefes.", true); setStatus(g, "Aún no tienes monturas.", now); return; }
  if (!s.owned.includes(s.active)) s.active = first;
  s.riding = true; const d = mountDef(s.active); if (d) setStatus(g, `Montas ${d.n} (+${d.speed}% de velocidad).`, now, "#ffe08a");
}
function chooseMount(g: Game, id: string, now: number): boolean {
  const s = mt(g); const d = mountDef(id); if (!d || !s.owned.includes(id)) return false;
  s.active = id; s.riding = true; mtMsg(g, `Montas ${d.n} (+${d.speed}% de velocidad).`); setStatus(g, `Montas ${d.n}.`, now, "#ffe08a"); return true;
}
function grantMount(g: Game, id: string, why: string, now: number): boolean {
  const s = mt(g); const d = mountDef(id); if (!d || s.owned.includes(id)) return false;
  s.owned.push(id); if (!s.owned.includes(s.active)) s.active = id;
  addLog(g, `🐎 ¡Nueva montura: ${d.n}! (${why})`); pfloat(g, `🐎 ${d.n}`, "#ffe08a", now, -26);
  setStatus(g, `¡Conseguiste la montura ${d.n}! Móntala desde «🐎 Monturas».`, now, "#ffe08a"); mtMsg(g, `¡${d.n} ya es tuya!`); return true;
}
function buyMountCoins(g: Game, id: string, now: number): boolean {
  const d = mountDef(id); if (!d || d.src !== "coins") return false;
  if (ownsMount(g, id)) { coinMsg(g, "Ya tienes esa montura.", true); mtMsg(g, "Ya tienes esa montura.", true); return false; }
  if (!spend(g, d.price)) { mtMsg(g, cs(g).msg, true); return false; }
  grantMount(g, id, "Tienda de Edisar Coins", now); coinMsg(g, `Compraste ${d.n} por ${d.price} coins. Móntala desde «🐎 Monturas».`); return true;
}
function stableNear(g: Game): boolean { return regionOf(g.p.x, g.p.y) === 0 && cheb(g.p.x, g.p.y, STABLE_X, STABLE_Y) <= 2; }
function buyMountGold(g: Game, id: string, now: number): boolean {
  const d = mountDef(id); if (!d || d.src !== "gold") return false;
  if (ownsMount(g, id)) { mtMsg(g, "Ya tienes esa montura.", true); return false; }
  if (!stableNear(g)) { mtMsg(g, `Cómprala con ${STABLE_NAME}, en la esquina de Villa Esmeralda.`, true); return false; }
  if (g.p.gold < d.price) { mtMsg(g, `Te falta oro: cuesta ${d.price.toLocaleString("es-MX")} y tienes ${g.p.gold.toLocaleString("es-MX")}.`, true); return false; }
  g.p.gold -= d.price; return grantMount(g, id, `comprada a ${STABLE_NAME}`, now);
}
function requestStable(g: Game, now: number): void {
  const s = mt(g);
  if (stableNear(g)) { s.open = true; s.msg = ""; g.walkGoal = null; if (g.dep) g.dep.open = false; return; }
  if (regionOf(g.p.x, g.p.y) !== 0) { s.open = true; mtMsg(g, "Tomás está en el establo de Villa Esmeralda.", true); return; }
  g.walkGoal = { x: STABLE_X, y: STABLE_Y, open: true }; if (g.cs) g.cs.exWalk = false; g.chase = false; setStatus(g, "Caminando hacia el establo de Tomás...", now);
}
// Botín de jefes: cada montura domable tiene su jefe y su probabilidad
function mountDrop(g: Game, m: Mon, now: number, r?: number): boolean {
  for (const d of MOUNTS) if (d.src === "boss" && d.mon === m.def.id && !ownsMount(g, d.id) && (r ?? Math.random()) < (d.chance ?? 0)) return grantMount(g, d.id, `domada tras vencer a ${m.def.name}`, now);
  return false;
}
interface SaveMT { owned: string[]; active: string; riding: boolean; }
interface SaveData { mt?: SaveMT; }
function saveMt(g: Game): SaveMT | undefined { const s = g.mt; if (!s || s.owned.length === 0) return undefined; return { owned: [...s.owned], active: s.active, riding: s.riding }; }
function readMt(v: unknown): SaveMT | undefined {
  if (!isObj(v)) return undefined; const o = v["owned"]; const owned: string[] = [];
  if (Array.isArray(o)) for (const x of o) if (typeof x === "string" && mountDef(x) && !owned.includes(x)) owned.push(x);
  const first = owned[0]; if (first === undefined) return undefined; const a = v["active"];
  return { owned, active: typeof a === "string" && owned.includes(a) ? a : first, riding: v["riding"] === true };
}
function loadMt(g: Game, s: SaveMT | undefined): void { if (!s) return; const t = mt(g); t.owned = [...s.owned]; t.active = s.active; t.riding = s.riding; }
function mtFlip(g: Game, face: Dir): boolean { const s = mt(g); if (face === 3) s.flip = true; else if (face === 1) s.flip = false; return s.flip; }
// Dibujo: la montura mira a la derecha (o a la izquierda si flip); el jinete va encima
function drawMount(ctx: CanvasRenderingContext2D, d: MountDef, x: number, y: number, flip: boolean, phase: number, now: number): void {
  ctx.save(); if (flip) { ctx.translate(x * 2 + 32, 0); ctx.scale(-1, 1); }
  const lg = phase === 1 ? 2 : phase === 2 ? -2 : 0; const k = d.kind; const b = d.body, dk = d.dark, mn = d.mane;
  ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.beginPath(); ctx.ellipse(x + 16, y + 29, 13, 3, 0, 0, Math.PI * 2); ctx.fill();
  if (k === "dragon" || k === "pegasus") { const w = Math.round(Math.sin(now / 160) * 3); ctx.fillStyle = mn; ctx.beginPath(); ctx.moveTo(x + 10, y + 15); ctx.lineTo(x + 4, y + 3 + w); ctx.lineTo(x + 19, y + 13); ctx.closePath(); ctx.fill(); }
  const short = k === "boar" || k === "wolf" || k === "lion"; const ly = short ? 23 : 21, lh = short ? 6 : 8;
  ctx.fillStyle = dk; ctx.fillRect(x + 7 + lg, y + ly, 3, lh); ctx.fillRect(x + 11 - lg, y + ly, 3, lh); ctx.fillRect(x + 20 + lg, y + ly, 3, lh); ctx.fillRect(x + 24 - lg, y + ly, 3, lh);
  ctx.fillStyle = mn; if (k === "wolf" || k === "lion") ctx.fillRect(x + 1, y + 14, 5, 4); else ctx.fillRect(x + 3, y + 15, 3, 8);
  ctx.fillStyle = b; ctx.fillRect(x + 5, y + (short ? 16 : 14), 22, short ? 8 : 9); ctx.fillStyle = dk; ctx.fillRect(x + 6, y + 22, 20, 1);
  if (k === "horse" || k === "donkey" || k === "pegasus") {
    ctx.fillStyle = b; ctx.fillRect(x + 22, y + 8, 5, 9); ctx.fillRect(x + 24, y + 6, 7, 5);
    ctx.fillStyle = mn; ctx.fillRect(x + 21, y + 6, 2, 9); ctx.fillRect(x + 24, y + (k === "donkey" ? 1 : 3), 2, k === "donkey" ? 5 : 3);
    ctx.fillStyle = dk; ctx.fillRect(x + 29, y + 9, 2, 2);
  } else if (k === "wolf" || k === "lion") {
    if (k === "lion") { ctx.fillStyle = mn; ctx.fillRect(x + 20, y + 8, 10, 11); }
    ctx.fillStyle = b; ctx.fillRect(x + 23, y + 10, 7, 7); ctx.fillRect(x + 29, y + 13, 3, 3);
    if (k === "wolf") { ctx.fillRect(x + 23, y + 7, 2, 3); ctx.fillRect(x + 27, y + 7, 2, 3); }
  } else if (k === "boar" || k === "bull") {
    ctx.fillStyle = b; ctx.fillRect(x + 25, y + 13, 6, 8); ctx.fillStyle = dk; ctx.fillRect(x + 29, y + 17, 3, 3);
    ctx.fillStyle = "#f4ecd8"; if (k === "boar") { ctx.fillRect(x + 30, y + 19, 2, 3); } else { ctx.fillRect(x + 24, y + 10, 2, 4); ctx.fillRect(x + 29, y + 10, 2, 4); }
    ctx.fillStyle = mn; ctx.fillRect(x + 7, y + 13, 17, 3);
  } else {
    ctx.fillStyle = b; ctx.fillRect(x + 23, y + 7, 4, 9); ctx.fillRect(x + 25, y + 4, 7, 5); ctx.fillStyle = mn;
    for (let s = 0; s < 4; s++) ctx.fillRect(x + 7 + s * 4, y + 12, 2, 2);
    const fl = Math.sin(now / 90) > 0.6; if (fl) { ctx.fillStyle = "#ffb040"; ctx.fillRect(x + 32, y + 6, 3, 2); }
  }
  ctx.fillStyle = "#222"; ctx.fillRect(x + (k === "boar" || k === "bull" ? 28 : 27), y + (k === "boar" || k === "bull" ? 15 : k === "wolf" || k === "lion" ? 12 : 7), 2, 2);
  ctx.fillStyle = "#7a2a1a"; ctx.fillRect(x + 11, y + (short ? 14 : 12), 10, 4); ctx.fillStyle = "#d8a93a"; ctx.fillRect(x + 11, y + (short ? 17 : 15), 10, 1);
  ctx.restore();
}
function drawRider(ctx: CanvasRenderingContext2D, g: Game, d: MountDef, x: number, y: number, face: Dir, phase: number, flip: boolean, now: number, robe: string, trim: string): void {
  const bob = phase === 0 ? 0 : 1; drawMount(ctx, d, x, y - bob, flip, phase, now);
  ctx.save(); ctx.beginPath(); ctx.rect(x - 16, y - 40, 64, 58 - bob); ctx.clip();
  drawHuman(ctx, x, y - 8 - bob, robe, trim, g.cls.hat, lookOf(g), face, 0, hasShield(g), weaponInfo(g).elem); ctx.restore();
  ctx.fillStyle = robe; ctx.fillRect(x + (flip ? 17 : 11), y + 15 - bob, 4, 6); ctx.fillStyle = "#3a2a1a"; ctx.fillRect(x + (flip ? 17 : 11), y + 20 - bob, 4, 2);
  ctx.save(); ctx.beginPath(); ctx.rect(flip ? x - 6 : x + 22, y - 2, 16, 20); ctx.clip(); drawMount(ctx, d, x, y - bob, flip, phase, now); ctx.restore(); // cabeza y cuello por delante del jinete
}

// ===================== Depósito (estilo Tibia): baúl junto al templo =====================
const DEPOT_X = 41, DEPOT_Y = 29 + OY; const DEPOT_MAX = 80;
interface DepotState { items: Inst[]; open: boolean; msg: string; msgBad: boolean; }
interface Game { dep?: DepotState; }
function dep(g: Game): DepotState { if (!g.dep) g.dep = { items: [], open: false, msg: "", msgBad: false }; return g.dep; }
function depMsg(g: Game, text: string, bad?: boolean): void { const d = dep(g); d.msg = text; d.msgBad = !!bad; }
function inTown(g: Game): boolean { return regionOf(g.p.x, g.p.y) === 0 && isSafe(g.p.x, g.p.y); }
function depotNear(g: Game): boolean { return inTown(g) && cheb(g.p.x, g.p.y, DEPOT_X, DEPOT_Y) <= 1; }
// Sólo se abre en Villa Esmeralda: al lado del baúl se abre; desde el pueblo caminas hasta él
function requestDepot(g: Game, now: number): void {
  const d = dep(g);
  if (!inTown(g)) { setStatus(g, "Tu depósito está en Villa Esmeralda, junto al templo.", now); return; }
  if (depotNear(g)) { d.open = true; d.msg = ""; g.walkGoal = null; g.shopOpen = false; if (g.cs) g.cs.exOpen = false; return; }
  g.walkGoal = { x: DEPOT_X, y: DEPOT_Y, open: true }; if (g.cs) g.cs.exWalk = false; g.chase = false; setStatus(g, "Caminando hacia tu depósito...", now);
}
function depotTick(g: Game): void { const d = g.dep; if (d && d.open && (!inTown(g) || cheb(g.p.x, g.p.y, DEPOT_X, DEPOT_Y) > 2 || g.shopOpen || (!!g.cs && g.cs.exOpen))) d.open = false; }
// Mochila → depósito (en la casilla «at» si se indica). Si está lleno no se mueve nada.
function depositItem(g: Game, bagIdx: number, at?: number): boolean {
  const d = dep(g); const it = g.p.bag[bagIdx]; if (!it || !d.open) return false;
  if (d.items.length >= DEPOT_MAX) { depMsg(g, `El depósito está lleno (${DEPOT_MAX}/${DEPOT_MAX}).`, true); return false; }
  g.p.bag.splice(bagIdx, 1); const k = at === undefined ? d.items.length : clamp(at, 0, d.items.length); d.items.splice(k, 0, it);
  depMsg(g, `Guardaste ${itemName(it)}.`); return true;
}
// Depósito → mochila. Si la mochila está llena no se mueve nada.
function withdrawItem(g: Game, depIdx: number, at?: number): boolean {
  const d = dep(g); const it = d.items[depIdx]; if (!it || !d.open) return false;
  if (g.p.bag.length >= bagMax(g)) { depMsg(g, "Tu mochila está llena: libera espacio para sacar objetos.", true); return false; }
  d.items.splice(depIdx, 1); const k = at === undefined ? g.p.bag.length : clamp(at, 0, g.p.bag.length); g.p.bag.splice(k, 0, it);
  depMsg(g, `Sacaste ${itemName(it)}.`); return true;
}
function depositAll(g: Game): number {
  let n = 0; while (g.p.bag.length > 0 && depositItem(g, 0)) n++;
  if (n > 0) depMsg(g, `Guardaste ${n} objeto${n > 1 ? "s" : ""}${g.p.bag.length > 0 ? " (el depósito se llenó)" : ""}.`, g.p.bag.length > 0); return n;
}
function reorderDep(g: Game, from: number, to: number): boolean {
  const b = dep(g).items; const it = b[from]; if (!it) return false; const k = clamp(to, 0, b.length - 1); if (k === from) return false;
  b.splice(from, 1); b.splice(k, 0, it); return true;
}
// Arrastrar y soltar con el depósito (envuelve applyDrop)
type DragSrcX = DragSrc | { kind: "dep"; uid: number };
type DropDstX = DropDst | { kind: "dep"; k: number };
function applyDropX(g: Game, src: DragSrcX, dst: DropDstX | null, now: number): boolean {
  if (!dst) return false; const d = dep(g);
  if (src.kind === "dep") {
    const idx = d.items.findIndex((i: Inst) => i.uid === src.uid); if (idx < 0) return false;
    if (dst.kind === "dep") return dst.k < DEPOT_MAX && reorderDep(g, idx, dst.k);
    if (dst.kind === "bag") return withdrawItem(g, idx, dst.k);
    if (dst.kind === "eq") { const it = d.items[idx]; if (!withdrawItem(g, idx)) return false; const bi = g.p.bag.findIndex((i: Inst) => i === it); if (bi >= 0) equipItem(g, bi, now); return true; }
    depMsg(g, "Primero sácalo a la mochila.", true); return false;
  }
  if (dst.kind === "dep") {
    if (src.kind === "bag") { const idx = g.p.bag.findIndex((i: Inst) => i.uid === src.uid); return idx >= 0 && depositItem(g, idx, dst.k); }
    if (src.kind === "eq") { const it = g.p.eq[src.slot]; if (!it || !d.open) return false; if (d.items.length >= DEPOT_MAX) { depMsg(g, `El depósito está lleno (${DEPOT_MAX}/${DEPOT_MAX}).`, true); return false; }
      if (g.p.bag.length >= bagMax(g)) { depMsg(g, "Mochila llena: quítatelo primero a la mochila.", true); return false; }
      unequip(g, src.slot, now); const bi = g.p.bag.findIndex((i: Inst) => i === it); return bi >= 0 && depositItem(g, bi, dst.k); }
    depMsg(g, "Recógelo primero en la mochila.", true); return false;
  }
  return applyDrop(g, src, dst, now);
}
interface SaveData { dep?: SaveItem[]; }
function readDep(v: unknown): SaveItem[] { const out: SaveItem[] = []; if (!Array.isArray(v)) return out; for (const x of v.slice(0, DEPOT_MAX)) { const i = readItem(x); if (i) out.push(saveItem(i)); } return out; }
function loadDep(g: Game, s: SaveItem[] | undefined): void { dep(g).items = (s ?? []).slice(0, DEPOT_MAX).map((i: SaveItem) => ({ uid: i.uid, id: i.id, rar: i.rar })); }
function drawDepot(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(x + 4, y + 25, 25, 4);
  ctx.fillStyle = "#6a4022"; ctx.fillRect(x + 4, y + 12, 24, 15); ctx.fillStyle = "#8a5630"; ctx.fillRect(x + 4, y + 7, 24, 7);
  ctx.fillStyle = "#d8a93a"; ctx.fillRect(x + 4, y + 13, 24, 2); ctx.fillRect(x + 8, y + 7, 2, 20); ctx.fillRect(x + 22, y + 7, 2, 20); ctx.fillRect(x + 14, y + 14, 4, 5);
  ctx.strokeStyle = "#2a1a0a"; ctx.lineWidth = 1; ctx.strokeRect(x + 4.5, y + 7.5, 23, 19);
}

// ===================== Guardado (código de partida) =====================
const SAVE_VER = 2; const SAVE_PREFIX = "EDISAR2"; const LS_KEY = "edisar.autosave.v1";
interface SaveItem { uid: number; id: string; rar: Rarity; st: Partial<Stats>; }
interface SaveData {
  v: number; name: string; cls: ClassId; level: number; exp: number; hp: number; mana: number; maxHp: number; maxMana: number;
  gold: number; hpPot: number; manaPot: number; magicLevel: number; sk: Record<SkillId, SkillVal>;
  eq: Record<Slot, SaveItem | null>; bag: SaveItem[]; binds: Binds; x: number; y: number; deaths: number; kills: number; nextUid: number; savedAt: number;
}
interface SaveData { hpPot2: number; manaPot2: number; cleared: number; quests: QuestSt[]; bossKills: number[]; mz?: number; }
type DecodeResult = { ok: true; data: SaveData } | { ok: false; error: string };
function saveItem(i: Inst): SaveItem { const st: Partial<Stats> = {}; for (const k of STAT_KEYS) { const v = istat(i, k); if (v) st[k] = v; } return { uid: i.uid, id: i.id, rar: i.rar, st }; }
function snapshot(g: Game, binds: Binds, savedAt?: number): SaveData {
  const p = g.p; const eq = {} as Record<Slot, SaveItem | null>;
  for (const s of SLOTS) { const i = p.eq[s]; eq[s] = i ? saveItem(i) : null; }
  const sk = {} as Record<SkillId, SkillVal>; for (const k of SKILL_IDS) sk[k] = { lvl: p.sk[k].lvl, tries: p.sk[k].tries };
  return { v: SAVE_VER, name: p.name, cls: g.cls.id, level: p.level, exp: p.exp, hp: Math.max(1, Math.round(p.hp)), mana: Math.max(0, Math.round(p.mana)), maxHp: maxHp(g), maxMana: maxMana(g),
    gold: p.gold, hpPot: p.hpPot, manaPot: p.manaPot, magicLevel: p.sk.magic.lvl, sk, eq, bag: p.bag.map(saveItem), binds: cloneBinds(binds),
    x: p.x, y: p.y, deaths: g.deaths, kills: g.kills, nextUid: g.nextUid, savedAt: savedAt ?? Date.now(),
    hpPot2: p.hpPot2, manaPot2: p.manaPot2, cleared: g.cleared, quests: g.quests.map((q: QuestSt) => ({ ...q })), bossKills: [...g.bossKills], mz: g.miniZoom ?? 1, cs: saveCS(g), dep: dep(g).items.map(saveItem), mt: saveMt(g) };
}
function fnv(s: string): string { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, "0"); }
function b64enc(s: string): string { const bytes = new TextEncoder().encode(s); let bin = ""; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] ?? 0); return btoa(bin); }
function b64dec(s: string): string { const bin = atob(s); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
function encodeSave(d: SaveData): string { const body = b64enc(JSON.stringify(d)); return `${SAVE_PREFIX}-${fnv(body)}-${body}`; }
function isObj(v: unknown): v is Record<string, unknown> { return typeof v === "object" && v !== null && !Array.isArray(v); }
function numIn(v: unknown, lo: number, hi: number): number | null { return typeof v === "number" && isFinite(v) && v >= lo && v <= hi ? v : null; }
function intIn(v: unknown, lo: number, hi: number): number | null { const n = numIn(v, lo, hi); return n !== null && Math.floor(n) === n ? n : null; }
function readItem(v: unknown): Inst | null {
  if (!isObj(v)) return null; const id = v["id"], rar = v["rar"], uid = intIn(v["uid"], 0, 1e9);
  if (typeof id !== "string" || !ITEM[id] || uid === null) return null;
  if (typeof rar !== "string" || !Object.prototype.hasOwnProperty.call(RAR, rar)) return null;
  return { uid, id, rar: rar as Rarity };
}
function validateSave(raw: unknown): DecodeResult {
  const bad = (what: string): DecodeResult => ({ ok: false, error: `El código está dañado (${what} no es válido). Asegúrate de copiarlo completo, sin cambiar nada.` });
  if (!isObj(raw)) return bad("el contenido");
  const ver = raw["v"]; if (ver !== SAVE_VER && ver !== 1) return { ok: false, error: "Este código es de otra versión del juego y no se puede cargar." };
  const cls = raw["cls"]; if (typeof cls !== "string" || !Object.prototype.hasOwnProperty.call(CLASSES, cls)) return bad("la vocación");
  const nameRaw = raw["name"]; if (typeof nameRaw !== "string" || !nameRaw.trim()) return bad("el nombre");
  const name = nameRaw.trim().slice(0, 16);
  const exp = intIn(raw["exp"], 0, 1e13); if (exp === null) return bad("la experiencia");
  const level = intIn(raw["level"], 1, 500); if (level === null) return bad("el nivel");
  const hp = numIn(raw["hp"], 0, 1e7), mana = numIn(raw["mana"], 0, 1e7); if (hp === null || mana === null) return bad("la vida o el maná");
  const gold = intIn(raw["gold"], 0, 1e12), hpPot = intIn(raw["hpPot"], 0, 1e6), manaPot = intIn(raw["manaPot"], 0, 1e6);
  if (gold === null || hpPot === null || manaPot === null) return bad("el oro o las pociones");
  const skRaw = raw["sk"]; if (!isObj(skRaw)) return bad("las habilidades");
  const sk = {} as Record<SkillId, SkillVal>;
  for (const k of SKILL_IDS) { const s = skRaw[k]; if (!isObj(s)) return bad("las habilidades"); const lvl = intIn(s["lvl"], 0, 300), tries = numIn(s["tries"], 0, 1e12); if (lvl === null || tries === null) return bad("las habilidades"); sk[k] = { lvl, tries }; }
  const eqRaw = raw["eq"]; if (!isObj(eqRaw)) return bad("el equipo");
  const eq = {} as Record<Slot, SaveItem | null>;
  for (const s of SLOTS) { const v = eqRaw[s]; if (v === null || v === undefined) { eq[s] = null; continue; } const i = readItem(v); const d = i ? ITEM[i.id] : undefined; if (!i || !d || d.slot !== s) return bad("el equipo"); eq[s] = saveItem(i); }
  const bagRaw = raw["bag"]; if (!Array.isArray(bagRaw) || bagRaw.length > BAG_CAP) return bad("la mochila");
  const bag: SaveItem[] = []; for (const v of bagRaw) { const i = readItem(v); if (!i) return bad("la mochila"); bag.push(saveItem(i)); }
  const bRaw = raw["binds"]; const binds = cloneBinds(DEFAULT_BINDS);
  if (isObj(bRaw)) for (const a of ACTIONS) { const arr = bRaw[a.id]; if (Array.isArray(arr) && arr.every((c: unknown) => typeof c === "string" && c.length > 0 && c.length < 40)) binds[a.id] = (arr as string[]).slice(0, 6); }
  if (isObj(bRaw) && !Array.isArray(bRaw["keys"]) && ACTIONS.some((a: { id: Action; label: string }) => a.id !== "keys" && binds[a.id].includes("KeyH"))) binds.keys = [];
  if (isObj(bRaw) && !Array.isArray(bRaw["coins"]) && ACTIONS.some((a: { id: Action; label: string }) => a.id !== "coins" && binds[a.id].includes("KeyK"))) binds.coins = [];
  if (isObj(bRaw) && !Array.isArray(bRaw["mount"]) && ACTIONS.some((a: { id: Action; label: string }) => a.id !== "mount" && binds[a.id].includes("KeyR"))) binds.mount = [];
  const x = intIn(raw["x"], 0, MW - 1), y0 = intIn(raw["y"], 0, MH - 1); if (x === null || y0 === null) return bad("la posición");
  const y = ver === 1 ? Math.min(MH - 1, y0 + OY) : y0; // las partidas v1 usaban el mapa sin el Santuario
  const hpPot2 = intIn(raw["hpPot2"], 0, 1e6) ?? 0, manaPot2 = intIn(raw["manaPot2"], 0, 1e6) ?? 0, cleared = intIn(raw["cleared"], 0, NH) ?? 0;
  const qRaw = raw["quests"], bkRaw = raw["bossKills"];
  const quests: QuestSt[] = HOUSES.map((H: HouseDef, i: number): QuestSt => { const q = Array.isArray(qRaw) ? qRaw[i] : undefined; if (!isObj(q)) return { e: false, k: 0, b: false, d: false }; return { e: q["e"] === true, k: intIn(q["k"], 0, H.quest.n) ?? 0, b: q["b"] === true, d: q["d"] === true }; });
  const bossKills: number[] = HOUSES.map((_: HouseDef, i: number): number => (Array.isArray(bkRaw) ? intIn(bkRaw[i], 0, 1e9) : null) ?? 0);
  const deaths = intIn(raw["deaths"], 0, 1e9) ?? 0, kills = intIn(raw["kills"], 0, 1e12) ?? 0, nextUid = intIn(raw["nextUid"], 1, 1e9) ?? 1;
  const savedAt = numIn(raw["savedAt"], 0, 1e15) ?? 0; const mz = miniZoomClamp(numIn(raw["mz"], 1, 4) ?? 1);
  const c = CLASSES[cls as ClassId];
  const tmp = newGame(c, name); const lv = Math.max(1, levelFor(exp));
  tmp.p.level = lv; for (const s of SLOTS) { const si = eq[s]; tmp.p.eq[s] = si ? { uid: si.uid, id: si.id, rar: si.rar } : null; } refreshStats(tmp);
  return { ok: true, data: { v: SAVE_VER, name, cls: c.id, level: lv, exp, hp, mana, maxHp: maxHp(tmp), maxMana: maxMana(tmp), gold, hpPot, manaPot, magicLevel: sk.magic.lvl, sk, eq, bag, binds, x, y, deaths, kills, nextUid, savedAt, hpPot2, manaPot2, cleared, quests, bossKills, mz, cs: readCS(raw["cs"]), dep: readDep(raw["dep"]), mt: readMt(raw["mt"]) } };
}
function decodeSave(code: string): DecodeResult {
  const s = code.replace(/\s+/g, "");
  if (!s) return { ok: false, error: "Primero pega tu código de guardado en el cuadro." };
  const parts = s.split("-"); const pre = parts[0] ?? "", sum = parts[1] ?? "", body = parts[2] ?? "";
  if (parts.length !== 3 || !pre.startsWith("EDISAR")) return { ok: false, error: "Ese texto no parece un código de Edisar. Debe empezar por «EDISAR2-» (o «EDISAR1-» si es antiguo). Cópialo completo desde el botón «Guardar»." };
  if (pre !== SAVE_PREFIX && pre !== "EDISAR1") return { ok: false, error: "Este código es de otra versión del juego y no se puede cargar." };
  if (fnv(body) !== sum.toLowerCase()) return { ok: false, error: "El código está incompleto o tiene algún carácter cambiado. Vuelve a copiarlo entero." };
  let raw: unknown = null;
  try { raw = JSON.parse(b64dec(body)); } catch { return { ok: false, error: "No se pudo leer el código: parece dañado. Vuelve a copiarlo entero." }; }
  return validateSave(raw);
}
function gameFromSave(d: SaveData): Game {
  const g = newGame(CLASSES[d.cls], d.name); const p = g.p;
  p.exp = d.exp; p.level = Math.max(1, levelFor(d.exp)); p.gold = d.gold; p.hpPot = d.hpPot; p.manaPot = d.manaPot; p.hpPot2 = d.hpPot2; p.manaPot2 = d.manaPot2;
  g.cleared = d.cleared; g.quests = d.quests.map((q: QuestSt) => ({ ...q })); g.bossKills = [...d.bossKills];
  for (const k of SKILL_IDS) { const s = d.sk[k]; p.sk[k] = { lvl: s.lvl, tries: s.tries }; }
  for (const s of SLOTS) { const i = d.eq[s]; p.eq[s] = i ? { uid: i.uid, id: i.id, rar: i.rar } : null; }
  loadCS(g, d.cs); p.bag = d.bag.slice(0, bagMax(g)).map((i: SaveItem) => ({ uid: i.uid, id: i.id, rar: i.rar }));
  g.deaths = d.deaths; g.kills = d.kills; g.miniZoom = miniZoomClamp(d.mz ?? 1);
  loadDep(g, d.dep); loadMt(g, d.mt); let mu = 0; for (const s of SLOTS) mu = Math.max(mu, p.eq[s]?.uid ?? 0); for (const i of p.bag) mu = Math.max(mu, i.uid); for (const i of dep(g).items) mu = Math.max(mu, i.uid);
  g.nextUid = Math.max(d.nextUid, mu + 1);
  refreshStats(g); p.hp = clamp(d.hp, 1, maxHp(g)); p.mana = clamp(d.mana, 0, maxMana(g));
  let spot: [number, number] | null = canPlayerEnter(g, d.x, d.y) ? [d.x, d.y] : null;
  if (!spot) for (const [dx, dy] of DIRS8) { if (canPlayerEnter(g, d.x + dx, d.y + dy)) { spot = [d.x + dx, d.y + dy]; break; } }
  const [sx, sy] = spot ?? [TEMPLE_X, TEMPLE_Y];
  p.x = sx; p.y = sy; p.fx = sx; p.fy = sy; p.moveStart = 0; g.zone = zoneName(g, sx, sy);
  const now = performance.now();
  addLog(g, `Partida cargada: ${d.name}, ${g.cls.name} nivel ${p.level}.`); setStatus(g, `¡Bienvenido de vuelta, ${d.name}!`, now, "#7dffb0");
  return g;
}
function lsGet(k: string): string | null { try { if (typeof window === "undefined" || !window.localStorage) return null; return window.localStorage.getItem(k); } catch { return null; } }
function lsSet(k: string, v: string): boolean { try { if (typeof window === "undefined" || !window.localStorage) return false; window.localStorage.setItem(k, v); return true; } catch { return false; } }

// ===================== Bucle de actualización =====================
function update(g: Game, now: number): void {
  const p = g.p;
  if (now >= p.moveStart + p.moveDur && p.bag.length < bagMax(g) && g.ground.some((gi: Ground) => gi.x === p.x && gi.y === p.y && autoPick(g, gi, now, true))) pickUp(g, p.x, p.y, now, true);
  if (now >= p.moveStart + p.moveDur) {
    const v = moveVec(g.heldDirs);
    if (v) { g.walkGoal = null; g.chase = false; tryStep(g, v[0], v[1], now); }
    else if (g.pending) { const [dx, dy] = g.pending; g.pending = null; g.walkGoal = null; g.chase = false; tryStep(g, dx, dy, now); }
    else if (g.walkGoal) walkStep(g, now);
    else if (g.chase && !g.afk) chaseStep(g, now);
  }
  if (g.afk && now >= g.afkNext) { g.afkNext = now + 150; afkThink(g, now); }
  autoAttack(g, now);
  const reg = regionOf(p.x, p.y);
  for (const m of g.byRegion[reg] ?? []) stepMon(g, m, now);
  stepMinion(g, now);
  const keep: Proj[] = [];
  for (const pr of g.projs) {
    if (now < pr.born + pr.dur) { keep.push(pr); continue; }
    const m = findMon(g, pr.target);
    if (m && m.alive) { hitMon(g, m, pr.dmg, pr.elem, now, pr.leech); if (pr.slow > 0 && m.alive) m.slowUntil = now + pr.slow; }
  }
  g.projs = keep;
  for (const f of g.fields) if (now >= f.next) { f.next = now + 1000; const m = monAt(g, f.x, f.y); if (m) damageMon(g, m, roll(f.min, f.max), now, f.elem); }
  g.fields = g.fields.filter((f: Field) => now < f.until);
  if (now >= g.nextRegen) {
    g.nextRegen = now + 1000; const k = isSafe(p.x, p.y) ? 3 : 1; const c = g.cls;
    p.hp = Math.min(maxHp(g), p.hp + (c.hpRegen + p.level * c.hpRegenPer) * k);
    p.mana = Math.min(maxMana(g), p.mana + (c.manaRegen + p.level * c.manaRegenPer) * k);
  }
  if (p.hotUntil > now && now >= p.hotNext) { p.hotNext = now + 1000; const a = roll(p.hotMin, p.hotMax); p.hp = Math.min(maxHp(g), p.hp + a); pfloat(g, `+${a}`, "#5cff7a", now); }
  if (p.poisonUntil > now && now >= p.poisonNext) { p.poisonNext = now + 1000; p.hp -= p.poisonDmg; p.hitAt = now; pfloat(g, String(p.poisonDmg), "#7ad13a", now); if (p.hp <= 0) die(g, now); }
  if (g.warns.length > 0) {
    const keepW: Warn[] = [];
    for (const w of g.warns) {
      if (now < w.at) { keepW.push(w); continue; }
      g.fx.push({ cells: w.cells, elem: w.elem, born: now });
      if (w.cells.some((c: [number, number]) => c[0] === p.x && c[1] === p.y)) specialHit(g, roll(w.min, w.max), now);
    }
    g.warns = keepW;
  }
  if (g.returnAt > 0 && now >= g.returnAt) {
    g.returnAt = 0; const r = regionOf(p.x, p.y);
    if (r > 0) { resetRegion(g, r); g.heldDirs = []; teleport(g, TEMPLE_X, TEMPLE_Y, now); setStatus(g, "Has vuelto al templo de Villa Esmeralda.", now, "#7dffb0"); }
  }
  if (!isFinite(p.hp)) p.hp = maxHp(g); if (!isFinite(p.mana)) p.mana = 0;
  if (p.mana < 0) p.mana = 0;
  g.fx = g.fx.filter((f: AreaFx) => now - f.born < 450);
  g.floats = g.floats.filter((f: Floater) => now - f.born < 1200);
  g.ground = g.ground.filter((gi: Ground) => now < gi.until);
  if (g.ground.length > 80) { const bg = g.ground.filter((gi: Ground) => !!gi.boss), rest = g.ground.filter((gi: Ground) => !gi.boss); g.ground = [...rest.slice(Math.max(0, rest.length - 80)), ...bg]; }
  if (g.shopOpen && cheb(p.x, p.y, NPC_X, NPC_Y) > 6) g.shopOpen = false;
  coinTick(g, now); depotTick(g);
  const [px, py] = drawPos(p, now);
  const rr = regionRect(regionOf(p.x, p.y));
  const vw = viewW(g); g.camX = clamp(px * TS + TS / 2 - vw / 2, rr[0] * TS, (rr[0] + rr[2]) * TS - vw); g.camY = clamp(py * TS + TS / 2 - VH / 2, rr[1] * TS, (rr[1] + rr[3]) * TS - VH);
}

// ===================== Dibujo: mundo =====================
const TILE_COL: Record<number, string> = { 0: "#3f8f3a", 1: "#2f6f2c", 2: "#2a5fa8", 3: "#6b6158", 4: "#8a6f4e", 5: "#cfc6b8", 6: "#4a4038", 7: "#5a4b3c", 8: "#d8c48a", 9: "#a88a5a", 10: "#d8c48a", 11: "#2a1440", 12: "#d8d2c4", 13: "#8a6a2a" };
function drawTile(ctx: CanvasRenderingContext2D, t: number, x: number, y: number, wx: number, wy: number, now: number): void {
  const h = hash(wx, wy);
  ctx.fillStyle = TILE_COL[t] ?? "#000"; ctx.fillRect(x, y, TS, TS);
  if (t === GRASS || t === TREE) {
    ctx.fillStyle = "#4c9e44"; for (let k = 0; k < 3; k++) ctx.fillRect(x + ((h >> (k * 5)) % 28), y + ((h >> (k * 5 + 3)) % 28), 2, 3);
    if (t === TREE) {
      ctx.fillStyle = "#5a3a1e"; ctx.fillRect(x + 13, y + 18, 6, 12);
      ctx.fillStyle = "#1f5a22"; ctx.beginPath(); ctx.arc(x + 16, y + 13, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2f7a2e"; ctx.beginPath(); ctx.arc(x + 12, y + 10, 6, 0, Math.PI * 2); ctx.fill();
    }
  } else if (t === WATER) {
    const o = Math.sin(now / 600 + wx * 0.7 + wy) * 3;
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.beginPath(); ctx.moveTo(x + 4, y + 12 + o); ctx.lineTo(x + 14, y + 10 + o); ctx.moveTo(x + 16, y + 24 - o); ctx.lineTo(x + 28, y + 22 - o); ctx.stroke();
  } else if (t === WALL) {
    ctx.fillStyle = "#857a70"; for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) ctx.fillRect(x + c * 16 + (r % 2) * 8 - 6, y + r * 8 + 1, 14, 6);
  } else if (t === FLOOR) {
    ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.strokeRect(x + 0.5, y + 0.5, TS - 1, TS - 1);
  } else if (t === TEMPLE) {
    ctx.strokeStyle = "#b8ad9c"; ctx.strokeRect(x + 0.5, y + 0.5, 15, 15); ctx.strokeRect(x + 16.5, y + 16.5, 15, 15);
  } else if (t === ROCK) {
    ctx.fillStyle = "#5a5046"; ctx.fillRect(x + (h % 10), y + ((h >> 4) % 10), 14, 10); ctx.fillStyle = "#3a322c"; ctx.fillRect(x + 16, y + 18, 12, 8);
  } else if (t === CAVE) {
    ctx.fillStyle = "#4c3f33"; ctx.fillRect(x + (h % 26), y + ((h >> 3) % 26), 4, 3);
  } else if (t === SAND || t === BOULDER) {
    ctx.fillStyle = "#c8b47a"; ctx.fillRect(x + (h % 28), y + ((h >> 5) % 28), 3, 2);
    if (t === BOULDER) { ctx.fillStyle = "#8a7c6a"; ctx.beginPath(); ctx.ellipse(x + 16, y + 18, 12, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#a89a86"; ctx.beginPath(); ctx.ellipse(x + 12, y + 14, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
  } else if (t === PATH) {
    ctx.fillStyle = "#977a4c"; ctx.fillRect(x + (h % 26), y + ((h >> 4) % 26), 5, 3);
  } else if (t === MARBLE) {
    const H = HOUSES[regionOf(wx, wy) - 1]; if (H) { ctx.globalAlpha = 0.2; ctx.fillStyle = H.tint; ctx.fillRect(x, y, TS, TS); ctx.globalAlpha = 1; }
    ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.strokeRect(x + 0.5, y + 0.5, TS - 1, TS - 1);
    if (h % 5 === 0) { ctx.strokeStyle = "rgba(110,100,90,0.35)"; ctx.beginPath(); ctx.moveTo(x + (h % 20), y + 3); ctx.lineTo(x + 6 + ((h >> 3) % 22), y + 28); ctx.stroke(); }
  } else if (t === HWALL) {
    ctx.fillStyle = "#b8963a"; for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) ctx.fillRect(x + c * 16 + (r % 2) * 8 - 6, y + r * 8 + 1, 14, 6);
    ctx.fillStyle = "rgba(255,240,180,0.25)"; ctx.fillRect(x, y, TS, 2);
  } else if (t === PORTAL) {
    const gr = ctx.createRadialGradient(x + 16, y + 16, 1, x + 16, y + 16, 16); gr.addColorStop(0, "#fff0ff"); gr.addColorStop(0.4, "#b070ff"); gr.addColorStop(1, "#2a1440");
    ctx.fillStyle = gr; ctx.fillRect(x + 2, y + 2, TS - 4, TS - 4);
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { const a = now / 280 + k * 2.09; ctx.beginPath(); ctx.arc(x + 16, y + 16, 5 + k * 3, a, a + 1.8); ctx.stroke(); } ctx.lineWidth = 1;
  }
}
function drawHat(ctx: CanvasRenderingContext2D, x: number, y: number, hat: HatStyle, trim: string, robe: string): void {
  ctx.fillStyle = robe;
  if (hat === "hood") { ctx.beginPath(); ctx.arc(x + 16, y + 9, 8, Math.PI, 0); ctx.fill(); ctx.fillRect(x + 8, y + 9, 3, 6); ctx.fillRect(x + 21, y + 9, 3, 6); }
  else if (hat === "pointy") { ctx.beginPath(); ctx.moveTo(x + 7, y + 7); ctx.lineTo(x + 25, y + 7); ctx.lineTo(x + 18, y - 8); ctx.closePath(); ctx.fill(); ctx.fillStyle = trim; ctx.fillRect(x + 7, y + 5, 18, 3); }
  else if (hat === "horns") { ctx.beginPath(); ctx.arc(x + 16, y + 9, 8, Math.PI, 0); ctx.fill(); ctx.fillStyle = trim; ctx.beginPath(); ctx.moveTo(x + 9, y + 4); ctx.lineTo(x + 5, y - 4); ctx.lineTo(x + 12, y + 3); ctx.moveTo(x + 23, y + 4); ctx.lineTo(x + 27, y - 4); ctx.lineTo(x + 20, y + 3); ctx.fill(); }
  else if (hat === "cap") { ctx.fillStyle = "#3f6b2a"; ctx.beginPath(); ctx.arc(x + 16, y + 8, 7, Math.PI, 0); ctx.fill(); ctx.fillStyle = "#e04040"; ctx.fillRect(x + 22, y + 1, 2, 7); }
  else if (hat === "mask") { ctx.fillStyle = "#1e1e24"; ctx.fillRect(x + 9, y + 2, 14, 7); ctx.fillRect(x + 9, y + 12, 14, 4); ctx.fillStyle = trim; ctx.fillRect(x + 8, y + 5, 16, 2); ctx.fillRect(x + 23, y + 5, 5, 2); }
  else if (hat === "helm") { ctx.fillStyle = "#a7adb8"; ctx.beginPath(); ctx.arc(x + 16, y + 10, 8, Math.PI, 0); ctx.fill(); ctx.fillRect(x + 8, y + 9, 16, 3); ctx.fillStyle = "#5a5f6a"; ctx.fillRect(x + 15, y + 10, 2, 6); ctx.fillStyle = trim; ctx.fillRect(x + 15, y + 1, 2, 3); }
}
function drawWeapon(ctx: CanvasRenderingContext2D, x: number, y: number, look: Look, trim: string, elem: Elem): void {
  const hx = x + 25, hy = y + 20;
  if (look === "staff") { ctx.fillStyle = "#6b4423"; ctx.fillRect(hx, y + 4, 2, 24); ctx.fillStyle = ELEM_COLOR[elem]; ctx.beginPath(); ctx.arc(hx + 1, y + 4, 3.5, 0, Math.PI * 2); ctx.fill(); }
  else if (look === "bow") { ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx - 2, hy - 4, 9, -1.2, 1.2); ctx.stroke(); ctx.strokeStyle = "#ddd"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx + 1, hy - 12); ctx.lineTo(hx + 1, hy + 4); ctx.stroke(); }
  else if (look === "sword") { ctx.fillStyle = "#dfe6ee"; ctx.fillRect(hx, hy - 14, 2, 13); ctx.fillStyle = trim; ctx.fillRect(hx - 2, hy - 1, 6, 2); ctx.fillStyle = "#5a3a1e"; ctx.fillRect(hx, hy + 1, 2, 4); }
  else if (look === "axe") { ctx.fillStyle = "#6b4423"; ctx.fillRect(hx, hy - 12, 2, 17); ctx.fillStyle = "#c9ced6"; ctx.beginPath(); ctx.moveTo(hx + 2, hy - 12); ctx.lineTo(hx + 8, hy - 15); ctx.lineTo(hx + 8, hy - 5); ctx.lineTo(hx + 2, hy - 7); ctx.fill(); }
  else if (look === "club") { ctx.fillStyle = "#6b4423"; ctx.fillRect(hx, hy - 8, 2, 13); ctx.fillStyle = "#8a8f98"; ctx.fillRect(hx - 3, hy - 14, 8, 7); }
  else if (look === "dagger") { ctx.fillStyle = "#dfe6ee"; ctx.fillRect(hx, hy - 8, 2, 7); ctx.fillStyle = "#5a3a1e"; ctx.fillRect(hx - 1, hy - 1, 4, 3); ctx.fillStyle = "#dfe6ee"; ctx.fillRect(x + 5, hy - 6, 2, 6); }
}
function drawHuman(ctx: CanvasRenderingContext2D, x: number, y: number, robe: string, trim: string, hat: HatStyle, look: Look, face: Dir, phase: number, shield: boolean, elem: Elem): void {
  const bob = phase === 0 ? 0 : 1; const lg = phase === 1 ? 2 : phase === 2 ? -2 : 0;
  ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(x + 16, y + 29, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3a2a1a"; ctx.fillRect(x + 11 + lg, y + 24, 4, 6); ctx.fillRect(x + 17 - lg, y + 24, 4, 6);
  ctx.fillStyle = robe; ctx.fillRect(x + 9, y + 14 - bob, 14, 12);
  ctx.fillStyle = trim; ctx.fillRect(x + 9, y + 24 - bob, 14, 2); ctx.fillRect(x + 15, y + 14 - bob, 2, 10);
  ctx.fillStyle = "#f0c8a0"; ctx.fillRect(x + 11, y + 5 - bob, 10, 10);
  if (face !== 0) { ctx.fillStyle = "#222"; const ex = face === 1 ? 2 : face === 3 ? -2 : 0; ctx.fillRect(x + 13 + ex, y + 9 - bob, 2, 2); ctx.fillRect(x + 17 + ex, y + 9 - bob, 2, 2); }
  drawHat(ctx, x, y - bob, hat, trim, robe);
  drawWeapon(ctx, x, y - bob, look, trim, elem);
  if (shield) { ctx.fillStyle = "#8a5a2b"; ctx.beginPath(); ctx.moveTo(x + 3, y + 14); ctx.lineTo(x + 11, y + 14); ctx.lineTo(x + 11, y + 21); ctx.lineTo(x + 7, y + 25); ctx.lineTo(x + 3, y + 21); ctx.closePath(); ctx.fill(); ctx.fillStyle = trim; ctx.fillRect(x + 6, y + 16, 2, 6); }
}
function drawBrute(ctx: CanvasRenderingContext2D, x: number, y: number, body: string, dark: string, horns: boolean, s: number, phase: number): void {
  ctx.save(); ctx.translate(x + 16, y + 30); ctx.scale(s, s); ctx.translate(-16, -30);
  const lg = phase === 1 ? 2 : phase === 2 ? -2 : 0;
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(16, 29, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = dark; ctx.fillRect(9 + lg, 22, 5, 8); ctx.fillRect(18 - lg, 22, 5, 8);
  ctx.fillStyle = body; ctx.fillRect(7, 11, 18, 13); ctx.fillRect(3, 12, 4, 10); ctx.fillRect(25, 12, 4, 10);
  ctx.fillRect(10, 3, 12, 10); ctx.fillStyle = "#ff3b3b"; ctx.fillRect(12, 7, 2, 2); ctx.fillRect(18, 7, 2, 2);
  if (horns) { ctx.fillStyle = "#eee3c8"; ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(4, -1); ctx.lineTo(11, 3); ctx.moveTo(22, 5); ctx.lineTo(28, -1); ctx.lineTo(21, 3); ctx.fill(); }
  ctx.restore();
}
function drawMonster(ctx: CanvasRenderingContext2D, m: Mon, x: number, y: number, now: number): void {
  const ph = walkPhase(m, now); const id = m.def.id;
  if (m.def.look) { drawLook(ctx, m.def.look, x, y, now, ph, !!m.def.boss, m.enraged); return; }
  if (id === "rat") {
    ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(x + 16, y + 27, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#8a8079"; ctx.beginPath(); ctx.ellipse(x + 15, y + 22, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + 23, y + 19, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#d9a0a0"; ctx.beginPath(); ctx.moveTo(x + 6, y + 22); ctx.quadraticCurveTo(x + 1, y + 16 + ph, x + 3, y + 12); ctx.stroke(); ctx.fillStyle = "#222"; ctx.fillRect(x + 24, y + 18, 2, 2);
  } else if (id === "rotworm") {
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? "#9a6a55" : "#b07e66"; ctx.beginPath(); ctx.arc(x + 7 + k * 6, y + 22 - Math.sin(now / 200 + k) * 2, 5.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#3a1a10"; ctx.beginPath(); ctx.arc(x + 26, y + 21, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (id === "troll") { drawBrute(ctx, x, y, "#5f8a3a", "#3f5f25", false, 0.95, ph); ctx.fillStyle = "#6b4423"; ctx.fillRect(x + 27, y + 8, 3, 14); }
  else if (id === "wasp") {
    const w = Math.sin(now / 40) * 4;
    ctx.fillStyle = "rgba(220,240,255,0.6)"; ctx.beginPath(); ctx.ellipse(x + 12, y + 10 + w * 0.3, 6, 3 + Math.abs(w) * 0.4, -0.5, 0, Math.PI * 2); ctx.ellipse(x + 20, y + 10 + w * 0.3, 6, 3 + Math.abs(w) * 0.4, 0.5, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? "#222" : "#f2c218"; ctx.fillRect(x + 9 + k * 5, y + 15, 5, 8); }
    ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(x + 25, y + 18, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + 5, y + 18, 4, 2);
  } else if (id === "mino") { drawBrute(ctx, x, y, "#8a5a32", "#5a3a1e", true, 1, ph); }
  else if (id === "guard") { drawBrute(ctx, x, y, "#6a4426", "#3a2a1a", true, 1.08, ph); ctx.fillStyle = "#9aa0aa"; ctx.fillRect(x + 8, y + 12, 16, 6); ctx.fillStyle = "#c9ced6"; ctx.fillRect(x + 27, y + 4, 3, 18); ctx.fillRect(x + 25, y + 2, 7, 5); }
  else {
    ctx.fillStyle = "rgba(200,30,30,0.35)"; ctx.beginPath(); ctx.ellipse(x + 16, y + 28, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    drawBrute(ctx, x, y, "#5a2a1a", "#2a1208", true, 1.45, ph);
    ctx.fillStyle = "#ffd34d"; const cy = y - 12; ctx.beginPath(); ctx.moveTo(x + 8, cy + 8); ctx.lineTo(x + 8, cy); ctx.lineTo(x + 12, cy + 4); ctx.lineTo(x + 16, cy - 2); ctx.lineTo(x + 20, cy + 4); ctx.lineTo(x + 24, cy); ctx.lineTo(x + 24, cy + 8); ctx.closePath(); ctx.fill();
  }
}
const SLOT_GLYPH: Record<string, string> = { sword: "⚔️", axe: "🪓", club: "🔨", dagger: "🗡️", rod: "🪄", wand: "🪄", staff: "🪄", bow: "🏹", shield: "🛡️", quiver: "🎯", orb: "🔮", head: "⛑️", body: "🥋", legs: "👖", feet: "👢", amulet: "📿", ring: "💍" };
function glyphOf(id: string): string { const d = ITEM[id]; if (!d) return "?"; return d.wt === "armor" || d.wt === "jewel" ? (SLOT_GLYPH[d.slot] ?? "?") : (SLOT_GLYPH[d.wt] ?? "?"); }
function drawGroundItem(ctx: CanvasRenderingContext2D, gi: Ground, x: number, y: number, now: number): void {
  const c = RAR[gi.inst.rar].c;
  if (gi.inst.rar === "hea" || gi.inst.rar === "epi") {
    const pulse = 0.5 + 0.5 * Math.sin(now / 250);
    const gr = ctx.createRadialGradient(x + 16, y + 18, 2, x + 16, y + 18, 18);
    gr.addColorStop(0, gi.inst.rar === "hea" ? `rgba(255,248,210,${0.6 + pulse * 0.4})` : `rgba(192,123,255,${0.3 + pulse * 0.3})`); gr.addColorStop(1, "rgba(255,240,168,0)");
    ctx.fillStyle = gr; ctx.fillRect(x - 4, y - 2, 40, 40);
    if (gi.inst.rar === "hea") { ctx.fillStyle = "#fffbe6"; for (let k = 0; k < 4; k++) { const a = now / 400 + k * 1.57; ctx.fillRect(x + 16 + Math.cos(a) * 12, y + 16 + Math.sin(a) * 10, 2, 2); } }
  }
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(x + 16, y + 26, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.strokeRect(x + 7, y + 9, 18, 16); ctx.lineWidth = 1;
  ctx.font = "14px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(glyphOf(gi.inst.id), x + 16, y + 17);
}

function outlined(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, font: string): void {
  ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.85)"; ctx.strokeText(text, x, y); ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.lineWidth = 1;
}
function hpBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, frac: number): void {
  const f = clamp(frac, 0, 1); ctx.fillStyle = "#000"; ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = f > 0.6 ? "#3fd13f" : f > 0.3 ? "#e0c020" : "#e03030"; ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * f), 2);
}
function drawOrb(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, frac: number, c1: string, c2: string, label: string, now: number): void {
  const f = clamp(frac, 0, 1);
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = "#0b0b10"; ctx.fill(); ctx.clip();
  const top = cy + r - 2 * r * f;
  const gr = ctx.createLinearGradient(0, cy - r, 0, cy + r); gr.addColorStop(0, c1); gr.addColorStop(1, c2); ctx.fillStyle = gr;
  ctx.beginPath(); ctx.moveTo(cx - r, cy + r);
  for (let i = 0; i <= 16; i++) { const x = cx - r + (2 * r * i) / 16; ctx.lineTo(x, top + Math.sin(now / 350 + i * 0.8) * (f > 0 && f < 1 ? 2 : 0)); }
  ctx.lineTo(cx + r, cy + r); ctx.closePath(); ctx.fill();
  const gl = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, 1, cx - r * 0.35, cy - r * 0.45, r * 0.7);
  gl.addColorStop(0, "rgba(255,255,255,0.55)"); gl.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = gl; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  ctx.restore();
  ctx.strokeStyle = "#b8913a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "#4a3a18"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r + 3.5, 0, Math.PI * 2); ctx.stroke();
  outlined(ctx, label, cx, cy + 4, "#ffffff", "bold 11px sans-serif");
}
function drawPowerIcon(ctx: CanvasRenderingContext2D, pw: Power, x: number, y: number): void {
  const c = ELEM_COLOR[pw.elem];
  const gr = ctx.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 16); gr.addColorStop(0, c); gr.addColorStop(1, "#151520");
  ctx.fillStyle = gr; ctx.fillRect(x + 1, y + 1, SLOT - 2, SLOT - 2);
  const G: Record<PKind, string> = { strike: "✹", area: "✷", heal: "✚", hot: "❁", wave: "≈", field: "♨", drain: "♥", dot: "☠", summon: "☻", spin: "⟳", buff: "⛨", slow: "❄", dash: "»", blink: "☾", smoke: "☁" };
  outlined(ctx, G[pw.kind], x + 16, y + 22, "#ffffff", "bold 16px sans-serif");
}
function drawFlask(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = "#cfd8e0"; ctx.fillRect(x + 13, y + 5, 6, 6);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + 16, y + 19, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(x + 12, y + 15, 2, 4);
}
function slotAt(px: number, py: number): number {
  if (py < BAR_Y || py > BAR_Y + SLOT) return -1;
  for (let i = 0; i < SLOT_N; i++) { const x = BAR_X + i * (SLOT + SLOT_GAP); if (px >= x && px <= x + SLOT) return i; }
  return -1;
}
function drawPowerBar(ctx: CanvasRenderingContext2D, g: Game, now: number, binds: Binds): void {
  const p = g.p;
  ctx.fillStyle = "rgba(10,10,16,0.75)"; ctx.fillRect(BAR_X - 6, BAR_Y - 6, BAR_W + 12, SLOT + 12);
  const ef = clamp((p.exp - expFor(p.level)) / Math.max(1, expFor(p.level + 1) - expFor(p.level)), 0, 1);
  ctx.fillStyle = "#000"; ctx.fillRect(BAR_X - 6, BAR_Y - 10, BAR_W + 12, 3); ctx.fillStyle = "#d9b84a"; ctx.fillRect(BAR_X - 6, BAR_Y - 10, (BAR_W + 12) * ef, 3);
  for (let i = 0; i < SLOT_N; i++) {
    const x = BAR_X + i * (SLOT + SLOT_GAP), y = BAR_Y; const act = SLOT_ACTS[i] ?? "power1";
    ctx.fillStyle = "#1c1c26"; ctx.fillRect(x, y, SLOT, SLOT);
    let frac = 0; let dim = false;
    if (i < 4) {
      const pw = g.cls.powers[i]; if (pw) { drawPowerIcon(ctx, pw, x, y); const left = (p.cd[i] ?? 0) - now; frac = left > 0 ? clamp(left / pw.cd, 0, 1) : clamp((p.gcd - now) / 900, 0, 1) * 0.6; dim = p.mana < pw.mana; }
    } else {
      const hp = i === 4; drawFlask(ctx, x, y, hp ? "#d0202a" : "#2a50d0");
      outlined(ctx, String(hp ? hpPots(p) : manaPots(p)), x + 25, y + 30, "#ffffff", "bold 10px sans-serif");
      frac = clamp((p.nextPotion - now) / 1000, 0, 1); dim = (hp ? hpPots(p) : manaPots(p)) <= 0;
    }
    if (dim) { ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(x, y, SLOT, SLOT); }
    if (frac > 0) { ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.save(); ctx.beginPath(); ctx.rect(x, y, SLOT, SLOT); ctx.clip(); ctx.beginPath(); ctx.moveTo(x + 16, y + 16); ctx.arc(x + 16, y + 16, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = "#6a5a30"; ctx.strokeRect(x + 0.5, y + 0.5, SLOT - 1, SLOT - 1);
    const k = binds[act][0]; if (k) { ctx.font = "bold 9px sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillStyle = "#000"; ctx.fillText(keyLabel(k), x + 3, y + 3); ctx.fillStyle = "#ffe9a8"; ctx.fillText(keyLabel(k), x + 2, y + 2); }
  }
  const r = 30, oy = VH - r - 8;
  drawOrb(ctx, BAR_X - r - 16, oy, r, p.hp / Math.max(1, maxHp(g)), "#ff4a4a", "#6a0a0a", `${Math.max(0, Math.round(p.hp))}`, now);
  drawOrb(ctx, BAR_X + BAR_W + r + 16, oy, r, p.mana / Math.max(1, maxMana(g)), "#5a8aff", "#0a1a6a", `${Math.round(p.mana)}`, now);
}
// ===================== Dibujo: criaturas de las 12 Casas (arte procedural) =====================
function drawHorn(ctx: CanvasRenderingContext2D, horn: Horn, hx: number, hy: number, c: string): void {
  if (horn === "none" || horn === "mane") return;
  ctx.strokeStyle = c; ctx.lineWidth = 2.5; ctx.beginPath();
  if (horn === "curl") { ctx.arc(hx - 4, hy - 1, 3.5, Math.PI * 0.9, Math.PI * 2.6); ctx.moveTo(hx + 7.5, hy - 1); ctx.arc(hx + 4, hy - 1, 3.5, 0, Math.PI * 1.7); }
  else if (horn === "bull") { ctx.moveTo(hx - 3, hy); ctx.quadraticCurveTo(hx - 10, hy - 2, hx - 9, hy - 8); ctx.moveTo(hx + 3, hy); ctx.quadraticCurveTo(hx + 10, hy - 2, hx + 9, hy - 8); }
  else { ctx.moveTo(hx - 2, hy - 1); ctx.quadraticCurveTo(hx - 4, hy - 9, hx - 9, hy - 7); ctx.moveTo(hx + 2, hy - 1); ctx.quadraticCurveTo(hx + 4, hy - 9, hx + 9, hy - 7); }
  ctx.stroke(); ctx.lineWidth = 1;
}
function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, c: string): void { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function drawLook(ctx: CanvasRenderingContext2D, L: MonLook, x: number, y: number, now: number, ph: number, boss: boolean, rage: boolean): void {
  ctx.save();
  if (boss) {
    const gr = ctx.createRadialGradient(x + 16, y + 18, 2, x + 16, y + 18, 34); const pulse = 0.35 + 0.2 * Math.sin(now / 300);
    gr.addColorStop(0, rage ? `rgba(255,60,40,${pulse + 0.15})` : `rgba(255,215,90,${pulse})`); gr.addColorStop(1, "rgba(255,200,80,0)");
    ctx.fillStyle = gr; ctx.fillRect(x - 20, y - 20, 72, 72);
  }
  ctx.globalAlpha = clamp(L.alpha * (L.body === "ghost" || L.body === "shadow" ? 0.85 + 0.15 * Math.sin(now / 250) : 1), 0.2, 1);
  ctx.translate(x + 16, y + 30); ctx.scale(L.s, L.s); ctx.translate(-16, -30);
  const lg = ph === 1 ? 2 : ph === 2 ? -2 : 0;
  ell(ctx, 16, 29, 11, 3, "rgba(0,0,0,0.28)");
  switch (L.body) {
    case "quad": {
      ctx.fillStyle = L.c2; ctx.fillRect(7 + lg, 20, 3, 9); ctx.fillRect(12 - lg, 21, 3, 8); ctx.fillRect(19 + lg, 21, 3, 8); ctx.fillRect(24 - lg, 20, 3, 9); ctx.fillRect(2, 14, 4, 3);
      if (L.horn === "mane") ell(ctx, 25, 13, 8, 8, L.c3);
      ell(ctx, 15, 18, 11, 7, L.c1); ell(ctx, 26, 13, 5.5, 5, L.c1);
      ctx.fillStyle = "#222"; ctx.fillRect(27, 11, 2, 2); ctx.fillStyle = L.c2; ctx.fillRect(29, 14, 2, 2);
      drawHorn(ctx, L.horn, 26, 9, L.c3); break;
    }
    case "crab": {
      ctx.strokeStyle = L.c2; ctx.lineWidth = 2; ctx.beginPath();
      for (let k = 0; k < 3; k++) { const yy = 20 + k * 3; ctx.moveTo(8, yy); ctx.lineTo(2, yy + 4 + (k === 1 ? lg : 0)); ctx.moveTo(24, yy); ctx.lineTo(30, yy + 4 - (k === 1 ? lg : 0)); }
      ctx.stroke(); ctx.lineWidth = 1;
      ell(ctx, 16, 20, 11, 7, L.c1); ell(ctx, 16, 18, 7, 3, L.c3);
      ell(ctx, 4, 12, 4, 3.5, L.c1); ell(ctx, 28, 12, 4, 3.5, L.c1); ctx.fillStyle = L.c2; ctx.fillRect(2, 8, 2, 3); ctx.fillRect(28, 8, 2, 3);
      ctx.fillStyle = L.c3; ctx.fillRect(12, 9, 2, 5); ctx.fillRect(18, 9, 2, 5); ctx.fillStyle = "#111"; ctx.fillRect(12, 8, 2, 2); ctx.fillRect(18, 8, 2, 2); break;
    }
    case "scorp": {
      ctx.strokeStyle = L.c2; ctx.lineWidth = 1.5; ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(10 + k * 4, 24); ctx.lineTo(8 + k * 4 + lg, 29); } ctx.stroke(); ctx.lineWidth = 1;
      ell(ctx, 9, 23, 6, 4, L.c1); ell(ctx, 16, 23, 5, 4, L.c1);
      const sw = Math.sin(now / 300) * 1.5; ell(ctx, 22, 19, 3.5, 3.5, L.c1); ell(ctx, 25, 13 + sw * 0.3, 3, 3, L.c1); ell(ctx, 23, 8 + sw * 0.6, 2.6, 2.6, L.c1);
      ctx.fillStyle = L.c3; ctx.beginPath(); ctx.moveTo(21, 6 + sw); ctx.lineTo(16, 7 + sw); ctx.lineTo(20, 10 + sw); ctx.closePath(); ctx.fill();
      ell(ctx, 3, 20, 3, 2.5, L.c2); ell(ctx, 3, 26, 3, 2.5, L.c2); ctx.fillStyle = "#111"; ctx.fillRect(5, 21, 1.5, 1.5); break;
    }
    case "fish": {
      ctx.fillStyle = L.c2; ctx.beginPath(); ctx.moveTo(10, 30); ctx.lineTo(16, 24); ctx.lineTo(22, 30); ctx.closePath(); ctx.fill();
      ell(ctx, 16, 18, 7, 9, L.c1); ell(ctx, 16, 20, 4, 6, L.c3); ell(ctx, 16, 8, 6, 5, L.c1);
      ctx.fillStyle = L.c2; ctx.beginPath(); ctx.moveTo(12, 4); ctx.lineTo(16, -1); ctx.lineTo(20, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillRect(12, 7, 3, 3); ctx.fillRect(17, 7, 3, 3); ctx.fillStyle = "#000"; ctx.fillRect(13, 8, 1.5, 1.5); ctx.fillRect(18, 8, 1.5, 1.5);
      ctx.fillStyle = L.c3; ctx.fillRect(27, 4, 1.5, 24); ctx.fillRect(24, 4, 7, 1.5); ctx.fillRect(24, 1, 1.5, 4); ctx.fillRect(29.5, 1, 1.5, 4); ctx.fillRect(26.8, 0, 1.5, 4); break;
    }
    case "ghost": {
      const w = now / 180; ctx.fillStyle = L.c1; ctx.beginPath(); ctx.arc(16, 13, 10, Math.PI, 0); ctx.lineTo(26, 26);
      for (let k = 0; k <= 4; k++) ctx.lineTo(26 - k * 5, 26 + Math.sin(w + k) * 2.5 + (k % 2 ? 2 : 0));
      ctx.closePath(); ctx.fill(); ell(ctx, 16, 15, 5, 6, L.c3 + "55");
      ell(ctx, 12, 12, 2.2, 3, L.c2); ell(ctx, 20, 12, 2.2, 3, L.c2); ell(ctx, 16, 19, 2, 2.5, L.c2); break;
    }
    case "golem": {
      ctx.fillStyle = L.c2; ctx.fillRect(9 + lg, 22, 6, 8); ctx.fillRect(17 - lg, 22, 6, 8); ctx.fillRect(1, 11, 5, 12); ctx.fillRect(26, 11, 5, 12);
      ctx.fillStyle = L.c1; ctx.fillRect(6, 10, 20, 13); ctx.fillRect(10, 1, 12, 10);
      ctx.fillStyle = L.c3; ctx.fillRect(12, 4, 3, 2); ctx.fillRect(17, 4, 3, 2); ctx.fillRect(14, 14, 4, 4);
      ctx.strokeStyle = L.c2; ctx.beginPath(); ctx.moveTo(8, 12); ctx.lineTo(12, 18); ctx.lineTo(10, 22); ctx.moveTo(24, 11); ctx.lineTo(21, 16); ctx.stroke(); break;
    }
    case "plant": {
      const sw = Math.sin(now / 400) * 2; ctx.fillStyle = L.c2; ctx.fillRect(15, 13, 2.5, 16); ell(ctx, 11, 22, 5, 2, L.c2); ell(ctx, 21, 19, 5, 2, L.c2);
      ctx.fillStyle = L.c2; ctx.fillRect(13, 17, 2, 1.5); ctx.fillRect(18, 24, 2, 1.5);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + now / 2000; ell(ctx, 16 + sw + Math.cos(a) * 5, 9 + Math.sin(a) * 5, 4, 4, L.c1); }
      ell(ctx, 16 + sw, 9, 3.5, 3.5, L.c3); ctx.fillStyle = "#111"; ctx.fillRect(14 + sw, 8, 1.5, 1.5); ctx.fillRect(17 + sw, 8, 1.5, 1.5); break;
    }
    case "centaur": {
      ctx.fillStyle = L.c2; ctx.fillRect(5 + lg, 20, 3, 9); ctx.fillRect(9 - lg, 21, 3, 8); ctx.fillRect(17 + lg, 21, 3, 8); ctx.fillRect(21 - lg, 20, 3, 9); ctx.fillRect(1, 15, 4, 6);
      ell(ctx, 13, 18, 10, 6, L.c1);
      ctx.fillStyle = L.c3; ctx.fillRect(19, 6, 7, 10); ell(ctx, 22.5, 4, 3.5, 3.5, "#f0c8a0"); ctx.fillStyle = "#222"; ctx.fillRect(23, 3, 1.5, 1.5);
      ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(26, 10, 8, -1.2, 1.2); ctx.stroke(); ctx.strokeStyle = "#ddd"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(29, 2); ctx.lineTo(29, 18); ctx.stroke(); break;
    }
    case "crystal": {
      const b = Math.sin(now / 350) * 1.5; ctx.fillStyle = L.c1; ctx.beginPath(); ctx.moveTo(16, 1 + b); ctx.lineTo(25, 13); ctx.lineTo(21, 28); ctx.lineTo(11, 28); ctx.lineTo(7, 13); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = L.c2; ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = L.c3; ctx.globalAlpha *= 0.7; ctx.beginPath(); ctx.moveTo(16, 3 + b); ctx.lineTo(19, 13); ctx.lineTo(13, 13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = L.c1; ctx.beginPath(); ctx.moveTo(4, 20); ctx.lineTo(7, 12); ctx.lineTo(9, 22); ctx.closePath(); ctx.moveTo(28, 20); ctx.lineTo(25, 12); ctx.lineTo(23, 22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; if (Math.floor(now / 300) % 3 === 0) ctx.fillRect(19, 8, 2, 2); break;
    }
    case "warrior": drawHuman(ctx, 0, 0, L.c1, L.c2, "helm", "sword", 2, ph, true, "phys"); ctx.fillStyle = L.c3; ctx.fillRect(9, 14, 14, 2); break;
    case "shadow": drawHuman(ctx, 0, 0, L.c1, L.c2, "hood", "staff", 2, ph, false, "dark"); ctx.fillStyle = L.c3; ctx.fillRect(12, 8, 3, 2); ctx.fillRect(17, 8, 3, 2); break;
    case "saint": {
      ctx.fillStyle = L.c3; ctx.beginPath(); ctx.moveTo(8, 12); ctx.lineTo(24, 12); ctx.lineTo(29, 30); ctx.lineTo(3, 30); ctx.closePath(); ctx.fill();
      drawHuman(ctx, 0, 0, L.c1, L.c2, "helm", "sword", 2, ph, false, "holy");
      ell(ctx, 8, 14, 3.5, 3, L.c1); ell(ctx, 24, 14, 3.5, 3, L.c1);
      ctx.strokeStyle = L.c2; ctx.strokeRect(9.5, 14.5, 13, 9);
      if (L.horn === "mane") { ctx.strokeStyle = L.c1; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(16, 9, 9, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.lineWidth = 1; }
      else drawHorn(ctx, L.horn, 16, 5, L.c1);
      ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#5a3a0a"; ctx.fillText(L.glyph, 16, 20); break;
    }
  }
  ctx.restore();
}
function drawFacade(ctx: CanvasRenderingContext2D, H: HouseDef, x: number, y: number, open: boolean, done: boolean, now: number): void {
  const top = y - 2 * TS + 8; const wall = done ? "#f2e4b4" : open ? "#e6dece" : "#8f8a82"; const col = done ? "#ffe9a0" : open ? "#f8f4ea" : "#a8a49c";
  if (open && !done) { const gr = ctx.createRadialGradient(x + 16, y + 10, 2, x + 16, y + 10, 60); gr.addColorStop(0, `rgba(255,220,120,${0.25 + 0.15 * Math.sin(now / 400)})`); gr.addColorStop(1, "rgba(255,220,120,0)"); ctx.fillStyle = gr; ctx.fillRect(x - 50, y - 60, 132, 110); }
  ctx.fillStyle = wall; ctx.fillRect(x - 40, top + 22, 40, y + TS - top - 22); ctx.fillRect(x + TS, top + 22, 40, y + TS - top - 22); ctx.fillRect(x, top + 22, TS, y - top - 22);
  ctx.fillStyle = col; for (const cx of [x - 36, x - 18, x + 42, x + 60]) ctx.fillRect(cx, top + 24, 7, y + TS - top - 26);
  ctx.fillStyle = wall; ctx.fillRect(x - 44, top + 18, 120, 6);
  ctx.fillStyle = done ? "#ffd34d" : open ? H.tint : "#77736c"; ctx.beginPath(); ctx.moveTo(x - 46, top + 18); ctx.lineTo(x + 16, top - 4); ctx.lineTo(x + 78, top + 18); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.stroke();
  outlined(ctx, H.glyph, x + 16, top + 16, "#ffffff", "bold 13px sans-serif");
  outlined(ctx, `${open ? "" : "🔒 "}${H.glyph} Casa de ${H.name} · nv ${H.rec}${done ? " ✔" : ""}`, x + 16, top - 8, done ? "#9dff9d" : open ? "#ffe066" : "#c0c0c0", "bold 10px sans-serif");
  if (!open) { ctx.fillStyle = "rgba(20,20,20,0.6)"; ctx.fillRect(x + 2, y + 2, TS - 4, TS - 4); ctx.font = "16px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🔒", x + 16, y + 17); }
}
function render(ctx: CanvasRenderingContext2D, g: Game, now: number, binds: Binds): void {
  const cx = Math.round(g.camX), cy = Math.round(g.camY); const p = g.p;
  BAR_X = Math.max(84, Math.round((Math.min(VW - HUD_RES, viewW(g)) - BAR_W) / 2)); // barra centrada en la parte visible
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, VW, VH);
  const tx0 = Math.floor(cx / TS), ty0 = Math.floor(cy / TS);
  for (let ty = ty0; ty <= ty0 + VH_T; ty++) for (let tx = tx0; tx <= tx0 + VW_T; tx++) drawTile(ctx, tileAt(g, tx, ty), tx * TS - cx, ty * TS - cy, tx, ty, now);
  const vis = (x: number, y: number): boolean => x * TS - cx > -TS * 2 && x * TS - cx < VW + TS && y * TS - cy > -TS * 2 && y * TS - cy < VH + TS;
  for (const f of g.fields) if (vis(f.x, f.y)) { const x = f.x * TS - cx, y = f.y * TS - cy; const fl = Math.sin(now / 90 + f.x * 3 + f.y) * 3; ctx.fillStyle = "rgba(255,120,20,0.45)"; ctx.fillRect(x + 2, y + 2, TS - 4, TS - 4); ctx.fillStyle = "rgba(255,220,80,0.7)"; ctx.beginPath(); ctx.moveTo(x + 8, y + 26); ctx.lineTo(x + 16, y + 6 + fl); ctx.lineTo(x + 24, y + 26); ctx.fill(); }
  const reg = regionOf(p.x, p.y);
  if (reg === 0) for (const H of HOUSES) { const d = DOORS[H.n - 1]; if (d && vis(d.x, d.y + 2)) drawFacade(ctx, H, d.x * TS - cx, d.y * TS - cy, houseOpen(g, H.n), g.cleared >= H.n, now); }
  else { const rt = HRT[reg - 1]; if (rt && vis(rt.exit[0], rt.exit[1])) outlined(ctx, "↩ Salida", rt.exit[0] * TS - cx + 16, rt.exit[1] * TS - cy - 2, "#e0b0ff", "bold 10px sans-serif"); }
  for (const w of g.warns) { const k = clamp((now - w.born) / Math.max(1, w.at - w.born), 0, 1); ctx.fillStyle = `rgba(255,${Math.round(60 - 50 * k)},30,${0.18 + 0.35 * k + 0.1 * Math.sin(now / 60)})`; for (const [wx, wy] of w.cells) if (vis(wx, wy)) ctx.fillRect(wx * TS - cx + 1, wy * TS - cy + 1, TS - 2, TS - 2); }
  for (const gi of g.ground) if (vis(gi.x, gi.y)) drawGroundItem(ctx, gi, gi.x * TS - cx, gi.y * TS - cy, now);
  if (premOn(g)) for (const gi of g.ground) if (gi.inst.rar !== "com" && vis(gi.x, gi.y)) { ctx.strokeStyle = RAR[gi.inst.rar].c; ctx.lineWidth = 2; ctx.strokeRect(gi.x * TS - cx + 2, gi.y * TS - cy + 2, TS - 4, TS - 4); ctx.lineWidth = 1; } // Premium: el botín raro brilla
  const t = curTarget(g);
  type Ent = { y: number; draw: () => void };
  const ents: Ent[] = [];
  ents.push({ y: NPC_Y, draw: () => { const x = NPC_X * TS - cx, y = NPC_Y * TS - cy; drawHuman(ctx, x, y, "#c0508a", "#ffd34d", "hood", "none", 2, 0, false, "holy"); outlined(ctx, "Rosa 🛒", x + 16, y - 4, "#ffb0e0", "bold 10px sans-serif"); } });
  if (reg === 0 && vis(DARIO_X, DARIO_Y)) ents.push({ y: DARIO_Y, draw: () => { const x = DARIO_X * TS - cx, y = DARIO_Y * TS - cy; drawHuman(ctx, x, y, "#2a5a6a", "#ffd34d", "cap", "none", 2, 0, false, "holy"); outlined(ctx, "Darío 🪙", x + 16, y - 4, "#ffe08a", "bold 10px sans-serif"); } });
  if (reg === 0 && vis(DEPOT_X, DEPOT_Y)) ents.push({ y: DEPOT_Y, draw: () => { const x = DEPOT_X * TS - cx, y = DEPOT_Y * TS - cy; drawDepot(ctx, x, y); outlined(ctx, "Depósito 📦", x + 16, y - 1, "#f0c070", "bold 10px sans-serif"); } });
  if (reg === 0 && vis(STABLE_X, STABLE_Y)) ents.push({ y: STABLE_Y, draw: () => { const x = STABLE_X * TS - cx, y = STABLE_Y * TS - cy; ctx.fillStyle = "#d8b850"; ctx.fillRect(x + 1, y + 19, 10, 10); ctx.fillStyle = "#a88a30"; ctx.fillRect(x + 1, y + 22, 10, 1); ctx.fillRect(x + 1, y + 26, 10, 1); drawHuman(ctx, x + 3, y, "#5a6a2a", "#8a5a32", "cap", "none", 2, 0, false, "phys"); outlined(ctx, "Tomás 🐴", x + 16, y - 4, "#d8f0a0", "bold 10px sans-serif"); } });
  for (const m of regionMons(g, p.x, p.y)) if (m.alive) { const [mx, my] = drawPos(m, now); if (!vis(mx, my)) continue; ents.push({ y: my, draw: () => {
    const x = mx * TS - cx, y = my * TS - cy;
    if (t === m) { ctx.strokeStyle = "#ff2a2a"; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, TS - 2, TS - 2); ctx.lineWidth = 1; }
    drawMonster(ctx, m, x, y, now);
    if (now < m.slowUntil) { ctx.fillStyle = "rgba(155,232,255,0.25)"; ctx.fillRect(x, y, TS, TS); }
    const big = m.def.id === "boss" || !!m.def.boss || (m.def.look ? m.def.look.s : 1) > 1.2; const top = big ? y - 22 : y - 4;
    hpBar(ctx, x + 4, top, 24, m.hp / m.def.hp); outlined(ctx, m.def.name, x + 16, top - 2, m.def.boss ? "#ffd34d" : m.def.id === "boss" ? "#ff9a5a" : "#e8e8e8", m.def.boss ? "bold 10px sans-serif" : "9px sans-serif");
  } }); }
  const mi = g.minion; if (mi) { const [mx, my] = drawPos(mi, now); ents.push({ y: my, draw: () => { const x = mx * TS - cx, y = my * TS - cy; ctx.globalAlpha = 0.85; drawBrute(ctx, x, y, "#3a2a4a", "#1a1022", true, 0.8, walkPhase(mi, now)); ctx.globalAlpha = 1; outlined(ctx, "Esbirro", x + 16, y - 2, "#d0a0ff", "9px sans-serif"); } }); }
  const [px, py] = drawPos(p, now);
  ents.push({ y: py, draw: () => {
    const x = px * TS - cx, y = py * TS - cy; const c = g.cls;
    if (now < p.evadeUntil) ctx.globalAlpha = 0.55;
    if (g.cs && g.cs.aura) drawAura(ctx, g.cs.aura, x, y, now);
    const [robe, trim] = outfitColors(g); const md = riding(g);
    if (md) drawRider(ctx, g, md, x, y, p.face, walkPhase(p, now), mtFlip(g, p.face), now, robe, trim); else drawHuman(ctx, x, y, robe, trim, c.hat, lookOf(g), p.face, walkPhase(p, now), hasShield(g), weaponInfo(g).elem);
    ctx.globalAlpha = 1;
    if (now < p.defUntil) { ctx.strokeStyle = "rgba(160,210,255,0.8)"; ctx.beginPath(); ctx.arc(x + 16, y + 17, 16, 0, Math.PI * 2); ctx.stroke(); }
    if (now - p.hitAt < 150) { ctx.fillStyle = "rgba(255,0,0,0.3)"; ctx.fillRect(x, y, TS, TS); }
    if (now < p.poisonUntil) { ctx.fillStyle = "rgba(122,209,58,0.25)"; ctx.fillRect(x, y, TS, TS); outlined(ctx, "☠", x + 30, y + 6, "#7ad13a", "bold 10px sans-serif"); }
    if (now < p.slowUntil) { ctx.fillStyle = "rgba(155,232,255,0.25)"; ctx.fillRect(x, y, TS, TS); outlined(ctx, "❄", x + 2, y + 6, "#9be8ff", "bold 10px sans-serif"); }
    hpBar(ctx, x + 4, y - 8, 24, p.hp / Math.max(1, maxHp(g)));
    outlined(ctx, p.name, x + 16, y - 11, nameColor(g), "bold 10px sans-serif");
  } });
  ents.sort((a: Ent, b: Ent) => a.y - b.y); for (const e of ents) e.draw();
  for (const f of g.fx) { const a = 1 - (now - f.born) / 450; ctx.globalAlpha = clamp(a, 0, 1) * 0.7; ctx.fillStyle = ELEM_COLOR[f.elem]; for (const [x, y] of f.cells) { const sx = x * TS - cx, sy = y * TS - cy; ctx.fillRect(sx + 3, sy + 3, TS - 6, TS - 6); } ctx.globalAlpha = 1; }
  for (const pr of g.projs) {
    const k = clamp((now - pr.born) / pr.dur, 0, 1); if (now < pr.born) continue;
    const x = (pr.sx + (pr.ex - pr.sx) * k) * TS - cx + 16, y = (pr.sy + (pr.ey - pr.sy) * k) * TS - cy + 16;
    ctx.fillStyle = ELEM_COLOR[pr.elem];
    if (pr.elem === "arrow") { const a = Math.atan2(pr.ey - pr.sy, pr.ex - pr.sx); ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-8, -1, 14, 2); ctx.fillStyle = "#ddd"; ctx.fillRect(5, -2, 4, 4); ctx.restore(); }
    else if (pr.elem === "star") { ctx.save(); ctx.translate(x, y); ctx.rotate(now / 40); ctx.fillRect(-6, -1.5, 12, 3); ctx.fillRect(-1.5, -6, 3, 12); ctx.restore(); }
    else { ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
  }
  for (const f of g.floats) { const a = (now - f.born) / 1200; ctx.globalAlpha = clamp(1 - a, 0, 1); outlined(ctx, f.text, f.x - cx, f.y - cy - a * 22, f.color, "bold 11px sans-serif"); ctx.globalAlpha = 1; }
  // HUD
  const chasing = g.chase && !g.afk && !!t && isChaser(g);
  ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(4, 4, 200, chasing ? 48 : 34);
  ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.font = "bold 11px sans-serif"; ctx.fillStyle = "#7dff7d"; ctx.fillText(`${p.name} · ${g.cls.name} · Nivel ${p.level}`, 9, 8);
  ctx.font = "10px sans-serif"; ctx.fillStyle = "#d8d8d8"; ctx.fillText(g.zone, 9, 23);
  if (chasing && t) { ctx.fillStyle = "#ffb070"; ctx.fillText(`⚔ Persiguiendo: ${t.def.name}`, 9, 37); }
  if (g.afk) {
    const blink = Math.floor(now / 500) % 2 === 0; ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(viewW(g) - 128, 4, 124, 50);
    ctx.fillStyle = blink ? "#7dffb0" : "#3fa070"; ctx.font = "bold 12px sans-serif"; ctx.fillText("● AFK", viewW(g) - 122, 8);
    ctx.font = "10px sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(`${afkRate(g, now).toLocaleString("es-MX")} exp/hora`, viewW(g) - 122, 24); ctx.fillText(`${g.afkKills} muertes · ${g.afkGold} oro`, viewW(g) - 122, 38);
  }
  let bb: Mon | null = null; for (const m of regionMons(g, p.x, p.y)) if (m.alive && m.def.boss && cheb(m.x, m.y, p.x, p.y) <= 12) { bb = m; break; }
  if (bb) {
    const bw = 260, bx = (viewW(g) - bw) / 2, by = 58; ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(bx - 4, by - 2, bw + 8, 26);
    ctx.fillStyle = "#300"; ctx.fillRect(bx, by + 14, bw, 7); ctx.fillStyle = bb.enraged ? "#ff3030" : "#ffcf4a"; ctx.fillRect(bx, by + 14, bw * clamp(bb.hp / bb.def.hp, 0, 1), 7);
    ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.font = "bold 11px sans-serif"; ctx.fillStyle = bb.enraged ? "#ff8080" : "#ffe9a8"; ctx.fillText(`${bb.def.name}${bb.enraged ? " — ¡FURIA!" : ""}  ${Math.max(0, Math.round(bb.hp))}/${bb.def.hp}`, viewW(g) / 2, by);
  }
  if (g.returnAt > now && regionOf(p.x, p.y) > 0) {
    const sec = Math.ceil((g.returnAt - now) / 1000); const txt = `🏆 Regresando al templo en ${sec} s · pisa el portal ✦ para salir ya`;
    ctx.font = "bold 11px sans-serif"; const tw = Math.min(viewW(g) - 8, ctx.measureText(txt).width + 14); ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect((viewW(g) - tw) / 2, 58, tw, 20);
    ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = "#ffe9a8"; ctx.fillText(txt, viewW(g) / 2, 62, tw - 8);
  }
  const lt = g.lootToast;
  if (lt && now - lt.at < 14000) {
    ctx.globalAlpha = clamp((14000 - (now - lt.at)) / 800, 0, 1);
    const n = lt.lines.length; const w = Math.min(260, viewW(g) - 8), h = 24 + n * 14 + (lt.note ? 14 : 0), y0 = 84;
    ctx.fillStyle = "rgba(12,8,24,0.85)"; ctx.fillRect(4, y0, w, h); ctx.strokeStyle = "#ffd34d"; ctx.strokeRect(4.5, y0 + 0.5, w - 1, h - 1);
    ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.font = "bold 11px sans-serif"; ctx.fillStyle = "#ffe066"; ctx.fillText(lt.title, 10, y0 + 5, w - 12);
    ctx.font = "10px sans-serif"; lt.lines.forEach((l: [string, string], k: number) => { ctx.fillStyle = l[1]; ctx.fillText(l[0], 10, y0 + 21 + k * 14, w - 12); });
    if (lt.note) { ctx.fillStyle = "#c8c8c8"; ctx.fillText(lt.note, 10, y0 + 21 + n * 14, w - 12); }
    ctx.globalAlpha = 1;
  }
  if (now - g.statusAt < 4500 && g.status) { ctx.globalAlpha = clamp((4500 - (now - g.statusAt)) / 600, 0, 1); outlined(ctx, g.status, viewW(g) / 2, BAR_Y - 20, g.statusColor, "bold 12px sans-serif"); ctx.globalAlpha = 1; }
  drawPowerBar(ctx, g, now, binds);
  if (g.bigMap) drawBigMap(ctx, g, now, "sans-serif");
}
function drawTemple(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, gold: boolean, now: number): void {
  if (gold) { const gr = ctx.createRadialGradient(x, y - s * 0.4, 1, x, y - s * 0.4, s * 2.6); gr.addColorStop(0, `rgba(255,220,120,${0.55 + 0.2 * Math.sin(now / 500)})`); gr.addColorStop(1, "rgba(255,200,80,0)"); ctx.fillStyle = gr; ctx.fillRect(x - s * 3, y - s * 3, s * 6, s * 6); }
  ctx.fillStyle = gold ? "#ffd86a" : "#e8e2d4"; ctx.fillRect(x - s, y - s * 0.15, s * 2, s * 0.15);
  for (let k = 0; k < 4; k++) ctx.fillRect(x - s * 0.85 + k * s * 0.53, y - s * 0.8, s * 0.16, s * 0.65);
  ctx.beginPath(); ctx.moveTo(x - s * 1.05, y - s * 0.8); ctx.lineTo(x, y - s * 1.25); ctx.lineTo(x + s * 1.05, y - s * 0.8); ctx.closePath(); ctx.fill();
}

// @@MINI
const MINI_COL: Record<number, string> = { 0: "#3f8f3a", 1: "#1f5a22", 2: "#2a5fa8", 3: "#8a8078", 4: "#a88a5e", 5: "#e8e0d0", 6: "#3a322c", 7: "#6a5a48", 8: "#d8c48a", 9: "#c0a070", 10: "#8a7c6a", 11: "#d090ff", 12: "#e8e2d4", 13: "#6a4e1a" };
const MINI_PX = 2; const MINI_SIZE = 208;
let MINI_CACHE: HTMLCanvasElement | null = null;
function buildMini(tiles: Uint8Array): HTMLCanvasElement | null {
  if (MINI_CACHE) return MINI_CACHE;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas"); c.width = MW * MINI_PX; c.height = MH * MINI_PX;
  const x2 = c.getContext("2d"); if (!x2) return null;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = tiles[y * MW + x] ?? 6; const H = t === MARBLE ? HOUSES[regionOf(x, y) - 1] : undefined;
    x2.fillStyle = H ? H.tint : (MINI_COL[t] ?? "#000"); x2.fillRect(x * MINI_PX, y * MINI_PX, MINI_PX, MINI_PX);
  }
  MINI_CACHE = c; return c;
}
function doorColor(g: Game, n: number): string { return g.cleared >= n ? "#5cff7a" : houseOpen(g, n) ? "#ffd34d" : "#8a8a8a"; }
function miniMarkers(ctx: CanvasRenderingContext2D, g: Game, ox: number, oy: number, s: number, now: number, labels: boolean): void {
  const dot = (x: number, y: number, c: string, r: number): void => { ctx.fillStyle = "#000"; ctx.fillRect(ox + x * s - r - 1, oy + y * s - r - 1, r * 2 + 2, r * 2 + 2); ctx.fillStyle = c; ctx.fillRect(ox + x * s - r, oy + y * s - r, r * 2, r * 2); };
  const reg = regionOf(g.p.x, g.p.y); const R = Math.max(2, labels ? s : Math.min(s, 4));
  if (reg === 0) {
    dot(TEMPLE_X + 0.5, TEMPLE_Y + 0.5, "#ffd34d", R); dot(NPC_X + 0.5, NPC_Y + 0.5, "#ff6ad0", R); dot(DARIO_X + 0.5, DARIO_Y + 0.5, "#ffe08a", R); dot(DEPOT_X + 0.5, DEPOT_Y + 0.5, "#c08a4a", R); dot(STABLE_X + 0.5, STABLE_Y + 0.5, "#a8d060", R);
    const boss = g.mons.find((m: Mon) => m.def.id === "boss"); if (boss && boss.alive) dot(boss.x + 0.5, boss.y + 0.5, "#ff3030", R);
    for (const H of HOUSES) {
      const d = DOORS[H.n - 1]; if (!d) continue; dot(d.x + 0.5, d.y + 0.5, doorColor(g, H.n), R);
      if (labels) { ctx.font = "bold 10px sans-serif"; ctx.textAlign = d.x < 48 ? "right" : "left"; ctx.textBaseline = "middle"; const tx = ox + (d.x + 0.5) * s + (d.x < 48 ? -R - 4 : R + 4); ctx.lineWidth = 3; ctx.strokeStyle = "#000"; const txt = `${houseOpen(g, H.n) ? "" : "🔒"}${H.glyph} ${H.name} (nv ${H.rec})`; ctx.strokeText(txt, tx, oy + (d.y + 0.5) * s); ctx.fillStyle = doorColor(g, H.n); ctx.fillText(txt, tx, oy + (d.y + 0.5) * s); ctx.lineWidth = 1; }
    }
  } else {
    const rt = HRT[reg - 1];
    if (rt) dot(rt.exit[0] + 0.5, rt.exit[1] + 0.5, "#d090ff", R);
    for (const m of g.byRegion[reg] ?? []) if (m.alive && m.def.boss) dot(m.x + 0.5, m.y + 0.5, "#ff3030", R);
  }
  const t = curTarget(g); if (t) dot(t.x + 0.5, t.y + 0.5, "#ff9a9a", Math.max(1, s * 0.6));
  const px = ox + (g.p.x + 0.5) * s, py = oy + (g.p.y + 0.5) * s; const L = Math.max(3, labels ? s * 2 : Math.min(s * 2, 9));
  ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - L, py); ctx.lineTo(px + L, py); ctx.moveTo(px, py - L); ctx.lineTo(px, py + L); ctx.stroke();
  ctx.strokeStyle = Math.floor(now / 400) % 2 === 0 ? "#ffffff" : "#e0e0e0"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
}
// Zoom del minimapa (rueda del ratón o botones −/+): 1x = toda la región; más = acercado y centrado en el jugador
const MINI_ZOOMS: number[] = [1, 1.5, 2, 3, 4];
function miniZoomClamp(z: number): number { let best = 1; for (const v of MINI_ZOOMS) if (Math.abs(v - z) < Math.abs(best - z)) best = v; return best; }
function miniZoomStep(g: Game, dir: number): number {
  const i = MINI_ZOOMS.indexOf(miniZoomClamp(g.miniZoom ?? 1)); const j = Math.max(0, Math.min(MINI_ZOOMS.length - 1, i + (dir > 0 ? 1 : -1)));
  g.miniZoom = MINI_ZOOMS[j] ?? 1; return g.miniZoom;
}
// Dibuja la región actual (mundo exterior o una Casa) dentro del rectángulo dado, centrada (o centrada en el jugador si hay zoom)
function drawRegionMap(ctx: CanvasRenderingContext2D, g: Game, bx: number, by: number, bw: number, bh: number, now: number, labels: boolean, zoom?: number): [number, number, number, number] {
  const [rx, ry, rw, rh] = regionRect(regionOf(g.p.x, g.p.y));
  const z = Math.max(1, zoom ?? 1); const s = Math.min(bw / rw, bh / rh) * z;
  const ox = z > 1 ? bx + bw / 2 - (g.p.x + 0.5 - rx) * s : bx + (bw - rw * s) / 2, oy = z > 1 ? by + bh / 2 - (g.p.y + 0.5 - ry) * s : by + (bh - rh * s) / 2;
  if (z > 1) { ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip(); }
  if (g.mini) { ctx.imageSmoothingEnabled = false; ctx.drawImage(g.mini, rx * MINI_PX, ry * MINI_PX, rw * MINI_PX, rh * MINI_PX, ox, oy, rw * s, rh * s); ctx.imageSmoothingEnabled = true; }
  ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.strokeRect(ox + (g.camX / TS - rx) * s + 0.5, oy + (g.camY / TS - ry) * s + 0.5, (viewW(g) / TS) * s, (VH / TS) * s);
  miniMarkers(ctx, g, ox - rx * s, oy - ry * s, s, now, labels);
  if (z > 1) ctx.restore();
  return [ox, oy, rw * s, rh * s];
}
function drawMiniPanel(ctx: CanvasRenderingContext2D, g: Game, now: number): void {
  const w = ctx.canvas.width, h = ctx.canvas.height; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
  drawRegionMap(ctx, g, 0, 0, w, h, now, false, g.miniZoom ?? 1);
}
function drawBigMap(ctx: CanvasRenderingContext2D, g: Game, now: number, font: string): void {
  ctx.fillStyle = "rgba(0,0,0,0.88)"; ctx.fillRect(0, 0, VW, VH);
  const reg = regionOf(g.p.x, g.p.y); const H = HOUSES[reg - 1];
  const [ox, oy, w, h] = drawRegionMap(ctx, g, 12, 28, VW - 24, VH - 64, now, true);
  ctx.strokeStyle = "#b8913a"; ctx.strokeRect(ox - 0.5, oy - 0.5, w + 1, h + 1);
  ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.font = `bold 13px ${font}`; ctx.fillStyle = "#ffd34d";
  ctx.fillText(H ? `${H.glyph} Casa de ${H.name} — nivel recomendado ${H.rec}` : `Mapa de Edisar · Casas superadas: ${g.cleared}/${NH}`, VW / 2, 8);
  ctx.font = `10px ${font}`; ctx.fillStyle = "#ddd";
  ctx.fillText(H ? "✚ Tú   ■ Salida (morado)   ■ Guardián (rojo)   — M o Esc para cerrar" : "✚ Tú  ■ Templo  ■ Tienda (rosa)  ■ Rey Minotauro (rojo)  Casas: ■ abierta (amarilla) ■ superada (verde) ■ sellada (gris)", VW / 2, VH - 30);
}
// @@ENDMINI

// ===================== Interfaz =====================
type Theme = ReturnType<typeof useGrokTheme>;
function btn(th: Theme, active?: boolean, small?: boolean): CSSProperties {
  return { padding: small ? "3px 7px" : "6px 10px", borderRadius: 6, border: `1px solid ${active ? th.border.focus : th.border.default}`, background: active ? th.fill.accent : th.fill.secondary,
    color: active ? th.text.onPrimary : th.text.primary, cursor: "pointer", fontFamily: th.font.family, fontSize: small ? 11 : 12, touchAction: "manipulation", userSelect: "none" };
}
function glowCss(th: Theme): string { const c = RAR.hea.c; return `@keyframes edisarGlow{0%,100%{box-shadow:0 0 3px 1px ${c}}50%{box-shadow:0 0 12px 4px ${th.text.warning}}}`; }
function ItemCell(props: { inst: Inst | null; label?: string; selected: boolean; onClick: () => void; th: Theme; fluid?: boolean; drop?: string; onDown?: (e: RPointerEvent<HTMLDivElement>) => void; up?: boolean; onTip?: (on: boolean, x: number, y: number) => void }) {
  const { inst, th } = props; const r = inst ? RAR[inst.rar] : null; const heaven = !!inst && inst.rar === "hea";
  const st: CSSProperties = { width: props.fluid ? "100%" : 40, height: props.fluid ? "auto" : 40, aspectRatio: props.fluid ? "1 / 1" : undefined, boxSizing: "border-box", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", fontSize: props.fluid ? 17 : 20, overflow: "hidden",
    background: heaven ? `radial-gradient(circle, ${th.bg.elevated} 0%, ${RAR.hea.c} 75%)` : r && inst && inst.rar !== "com" ? `radial-gradient(circle, ${th.bg.subtle} 35%, ${r.c}55 100%)` : th.bg.subtle,
    border: `2px solid ${props.selected ? th.border.focus : r ? r.c : th.border.weak}`, animation: heaven ? "edisarGlow 1.4s ease-in-out infinite" : undefined, userSelect: "none", touchAction: props.onDown && inst ? "none" : "manipulation" };
  return (
    <div style={st} data-drop={props.drop} onPointerDown={props.onDown} onClick={props.onClick} title={inst && props.onTip ? undefined : inst ? `${itemName(inst)} — ${itemDesc(inst)}` : props.label}
      onPointerMove={(e: RPointerEvent<HTMLDivElement>) => { if (props.onTip && inst && e.pointerType === "mouse" && e.buttons === 0) props.onTip(true, e.clientX, e.clientY); }} onPointerLeave={() => { if (props.onTip) props.onTip(false, 0, 0); }}>
      {props.up && inst && <span style={{ position: "absolute", top: 0, right: 2, fontSize: 9, lineHeight: 1, fontWeight: 700, color: props.th.text.success }}>▲</span>}
      {inst ? glyphOf(inst.id) : <span style={{ fontSize: 8, color: th.text.tertiary, textAlign: "center", lineHeight: 1 }}>{props.label}</span>}
    </div>
  );
}
// Contenido del tooltip / detalle: veredicto, nombre, ranura, requisitos y estadísticas con diferencias
function ItemTipBody(props: { g: Game; th: Theme; inst: Inst; plain?: boolean }) {
  const { g, th, inst } = props; const c = compareItem(g, inst); if (!c) return null;
  const d = c.def; const plain = !!props.plain || c.verdict === "same";
  const vc = !c.vocOk ? th.text.tertiary : c.verdict === "better" || c.verdict === "empty" ? th.text.success : c.verdict === "worse" ? th.text.danger : c.verdict === "mixed" ? th.text.warning : th.text.tertiary;
  const dc = (x: number) => (x > 0 ? th.text.success : x < 0 ? th.text.danger : th.text.tertiary);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, lineHeight: 1.35 }}>
      {!plain && <div style={{ fontWeight: 700, color: vc }}>{verdictText(c)}{c.vocOk && !c.lvlOk ? ` (al llegar a nivel ${d.lvl})` : ""}</div>}
      {!c.vocOk && <div style={{ fontWeight: 700, color: th.text.danger }}>✖ Tu vocación ({g.cls.name}) no puede usarlo</div>}
      <div style={{ fontWeight: 700, fontSize: 12, color: inst.rar === "com" ? th.text.primary : RAR[inst.rar].c }}>{itemName(inst)}</div>
      <div style={{ color: th.text.secondary }}>{d.slot === "off" ? g.cls.offName : SLOT_NAMES[d.slot]}{d.slot === "weapon" ? ` · ${d.wt}${d.elem !== "phys" ? ` · ${d.elem}` : ""}` : ""}{c.verdict === "same" ? " · equipado" : ""}</div>
      <div><span style={{ color: c.lvlOk ? th.text.secondary : th.text.danger }}>Nivel {d.lvl}</span><span style={{ color: th.text.tertiary }}> · </span><span style={{ color: c.vocOk ? th.text.secondary : th.text.danger }}>{d.voc ? d.voc.map((v: ClassId) => CLASSES[v].name).join("/") : "Todas las vocaciones"}</span></div>
      <div style={{ borderTop: `1px solid ${th.border.subtle}`, marginTop: 2, paddingTop: 2 }}>
        {c.rows.map((r: CmpRow) => (
          <div key={r.k} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: th.text.secondary }}>{r.label}</span>
            <span><b>{plain ? (r.a > 0 ? r.a : "—") : r.a}</b>{!plain && <span style={{ color: dc(r.d), marginLeft: 6 }}>{r.d > 0 ? `▲ +${r.d}` : r.d < 0 ? `▼ ${r.d}` : "="}</span>}</span>
          </div>))}
        {c.rows.length === 0 && <div style={{ color: th.text.tertiary }}>Sin estadísticas</div>}
      </div>
      {!plain && c.cur && c.def.slot === "weapon" && <div style={{ color: th.text.tertiary, fontSize: 10 }}>Daño por minuto: {Math.round((cmpStats(inst).atk * cmpStats(inst).aps))} frente a {Math.round(cmpStats(c.cur).atk * cmpStats(c.cur).aps)}</div>}
    </div>
  );
}
// Arte de la pantalla de inicio (pixel art de Juan Carlos, sin el panel de login; incrustado para no depender de la red)
const TITLE_ART_PARTS: string[] = ["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"];
const TITLE_ART = "data:image/webp;base64," + TITLE_ART_PARTS.filter((p: string) => !p.startsWith("@@")).join("");
const TITLE_SERIF = 'Georgia, "Palatino Linotype", "Book Antiqua", "Times New Roman", serif';
const GAME_VER = `Versión prototipo · guardado v${SAVE_VER}`;
// Placa de piedra vacía del arte (interior del marco dorado), en fracciones de la imagen 1280×720
const PLAQUE = { l: 350 / 1280, t: 508 / 720, w: 580 / 1280, h: 170 / 720 };
const PLAQUE_MIN_W = 860; // por debajo de este ancho del arte los controles van debajo de la imagen
function TitleScreen(props: { onStart: (c: ClassId, n: string) => void; onLoad?: (d: SaveData) => void; full?: boolean; onFull?: () => void }) {
  const th = useGrokTheme(); const artRef = useRef<HTMLDivElement | null>(null); const [artW, setArtW] = useState<number>(0);
  const [name, setName] = useState<string>(""); const [voc, setVoc] = useState<ClassId>("druid");
  const [showLoad, setShowLoad] = useState<boolean>(false); const [code, setCode] = useState<string>(""); const [err, setErr] = useState<string>("");
  const [last] = useState<SaveData | null>(() => { const c = lsGet(LS_KEY); if (!c) return null; try { const r = decodeSave(c); return r.ok ? r.data : null; } catch { return null; } });
  const load = (): void => { let r: DecodeResult; try { r = decodeSave(code); } catch { r = { ok: false, error: "No se pudo leer el código. Vuelve a copiarlo entero." }; } if (!r.ok) setErr(r.error); else if (props.onLoad) props.onLoad(r.data); };
  useEffect(() => {
    const el = artRef.current; if (!el) return;
    const upd = (): void => setArtW(el.clientWidth); upd();
    window.addEventListener("resize", upd);
    let ro: ResizeObserver | null = null; if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(upd); ro.observe(el); }
    return () => { window.removeEventListener("resize", upd); if (ro) ro.disconnect(); };
  }, [props.full]);
  const start = (): void => props.onStart(voc, name.trim().slice(0, 16) || "Aventurero");
  const c = CLASSES[voc];
  const inPlaque = artW >= PLAQUE_MIN_W;
  const k = inPlaque ? Math.max(0.85, Math.min(1.45, artW / 1180)) : 1; // escala de letra dentro de la placa
  const fs = (n: number): number => Math.round(n * k);
  const gold = th.text.warningDeep; const shadow = `0 1px 2px ${th.bg.base}, 0 0 6px ${th.bg.base}`;
  const field: CSSProperties = { padding: `${fs(5)}px ${fs(8)}px`, borderRadius: 4, border: `1px solid ${th.text.warning}`, background: th.bg.base, color: th.text.primary, fontFamily: TITLE_SERIF, fontSize: fs(13), minWidth: 0 };
  const gbtn = (primary: boolean, on?: boolean): CSSProperties => ({ padding: `${fs(5)}px ${fs(12)}px`, borderRadius: 4, cursor: "pointer", fontFamily: TITLE_SERIF, fontWeight: 700, fontSize: fs(primary ? 14 : 12), letterSpacing: 0.3,
    border: `${primary ? 2 : 1}px solid ${primary || on ? th.text.warning : th.border.strong}`, background: th.bg.base, boxShadow: primary ? `inset 0 0 0 40px ${th.fill.warningSubtle}` : on ? `inset 0 0 0 40px ${th.fill.secondary}` : "none", color: primary || on ? gold : th.text.primary,
    textShadow: shadow, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, touchAction: "manipulation", userSelect: "none" });
  const fullBtn = (pos: CSSProperties) => <button style={{ ...gbtn(false, !!props.full), ...pos, fontSize: 12, padding: "4px 10px" }} onClick={props.onFull}>{props.full ? "✕ Salir" : "⛶ Pantalla completa"}</button>;
  const lastLabel = last ? `▶ Continuar última partida (${last.name} · ${CLASSES[last.cls].name} nivel ${last.level})` : "";
  const controls = (
    <div style={{ display: "flex", flexDirection: "column", gap: fs(6), width: "100%", fontFamily: TITLE_SERIF }}>
      <div style={{ display: "flex", gap: fs(6), alignItems: "center", flexWrap: inPlaque ? "nowrap" : "wrap" }}>
        <input value={name} maxLength={16} placeholder="Nombre del personaje" aria-label="Nombre del personaje" title="Nombre del personaje (máx. 16 letras)"
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value.slice(0, 16))}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") start(); }} style={{ ...field, flex: "1 1 120px", width: 120 }} />
        <select value={voc} aria-label="Vocación" title="Vocación" onChange={(e: ChangeEvent<HTMLSelectElement>) => setVoc(e.target.value as ClassId)} onKeyDown={(e) => e.stopPropagation()} style={{ ...field, flex: "0 1 auto", cursor: "pointer" }}>
          {CLASS_ORDER.map((id: ClassId) => <option key={id} value={id}>{CLASSES[id].name}</option>)}
        </select>
        <button style={{ ...gbtn(true), flex: inPlaque ? "0 0 auto" : "1 1 100%" }} onClick={start}>⚔️ Comenzar aventura</button>
      </div>
      <div style={{ display: "flex", gap: fs(6), alignItems: "center", flexWrap: inPlaque ? "nowrap" : "wrap" }}>
        {last && <button style={{ ...gbtn(false, true), flex: inPlaque ? "1 1 auto" : "1 1 100%" }} title={lastLabel} onClick={() => { if (props.onLoad) props.onLoad(last); }}>{lastLabel}</button>}
        <button style={{ ...gbtn(false, showLoad), flex: last ? "0 0 auto" : "1 1 auto" }} onClick={() => { setShowLoad(!showLoad); setErr(""); }}>📂 Cargar partida</button>
      </div>
      <div style={{ fontSize: fs(12), color: th.text.secondary, textShadow: shadow, whiteSpace: inPlaque ? "nowrap" : "normal", overflow: "hidden", textOverflow: "ellipsis" }} title={c.desc}>
        <b style={{ color: gold }}>{c.name}</b> — {c.desc}
      </div>
    </div>
  );
  return (
    <div style={{ maxWidth: props.full ? "none" : 1280, margin: "0 auto", padding: props.full ? 0 : "4px 0 12px", fontFamily: th.font.family, color: th.text.primary }}>
      <div ref={artRef} style={{ position: "relative", width: props.full ? "min(100%, calc(100vh * 16 / 9))" : "100%", aspectRatio: "16 / 9", margin: "0 auto", backgroundImage: `url(${TITLE_ART})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat", backgroundColor: th.bg.base, borderRadius: props.full ? 0 : 10, overflow: "hidden" }}
        role="img" aria-label="Edisar MMORPG: montaña con los doce templos bajo un cielo de constelaciones">
        {props.onFull && inPlaque && fullBtn({ position: "absolute", top: 8, right: 8 })}
        {inPlaque && <div style={{ position: "absolute", left: `${PLAQUE.l * 100}%`, top: `${PLAQUE.t * 100}%`, width: `${PLAQUE.w * 100}%`, height: `${PLAQUE.h * 100}%`, boxSizing: "border-box", padding: `${fs(8)}px ${fs(16)}px`, display: "flex", alignItems: "center" }}>{controls}</div>}
        <div style={{ position: "absolute", left: "1.2%", bottom: "1.4%", fontFamily: TITLE_SERIF, fontWeight: 700, fontSize: Math.max(9, Math.round(artW / 95)), color: gold, textShadow: shadow, pointerEvents: "none" }}>{GAME_VER}</div>
      </div>
      <div style={{ padding: props.full ? "0 12px" : 0, maxWidth: props.full ? 1280 : "none", margin: "0 auto" }}>
        {!inPlaque && <div style={{ margin: "10px 0", padding: 10, borderRadius: 8, border: `2px solid ${th.text.warning}`, background: th.bg.subtle }}>
          {props.onFull && <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>{fullBtn({})}</div>}
          {controls}
        </div>}
        {showLoad && <div style={{ padding: 10, borderRadius: 8, border: `1px solid ${th.text.warning}`, background: th.bg.subtle, margin: "12px 0" }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Pega aquí el código que copiaste con el botón «💾 Guardar» dentro del juego:</div>
          <textarea value={code} rows={4} placeholder="EDISAR2-…" spellCheck={false}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setCode(e.target.value); setErr(""); }}
            onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}
            style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 6, border: `1px solid ${th.border.default}`, background: th.bg.elevated, color: th.text.primary, fontFamily: th.font.mono, fontSize: 11, resize: "vertical", wordBreak: "break-all" }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
            <button style={{ ...gbtn(true), fontSize: 13 }} onClick={load}>Continuar</button>
            {err && <span style={{ color: th.text.danger, fontSize: 12 }}>{err}</span>}
          </div>
        </div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 8, marginTop: 12 }}>
          {CLASS_ORDER.map((id: ClassId) => { const kc = CLASSES[id]; const on = id === voc; return (
            <div key={id} onClick={() => setVoc(id)} style={{ cursor: "pointer", padding: 10, borderRadius: 8, border: `2px solid ${on ? th.text.warning : th.border.weak}`, background: on ? th.fill.warningSubtle : th.bg.subtle }}>
              <div style={{ fontWeight: 700, fontFamily: TITLE_SERIF, color: on ? gold : th.text.primary }}>{kc.name}</div>
              <div style={{ fontSize: 12, color: th.text.secondary, margin: "3px 0" }}>{kc.desc}</div>
              <div style={{ fontSize: 11 }}>{kc.powers.map((pw: Power) => pw.name).join(" · ")}</div>
            </div>); })}
        </div>
        <p style={{ fontSize: 12, color: th.text.secondary }}>Elegiste: <b>{c.name}</b>. Pulsa Enter o «Comenzar aventura». Para no perder tu progreso usa «💾 Guardar» en el juego y conserva el código.</p>
      </div>
    </div>
  );
}
function ShopOverlay(props: { g: Game; refresh: () => void; th: Theme; tip?: (inst: Inst | null, x: number, y: number) => void }) {
  const { g, th } = props; const [tab, setTab] = useState<"buy" | "sell">("buy");
  const act = (f: () => void): void => { f(); props.refresh(); };
  const goods = ITEMS.filter((d: ItemDef) => d.price > 0 && !d.loot && (d.voc === null || d.voc.includes(g.cls.id))).sort((a: ItemDef, b: ItemDef) => a.lvl - b.lvl || a.price - b.price);
  const row: CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "4px 2px", borderBottom: `1px solid ${th.border.subtle}`, fontSize: 12 };
  useEffect(() => { if (props.tip) props.tip(null, 0, 0); return () => { if (props.tip) props.tip(null, 0, 0); }; }, [tab]);
  const tipOn = (inst: Inst) => ({ onPointerMove: (e: RPointerEvent<HTMLDivElement>) => { if (props.tip && e.pointerType === "mouse") props.tip(inst, e.clientX, e.clientY); }, onPointerLeave: () => { if (props.tip) props.tip(null, 0, 0); } });
  return (
    <div onPointerDown={(e) => e.stopPropagation()} style={{ position: "absolute", inset: 8, background: th.bg.elevated, color: th.text.primary, border: `1px solid ${th.border.strong}`, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", zIndex: 5, fontFamily: th.font.family }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <b style={{ flex: 1 }}>🛒 Tienda de Rosa</b><span style={{ color: th.text.warning, fontWeight: 700 }}>💰 {g.p.gold} oro</span>
        <button style={btn(th, false, true)} onClick={() => act(() => { g.shopOpen = false; })}>Cerrar ✕</button>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <button style={btn(th, tab === "buy", true)} onClick={() => setTab("buy")}>Comprar</button>
        <button style={btn(th, tab === "sell", true)} onClick={() => setTab("sell")}>Vender ({g.p.bag.length})</button>
        <span style={{ fontSize: 12, alignSelf: "center", color: g.shopMsg.startsWith("No") || g.shopMsg.startsWith("Tu") ? th.text.danger : th.text.success }}>{g.shopMsg}</span>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {tab === "buy" ? (<Fragment>
          {POT_KINDS.map((k: PotKind) => (
            <div key={k} style={row}><span style={{ width: 24 }}>{POT[k].icon}</span><span style={{ flex: 1 }}>{POT[k].n} (tienes {potCount(g.p, k)})<br /><span style={{ fontSize: 10, color: th.text.secondary }}>Recupera {POT[k].min}–{POT[k].max} de {POT[k].hp ? "vida" : "maná"}{k === "hp2" || k === "mana2" ? " · se usa sola cuando te falta mucho" : ""}</span></span>
              <span>{POT[k].price} oro</span>
              <button style={btn(th, false, true)} onClick={() => act(() => buyPotion(g, k, 1))}>Comprar</button><button style={btn(th, false, true)} onClick={() => act(() => buyPotion(g, k, 10))}>x10</button></div>))}
          {goods.map((d: ItemDef, gk: number) => { const gi: Inst = { uid: -1 - gk, id: d.id, rar: "com" }; const upg = isUpgrade(g, gi); return (
            <div key={d.id} style={row} {...tipOn(gi)}><span style={{ width: 24 }}>{glyphOf(d.id)}{upg && <span style={{ color: th.text.success, fontSize: 10, fontWeight: 700 }}>▲</span>}</span>
              <span style={{ flex: 1 }}>{d.name} <span style={{ color: g.p.level >= d.lvl ? th.text.tertiary : th.text.danger }}>(nivel {d.lvl})</span><br /><span style={{ fontSize: 10, color: th.text.secondary }}>{itemDesc({ uid: 0, id: d.id, rar: "com" })}</span></span>
              <span>{d.price} oro</span><button style={btn(th, false, true)} onClick={() => act(() => buyItem(g, d.id))}>Comprar</button></div>); })}
        </Fragment>) : g.p.bag.length === 0 ? <div style={{ fontSize: 12, color: th.text.secondary }}>Tu mochila está vacía.</div> : g.p.bag.map((i: Inst, idx: number) => (
          <div key={i.uid} style={row} {...tipOn(i)}><span style={{ width: 24 }}>{glyphOf(i.id)}{isUpgrade(g, i) && <span style={{ color: th.text.success, fontSize: 10, fontWeight: 700 }}>▲</span>}</span><span style={{ flex: 1, color: RAR[i.rar].c }}>{itemName(i)}</span>
            <span>{sellValue(i)} oro</span><button style={btn(th, false, true)} onClick={() => act(() => sellItem(g, idx))}>Vender</button></div>))}
      </div>
    </div>
  );
}

// ===== Tienda de Edisar Coins (prueba) y Cambista Darío =====
function CoinPreview(props: { g: Game; outfit?: string; aura?: string; ncol?: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null); const sz = props.size ?? 46;
  useEffect(() => {
    const c = ref.current; if (!c) return; let raf = 0; const g = props.g;
    const draw = (): void => {
      const ctx = c.getContext("2d"); if (!ctx) return; const now = performance.now();
      ctx.setTransform(c.width / 40, 0, 0, c.height / 48, 0, 0); ctx.clearRect(0, 0, 40, 48);
      const o = OUTFITS.find((x: Outfit) => x.id === props.outfit);
      if (props.aura) drawAura(ctx, props.aura, 4, 12, now);
      drawHuman(ctx, 4, 12, o ? o.robe : g.cls.robe, o ? o.trim : g.cls.trim, g.cls.hat, lookOf(g), 2, 0, hasShield(g), weaponInfo(g).elem);
      const n = NAMECOLS.find((x: NameCol) => x.id === props.ncol); if (n) outlined(ctx, g.p.name.slice(0, 7), 20, 9, n.c, "bold 8px sans-serif");
      if (props.aura) raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [props.outfit, props.aura, props.ncol, props.g]);
  return <canvas ref={ref} width={80} height={96} style={{ width: sz, height: Math.round((sz * 48) / 40), imageRendering: "pixelated", display: "block", margin: "0 auto" }} />;
}
function coinStyles(th: Theme) {
  const gold = th.text.warningDeep;
  const frame: CSSProperties = { position: "absolute", inset: 8, zIndex: 7, display: "flex", flexDirection: "column", gap: 6, background: th.bg.base, color: th.text.primary, border: `2px solid ${th.text.warning}`, borderRadius: 8,
    boxShadow: `inset 0 0 0 3px ${th.bg.base}, inset 0 0 0 4px ${th.border.strong}, inset 0 0 0 2000px ${th.fill.secondary}`, fontFamily: TITLE_SERIF, padding: 10, fontSize: 12 };
  const card: CSSProperties = { border: `1px solid ${th.border.strong}`, background: th.bg.elevated, borderRadius: 6, padding: 6, display: "flex", flexDirection: "column", gap: 4, alignItems: "stretch", textAlign: "center", minWidth: 0 };
  const gbtn = (primary: boolean, off?: boolean): CSSProperties => ({ padding: "3px 8px", borderRadius: 4, cursor: off ? "default" : "pointer", fontFamily: TITLE_SERIF, fontWeight: 700, fontSize: 11, border: `1px solid ${primary ? th.text.warning : th.border.strong}`,
    background: th.bg.base, boxShadow: primary ? `inset 0 0 0 40px ${th.fill.warningSubtle}` : "none", color: primary ? gold : th.text.primary, opacity: off ? 0.5 : 1, touchAction: "manipulation", userSelect: "none", whiteSpace: "nowrap" });
  return { gold, frame, card, gbtn };
}
function CoinStore(props: { g: Game; th: Theme; refresh: () => void }) {
  const { g, th } = props; const c = cs(g); const [cat, setCat] = useState<CoinCat>("cosmetic"); const [nm, setNm] = useState<string>("");
  const act = (f: () => void): void => { f(); props.refresh(); };
  const { gold, frame, card, gbtn } = coinStyles(th);
  const price = (n: number) => <span style={{ color: gold, fontWeight: 700 }}>🪙 {n}</span>;
  const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(124px, 1fr))", gap: 6 };
  const sec = (t: string) => <div style={{ color: gold, fontWeight: 700, margin: "6px 0 3px", borderBottom: `1px solid ${th.text.warning}`, paddingBottom: 2 }}>{t}</div>;
  const cosCard = (id: string, n: string, p: number, prev: { outfit?: string; aura?: string; ncol?: string }, worn: boolean) => (
    <div key={id} style={card} data-coinitem={id}>
      <CoinPreview g={g} {...prev} />
      <div style={{ fontWeight: 700, fontSize: 11 }}>{n}</div>
      {owns(g, id) ? <button style={gbtn(worn)} onClick={() => act(() => wearCosmetic(g, id, !worn))}>{worn ? "✓ Puesto (quitar)" : "Usar"}</button>
        : <button style={gbtn(true, c.coins < p)} onClick={() => act(() => { buyCosmetic(g, id); })}>Comprar {price(p)}</button>}
    </div>);
  const utilCard = (u: UtilId, extra: string, can: boolean) => { const it = UTILS[u]; return (
    <div key={u} style={card} data-coinitem={u}>
      <div style={{ fontSize: 22 }}>{it.icon}</div><div style={{ fontWeight: 700, fontSize: 11 }}>{it.n}</div>
      <div style={{ fontSize: 10, color: th.text.secondary }}>{it.d}</div>
      {extra && <div style={{ fontSize: 10, color: th.text.success }}>{extra}</div>}
      {u === "scroll" && c.scrolls > 0 && <button style={gbtn(false)} onClick={() => act(() => { if (readScroll(g, performance.now())) c.open = false; })}>Usar uno ahora</button>}
      {u === "rename" && <input value={nm} maxLength={16} placeholder="Nombre nuevo" aria-label="Nombre nuevo" onChange={(e: ChangeEvent<HTMLInputElement>) => setNm(e.target.value.slice(0, 16))} onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}
        style={{ padding: "3px 6px", borderRadius: 4, border: `1px solid ${th.text.warning}`, background: th.bg.base, color: th.text.primary, fontFamily: TITLE_SERIF, fontSize: 11, minWidth: 0 }} />}
      <button style={gbtn(true, !can || c.coins < it.price)} onClick={() => act(() => { buyUtil(g, u, performance.now(), nm); if (u === "rename" && c.msg.startsWith("Ahora")) setNm(""); })}>{can ? <Fragment>Comprar {price(it.price)}</Fragment> : "Máximo alcanzado"}</button>
    </div>); };
  const tab = (k: CoinCat, label: string) => <button style={gbtn(cat === k)} onClick={() => setCat(k)}>{label}</button>;
  const premTxt = premOn(g) ? `Activo hasta el ${new Date(c.premUntil).toLocaleDateString("es-MX")}` : "No activo";
  return (
    <div data-coinstore="1" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => { const t = e.target as HTMLElement; if (t.tagName === "BUTTON") e.preventDefault(); }} style={frame}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <b style={{ flex: 1, color: gold, fontSize: 15, letterSpacing: 0.5, minWidth: 160 }}>🪙 Tienda de Edisar Coins</b>
        <span style={{ fontWeight: 700 }}>Saldo: <span data-coinbal={c.coins} style={{ color: gold }}>🪙 {c.coins.toLocaleString("es-MX")}</span> · <span style={{ color: th.text.warning }}>💰 {g.p.gold.toLocaleString("es-MX")}</span></span>
        <button style={gbtn(false)} onClick={() => act(() => coinTest(g, performance.now()))} title="Sólo para probar el prototipo">🧪 Modo prueba: +{COIN_TEST} coins</button>
        <button style={gbtn(false)} onClick={() => act(() => { c.open = false; })}>Cerrar ✕</button>
      </div>
      <div style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, border: `1px dashed ${th.text.warning}`, color: th.text.warningDeep, background: th.fill.warningSubtle }}>
        ⚠️ Tienda de prueba: en la versión online se comprarán con dinero real. Aquí no hay pagos: las coins se ganan jugando (los guardianes a veces sueltan coins, +{COIN_HOUSE} por cada Casa superada por primera vez) o con el {DARIO_NAME} junto a la fuente de Villa Esmeralda: <b>1 Edisar Coin = 10,000 de oro</b>.
        {" "}<button style={{ ...gbtn(false), padding: "1px 6px", fontSize: 10 }} onClick={() => act(() => { c.open = false; requestExchange(g, performance.now()); })}>Ir con Darío</button>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        {tab("cosmetic", "✨ Cosméticos")}{tab("mount", "🐎 Monturas")}{tab("premium", "👑 Premium")}{tab("util", "🎒 Utilidades")}
        <span data-coinmsg="1" style={{ fontSize: 11, color: c.msgBad ? th.text.danger : th.text.success, marginLeft: 4 }}>{c.msg}</span>
      </div>
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0, paddingRight: 2 }}>
        {cat === "cosmetic" && <Fragment>
          <div style={{ fontSize: 10, color: th.text.secondary }}>Sólo cambian el aspecto: nada de equipo ni estadísticas a la venta.</div>
          {sec("Atuendos")}<div style={grid}>{OUTFITS.map((o: Outfit) => cosCard(o.id, o.n, o.price, { outfit: o.id, aura: c.aura, ncol: c.ncol }, c.outfit === o.id))}</div>
          {sec("Auras")}<div style={grid}>{AURAS.map((a: Aura) => cosCard(a.id, a.n, a.price, { outfit: c.outfit, aura: a.id, ncol: c.ncol }, c.aura === a.id))}</div>
          {sec("Color del nombre")}<div style={grid}>{NAMECOLS.map((n: NameCol) => cosCard(n.id, n.n, n.price, { outfit: c.outfit, aura: c.aura, ncol: n.id }, c.ncol === n.id))}</div>
        </Fragment>}
        {cat === "mount" && <Fragment>
          <div style={{ fontSize: 11, color: th.text.secondary, marginBottom: 4 }}>🐎 Montado caminas más rápido (+20% a +40%). Elige y monta la tuya en «🐎 Monturas». También hay una barata con oro (Tomás, en el establo) y otras se doman venciendo a ciertos jefes.</div>
          <div style={grid}>{MOUNTS.map((m: MountDef) => { const own = ownsMount(g, m.id), on = riding(g) === m; return (
            <div key={m.id} style={{ ...card, opacity: m.src === "coins" || own ? 1 : 0.8 }} data-coinitem={m.id}><MountPreview g={g} d={m} />
              <div style={{ fontWeight: 700, fontSize: 11 }}>{m.n}</div>
              <div style={{ fontSize: 10, color: th.text.success }}>+{m.speed}% de velocidad</div>
              {own ? <button style={gbtn(on)} onClick={() => act(() => { if (on) mt(g).riding = false; else chooseMount(g, m.id, performance.now()); })}>{on ? "✓ Montando" : "✓ Tuya · Montar"}</button>
                : m.src === "coins" ? <button style={gbtn(true, c.coins < m.price)} onClick={() => act(() => { buyMountCoins(g, m.id, performance.now()); })}>Comprar {price(m.price)}</button>
                : <div style={{ fontSize: 10, color: th.text.secondary }}>{mountHow(m)}</div>}
            </div>); })}</div>
        </Fragment>}
        {cat === "premium" && <div style={grid}>{utilCard("premium", premTxt, true)}</div>}
        {cat === "util" && <div style={grid}>
          {utilCard("bag", `Ahora: ${bagMax(g)} casillas`, c.bagX < BAG_STEP * BAG_BUYS)}
          {utilCard("xp", c.xpLeft > 0 ? `Activa: ${Math.ceil(c.xpLeft / 60000)} min` : "", c.xpLeft + XP_BOOST_MS <= XP_BOOST_MAX)}
          {utilCard("scroll", `Tienes ${c.scrolls}`, true)}
          {utilCard("scroll5", "", true)}
          {utilCard("rename", `Ahora: ${g.p.name}`, true)}
        </div>}
      </div>
      <div style={{ fontSize: 10, color: th.text.tertiary }}>Tecla para abrir/cerrar: se puede cambiar en «⌨️ Atajos».</div>
    </div>
  );
}
function ExchangeOverlay(props: { g: Game; th: Theme; refresh: () => void }) {
  const { g, th } = props; const c = cs(g); const [dir, setDir] = useState<"c2g" | "g2c">("c2g"); const [n, setN] = useState<number>(1);
  const act = (f: () => void): void => { f(); props.refresh(); };
  const { gold, frame, card, gbtn } = coinStyles(th);
  const max = dir === "c2g" ? c.coins : Math.floor(g.p.gold / COIN_GOLD); const q = clamp(Math.floor(n) || 1, 1, Math.max(1, max)); const ok = max >= 1;
  const set = (v: number): void => setN(clamp(Math.floor(v) || 1, 1, Math.max(1, max)));
  return (
    <div data-exchange="1" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => { const t = e.target as HTMLElement; if (t.tagName === "BUTTON") e.preventDefault(); }} style={{ ...frame, inset: "auto", left: 12, top: 44, width: "min(60%, 380px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <b style={{ flex: 1, color: gold, fontSize: 15 }}>⚖️ {DARIO_NAME}</b>
        <button style={gbtn(false)} onClick={() => act(() => { c.exOpen = false; })}>Cerrar ✕</button>
      </div>
      <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: gold, padding: "4px 0", border: `1px solid ${th.text.warning}`, borderRadius: 4, background: th.fill.warningSubtle }}>1 Edisar Coin = 10,000 de oro</div>
      <div style={{ display: "flex", justifyContent: "space-around", fontWeight: 700 }}><span data-exbal-coins={c.coins} style={{ color: gold }}>🪙 {c.coins.toLocaleString("es-MX")} coins</span><span data-exbal-gold={g.p.gold} style={{ color: th.text.warning }}>💰 {g.p.gold.toLocaleString("es-MX")} oro</span></div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
        <button style={gbtn(dir === "c2g")} onClick={() => { setDir("c2g"); setN(1); }}>Coins → Oro</button>
        <button style={gbtn(dir === "g2c")} onClick={() => { setDir("g2c"); setN(1); }}>Oro → Coins</button>
      </div>
      <div style={{ ...card, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
        <span>{dir === "c2g" ? "Coins:" : "Coins a comprar:"}</span>
        <button style={gbtn(false, q <= 1)} onClick={() => set(q - 1)} aria-label="Menos">−</button>
        <input type="number" min={1} max={Math.max(1, max)} value={q} aria-label="Cantidad" onChange={(e: ChangeEvent<HTMLInputElement>) => set(Number(e.target.value))} onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}
          style={{ width: 70, padding: "3px 6px", borderRadius: 4, border: `1px solid ${th.text.warning}`, background: th.bg.base, color: th.text.primary, fontFamily: TITLE_SERIF, fontSize: 12, textAlign: "center" }} />
        <button style={gbtn(false, q >= max)} onClick={() => set(q + 1)} aria-label="Más">+</button>
        <button style={gbtn(false, !ok)} onClick={() => set(max)}>Máx ({max})</button>
      </div>
      <div style={{ textAlign: "center", fontSize: 12 }}>{dir === "c2g" ? <Fragment>Entregas <b style={{ color: gold }}>🪙 {q}</b> y recibes <b style={{ color: th.text.warning }}>💰 {(q * COIN_GOLD).toLocaleString("es-MX")}</b></Fragment> : <Fragment>Entregas <b style={{ color: th.text.warning }}>💰 {(q * COIN_GOLD).toLocaleString("es-MX")}</b> y recibes <b style={{ color: gold }}>🪙 {q}</b></Fragment>}</div>
      <button data-exgo="1" style={{ ...gbtn(true, !ok), fontSize: 13, padding: "5px 10px" }} onClick={() => act(() => { if (dir === "c2g") exCoinsToGold(g, q); else exGoldToCoins(g, q); setN(1); })}>{ok ? "Cambiar" : dir === "c2g" ? "No tienes coins" : "Te falta oro (10,000 por coin)"}</button>
      <div data-coinmsg="1" style={{ fontSize: 11, textAlign: "center", minHeight: 14, color: c.msgBad ? th.text.danger : th.text.success }}>{c.msg}</div>
      <div style={{ fontSize: 10, color: th.text.tertiary, textAlign: "center" }}>Prototipo: sin dinero real. Las coins se gastan en la 🪙 Tienda de Coins.</div>
    </div>
  );
}

// Ventana del depósito: arrastra entre mochila ↔ depósito, o clic + «Sacar» / «📦 Guardar» en el detalle
interface DepDnd { start: (x: number, y: number, src: DragSrcX, tap?: () => void) => void; used: () => boolean; tip?: (inst: Inst | null, x: number, y: number) => void; }
function DepotWindow(props: { g: Game; th: Theme; refresh: () => void; dnd: DepDnd }) {
  const { g, th } = props; const d = dep(g); const [sel, setSel] = useState<number>(-1);
  const act = (f: () => void): void => { f(); props.refresh(); };
  const { gold, frame, gbtn } = coinStyles(th);
  const si = d.items.findIndex((i: Inst) => i.uid === sel); const selInst = si >= 0 ? (d.items[si] ?? null) : null;
  return (
    <div data-depot="1" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => { const t = e.target as HTMLElement; if (t.tagName === "BUTTON") e.preventDefault(); }}
      style={{ ...frame, inset: "auto", left: 8, top: 40, width: "min(52%, 400px)", maxHeight: "calc(100% - 110px)", zIndex: 6, gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <b style={{ flex: 1, color: gold, fontSize: 15 }}>📦 Depósito <span data-depcount={d.items.length} style={{ fontSize: 11 }}>({d.items.length}/{DEPOT_MAX})</span></b>
        <button style={gbtn(false, g.p.bag.length === 0)} onClick={() => act(() => { depositAll(g); setSel(-1); })} title="Guarda toda la mochila">Guardar todo</button>
        <button style={gbtn(false)} onClick={() => act(() => { d.open = false; })}>Cerrar ✕</button>
      </div>
      <div style={{ fontSize: 10, color: th.text.secondary }}>Arrastra objetos entre la 🎒 mochila (a la derecha) y el depósito, o tócalos y usa «Sacar» / «📦 Guardar». Lo guardado aquí se queda en tu partida.</div>
      <div data-drop={`dep:${DEPOT_MAX}`} style={{ overflowY: "auto", minHeight: 0, flex: "1 1 auto", padding: 2, display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: 2, alignContent: "start" }}>
        {Array.from({ length: DEPOT_MAX }, (_: unknown, k: number) => { const i = d.items[k] ?? null; return <ItemCell key={i ? i.uid : `d${k}`} th={th} fluid inst={i} label="" drop={`dep:${k}`} selected={!!i && i.uid === sel} up={!!i && isUpgrade(g, i)}
          onClick={() => { if (props.dnd.used()) return; setSel(i ? i.uid : -1); }}
          onTip={(on: boolean, x: number, y: number) => { if (props.dnd.tip) props.dnd.tip(on ? i : null, x, y); }}
          onDown={(e: RPointerEvent<HTMLDivElement>) => { if (i) props.dnd.start(e.clientX, e.clientY, { kind: "dep", uid: i.uid }); }} />; })}
      </div>
      {selInst && <div style={{ borderTop: `1px solid ${th.text.warning}`, paddingTop: 4, display: "flex", gap: 8, alignItems: "flex-start", fontFamily: th.font.family }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 11 }}><ItemTipBody g={g} th={th} inst={selInst} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button style={gbtn(true, g.p.bag.length >= bagMax(g))} onClick={() => act(() => { if (withdrawItem(g, si)) setSel(-1); })}>⬆ Sacar</button>
          <button style={gbtn(false)} onClick={() => setSel(-1)}>✕</button>
        </div>
      </div>}
      <div data-depmsg="1" style={{ fontSize: 11, minHeight: 14, color: d.msgBad ? th.text.danger : th.text.success }}>{d.msg}</div>
    </div>
  );
}

// ===== Monturas: vista previa y ventana =====
function MountPreview(props: { g: Game; d: MountDef; size?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null); const sz = props.size ?? 46;
  useEffect(() => {
    const c = ref.current; if (!c) return; let raf = 0; const g = props.g, d = props.d;
    const draw = (): void => {
      const ctx = c.getContext("2d"); if (!ctx) return; const now = performance.now();
      ctx.setTransform(c.width / 40, 0, 0, c.height / 48, 0, 0); ctx.clearRect(0, 0, 40, 48);
      const [robe, trim] = outfitColors(g); drawRider(ctx, g, d, 2, 16, 1, Math.floor(now / 220) % 3, false, now, robe, trim);
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [props.d, props.g]);
  return <canvas ref={ref} width={80} height={96} style={{ width: sz, height: Math.round((sz * 48) / 40), imageRendering: "pixelated", display: "block", margin: "0 auto" }} />;
}
function MountsWindow(props: { g: Game; th: Theme; refresh: () => void; keyName: string }) {
  const { g, th } = props; const s = mt(g); const act = (f: () => void): void => { f(); props.refresh(); };
  const { gold, frame, card, gbtn } = coinStyles(th); const cur = riding(g); const near = stableNear(g);
  const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))", gap: 5 };
  const list = [...MOUNTS].sort((a: MountDef, b: MountDef) => Number(ownsMount(g, b.id)) - Number(ownsMount(g, a.id)));
  return (
    <div data-mounts="1" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => { const t = e.target as HTMLElement; if (t.tagName === "BUTTON") e.preventDefault(); }}
      style={{ ...frame, inset: "auto", left: 8, top: 40, width: "min(56%, 430px)", maxHeight: "calc(100% - 110px)", zIndex: 6, gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <b style={{ flex: 1, color: gold, fontSize: 15 }}>🐎 Monturas <span data-mtcount={s.owned.length} style={{ fontSize: 11 }}>({s.owned.length}/{MOUNTS.length})</span></b>
        <button data-mtride="1" style={gbtn(!!cur, s.owned.length === 0)} onClick={() => act(() => toggleMount(g, performance.now()))}>{cur ? "Bajar" : "Montar"} ({props.keyName})</button>
        <button style={gbtn(false)} onClick={() => act(() => { s.open = false; })}>Cerrar ✕</button>
      </div>
      <div style={{ fontSize: 10, color: th.text.secondary }}>{cur ? <Fragment>Montas <b style={{ color: gold }}>{cur.n}</b>: caminas un {cur.speed}% más rápido.</Fragment> : "Montado caminas más rápido, también dentro de las casas."} Tecla «{props.keyName}» para montar o bajar (cámbiala en «⌨️ Atajos»).</div>
      <div style={{ overflowY: "auto", minHeight: 0, flex: "1 1 auto", padding: 2 }}><div style={grid}>
        {list.map((m: MountDef) => { const own = ownsMount(g, m.id), on = cur === m; return (
          <div key={m.id} data-mount={m.id} data-own={own ? "1" : "0"} style={{ ...card, opacity: own ? 1 : 0.8, borderColor: on ? th.text.warning : th.border.strong }}>
            <MountPreview g={g} d={m} size={40} />
            <div style={{ fontWeight: 700, fontSize: 11 }}>{m.n}</div>
            <div style={{ fontSize: 10, color: th.text.success }}>+{m.speed}% de velocidad</div>
            {own ? <button data-mtpick={m.id} style={gbtn(on)} onClick={() => act(() => { if (on) s.riding = false; else chooseMount(g, m.id, performance.now()); })}>{on ? "✓ Montando" : "Montar"}</button>
              : m.src === "coins" ? <button data-mtbuy={m.id} style={gbtn(true, cs(g).coins < m.price)} onClick={() => act(() => { buyMountCoins(g, m.id, performance.now()); })}>Comprar 🪙 {m.price}</button>
              : m.src === "gold" ? (near ? <button data-mtbuy={m.id} style={gbtn(true, g.p.gold < m.price)} onClick={() => act(() => { buyMountGold(g, m.id, performance.now()); })}>Comprar 💰 {m.price.toLocaleString("es-MX")}</button>
                : <button data-mtgo={m.id} style={gbtn(false)} onClick={() => act(() => requestStable(g, performance.now()))} title={mountHow(m)}>Ir con Tomás · 💰 {m.price.toLocaleString("es-MX")}</button>)
              : <div style={{ fontSize: 10, color: th.text.secondary }}>{mountHow(m)}</div>}
          </div>); })}
      </div></div>
      <div data-mtmsg="1" style={{ fontSize: 11, minHeight: 14, color: s.msgBad ? th.text.danger : th.text.success }}>{s.msg}</div>
    </div>
  );
}

function SaveModal(props: { code: string; local: boolean; onClose: () => void; th: Theme }) {
  const { th } = props; const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [msg, setMsg] = useState<string>(""); const [good, setGood] = useState<boolean>(true);
  const selectAll = (): void => { const ta = taRef.current; if (ta) { ta.focus(); ta.select(); } };
  const fallback = (): void => {
    selectAll(); let copied = false;
    try { copied = document.execCommand("copy"); } catch { copied = false; }
    if (copied) { setGood(true); setMsg("¡Código copiado! Guárdalo en una nota o mensaje."); }
    else { setGood(false); setMsg("No pude copiarlo automáticamente. El código ya está seleccionado: pulsa Ctrl+C (Cmd+C en Mac) para copiarlo."); }
  };
  const copy = (): void => {
    try {
      const cb = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
      if (!cb || typeof cb.writeText !== "function") { fallback(); return; }
      cb.writeText(props.code).then(() => { setGood(true); setMsg("¡Código copiado al portapapeles! Guárdalo en una nota o mensaje."); }).catch(() => fallback());
    } catch { fallback(); }
  };
  useEffect(() => { selectAll(); }, []);
  return (
    <div onPointerDown={(e) => e.stopPropagation()} style={{ position: "absolute", inset: 8, background: th.bg.elevated, color: th.text.primary, border: `1px solid ${th.border.strong}`, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8, zIndex: 6, fontFamily: th.font.family }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <b style={{ flex: 1 }}>💾 Guardar partida</b>
        <button style={btn(th, false, true)} onClick={props.onClose}>Cerrar ✕</button>
      </div>
      <div style={{ fontSize: 12, color: th.text.secondary }}>Copia este código y guárdalo. Para seguir jugando, en la pantalla de inicio pulsa «📂 Cargar partida», pégalo y pulsa «Continuar».</div>
      <textarea ref={taRef} readOnly value={props.code} spellCheck={false} onFocus={(e) => e.currentTarget.select()} onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}
        style={{ flex: 1, minHeight: 80, width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 6, border: `1px solid ${th.border.default}`, background: th.bg.subtle, color: th.text.primary, fontFamily: th.font.mono, fontSize: 11, resize: "none", wordBreak: "break-all" }} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button style={btn(th, true)} onClick={copy}>📋 Copiar</button>
        {msg && <span style={{ fontSize: 12, color: good ? th.text.success : th.text.warning }}>{msg}</span>}
      </div>
      <div style={{ fontSize: 11, color: th.text.tertiary }}>{props.local ? "También quedó guardada en este navegador (se guarda sola cada 30 s): aparecerá «Continuar última partida» al inicio." : "Este navegador no permite guardar automáticamente: el código es la única copia de tu partida."}</div>
    </div>
  );
}

type Listen = { act: Action; mode: "set" | "add" } | null;
type HudWin = "skills" | "quests" | "keys" | "log" | null;
// Equipo estilo Tibia: amuleto · casco · mochila / arma · armadura · escudo / anillo · piernas / botas
const DOLL: Array<Slot | "bag" | null> = ["amulet", "head", "bag", "weapon", "body", "off", "ring", "legs", null, null, "feet", null];
const HUD_WIN_TITLE: Record<"skills" | "quests" | "keys" | "log", string> = { skills: "📊 Habilidades", quests: "📜 Misiones", keys: "⌨️ Atajos", log: "📖 Registro" };
// Ventana flotante dentro del juego (habilidades, misiones, atajos, registro)
function HudWindow(props: { g: Game; th: Theme; win: "skills" | "quests" | "keys" | "log"; onClose: () => void; binds: Binds; listening: Listen; setListening: (l: Listen) => void; resetBinds: () => void }) {
  const { g, th } = props; const p = g.p; const tab = props.win;
  const rowS: CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 12, padding: "1px 0" };
  return (
    <div onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => { const t = e.target as HTMLElement; if (t.tagName === "BUTTON") e.preventDefault(); }}
      style={{ position: "absolute", top: 6, left: 6, width: "min(52%, 360px)", maxHeight: "calc(100% - 12px)", display: "flex", flexDirection: "column", background: th.bg.elevated, color: th.text.primary, border: `1px solid ${th.border.strong}`, borderRadius: 8, zIndex: 4, fontFamily: th.font.family, fontSize: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderBottom: `1px solid ${th.border.subtle}` }}>
        <b style={{ flex: 1 }}>{HUD_WIN_TITLE[tab]}</b>
        <button style={btn(th, false, true)} onClick={props.onClose}>✕</button>
      </div>
      <div style={{ overflowY: "auto", padding: 8, minHeight: 0 }}>
        {tab === "skills" && <div>
          {([["Nivel", String(p.level)], ["Experiencia", p.exp.toLocaleString("es-MX")], ["Para subir", Math.max(0, expFor(p.level + 1) - p.exp).toLocaleString("es-MX")], ["Vida", `${Math.round(p.hp)} / ${maxHp(g)}`], ["Maná", `${Math.round(p.mana)} / ${maxMana(g)}`], ["Ataque arma", String(weaponInfo(g).atk)], ["Armadura", String(g.st.arm)], ["Defensa", String(g.st.def)], ["Magia extra", `+${g.st.magic}`], ["Muertes", String(g.deaths)]] as Array<[string, string]>).map((r: [string, string]) => <div key={r[0]} style={rowS}><span>{r[0]}</span><b>{r[1]}</b></div>)}
          <div style={{ borderTop: `1px solid ${th.border.subtle}`, margin: "6px 0" }} />
          {SKILL_IDS.map((k: SkillId) => (
            <div key={k} style={{ marginBottom: 4 }}>
              <div style={rowS}><span>{SKILL_NAMES[k]}</span><b>{p.sk[k].lvl}</b></div>
              <div style={{ height: 4, background: th.border.weak, borderRadius: 2 }}><div style={{ height: 4, width: `${Math.round(skillPct(g, k) * 100)}%`, background: th.text.success, borderRadius: 2 }} /></div>
            </div>))}
        </div>}
        {tab === "quests" && <div>
          <div style={{ color: th.text.secondary, marginBottom: 6 }}>Las 12 Casas del Zodiaco están en el Santuario, al norte de Villa Esmeralda. Cada guardián vencido abre la siguiente casa. Superadas: <b>{g.cleared}/{NH}</b></div>
          {HOUSES.map((H: HouseDef) => {
            const q = g.quests[H.n - 1] ?? { e: false, k: 0, b: false, d: false }; const open = houseOpen(g, H.n); const rw = questReward(H.n);
            const stTxt = q.d ? "✅ Completada" : !open ? "🔒 Sellada" : q.e ? "En curso" : "Disponible";
            const stCol = q.d ? th.text.success : !open ? th.text.tertiary : th.text.warning;
            const step = (ok: boolean, txt: string) => <div style={{ color: ok ? th.text.success : th.text.secondary }}>{ok ? "✔" : "○"} {txt}</div>;
            return (
              <div key={H.n} style={{ padding: "5px 0", borderBottom: `1px solid ${th.border.subtle}`, opacity: open || q.d ? 1 : 0.65 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}><b>{H.glyph} Casa de {H.name}</b><span style={{ color: stCol, fontWeight: 700 }}>{stTxt}</span></div>
                <div style={{ color: th.text.secondary }}>Nivel recomendado {H.rec}{p.level < H.rec && open ? " · ¡aún eres de nivel menor!" : ""} · Guardián: {H.boss}{H.n === NH ? ` y ${KANON}` : ""}{(g.bossKills[H.n - 1] ?? 0) > 0 ? ` (vencido ${g.bossKills[H.n - 1]}×)` : ""}</div>
                {open && !q.d && <div style={{ marginTop: 2 }}>
                  {step(q.e, "Llega a la casa y cruza su portal")}
                  {step(q.k >= H.quest.n, H.quest.kind === "kill" ? `Derrota ${H.quest.n} enemigos de la casa (${q.k}/${H.quest.n})` : `Encuentra ${H.quest.n} ${H.quest.item} en los enemigos (${q.k}/${H.quest.n})`)}
                  {step(q.b, `Vence a ${H.boss}${H.n === NH ? ` y luego a ${KANON}` : ""}`)}
                </div>}
                <div style={{ color: H.n === NH ? RAR.hea.c : th.text.tertiary, fontSize: 11 }}>Premio: {rw.exp.toLocaleString("es-MX")} exp · {rw.gold.toLocaleString("es-MX")} oro · {rw.item}</div>
              </div>);
          })}
        </div>}
        {tab === "keys" && <div>
          <div style={{ color: th.text.secondary, marginBottom: 4 }}>{props.listening ? `Pulsa una tecla para «${ACTIONS.find((a: { id: Action; label: string }) => a.id === props.listening?.act)?.label ?? ""}» (Esc cancela)…` : "Cambiar reemplaza las teclas; + añade otra."}</div>
          {ACTIONS.map((a: { id: Action; label: string }) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 0", borderBottom: `1px solid ${th.border.subtle}` }}>
              <span style={{ flex: 1 }}>{a.id.startsWith("power") ? `${a.label}: ${g.cls.powers[Number(a.id.slice(5)) - 1]?.name ?? ""}` : a.label}</span>
              <span style={{ fontFamily: th.font.mono, fontSize: 11 }}>{props.binds[a.id].map(keyLabel).join(", ") || "—"}</span>
              <button style={btn(th, props.listening?.act === a.id && props.listening.mode === "set", true)} onClick={() => props.setListening({ act: a.id, mode: "set" })}>Cambiar</button>
              <button style={btn(th, props.listening?.act === a.id && props.listening.mode === "add", true)} onClick={() => props.setListening({ act: a.id, mode: "add" })}>+</button>
            </div>))}
          <button style={{ ...btn(th, false, true), marginTop: 6 }} onClick={props.resetBinds}>Restablecer atajos</button>
        </div>}
        {tab === "log" && <div>{g.log.map((l: string, k: number) => <div key={k} style={{ padding: "1px 0", color: k === 0 ? th.text.primary : th.text.secondary }}>{l}</div>)}</div>}
      </div>
    </div>
  );
}
// Arrastrar y soltar objetos (ratón y táctil): start al presionar; used() evita abrir el detalle justo después de soltar
interface Dnd { start: (x: number, y: number, src: DragSrc, tap?: () => void) => void; used: () => boolean; tip?: (inst: Inst | null, x: number, y: number, plain?: boolean) => void; }
// HUD a la derecha, encima del mapa: minimapa, equipo (estilo Tibia), mochila, oro, pociones y botones
function HudPanel(props: { g: Game; th: Theme; refresh: () => void; miniRef: { current: HTMLCanvasElement | null }; hudRef: { current: HTMLDivElement | null }; open: boolean; setOpen: (o: boolean) => void; win: HudWin; setWin: (w: HudWin) => void; onSave: () => void; full: boolean; onFull: () => void; dnd?: Dnd }) {
  const { g, th } = props; const p = g.p; const now = performance.now();
  const [sel, setSel] = useState<number>(-1); const [showMini, setShowMini] = useState<boolean>(true); const [showBag, setShowBag] = useState<boolean>(true);
  // Rueda del ratón sobre el minimapa: zoom (solo ahí; el resto de la página se desplaza normal). Listener nativo para poder usar preventDefault.
  const miniWrapRef = useRef<HTMLDivElement | null>(null); const refreshRef = useRef<() => void>(props.refresh); refreshRef.current = props.refresh;
  useEffect(() => {
    const el = miniWrapRef.current; if (!el) return; let acc = 0;
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault(); e.stopPropagation();
      acc += e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 400 : 1); if (Math.abs(acc) < 30) return;
      const dir = acc < 0 ? 1 : -1; acc = 0; miniZoomStep(g, dir); refreshRef.current();
    };
    el.addEventListener("wheel", onWheel, { passive: false }); return () => el.removeEventListener("wheel", onWheel);
  }, [showMini, props.open, g]);
  const act = (f: () => void): void => { f(); props.refresh(); };
  const pick = (uid: number): void => { if (props.dnd && props.dnd.used()) return; setSel(uid); };
  const selBag = p.bag.findIndex((i: Inst) => i.uid === sel); const selSlot = SLOTS.find((s: Slot) => p.eq[s]?.uid === sel) ?? null;
  const selInst = selBag >= 0 ? (p.bag[selBag] ?? null) : selSlot ? p.eq[selSlot] : null;
  const nearShop = cheb(p.x, p.y, NPC_X, NPC_Y) <= 4 || g.shopOpen;
  const panel: CSSProperties = { background: th.bg.elevated, border: `1px solid ${th.border.strong}`, borderRadius: 8, padding: 6, pointerEvents: "auto" };
  const head: CSSProperties = { display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, marginBottom: 4 };
  const winBtn = (w: "skills" | "quests" | "keys" | "log", label: string) => <button style={btn(th, props.win === w, true)} onClick={() => props.setWin(props.win === w ? null : w)}>{label}</button>;
  if (!props.open) return (
    <div style={{ position: "absolute", top: 6, right: 6, zIndex: 3, display: "flex", gap: 4, pointerEvents: "auto" }} onMouseDown={(e) => e.preventDefault()} onPointerDown={(e) => e.stopPropagation()}>
      <button style={btn(th, false, true)} onClick={() => act(() => { g.bigMap = !g.bigMap; })}>🗺️</button>
      <button style={btn(th, props.full, true)} onClick={props.onFull} title="Pantalla completa (P)">{props.full ? "✕" : "⛶"}</button>
      <button style={btn(th, true, true)} onClick={() => props.setOpen(true)}>◂ Equipo y mapa</button>
    </div>
  );
  return (
    <div ref={props.hudRef} onMouseDown={(e) => e.preventDefault()} onPointerDown={(e) => e.stopPropagation()}
      style={{ position: "absolute", top: 6, right: 6, maxHeight: "calc(100% - 12px)", width: props.full ? "clamp(170px, 17%, 240px)" : `max(156px, ${((HUD_RES - 12) / (TS * 21)) * 100}%)`, display: "flex", flexDirection: "column", gap: 5, zIndex: 3, pointerEvents: "none", fontFamily: th.font.family, color: th.text.primary, fontSize: 11 }}>
      <div style={{ ...panel, flexShrink: 0 }}>
        <div style={head}>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={g.zone}>🗺️ {g.zone}</span>
          <button style={btn(th, g.bigMap, true)} onClick={() => act(() => { g.bigMap = !g.bigMap; })} title="Mapa completo (M)">M</button>
          <button style={btn(th, false, true)} onClick={() => setShowMini(!showMini)} title={showMini ? "Ocultar minimapa" : "Mostrar minimapa"}>{showMini ? "–" : "+"}</button>
          <button style={btn(th, false, true)} onClick={() => props.setOpen(false)} title="Ocultar HUD">▸</button>
        </div>
        {showMini && <div ref={miniWrapRef} data-minizoom={g.miniZoom ?? 1} style={{ position: "relative", width: "100%", maxWidth: 132, margin: "0 auto" }}>
          <canvas ref={props.miniRef} width={MINI_SIZE} height={MINI_SIZE} onClick={() => act(() => { g.bigMap = !g.bigMap; })} title="Rueda del ratón: zoom · clic: mapa completo" style={{ width: "100%", aspectRatio: "1 / 1", imageRendering: "pixelated", borderRadius: 4, cursor: "pointer", display: "block" }} />
          <div style={{ position: "absolute", right: 2, bottom: 2, display: "flex", gap: 2, alignItems: "center" }}>
            <button style={{ ...btn(th, false, true), padding: "0 5px", lineHeight: "14px", background: th.bg.base, opacity: (g.miniZoom ?? 1) <= 1 ? 0.45 : 1 }} onClick={() => act(() => { miniZoomStep(g, -1); })} title="Alejar minimapa (rueda abajo)" aria-label="Alejar minimapa">−</button>
            <span data-minizoom-label="1" style={{ fontSize: 9, fontWeight: 700, padding: "0 3px", borderRadius: 3, background: th.bg.base, color: th.text.primary, lineHeight: "14px" }}>{g.miniZoom ?? 1}x</span>
            <button style={{ ...btn(th, false, true), padding: "0 5px", lineHeight: "14px", background: th.bg.base, opacity: (g.miniZoom ?? 1) >= 4 ? 0.45 : 1 }} onClick={() => act(() => { miniZoomStep(g, 1); })} title="Acercar minimapa (rueda arriba)" aria-label="Acercar minimapa">+</button>
          </div>
        </div>}
      </div>
      <div data-hudscroll="1" style={{ ...panel, overflowY: "auto", minHeight: 0, flex: "0 1 auto" }}>
        <div style={{ ...head, justifyContent: "space-between" }}><span>{p.name} · Nv {p.level}</span><span style={{ whiteSpace: "nowrap" }}><span style={{ color: th.text.warning }}>💰 {p.gold}</span> <span data-coins={cs(g).coins} title="Edisar Coins (prueba)" style={{ color: th.text.warningDeep }}>🪙 {cs(g).coins}</span></span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 3, maxWidth: 132, margin: "0 auto" }}>
          {DOLL.map((s: Slot | "bag" | null, k: number) => s === null ? <div key={k} /> : s === "bag"
            ? <ItemCell key={k} th={th} fluid inst={null} drop={`bag:${bagMax(g)}`} label={`🎒 ${p.bag.length}/${bagMax(g)}`} selected={showBag} onClick={() => setShowBag(!showBag)} />
            : <ItemCell key={k} th={th} fluid inst={p.eq[s]} drop={`eq:${s}`} label={s === "off" ? g.cls.offName : SLOT_NAMES[s]} selected={!!p.eq[s] && p.eq[s]?.uid === sel} onClick={() => pick(p.eq[s]?.uid ?? -1)}
                onTip={(on: boolean, x: number, y: number) => { if (props.dnd && props.dnd.tip) props.dnd.tip(on ? p.eq[s] : null, x, y, true); }}
                onDown={(e: RPointerEvent<HTMLDivElement>) => { const it = p.eq[s]; if (it && props.dnd) props.dnd.start(e.clientX, e.clientY, { kind: "eq", slot: s, uid: it.uid }); }} />)}
        </div>
        <div style={{ display: "flex", gap: 4, justifyContent: "center", margin: "5px 0", flexWrap: "wrap" }}>
          <button style={btn(th, false, true)} onClick={() => act(() => { usePotion(g, "hp", performance.now()); })} title={`Vida: ${p.hpPot} normales + ${p.hpPot2} fuertes`}>❤️ {hpPots(p)}</button>
          <button style={btn(th, false, true)} onClick={() => act(() => { usePotion(g, "mana", performance.now()); })} title={`Maná: ${p.manaPot} normales + ${p.manaPot2} grandes`}>💧 {manaPots(p)}</button>
          {cs(g).scrolls > 0 && <button style={btn(th, false, true)} onClick={() => act(() => { readScroll(g, performance.now()); })} title="Pergamino de regreso: al templo">📜 {cs(g).scrolls}</button>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 3, marginBottom: 6 }}>
          <button style={btn(th, g.shopOpen, true)} onClick={() => act(() => { if (g.shopOpen) g.shopOpen = false; else requestShop(g, performance.now()); })}>🛒 Tienda</button>
          <button style={btn(th, g.afk, true)} onClick={() => act(() => toggleAfk(g, performance.now()))}>{g.afk ? "● AFK" : "🤖 AFK"}</button>
          <button style={btn(th, false, true)} onClick={props.onSave}>💾 Guardar</button>
          {winBtn("skills", "📊 Habilid.")}
          {winBtn("quests", "📜 Misiones")}
          {winBtn("keys", "⌨️ Atajos")}
          {winBtn("log", "📖 Registro")}
          <button data-coinbtn="1" style={btn(th, cs(g).open, true)} onClick={() => act(() => { const c = cs(g); c.open = !c.open; c.msg = ""; })} title="Tienda de Edisar Coins (K)">🪙 Coins</button>
          <button data-depbtn="1" style={btn(th, !!g.dep && g.dep.open, true)} onClick={() => act(() => { if (g.dep && g.dep.open) g.dep.open = false; else requestDepot(g, performance.now()); })} title="Depósito (baúl junto al templo)">📦 Depósito</button>
          <button data-mountbtn="1" style={btn(th, !!g.mt && g.mt.open, true)} onClick={() => act(() => { const s = mt(g); s.open = !s.open; s.msg = ""; if (s.open && g.dep) g.dep.open = false; })} title="Monturas: elige y monta">🐎 Monturas</button>
          <button style={{ ...btn(th, props.full, true), gridColumn: "1 / -1" }} onClick={props.onFull} title="Tecla P">{props.full ? "✕ Salir de pantalla completa" : "⛶ Pantalla completa"}</button>
        </div>
        <div data-afkmin={cs(g).afkMin} style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap", marginBottom: 5, fontSize: 10 }} title="Qué objetos recoge el modo AFK (el oro se recoge siempre)">
          <span style={{ color: th.text.secondary }}>🤖 AFK recoge:</span>
          {AFK_MINS.map((r: Rarity) => <button key={r} data-afkopt={r} style={{ ...btn(th, cs(g).afkMin === r, true), padding: "1px 5px", fontSize: 10 }} onClick={() => act(() => setAfkMin(g, r))} title={AFK_MIN_LABEL[r]}>{r === "com" ? "Todo" : <span style={{ color: cs(g).afkMin === r ? th.text.onPrimary : RAR[r].c }}>{RAR[r].n}+</span>}</button>)}
        </div>
        {showBag && <div>
          <div style={{ fontWeight: 700, marginBottom: 3 }}>🎒 Mochila ({p.bag.length}/{bagMax(g)})</div>
          <div data-drop={`bag:${bagMax(g)}`} style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 2 }}>
            {Array.from({ length: bagMax(g) }, (_: unknown, k: number) => { const i = p.bag[k] ?? null; return <ItemCell key={i ? i.uid : `e${k}`} th={th} fluid inst={i} label="" drop={`bag:${k}`} selected={!!i && i.uid === sel} onClick={() => pick(i ? i.uid : -1)} up={!!i && isUpgrade(g, i)}
              onTip={(on: boolean, x: number, y: number) => { if (props.dnd && props.dnd.tip) props.dnd.tip(on ? i : null, x, y); }}
              onDown={(e: RPointerEvent<HTMLDivElement>) => { if (i && props.dnd) props.dnd.start(e.clientX, e.clientY, { kind: "bag", uid: i.uid }); }} />; })}
          </div>
        </div>}
        {selInst && <div style={{ ...panel, position: "absolute", top: 0, right: "calc(100% + 6px)", width: 190, fontSize: 11 }}>
          <div style={{ marginBottom: 4 }}><ItemTipBody g={g} th={th} inst={selInst} plain={!!selSlot} /></div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {selBag >= 0 && <button style={btn(th, true, true)} onClick={() => act(() => { equipItem(g, selBag, performance.now()); })}>Equipar</button>}
            {selSlot && <button style={btn(th, false, true)} onClick={() => act(() => { unequip(g, selSlot, performance.now()); })}>Quitar</button>}
            <button style={btn(th, false, true)} title="Tirar al suelo, a tus pies" onClick={() => act(() => { const t = performance.now(); if (selBag >= 0) dropItem(g, selBag, null, null, t); else if (selSlot) dropItem(g, selSlot, null, null, t); setSel(-1); })}>⬇ Tirar</button>
            {selBag >= 0 && !!g.dep && g.dep.open && <button style={btn(th, true, true)} onClick={() => act(() => { depositItem(g, selBag); setSel(-1); })} title="Guardar en el depósito">📦 Guardar</button>}
            {selBag >= 0 && (nearShop ? <button style={btn(th, false, true)} onClick={() => act(() => { sellItem(g, selBag); setSel(-1); })}>Vender ({sellValue(selInst)})</button> : <span style={{ color: th.text.tertiary, alignSelf: "center" }}>Vende con Rosa</span>)}
            <button style={btn(th, false, true)} onClick={() => setSel(-1)}>✕</button>
          </div>
          {(() => { const d = ITEM[selInst.id]; return d && !canUse(g, d) ? <div style={{ color: th.text.danger, marginTop: 3 }}>No puedes usarlo (vocación o nivel).</div> : null; })()}
        </div>}
        {g.afk && <div style={{ fontSize: 10, marginTop: 4, color: th.text.success }}>AFK {Math.floor((now - g.afkStart) / 60000)} min · {afkRate(g, now).toLocaleString("es-MX")} exp/h · {g.afkKills} muertes · {g.afkLoot} objetos</div>}
      </div>
    </div>
  );
}

const PAD: Array<MoveAct | null> = ["ul", "up", "ur", "left", null, "right", "dl", "down", "dr"];
const PAD_ICON: Record<MoveAct, string> = { ul: "↖", up: "↑", ur: "↗", left: "←", right: "→", dl: "↙", down: "↓", dr: "↘" };
function GameScreen(props: { cls: ClassId; name: string; save?: SaveData | null; onExit: () => void; full: boolean; fs: boolean; onFull: () => void }) {
  const th = useGrokTheme();
  const fullRef = useRef<boolean>(props.full); fullRef.current = props.full; const onFullRef = useRef<() => void>(props.onFull); onFullRef.current = props.onFull;
  const [coarse] = useState<boolean>(() => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches);
  const canvasRef = useRef<HTMLCanvasElement | null>(null); const miniRef = useRef<HTMLCanvasElement | null>(null); const hudRef = useRef<HTMLDivElement | null>(null);
  const gRef = useRef<Game | null>(null);
  if (!gRef.current) gRef.current = props.save ? gameFromSave(props.save) : newGame(CLASSES[props.cls], props.name);
  const g = gRef.current;
  const [binds, setBindsS] = useState<Binds>(() => cloneBinds(props.save ? props.save.binds : DEFAULT_BINDS)); const bindsRef = useRef<Binds>(binds);
  const [saveView, setSaveView] = useState<{ code: string; local: boolean } | null>(null); const saveOpenRef = useRef<boolean>(false);
  const openSave = (): void => {
    let code = ""; try { code = encodeSave(snapshot(g, bindsRef.current)); } catch { code = ""; }
    if (!code) return;
    const local = lsSet(LS_KEY, code); g.heldDirs = []; saveOpenRef.current = true; setSaveView({ code, local });
    addLog(g, "Partida guardada (código generado).");
  };
  const closeSave = (): void => { saveOpenRef.current = false; setSaveView(null); };
  const [listening, setListeningS] = useState<Listen>(null); const listenRef = useRef<Listen>(null);
  const [, setTick] = useState<number>(0);
  const [hudOpen, setHudOpen] = useState<boolean>(() => typeof window === "undefined" || window.innerWidth >= 700);
  const [win, setWin] = useState<HudWin>(null);
  const refresh = (): void => setTick((t: number) => (t + 1) % 1000000);
  const setBinds = (b: Binds): void => { bindsRef.current = b; setBindsS(b); };
  const setListening = (l: Listen): void => { listenRef.current = l; setListeningS(l); };
  useEffect(() => {
    let raf = 0;
    // Cuánto del mapa tapa el HUD (para centrar la cámara en la parte visible)
    const measure = (): void => {
      const gg = gRef.current, c = canvasRef.current; if (!gg || !c) return;
      const cw = c.getBoundingClientRect().width; const h = hudRef.current; const hw = h ? h.getBoundingClientRect().width + 6 : 0;
      gg.hudPad = cw > 0 ? clamp((hw / cw) * VW, 0, VW * 0.6) : 0;
    };
    // Ajusta la vista y la resolución del lienzo a su tamaño en pantalla (nítido, DPR máx. 2)
    const fit = (): void => {
      const c = canvasRef.current; if (!c) return; const r = c.getBoundingClientRect(); if (r.width < 10 || r.height < 10) return;
      let w = TS * 21, h = TS * 13;
      if (fullRef.current) { let z = clamp(Math.min(r.height / (14 * TS), r.width / 576), 0.5, 3); z = Math.max(z, r.width / 1400, r.height / 1000); w = r.width / z; h = r.height / z; }
      if (Math.round(w) !== VW || Math.round(h) !== VH) { setView(w, h); measure(); }
      const dpr = Math.min(2, window.devicePixelRatio || 1); let bw = Math.round(r.width * dpr), bh = Math.round(r.height * dpr);
      if (bw * bh > 8300000) { const k = Math.sqrt(8300000 / (bw * bh)); bw = Math.round(bw * k); bh = Math.round(bh * k); }
      if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
    };
    const loop = (): void => {
      const gg = gRef.current; const now = performance.now();
      if (gg) {
        update(gg, now); fit();
        const cv = canvasRef.current; const ctx = cv ? cv.getContext("2d") : null; if (cv && ctx) { ctx.setTransform(cv.width / VW, 0, 0, cv.height / VH, 0, 0); render(ctx, gg, now, bindsRef.current); }
        const mctx = miniRef.current ? miniRef.current.getContext("2d") : null; if (mctx) drawMiniPanel(mctx, gg, now);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const iv = window.setInterval(() => { measure(); setTick((t: number) => (t + 1) % 1000000); }, 300);
    const typing = (t: EventTarget | null): boolean => { const el = t as HTMLElement | null; return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable); };
    const autosave = (): void => { const gg = gRef.current; if (!gg) return; try { lsSet(LS_KEY, encodeSave(snapshot(gg, bindsRef.current))); } catch { /* sin almacenamiento */ } };
    const autoIv = window.setInterval(autosave, 30000);
    const down = (e: KeyboardEvent): void => {
      if (typing(e.target)) return; const gg = gRef.current; if (!gg) return;
      if (saveOpenRef.current) { if (e.code === "Escape") { e.preventDefault(); saveOpenRef.current = false; setSaveView(null); } return; }
      const L = listenRef.current;
      if (L) { e.preventDefault(); if (e.code !== "Escape") { const b = cloneBinds(bindsRef.current); assignKey(b, L.act, e.code, L.mode); setBinds(b); } setListening(null); return; }
      if (e.code === "Escape" && fullRef.current && !document.fullscreenElement && !gg.shopOpen && !gg.bigMap && !(gg.cs && (gg.cs.open || gg.cs.exOpen)) && !(gg.dep && gg.dep.open) && !(gg.mt && gg.mt.open) && gg.target < 0) { e.preventDefault(); onFullRef.current(); return; }
      const a = actionFor(bindsRef.current, e.code); if (!a) return;
      e.preventDefault();
      if (a === "fullscreen") { if (!e.repeat) onFullRef.current(); return; }
      if (a === "keys") { if (!e.repeat) setWin((w: HudWin) => (w === "keys" ? null : "keys")); return; }
      if (isMove(a)) { if (!gg.heldDirs.includes(a)) gg.heldDirs.push(a); return; }
      if (e.repeat) return;
      runAction(gg, a, performance.now()); refresh();
    };
    const up = (e: KeyboardEvent): void => { const gg = gRef.current; if (!gg) return; const a = actionFor(bindsRef.current, e.code); if (a && isMove(a)) gg.heldDirs = gg.heldDirs.filter((d: MoveAct) => d !== a); };
    const blur = (): void => { const gg = gRef.current; if (gg) gg.heldDirs = []; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur); window.addEventListener("resize", measure);
    return () => { autosave(); window.clearInterval(autoIv); cancelAnimationFrame(raf); window.clearInterval(iv); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); window.removeEventListener("resize", measure); setView(TS * 21, TS * 13); };
  }, []);
  useEffect(() => { const gg = gRef.current; if (gg && !hudOpen) gg.hudPad = 0; const t = window.setTimeout(() => { const c = canvasRef.current, h = hudRef.current; if (gg && c) { const cw = c.getBoundingClientRect().width; gg.hudPad = h && cw > 0 ? clamp(((h.getBoundingClientRect().width + 6) / cw) * VW, 0, VW * 0.6) : 0; } }, 30); return () => window.clearTimeout(t); }, [hudOpen]);
  // Arrastrar objetos: mochila / equipo / suelo → mapa, mochila o ranura de equipo
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ src: DragSrcX; x0: number; y0: number; on: boolean; tap?: () => void } | null>(null);
  const dragEnd = useRef<number>(-99999);
  const [ghost, setGhost] = useState<{ x: number; y: number; inst: Inst } | null>(null);
  const dropDst = (cx: number, cy: number): DropDstX | null => {
    const el = document.elementFromPoint(cx, cy); const t = el ? el.closest("[data-drop]") : null; const d = t ? (t.getAttribute("data-drop") ?? "") : "";
    if (d.startsWith("bag:")) return { kind: "bag", k: Number(d.slice(4)) };
    if (d.startsWith("dep:")) return { kind: "dep", k: Number(d.slice(4)) };
    if (d.startsWith("eq:")) { const sl = SLOTS.find((x: Slot) => x === d.slice(3)); return sl ? { kind: "eq", slot: sl } : null; }
    if (d === "map") {
      const c = canvasRef.current; if (!c || g.bigMap) return { kind: "feet" }; const r = c.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return { kind: "feet" };
      const px = ((cx - r.left) * VW) / r.width, py = ((cy - r.top) * VH) / r.height; return { kind: "tile", x: Math.floor((px + g.camX) / TS), y: Math.floor((py + g.camY) / TS) };
    }
    return null;
  };
  const startDrag = (x0: number, y0: number, src: DragSrcX, tap?: () => void): void => {
    if (dragRef.current) return;
    dragRef.current = { src, x0, y0, on: false, tap }; setTip(null);
    const inst: Inst | null = src.kind === "floor" ? src.gi.inst : src.kind === "eq" ? g.p.eq[src.slot] : src.kind === "dep" ? (dep(g).items.find((i: Inst) => i.uid === src.uid) ?? null) : (g.p.bag.find((i: Inst) => i.uid === src.uid) ?? null);
    const move = (e: PointerEvent): void => {
      const d = dragRef.current; if (!d) return;
      if (!d.on && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 7) return;
      d.on = true; if (inst) setGhost({ x: e.clientX, y: e.clientY, inst }); if (e.cancelable) e.preventDefault();
      const sc = wrapRef.current ? wrapRef.current.querySelector("[data-hudscroll]") : null;
      if (sc) { const r = sc.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right) { if (e.clientY < r.top + 6 && e.clientY > r.top - 60) sc.scrollTop -= 14; else if (e.clientY > r.bottom - 6 && e.clientY < r.bottom + 60) sc.scrollTop += 14; } }
    };
    const end = (e: PointerEvent, cancel: boolean): void => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", upH); window.removeEventListener("pointercancel", cancelH);
      const d = dragRef.current; dragRef.current = null; setGhost(null); if (!d) return;
      if (!d.on) { if (!cancel && d.tap) d.tap(); return; }
      dragEnd.current = performance.now();
      if (!cancel) applyDropX(g, d.src, dropDst(e.clientX, e.clientY), performance.now());
      refresh();
    };
    const upH = (e: PointerEvent): void => end(e, false); const cancelH = (e: PointerEvent): void => end(e, true);
    window.addEventListener("pointermove", move, { passive: false }); window.addEventListener("pointerup", upH); window.addEventListener("pointercancel", cancelH);
  };
  // Tooltip de comparación (sólo ratón): se oculta al arrastrar; Mayús muestra lo equipado al lado
  const [tip, setTip] = useState<{ inst: Inst; x: number; y: number; plain: boolean } | null>(null);
  const [shift, setShift] = useState<boolean>(false);
  useEffect(() => {
    const kd = (e: KeyboardEvent): void => { if (e.key === "Shift") setShift(true); }; const ku = (e: KeyboardEvent): void => { if (e.key === "Shift") setShift(false); }; const bl = (): void => setShift(false);
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku); window.addEventListener("blur", bl);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); window.removeEventListener("blur", bl); };
  }, []);
  const hoverTip = (inst: Inst | null, x: number, y: number, plain?: boolean): void => {
    if (!inst || dragRef.current) { setTip((t: { inst: Inst; x: number; y: number; plain: boolean } | null) => (t ? null : t)); return; }
    setTip({ inst, x, y, plain: !!plain });
  };
  const placeTip = (el: HTMLDivElement | null): void => {
    const w = wrapRef.current; if (!el || !w || !tip) return; const r = w.getBoundingClientRect(); const tw = el.offsetWidth, tht = el.offsetHeight; const vw = window.innerWidth, vh = window.innerHeight;
    let x = tip.x + 16, y = tip.y + 16; if (x + tw > vw - 4) x = tip.x - 16 - tw; if (y + tht > vh - 4) y = tip.y - 16 - tht;
    x = clamp(x, 4, Math.max(4, vw - tw - 4)); y = clamp(y, 4, Math.max(4, vh - tht - 4));
    el.style.left = `${Math.round(x - r.left)}px`; el.style.top = `${Math.round(y - r.top)}px`;
  };
  const tipLive = !!tip && !ghost && (tip.inst.uid < 0 ? g.shopOpen : g.p.bag.includes(tip.inst) || SLOTS.some((s: Slot) => g.p.eq[s] === tip.inst) || g.ground.some((gi: Ground) => gi.inst === tip.inst) || (!!g.dep && g.dep.open && g.dep.items.includes(tip.inst)));
  const onCanvasMove = (e: RPointerEvent<HTMLCanvasElement>): void => {
    if (e.pointerType !== "mouse" || e.buttons !== 0 || g.bigMap) { if (tip) setTip(null); return; }
    const c = canvasRef.current; if (!c) return; const r = c.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return;
    const px = ((e.clientX - r.left) * VW) / r.width, py = ((e.clientY - r.top) * VH) / r.height;
    const gi = floorAt(g, Math.floor((px + g.camX) / TS), Math.floor((py + g.camY) / TS));
    if (gi) hoverTip(gi.inst, e.clientX, e.clientY); else if (tip) setTip(null);
  };
  const dnd: Dnd = { start: startDrag, used: () => performance.now() - dragEnd.current < 350, tip: hoverTip };
  const onCanvas = (e: RPointerEvent<HTMLCanvasElement>): void => {
    const c = canvasRef.current; if (!c) return; const r = c.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return;
    const px = ((e.clientX - r.left) * VW) / r.width, py = ((e.clientY - r.top) * VH) / r.height; const now = performance.now();
    if (g.bigMap) { g.bigMap = false; refresh(); return; }
    const s = slotAt(px, py); if (s >= 0) { runAction(g, SLOT_ACTS[s] ?? "power1", now); refresh(); return; }
    const tx = Math.floor((px + g.camX) / TS), ty = Math.floor((py + g.camY) / TS);
    const gi = floorAt(g, tx, ty);
    if (gi && !monAt(g, tx, ty) && cheb(tx, ty, g.p.x, g.p.y) <= DROP_RANGE && regionOf(tx, ty) === regionOf(g.p.x, g.p.y)) { startDrag(e.clientX, e.clientY, { kind: "floor", gi }, () => { clickTile(g, tx, ty, performance.now()); refresh(); }); return; }
    if (tx === NPC_X && (ty === NPC_Y || ty === NPC_Y - 1)) requestShop(g, now); else if (regionOf(g.p.x, g.p.y) === 0 && tx === DARIO_X && (ty === DARIO_Y || ty === DARIO_Y - 1)) requestExchange(g, now); else if (regionOf(g.p.x, g.p.y) === 0 && tx === DEPOT_X && (ty === DEPOT_Y || ty === DEPOT_Y - 1)) requestDepot(g, now); else if (regionOf(g.p.x, g.p.y) === 0 && tx === STABLE_X && (ty === STABLE_Y || ty === STABLE_Y - 1)) requestStable(g, now); else clickTile(g, tx, ty, now);
    refresh();
  };
  const hold = (d: MoveAct, on: boolean): void => { if (on) { if (!g.heldDirs.includes(d)) g.heldDirs.push(d); } else g.heldDirs = g.heldDirs.filter((x: MoveAct) => x !== d); };
  const doAct = (a: Action): void => { runAction(g, a, performance.now()); refresh(); };
  const short = (n: string): string => n.split(" ")[0] ?? n;
  const full = props.full;
  return (
    <div style={full ? { fontFamily: th.font.family, color: th.text.primary, height: "100%", display: "flex", flexDirection: "column" } : { fontFamily: th.font.family, color: th.text.primary, padding: 8 }}>
      <style>{glowCss(th)}</style>
      {!full && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap", maxWidth: 1080, margin: "0 auto 6px" }}>
        <h2 style={{ margin: 0, flex: 1, fontSize: 20 }}>Edisar – Prototipo</h2>
        <button style={btn(th, false, true)} onClick={props.onFull} title="Tecla P">⛶ Pantalla completa</button>
        <button style={btn(th, hudOpen, true)} onClick={() => setHudOpen(!hudOpen)}>{hudOpen ? "Ocultar HUD" : "Mostrar HUD"}</button>
        <button style={btn(th, false, true)} onClick={openSave}>💾 Guardar</button>
        <button style={btn(th, false, true)} onClick={() => { try { lsSet(LS_KEY, encodeSave(snapshot(g, bindsRef.current))); } catch { /* sin almacenamiento */ } props.onExit(); }}>Nueva partida</button>
      </div>}
      <div style={full ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : { maxWidth: 1080, margin: "0 auto" }}>
        <div ref={wrapRef} style={full ? { position: "relative", flex: 1, minHeight: 0, overflow: "hidden" } : { position: "relative" }}>
          <canvas ref={canvasRef} data-drop="map" onPointerDown={onCanvas} onPointerMove={onCanvasMove} onPointerLeave={() => { if (tip) setTip(null); }} onContextMenu={(e) => e.preventDefault()} style={full ? { width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "pointer" } : { width: "100%", aspectRatio: "672 / 416", display: "block", borderRadius: 8, touchAction: "none", cursor: "pointer" }} />
          {!g.bigMap && <HudPanel g={g} th={th} refresh={refresh} miniRef={miniRef} hudRef={hudRef} open={hudOpen} setOpen={setHudOpen} win={win} setWin={setWin} onSave={openSave} full={full} onFull={props.onFull} dnd={dnd} />}
          {ghost && (() => { const w = wrapRef.current; const r = w ? w.getBoundingClientRect() : null; if (!r) return null; return (
            <div style={{ position: "absolute", left: ghost.x - r.left - 18, top: ghost.y - r.top - 18, width: 36, height: 36, boxSizing: "border-box", borderRadius: 6, border: `2px solid ${RAR[ghost.inst.rar].c}`, background: th.bg.elevated, boxShadow: `0 0 8px ${RAR[ghost.inst.rar].c}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, pointerEvents: "none", zIndex: 20, opacity: 0.92 }}>{glyphOf(ghost.inst.id)}</div>); })()}
          {full && <button style={{ ...btn(th, true, true), position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", zIndex: 5 }} onMouseDown={(e) => e.preventDefault()} onPointerDown={(e) => e.stopPropagation()} onClick={props.onFull}>✕ Salir{props.fs ? "" : " (Esc)"}</button>}
          {win && !g.bigMap && <HudWindow g={g} th={th} win={win} onClose={() => setWin(null)} binds={binds} listening={listening} setListening={setListening} resetBinds={() => setBinds(cloneBinds(DEFAULT_BINDS))} />}
          {g.shopOpen && <ShopOverlay g={g} th={th} refresh={refresh} tip={hoverTip} />}
          {g.cs && g.cs.exOpen && <ExchangeOverlay g={g} th={th} refresh={refresh} />}
          {g.cs && g.cs.open && <CoinStore g={g} th={th} refresh={refresh} />}
          {g.mt && g.mt.open && <MountsWindow g={g} th={th} refresh={refresh} keyName={binds.mount[0] ? keyLabel(binds.mount[0]) : "—"} />}
          {g.dep && g.dep.open && <DepotWindow g={g} th={th} refresh={refresh} dnd={{ start: startDrag, used: dnd.used, tip: hoverTip }} />}
          {tip && tipLive && (() => { const cmp = compareItem(g, tip.inst); const cur = cmp && !tip.plain && cmp.verdict !== "same" ? cmp.cur : null; return (
            <div ref={placeTip} style={{ position: "absolute", left: 0, top: 0, zIndex: 30, pointerEvents: "none", display: "flex", gap: 10, background: th.bg.elevated, color: th.text.primary, border: `1px solid ${th.border.strong}`, borderRadius: 8, padding: 8, fontSize: 11, fontFamily: th.font.family, boxShadow: `0 4px 14px ${th.border.strong}` }}>
              <div style={{ width: 210 }}><ItemTipBody g={g} th={th} inst={tip.inst} plain={tip.plain} />{!shift && cur && <div style={{ fontSize: 9, marginTop: 3, color: th.text.tertiary }}>Mayús: ver equipado</div>}</div>
              {shift && cur && <div style={{ width: 190, borderLeft: `1px solid ${th.border.subtle}`, paddingLeft: 10 }}><div style={{ color: th.text.tertiary, marginBottom: 2 }}>Equipado ahora</div><ItemTipBody g={g} th={th} inst={cur} plain /></div>}
            </div>); })()}
          {saveView && <SaveModal code={saveView.code} local={saveView.local} th={th} onClose={closeSave} />}
        </div>
        {(!full || coarse) && <div style={full ? { display: "flex", gap: 6, padding: 4, flexWrap: "wrap", alignItems: "flex-start", flex: "none" } : { display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,44px)", gap: 4 }}>
            {PAD.map((d: MoveAct | null, k: number) => d ? (
              <button key={k} style={{ ...btn(th), width: 44, height: 44, fontSize: 18, padding: 0, touchAction: "none" }}
                onPointerDown={(e) => { e.preventDefault(); hold(d, true); }} onPointerUp={() => hold(d, false)} onPointerLeave={() => hold(d, false)} onPointerCancel={() => hold(d, false)}>{PAD_ICON[d]}</button>
            ) : <button key={k} style={{ ...btn(th, true), width: 44, height: 44, fontSize: 10, padding: 0 }} onClick={() => doAct("attack")}>Atacar</button>)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1, minWidth: 200 }}>
            <button style={btn(th, true)} onClick={() => doAct("attack")}>⚔️ Atacar</button>
            <button style={btn(th)} onClick={() => doAct("nextTarget")}>Sig. objetivo</button>
            {g.cls.powers.map((pw: Power, i: number) => <button key={i} style={btn(th)} onClick={() => doAct(SLOT_ACTS[i] ?? "power1")}>{i + 1}. {short(pw.name)}</button>)}
            <button style={btn(th)} onClick={() => doAct("hpPot")}>❤️ Vida ({hpPots(g.p)})</button>
            <button style={btn(th)} onClick={() => doAct("manaPot")}>💧 Maná ({manaPots(g.p)})</button>
            <button style={btn(th, g.shopOpen)} onClick={() => doAct("shop")}>🛒 Tienda</button>
            <button style={btn(th, !!g.cs && g.cs.open)} onClick={() => doAct("coins")}>🪙 Coins</button>
            <button data-ridebtn="1" style={btn(th, !!riding(g))} onClick={() => doAct("mount")}>🐎 {riding(g) ? "Bajar" : "Montar"}</button>
            <button style={btn(th, g.afk)} onClick={() => doAct("afk")}>{g.afk ? "● AFK" : "🤖 AFK"}</button>
            <button style={btn(th, g.bigMap)} onClick={() => doAct("map")}>🗺️ Mapa</button>
            <button style={btn(th)} onClick={() => doAct("clearTarget")}>Esc</button>
          </div>
        </div>}
        {!full && <div style={{ fontSize: 11, color: th.text.secondary, marginTop: 6, lineHeight: 1.5 }}>
          WASD / flechas / numpad para moverte (Q E Z C o 7 9 1 3 en diagonal). Espacio: atacar al más cercano (otra vez: siguiente). F1–F4 poderes, F5/F6 pociones, T o Enter: tienda (cerca de Rosa), G: AFK, M: mapa, H: atajos (ahí puedes cambiar cualquier tecla).
          Toca el suelo para caminar, un monstruo para atacarlo, o a Rosa para abrir la tienda. Pisa el botín para recogerlo. El equipo, la mochila y el minimapa están dentro del juego, a la derecha (▸ lo oculta); Habilidades, Misiones, Atajos y Registro se abren como ventanas.
          Caballero y pícaro persiguen solos a su objetivo (moverte a mano cancela la persecución hasta el próximo ataque). «💾 Guardar» te da un código para continuar después.
          <br />🏛️ <b>Las 12 Casas del Zodiaco</b>: sube por el camino del Santuario, al norte de la villa. Entra pisando el portal de cada casa (empieza por Aries, nivel 3); al vencer a su guardián dorado se abre la siguiente y vuelves al templo. Cuidado con los ataques marcados en rojo: ¡apártate! El AFK puede cazar dentro de las casas, pero nunca pelea contra los guardianes.
          <br />⬇ <b>Tirar objetos</b>: arrastra un objeto de la mochila o del equipo al mapa (hasta 3 casillas; si no, cae a tus pies), a otra casilla de la mochila para ordenarla, o a una ranura de equipo para ponértelo. También con «⬇ Tirar» en el detalle del objeto. Lo que tiras no se recoge solo (el AFK lo ignora); para recogerlo, arrástralo del suelo a la mochila o vuelve a pisarlo pasados 10 s.
          <br />🔍 <b>Comparar objetos</b>: pasa el ratón sobre un objeto (mochila, suelo o tienda) para compararlo con lo que llevas puesto: ▲ verde mejor, ▼ rojo peor. Mantén Mayús para ver tu objeto equipado al lado. En táctil, tócalo para ver la comparación en el detalle. Un ▲ verde en la casilla marca una mejora para ti.
          <br />🪙 <b>Edisar Coins (prueba)</b>: tecla K o botón «🪙 Coins» abre la tienda (cosméticos, premium, mochila, pergaminos, poción de experiencia, cambio de nombre; monturas próximamente). Sin pagos reales: se ganan jugando, con «Modo prueba» o con el Cambista Darío junto a la fuente (1 Edisar Coin = 10,000 de oro). En el HUD, «🤖 AFK recoge» elige si el AFK recoge todo o sólo objetos Raros (azul), Épicos (morado) y Heaven; el oro se recoge siempre.
          <br />📦 <b>Depósito</b>: el baúl junto al templo guarda hasta 80 objetos. Tócalo (o camina hasta él) para abrirlo y arrastra objetos entre la mochila y el depósito, o usa «📦 Guardar» / «⬆ Sacar». Sólo se abre en Villa Esmeralda.
          <br />🐎 <b>Monturas</b>: tecla R (o «🐎 Montar») para montar o bajar; «🐎 Monturas» abre la ventana para elegir cuál. Montado caminas de +20% a +40% más rápido, también dentro de las casas. Tomás, en la esquina del pueblo, vende el Burro de carga por oro; otras están en la Tienda de Coins y algunas se doman venciendo jefes (Rey Minotauro, Aldebarán, Aioria, Aioros).
          <br />⛶ <b>Pantalla completa</b>: botón ⛶ o tecla P (se puede cambiar en «Atajos»). Si el navegador no la permite, el juego ocupa toda la página; «✕ Salir» o Esc para volver.
        </div>}
      </div>
    </div>
  );
}

export default function App() {
  const [run, setRun] = useState<{ cls: ClassId; name: string; key: number; save: SaveData | null } | null>(null);
  // Pantalla completa: intenta la real (requestFullscreen); si el marco no la permite, el juego se maximiza dentro de la página
  const th = useGrokTheme(); const rootRef = useRef<HTMLDivElement | null>(null); const [full, setFull] = useState<boolean>(false); const [fs, setFs] = useState<boolean>(false);
  useEffect(() => {
    const onChange = (): void => { const on = !!document.fullscreenElement; setFs(on); if (!on) setFull(false); };
    document.addEventListener("fullscreenchange", onChange); return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  useEffect(() => {
    if (!full) return;
    const b = document.body.style.overflow, h = document.documentElement.style.overflow; document.body.style.overflow = "hidden"; document.documentElement.style.overflow = "hidden";
    const esc = (e: KeyboardEvent): void => { if (e.code === "Escape" && !run && !document.fullscreenElement) setFull(false); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = b; document.documentElement.style.overflow = h; window.removeEventListener("keydown", esc); };
  }, [full, run]);
  const toggleFull = (): void => {
    if (full || document.fullscreenElement) {
      setFull(false);
      if (document.fullscreenElement) { try { void document.exitFullscreen().catch(() => undefined); } catch { /* nada */ } }
      return;
    }
    setFull(true);
    const el = rootRef.current;
    try { if (el && document.fullscreenEnabled && typeof el.requestFullscreen === "function") void el.requestFullscreen().catch(() => undefined); } catch { /* el marco no lo permite: queda maximizado */ }
  };
  return (
    <Page title="Edisar – Prototipo" width="full">
      <div ref={rootRef} style={full ? { position: "fixed", inset: 0, zIndex: 1000, background: th.bg.elevated, overflow: run ? "hidden" : "auto" } : undefined}>
      {!run ? <TitleScreen full={full} onFull={toggleFull} onStart={(c: ClassId, n: string) => setRun({ cls: c, name: n, key: Date.now(), save: null })} onLoad={(d: SaveData) => setRun({ cls: d.cls, name: d.name, key: Date.now(), save: d })} />
        : <GameScreen key={run.key} cls={run.cls} name={run.name} save={run.save} onExit={() => setRun(null)} full={full} fs={fs} onFull={toggleFull} />}
      </div>
    </Page>
  );
}
