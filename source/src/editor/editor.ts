// Editor de mapas de Edisar (v26). Página independiente: dist/editor.html (la genera scripts/build.mjs).
// Datos embebidos en window.__ED: catálogo de tiles, atlas, mapa del juego (formato "edisar-map"), monstruos, zonas.
type TileInfo = { id: number; n: string; cat: string; layer: "floor" | "obj"; spr: number[]; under?: number; ov?: boolean; anim?: boolean; stair?: boolean; walk?: boolean; c?: string };
type Mark = { k: "spawn" | "npc" | "portal"; x: number; y: number; m?: string; n?: string; tx?: number; ty?: number };
type EdData = { W: number; H: number; map: string; tiles: TileInfo[]; mons: Array<{ id: string; n: string; boss: boolean }>; ref: Array<[number, number, string]>;
  zn: string[]; zr: string; zc: Array<[number, number]>; temple: [number, number]; town: [number, number, number, number]; tileset: string; ver: string };
const D = (window as unknown as { __ED: EdData }).__ED;
const CW = D.W, CH = D.H, NONE = 255, GRASS = 0, PORTAL = 11, LS = "edisar.editor.v1", MAXS = 1024; // CW×CH = mundo original (fijo); el archivo puede ser mayor (v2)
const TI: Array<TileInfo | undefined> = []; for (const t of D.tiles) TI[t.id] = t;
const monName: Record<string, string> = {}; for (const m of D.mons) monName[m.id] = m.n;
const $ = <T extends HTMLElement>(s: string): T => document.querySelector(s) as T;

// ---------- formato ----------
function rleDec(s: string, len: number): number[] | null { const a: number[] = new Array(len); let i = 0;
  for (const tok of s.split(",")) { if (!tok) continue; const k = tok.indexOf("*"); const v = Number(k < 0 ? tok : tok.slice(0, k)), n = k < 0 ? 1 : Number(tok.slice(k + 1));
    if (!Number.isInteger(v) || v < 0 || !Number.isInteger(n) || n < 1 || i + n > len) return null; for (let j = 0; j < n; j++) a[i + j] = v; i += n; }
  return i === len ? a : null; }
function rleEnc(a: ArrayLike<number>): string { const out: string[] = []; let i = 0; while (i < a.length) { const v = a[i]!; let n = 1; while (i + n < a.length && a[i + n] === v) n++; out.push(n > 1 ? `${v}*${n}` : String(v)); i += n; } return out.join(","); }
type MapState = { w: number; h: number; ox: number; oy: number; floor: Uint8Array; obj: Uint8Array; safe: Uint8Array; marks: Mark[]; name: string };
function parse(txt: string): MapState | string {
  let o: any; try { o = JSON.parse(txt); } catch { return "El archivo no es un JSON válido."; }
  if (!o || o.format !== "edisar-map") return "No es un mapa de Edisar (falta format: \"edisar-map\").";
  const w = o.w, h = o.h, ox = o.v === 1 || o.ox === undefined ? 0 : o.ox, oy = o.v === 1 || o.oy === undefined ? 0 : o.oy;
  if (![w, h, ox, oy].every((v) => Number.isInteger(v))) return "Tamaño del mapa no válido.";
  if (w > MAXS || h > MAXS) return `El mapa es demasiado grande (máximo ${MAXS}×${MAXS}).`;
  if (ox < 0 || oy < 0 || ox + CW > w || oy + CH > h) return `El mapa debe contener el mundo original (${CW}×${CH}).`;
  const N = w * h; const f = typeof o.floor === "string" ? rleDec(o.floor, N) : null, b = typeof o.obj === "string" ? rleDec(o.obj, N) : null; if (!f || !b) return "Las capas del mapa están dañadas.";
  const sf = typeof o.safe === "string" ? rleDec(o.safe, N) : null;
  const marks: Mark[] = Array.isArray(o.marks) ? o.marks.filter((m: any) => m && typeof m.x === "number" && typeof m.y === "number" && (m.k === "spawn" || m.k === "npc" || m.k === "portal")) : [];
  return { w, h, ox, oy, floor: Uint8Array.from(f.map((v) => (TI[v]?.layer === "floor" ? v : GRASS))), obj: Uint8Array.from(b.map((v) => (TI[v]?.layer === "obj" ? v : NONE))), safe: sf ? Uint8Array.from(sf.map((v) => (v === 1 ? 1 : 0))) : new Uint8Array(N), marks, name: typeof o.name === "string" ? o.name : "mapa" };
}
function serialize(): string { return JSON.stringify({ format: "edisar-map", v: 2, name: st.name, w: st.w, h: st.h, ox: st.ox, oy: st.oy, floor: rleEnc(st.floor), obj: rleEnc(st.obj), safe: st.safe.some((v) => v === 1) ? rleEnc(st.safe) : undefined, marks: st.marks }); }

// ---------- estado ----------
const base = parse(D.map) as MapState;
let st: MapState = clone(base);
function clone(m: MapState): MapState { return { ...m, floor: m.floor.slice(), obj: m.obj.slice(), safe: m.safe.slice(), marks: m.marks.map((k) => ({ ...k })) }; }
try { const s = localStorage.getItem(LS); if (s) { const r = parse(s); if (typeof r !== "string") st = r; } } catch { /* sin almacenamiento */ }
const zoneIdx = rleDec(D.zr, CW * CH) ?? new Array(CW * CH).fill(0);
function zoneAt(x: number, y: number): string { const gx = x - st.ox, gy = y - st.oy; return gx < 0 || gy < 0 || gx >= CW || gy >= CH ? "🧭 Tierras nuevas" : D.zn[zoneIdx[gy * CW + gx] ?? 0] ?? ""; }
type Sel = { kind: "tile"; id: number } | { kind: "mark"; k: Mark["k"] } | { kind: "safe" };
let sel: Sel = { kind: "tile", id: GRASS }; let tool: "brush" | "erase" | "fill" | "pick" | "pan" = "brush"; let brush = 1;
let zoom = 1, camX = 0, camY = 0; const view = { floor: true, obj: true, marks: true, ref: true, grid: false, safe: true };
const undo: MapState[] = [], redo: MapState[] = [];
function layer(): "floor" | "obj" | "marks" | "safe" { return sel.kind === "mark" ? "marks" : sel.kind === "safe" ? "safe" : TI[sel.id]?.layer ?? "floor"; }
function pushUndo(): void { undo.push(clone(st)); if (undo.length > 40) undo.shift(); redo.length = 0; }
let saveT = 0; function dirty(): void { overviewDirty = true; draw(); window.clearTimeout(saveT); saveT = window.setTimeout(() => { try { localStorage.setItem(LS, serialize()); $("#saved").textContent = "Guardado en este navegador ✓"; } catch { $("#saved").textContent = "⚠ No se pudo guardar en el navegador (exporta el JSON)"; } }, 600); $("#saved").textContent = "Guardando…"; }

// ---------- atlas ----------
const atlas = new Image(); let atlasOk = false; const avg: string[] = [];
atlas.onload = () => { atlasOk = true; const c = document.createElement("canvas"); c.width = atlas.width; c.height = atlas.height; const x = c.getContext("2d")!; x.drawImage(atlas, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data; const cols = c.width / 32;
  for (let i = 0; i < (c.width / 32) * (c.height / 32); i++) { let r = 0, g = 0, b = 0, n = 0; const ox = (i % cols) * 32, oy = Math.floor(i / cols) * 32;
    for (let y = 0; y < 32; y++) for (let xx = 0; xx < 32; xx++) { const k = ((oy + y) * c.width + ox + xx) * 4; if (d[k + 3]! < 128) continue; r += d[k]!; g += d[k + 1]!; b += d[k + 2]!; n++; }
    avg[i] = n ? `rgb(${(r / n) | 0},${(g / n) | 0},${(b / n) | 0})` : "#000"; }
  buildPalette(); overviewDirty = true; draw(); };
atlas.src = D.tileset;
function hash(x: number, y: number): number { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; }
function spr(ctx: CanvasRenderingContext2D, i: number, x: number, y: number, s: number): void { ctx.drawImage(atlas, (i % 8) * 32, (i >> 3) * 32, 32, 32, x, y, s, s); }
let animSeen = false;
function tileSpr(id: number, h: number): number { const t = TI[id]; if (!t || !t.spr.length) return -1; if (t.anim) { animSeen = true; const now = performance.now(); return t.spr[(t.layer === "floor" ? Math.floor(now / 230) : Math.floor(now / 170) + (h & 3)) % t.spr.length]!; } return id === GRASS && h % 19 === 0 ? 3 : t.spr[h % t.spr.length]!; }
function drawPortal(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void { const g = ctx.createRadialGradient(x + s / 2, y + s / 2, 1, x + s / 2, y + s / 2, s / 2); g.addColorStop(0, "#fff0ff"); g.addColorStop(0.45, "#b070ff"); g.addColorStop(1, "rgba(42,20,64,0.9)"); ctx.fillStyle = g; ctx.fillRect(x + s * 0.08, y + s * 0.08, s * 0.84, s * 0.84); }
function drawCell(ctx: CanvasRenderingContext2D, i: number, x: number, y: number, s: number, wx: number, wy: number): void {
  const h = hash(wx, wy); const f = st.floor[i]!, o = st.obj[i]!;
  if (view.floor) { const k = tileSpr(f, h); if (k >= 0) spr(ctx, k, x, y, s); } else { ctx.fillStyle = "#111"; ctx.fillRect(x, y, s, s); }
  if (view.obj && o !== NONE) { if (o === PORTAL) drawPortal(ctx, x, y, s); else { const k = tileSpr(o, h); if (k >= 0) spr(ctx, k, x, y, s); } }
  if (view.safe && st.safe[i] === 1) { ctx.fillStyle = "rgba(90,255,140,0.22)"; ctx.fillRect(x, y, s, s); }
}

// ---------- vista ----------
const cv = $<HTMLCanvasElement>("#cv"); const ctx = cv.getContext("2d")!;
function resize(): void { const r = cv.parentElement!.getBoundingClientRect(); cv.width = Math.max(100, r.width | 0); cv.height = Math.max(100, r.height | 0); draw(); }
function ts(): number { return 32 * zoom; }
function centerOn(tx: number, ty: number): void { camX = tx * ts() + ts() / 2 - cv.width / 2; camY = ty * ts() + ts() / 2 - cv.height / 2; draw(); }
let raf = 0; function draw(): void { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }
let hover: [number, number] | null = null; let animT = 0;
function render(): void {
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = "#0b0b0e"; ctx.fillRect(0, 0, cv.width, cv.height); if (!atlasOk) return;
  const s = ts(); const x0 = Math.max(0, Math.floor(camX / s)), y0 = Math.max(0, Math.floor(camY / s)), x1 = Math.min(st.w - 1, Math.floor((camX + cv.width) / s)), y1 = Math.min(st.h - 1, Math.floor((camY + cv.height) / s)); animSeen = false;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) drawCell(ctx, y * st.w + x, Math.round(x * s - camX), Math.round(y * s - camY), Math.ceil(s), x, y);
  if (view.grid && s >= 12) { ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 1; ctx.beginPath(); for (let x = x0; x <= x1 + 1; x++) { const px = Math.round(x * s - camX) + 0.5; ctx.moveTo(px, 0); ctx.lineTo(px, cv.height); } for (let y = y0; y <= y1 + 1; y++) { const py = Math.round(y * s - camY) + 0.5; ctx.moveTo(0, py); ctx.lineTo(cv.width, py); } ctx.stroke(); }
  const P = (tx: number, ty: number): [number, number] => [tx * s - camX + s / 2, ty * s - camY + s / 2];
  if (view.ref) { ctx.fillStyle = "rgba(255,150,40,0.55)"; const rp = replaced(); for (const [rx, ry, rid] of D.ref) { if (rp.has(rid)) continue; const x = rx + st.ox, y = ry + st.oy; if (x < x0 - 1 || x > x1 + 1 || y < y0 - 1 || y > y1 + 1) continue; const [px, py] = P(x, y); ctx.beginPath(); ctx.arc(px, py, Math.max(2, s * 0.12), 0, Math.PI * 2); ctx.fill(); } }
  if (view.safe) { const [a, b, c, d] = D.town; ctx.strokeStyle = "rgba(90,255,140,0.8)"; ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.strokeRect((a + st.ox) * s - camX, (b + st.oy) * s - camY, (c - a + 1) * s, (d - b + 1) * s); ctx.setLineDash([]); }
  { ctx.strokeStyle = "rgba(255,224,102,0.55)"; ctx.lineWidth = 1; ctx.strokeRect(st.ox * s - camX + 0.5, st.oy * s - camY + 0.5, CW * s, CH * s); }
  if (view.marks) for (const m of st.marks) {
    const [px, py] = P(m.x, m.y); if (px < -s * 4 || py < -s * 4 || px > cv.width + s * 4 || py > cv.height + s * 4) { if (m.k !== "portal") continue; }
    const col = m.k === "spawn" ? "#ff4a4a" : m.k === "npc" ? "#4aa8ff" : "#d070ff";
    if (m.k === "portal" && m.tx !== undefined && m.ty !== undefined) { const [qx, qy] = P(m.tx, m.ty); ctx.strokeStyle = "rgba(208,112,255,0.8)"; ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke(); ctx.setLineDash([]); ctx.strokeRect(qx - s * 0.3, qy - s * 0.3, s * 0.6, s * 0.6); }
    ctx.fillStyle = col; ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, Math.max(4, s * 0.28), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = `bold ${Math.max(8, s * 0.3) | 0}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(m.k === "spawn" ? "M" : m.k === "npc" ? "N" : "P", px, py + 0.5);
    if (s >= 24) { const lbl = m.k === "spawn" ? monName[m.m ?? ""] ?? m.m ?? "?" : m.k === "npc" ? m.n ?? "NPC" : `→ ${m.tx}, ${m.ty}`; ctx.font = "11px sans-serif"; ctx.lineWidth = 3; ctx.strokeStyle = "#000"; ctx.strokeText(lbl, px, py - s * 0.55); ctx.fillText(lbl, px, py - s * 0.55); }
  }
  if (hover) { const b = tool === "brush" || tool === "erase" ? (layer() === "marks" ? 1 : brush) : 1; if (animSeen) animT = animT || window.setTimeout(() => { animT = 0; draw(); }, 120); const o = Math.floor((b - 1) / 2); ctx.strokeStyle = tool === "erase" ? "#ff6a6a" : "#ffe066"; ctx.lineWidth = 2; ctx.strokeRect((hover[0] - o) * s - camX + 1, (hover[1] - o) * s - camY + 1, b * s - 2, b * s - 2); }
  renderOverview();
}
// ---------- vista general ----------
const ov = $<HTMLCanvasElement>("#ov"); const octx = ov.getContext("2d")!; let overviewDirty = true;
function renderOverview(): void {
  if (overviewDirty && atlasOk) { overviewDirty = false; if (ov.width !== st.w || ov.height !== st.h) { ov.width = st.w; ov.height = st.h; } const img = octx.createImageData(st.w, st.h); const cache: Record<string, number[]> = {};
    const rgb = (c: string): number[] => cache[c] ?? (cache[c] = (c.match(/\d+/g) ?? ["0", "0", "0"]).map(Number));
    for (let i = 0; i < st.w * st.h; i++) { const o = st.obj[i]!; const id = o !== NONE ? o : st.floor[i]!; const t = TI[id]; const c = id === PORTAL ? [208, 144, 255] : t && t.spr.length ? rgb(avg[t.spr[0]!] ?? "#000") : [0, 0, 0]; img.data[i * 4] = c[0]!; img.data[i * 4 + 1] = c[1]!; img.data[i * 4 + 2] = c[2]!; img.data[i * 4 + 3] = 255; }
    octx.putImageData(img, 0, 0); ovBase = octx.getImageData(0, 0, st.w, st.h); }
  if (ovBase) octx.putImageData(ovBase, 0, 0);
  const s = ts(); octx.strokeStyle = "#ffe066"; octx.lineWidth = 1; octx.strokeRect(camX / s + 0.5, camY / s + 0.5, cv.width / s, cv.height / s);
}
let ovBase: ImageData | null = null;
ov.addEventListener("pointerdown", (e) => { const r = ov.getBoundingClientRect(); const go = (ev: PointerEvent): void => centerOn(Math.floor(((ev.clientX - r.left) / r.width) * st.w), Math.floor(((ev.clientY - r.top) / r.height) * st.h)); go(e); const mv = (ev: PointerEvent): void => go(ev); const up = (): void => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); }; window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); });

// ---------- edición ----------
function cellAt(e: { clientX: number; clientY: number }): [number, number] { const r = cv.getBoundingClientRect(); const s = ts(); return [Math.floor((e.clientX - r.left + camX) / s), Math.floor((e.clientY - r.top + camY) / s)]; }
const inb = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < st.w && y < st.h;
function markAt(x: number, y: number): number { return st.marks.findIndex((m) => m.x === x && m.y === y); }
function paint(x: number, y: number, erase: boolean): void {
  const L = layer();
  if (L === "marks") { const k = markAt(x, y); if (erase) { if (k >= 0) st.marks.splice(k, 1); return; } if (!inb(x, y) || sel.kind !== "mark") return; if (k >= 0) st.marks.splice(k, 1); st.marks.push(newMark(sel.k, x, y)); if (sel.k === "portal" && !TI[st.obj[y * st.w + x]!]?.stair) st.obj[y * st.w + x] = PORTAL; return; }
  const o = Math.floor((brush - 1) / 2);
  for (let dy = 0; dy < brush; dy++) for (let dx = 0; dx < brush; dx++) { const cx = x - o + dx, cy = y - o + dy; if (!inb(cx, cy)) continue; const i = cy * st.w + cx;
    if (L === "safe") st.safe[i] = erase ? 0 : 1; else if (L === "floor") st.floor[i] = erase ? GRASS : (sel as { id: number }).id; else st.obj[i] = erase ? NONE : (sel as { id: number }).id; }
}
function newMark(k: Mark["k"], x: number, y: number): Mark {
  if (k === "spawn") return { k, x, y, m: $<HTMLSelectElement>("#mon").value };
  if (k === "npc") return { k, x, y, n: $<HTMLInputElement>("#npcname").value.trim().slice(0, 40) || "Vecino" };
  const tx = Number($<HTMLInputElement>("#ptx").value), ty = Number($<HTMLInputElement>("#pty").value);
  return { k, x, y, tx: Number.isFinite(tx) ? tx | 0 : D.temple[0] + st.ox, ty: Number.isFinite(ty) ? ty | 0 : D.temple[1] + st.oy, n: $<HTMLInputElement>("#pname").value.trim().slice(0, 40) || undefined };
}
function fill(x: number, y: number): void {
  const L = layer(); if (L === "marks" || !inb(x, y) || sel.kind === "mark") return; const W = st.w; const A = L === "floor" ? st.floor : L === "safe" ? st.safe : st.obj; const to = sel.kind === "safe" ? 1 : sel.id; const from = A[y * W + x]!; if (from === to) return;
  const q = [y * W + x]; A[y * W + x] = to; let n = 0;
  while (q.length && n < 60000) { const i = q.pop()!; n++; const cx = i % W, cy = (i / W) | 0; for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + ax!, ny = cy + ay!; if (!inb(nx, ny)) continue; const j = ny * st.w + nx; if (A[j] === from) { A[j] = to; q.push(j); } } }
  status(`Relleno: ${n} casillas.`);
}
function pick(x: number, y: number): void { if (!inb(x, y)) return; const i = y * st.w + x; const o = st.obj[i]!; select({ kind: "tile", id: o !== NONE ? o : st.floor[i]! }); setTool("brush"); }
let drag: null | { mode: "paint" | "erase" | "pan"; sx: number; sy: number; cx: number; cy: number; last: string } = null; let space = false;
cv.addEventListener("contextmenu", (e) => e.preventDefault());
cv.addEventListener("pointerdown", (e) => {
  cv.setPointerCapture(e.pointerId); const [x, y] = cellAt(e);
  if (e.button === 1 || e.button === 2 || space || tool === "pan") { drag = { mode: "pan", sx: e.clientX, sy: e.clientY, cx: camX, cy: camY, last: "" }; return; }
  if (tool === "fill") { pushUndo(); fill(x, y); dirty(); return; }
  if (tool === "pick") { pick(x, y); return; }
  pushUndo(); const er = tool === "erase"; paint(x, y, er); drag = { mode: er ? "erase" : "paint", sx: 0, sy: 0, cx: 0, cy: 0, last: `${x},${y}` }; dirty();
});
cv.addEventListener("pointermove", (e) => {
  const [x, y] = cellAt(e); hover = [x, y]; info(x, y);
  if (drag && drag.mode === "pan") { camX = drag.cx - (e.clientX - drag.sx); camY = drag.cy - (e.clientY - drag.sy); }
  else if (drag && layer() !== "marks" && drag.last !== `${x},${y}`) { drag.last = `${x},${y}`; paint(x, y, drag.mode === "erase"); dirty(); }
  draw();
});
cv.addEventListener("pointerup", () => { drag = null; });
cv.addEventListener("pointerleave", () => { hover = null; draw(); });
cv.addEventListener("wheel", (e) => { e.preventDefault(); const r = cv.getBoundingClientRect(); const mx = e.clientX - r.left, my = e.clientY - r.top; const wx = (mx + camX) / ts(), wy = (my + camY) / ts();
  setZoom(zoom * (e.deltaY < 0 ? 1.25 : 0.8)); camX = wx * ts() - mx; camY = wy * ts() - my; draw(); }, { passive: false });
function setZoom(z: number): void { zoom = Math.min(2, Math.max(0.125, z)); $("#zoomv").textContent = `${Math.round(zoom * 100)}%`; draw(); }
function info(x: number, y: number): void {
  if (!inb(x, y)) { $("#info").textContent = ""; return; } const i = y * st.w + x; const o = st.obj[i]!; const mk = st.marks.find((m) => m.x === x && m.y === y); const ti = o !== NONE ? TI[o] : TI[st.floor[i]!];
  $("#info").textContent = `x ${x}, y ${y} (en el juego ${x - st.ox}, ${y - st.oy}) · ${zoneAt(x, y)} · suelo: ${TI[st.floor[i]!]?.n ?? "?"}${o !== NONE ? ` · objeto: ${TI[o]?.n ?? o}` : ""}${ti && ti.walk === false ? " (no se pisa)" : ""}${st.safe[i] ? " · zona segura" : ""}${mk ? ` · marcador: ${mk.k === "spawn" ? `monstruo ${monName[mk.m ?? ""] ?? mk.m}` : mk.k === "npc" ? `NPC ${mk.n}` : `portal → ${mk.tx}, ${mk.ty}`}` : ""}`;
}
function status(s: string): void { $("#status").textContent = s; }

// ---------- interfaz ----------
const CATS: Array<[string, string]> = [["suelos", "Suelos"], ["muros", "Muros"], ["puertas", "Puertas"], ["muebles", "Muebles"], ["deco", "Decoración"], ["natu", "Naturaleza"], ["marks", "Marcadores"]];
let cat = "suelos";
function buildPalette(): void {
  const tabs = $("#tabs"); tabs.innerHTML = "";
  for (const [k, n] of CATS) { const b = document.createElement("button"); b.textContent = n; b.dataset.cat = k; b.onclick = () => showCat(k); tabs.append(b); }
  const box = $("#pal"); box.innerHTML = "";
  for (const t of D.tiles) { const b = document.createElement("button"); b.className = "tile"; b.title = `${t.n}${t.walk === false ? " · no se pisa" : ""}${t.stair ? " · ponle un marcador de portal para usarla" : ""}`; b.dataset.tile = String(t.id); b.dataset.tcat = t.cat;
    const c = document.createElement("canvas"); c.width = 32; c.height = 32; const x = c.getContext("2d")!; if (t.id === PORTAL) drawPortal(x, 0, 0, 32); else { if (t.layer === "obj" && t.under !== undefined && (t.ov || t.id === 1 || t.id === 20 || t.id === 10)) spr(x, TI[t.under]!.spr[0]!, 0, 0, 32); spr(x, t.spr[0]!, 0, 0, 32); }
    const sp = document.createElement("span"); sp.textContent = t.n; b.append(c, sp); b.onclick = () => select({ kind: "tile", id: t.id }); box.append(b); }
  showCat(cat); select(sel);
}
function showCat(k: string): void { cat = k; document.querySelectorAll<HTMLElement>("[data-cat]").forEach((b) => b.classList.toggle("on", b.dataset.cat === k));
  document.querySelectorAll<HTMLElement>("[data-tcat]").forEach((b) => (b.style.display = b.dataset.tcat === k ? "" : "none")); $("#markbox").style.display = k === "marks" ? "" : "none"; $("#pal").style.display = k === "marks" ? "none" : ""; }
function select(s: Sel): void { sel = s; if (tool === "pick" || tool === "pan") setTool("brush");
  document.querySelectorAll<HTMLElement>("[data-tile],[data-mark]").forEach((b) => b.classList.toggle("on", s.kind === "tile" ? b.dataset.tile === String(s.id) : s.kind === "mark" ? b.dataset.mark === s.k : b.dataset.mark === "safe"));
  const L = layer(); $("#layer").textContent = L === "floor" ? "Suelo" : L === "obj" ? "Objetos (muros, puertas, muebles, decoración, naturaleza)" : L === "safe" ? "Zona segura" : "Marcadores"; }
function setTool(t: typeof tool): void { tool = t; document.querySelectorAll<HTMLElement>("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === t)); cv.style.cursor = t === "pan" ? "grab" : "crosshair"; }
document.querySelectorAll<HTMLElement>("[data-tool]").forEach((b) => (b.onclick = () => setTool(b.dataset.tool as typeof tool)));
document.querySelectorAll<HTMLElement>("[data-mark]").forEach((b) => (b.onclick = () => select(b.dataset.mark === "safe" ? { kind: "safe" } : { kind: "mark", k: b.dataset.mark as Mark["k"] })));
document.querySelectorAll<HTMLElement>("[data-brush]").forEach((b) => (b.onclick = () => { brush = Number(b.dataset.brush); document.querySelectorAll<HTMLElement>("[data-brush]").forEach((q) => q.classList.toggle("on", q === b)); }));
document.querySelectorAll<HTMLInputElement>("[data-view]").forEach((c) => (c.onchange = () => { (view as Record<string, boolean>)[c.dataset.view!] = c.checked; draw(); }));
const monSel = $<HTMLSelectElement>("#mon"); for (const m of D.mons) { const o = document.createElement("option"); o.value = m.id; o.textContent = (m.boss ? "👑 " : "") + m.n; monSel.append(o); }
function setPortalDefault(): void { $<HTMLInputElement>("#ptx").value = String(D.temple[0] + st.ox); $<HTMLInputElement>("#pty").value = String(D.temple[1] + st.oy); }
const zsel = $<HTMLSelectElement>("#zone"); D.zn.forEach((z, i) => { const c = D.zc[i]; if (!c) return; const o = document.createElement("option"); o.value = String(i); o.textContent = z; zsel.append(o); });
zsel.onchange = () => { const c = D.zc[Number(zsel.value)]; if (c) centerOn(c[0] + st.ox, c[1] + st.oy); };
$("#undo").onclick = () => { const s = undo.pop(); if (!s) return; redo.push(clone(st)); st = s; nameIn.value = st.name; sizeInfo(); dirty(); status("Deshecho."); };
$("#redo").onclick = () => { const s = redo.pop(); if (!s) return; undo.push(clone(st)); st = s; nameIn.value = st.name; sizeInfo(); dirty(); status("Rehecho."); };
$("#zin").onclick = () => { const cxw = (camX + cv.width / 2) / ts(), cyw = (camY + cv.height / 2) / ts(); setZoom(zoom * 1.25); camX = cxw * ts() - cv.width / 2; camY = cyw * ts() - cv.height / 2; };
$("#zout").onclick = () => { const cxw = (camX + cv.width / 2) / ts(), cyw = (camY + cv.height / 2) / ts(); setZoom(zoom * 0.8); camX = cxw * ts() - cv.width / 2; camY = cyw * ts() - cv.height / 2; };
const nameIn = $<HTMLInputElement>("#mapname"); nameIn.value = st.name; nameIn.oninput = () => { st.name = nameIn.value.slice(0, 60); dirty(); };
$("#new").onclick = () => { if (!confirm("¿Empezar de nuevo desde el mapa actual del juego? Se pierden los cambios sin exportar (puedes deshacer).")) return; pushUndo(); st = clone(base); nameIn.value = st.name; sizeInfo(); setPortalDefault(); dirty(); status("Cargado el mapa del juego."); };
$("#export").onclick = () => { const txt = serialize(); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "application/json" })); a.download = `${(st.name || "mapa").replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g, "").trim().replace(/\s+/g, "-") || "mapa"}.json`; document.body.append(a); a.click(); a.remove(); status(`Exportado ${a.download} (${Math.round(txt.length / 1024)} KB). En el juego: Modo GM → «Cargar mapa…».`); };
const fileIn = $<HTMLInputElement>("#file"); $("#import").onclick = () => fileIn.click();
fileIn.onchange = async () => { const f = fileIn.files?.[0]; fileIn.value = ""; if (!f) return; const r = parse(await f.text()); if (typeof r === "string") { status(`❌ ${r}`); return; } pushUndo(); st = r; nameIn.value = st.name; sizeInfo(); setPortalDefault(); dirty(); status(`Importado «${r.name}» (${r.marks.length} marcadores).`); };
function grow(dir: "n" | "s" | "e" | "w", n: number): void {
  n = Math.floor(n); if (!(n > 0)) { status("Escribe cuántas casillas quieres añadir."); return; }
  const w2 = st.w + (dir === "e" || dir === "w" ? n : 0), h2 = st.h + (dir === "n" || dir === "s" ? n : 0); if (w2 > MAXS || h2 > MAXS) { status(`❌ Máximo ${MAXS}×${MAXS}.`); return; }
  pushUndo(); const dx = dir === "w" ? n : 0, dy = dir === "n" ? n : 0; const N2 = w2 * h2;
  const f = new Uint8Array(N2).fill(GRASS), o = new Uint8Array(N2).fill(NONE), sf = new Uint8Array(N2);
  for (let y = 0; y < st.h; y++) { const a = y * st.w, b = (y + dy) * w2 + dx; f.set(st.floor.subarray(a, a + st.w), b); o.set(st.obj.subarray(a, a + st.w), b); sf.set(st.safe.subarray(a, a + st.w), b); }
  for (const m of st.marks) { m.x += dx; m.y += dy; if (m.tx !== undefined) m.tx += dx; if (m.ty !== undefined) m.ty += dy; }
  st = { ...st, w: w2, h: h2, ox: st.ox + dx, oy: st.oy + dy, floor: f, obj: o, safe: sf }; camX += dx * ts(); camY += dy * ts(); sizeInfo(); setPortalDefault(); dirty();
  status(`Mapa agrandado ${n} casillas al ${({ n: "norte", s: "sur", e: "este", w: "oeste" })[dir]}: ahora ${w2}×${h2}. Todo lo anterior (marcadores y portales incluidos) se movió con él.`);
}
function sizeInfo(): void { $("#size").textContent = `${st.w}×${st.h} casillas · el mundo original (${CW}×${CH}) empieza en ${st.ox}, ${st.oy}`; }
document.querySelectorAll<HTMLElement>("[data-grow]").forEach((b) => (b.onclick = () => grow(b.dataset.grow as "n" | "s" | "e" | "w", Number($<HTMLInputElement>("#grown").value))));
// v27: los respawns de White Knight y Boris se pueden recolocar: al poner marcadores de ese monstruo, sustituyen a los de fábrica
const REPL = ["wknight", "boris"];
function replaced(): Set<string> { const r = new Set<string>(); for (const m of st.marks) if (m.k === "spawn" && m.m && REPL.includes(m.m)) r.add(m.m); return r; }
function wkMarks(): number { pushUndo(); let n = 0; const rp = replaced(); for (const [rx, ry, rid] of D.ref) { if (!REPL.includes(rid) || rp.has(rid)) continue; const x = rx + st.ox, y = ry + st.oy; if (markAt(x, y) >= 0) continue; st.marks.push({ k: "spawn", x, y, m: rid }); n++; } dirty(); status(n ? `${n} respawns de White Knight / Boris convertidos en marcadores: muévelos (bórralos y vuelve a ponerlos) donde quieras.` : "Ya están como marcadores."); return n; }
$("#wkmarks").onclick = () => { wkMarks(); };
$("#clearmarks").onclick = () => { if (!st.marks.length) return; pushUndo(); st.marks = []; dirty(); status("Marcadores borrados."); };
window.addEventListener("keydown", (e) => {
  if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "SELECT") return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); (e.shiftKey ? $("#redo") : $("#undo")).click(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); $("#redo").click(); return; }
  if (e.key === " ") { space = true; cv.style.cursor = "grab"; e.preventDefault(); return; }
  const k = e.key.toLowerCase(); const map: Record<string, typeof tool> = { b: "brush", e: "erase", f: "fill", i: "pick", h: "pan" }; if (map[k]) setTool(map[k]!);
  if (k === "g") { view.grid = !view.grid; $<HTMLInputElement>("[data-view=grid]").checked = view.grid; draw(); }
  const step = 4 * ts(); if (e.key === "ArrowLeft") camX -= step; if (e.key === "ArrowRight") camX += step; if (e.key === "ArrowUp") camY -= step; if (e.key === "ArrowDown") camY += step; if (e.key.startsWith("Arrow")) { e.preventDefault(); draw(); }
});
window.addEventListener("keyup", (e) => { if (e.key === " ") { space = false; setTool(tool); } });
window.addEventListener("resize", resize);
$("#ver").textContent = D.ver;
setPortalDefault(); sizeInfo(); resize(); setZoom(1); centerOn(D.temple[0] + st.ox, D.temple[1] + st.oy); setTool("brush");
(window as unknown as { __edisarEditor: unknown }).__edisarEditor = { wkMarks, get st() { return st; }, serialize, parse, centerOn, setZoom, select, setTool, paint, dirty, grow, showCat };
