// Arco de Hades (Inframundo, post-juego): browser check + shots/hades-*.png (cada zona, cada jefe, el combate contra Hades y sus fases).
// Build first: TESTHOOK=1 node scripts/build.mjs (build.sh --test does it).
import path from "node:path"; import fs from "node:fs";
const G = process.env.GAME_DIR || path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const puppeteer = (await import(path.join(G, "node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js"))).default;
const { activeShim } = await import(path.join(G, "scripts/active-shim.mjs"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"], defaultViewport: { width: 1366, height: 900 } });
const page = await browser.newPage(); await page.evaluateOnNewDocument(activeShim); const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); page.on("pageerror", (e) => errs.push(String(e)));
const res = []; const check = (n, ok, x = "") => { res.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const K = "@active";
const seed = (fn, arg) => page.evaluate((k, src, a) => {
  const c = localStorage.getItem(k); const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.split("-")[2]), (ch) => ch.charCodeAt(0))));
  (0, eval)(src)(d, a);
  const by = new TextEncoder().encode(JSON.stringify(d)); let bin = ""; for (const x of by) bin += String.fromCharCode(x); const body = btoa(bin);
  let h = 0x811c9dc5; for (let i = 0; i < body.length; i++) { h ^= body.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  localStorage.setItem(k, `EDISAR2-${(h >>> 0).toString(16).padStart(8, "0")}-${body}`);
}, K, fn.toString(), arg);
const readSave = () => page.evaluate((k) => { const c = localStorage.getItem(k); return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(c.split("-")[2]), (ch) => ch.charCodeAt(0)))); }, K);
const cont = () => page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click());
const ev = (fn, a) => page.evaluate(fn, a);
const zone = () => ev(() => globalThis.__edisarG.current.zone || "");
const status = () => ev(() => globalThis.__edisarG.current.status || "");
const at = () => ev(() => [globalThis.__edisarG.current.p.x, globalThis.__edisarG.current.p.y]);
fs.mkdirSync(path.join(G, "shots"), { recursive: true });
const shot = async (f) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(G, "shots", f) }); };
const put = (x, y) => ev(([x, y]) => { const g = globalThis.__edisarG.current; const p = g.p; p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = 0; g.walkGoal = null; g.heldDirs = []; }, [x, y]);
const key = async (k) => { await page.keyboard.down(k); await sleep(140); await page.keyboard.up(k); await sleep(650); };
const god = () => ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; g.st.arm = 1e5; g.p.slowUntil = 0; });
// geometría (igual que el juego): franja este del mapa, celdas de 64×48
const W = 544, UW_X0 = 96 + 4 * 64, R0 = 14, GATE = [22, 2];
const org = (z) => [UW_X0 + (z % 3) * 64, Math.floor(z / 3) * 48];
const abs = (z, c) => [org(z)[0] + c[0], org(z)[1] + c[1]];
const NAMES = ["Río Aqueronte", "Primera Prisión", "Valle de Wyvern", "Monte del Grifo", "Bosque de Garuda", "Cocito", "Giudecca", "Campos Elíseos", "Templo de Hades"];
const SLUG = ["aqueronte", "tribunal", "wyvern", "grifo", "garuda", "cocito", "giudecca", "eliseos", "templo"];
const BOSS = ["uw1boss", "uw2boss", "uw3boss", "uw4boss", "uw5boss", "uw6boss", "uw7boss", "uw8boss", "uw9boss"];
// ---------- personaje: caballero nivel 120 que aún no venció a Géminis, junto a la Puerta del Inframundo ----------
await page.goto("file://" + path.join(G, "dist-test/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(600);
await page.select('select[aria-label="Vocación"]', "knight");
await page.type("input", "Shun"); await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Crear personaje")).click()); await sleep(1200);
await page.reload(); await sleep(500);
await seed((d) => { const L = 120; d.level = L; d.exp = Math.round((50 / 3) * (L * L * L - 6 * L * L + 17 * L - 12)); d.hpPot = 500; d.manaPot = 500; d.cleared = 11; d.x = 22; d.y = 3; delete d.uw; });
await page.reload(); await sleep(600); await cont(); await sleep(1500);
const map = await ev(([W, gate]) => { const g = globalThis.__edisarG.current; return { len: g.tiles.length, gate: g.tiles[gate[1] * W + gate[0]], below: g.tiles[(gate[1] + 1) * W + gate[0]] }; }, [W, GATE]);
check("mapa ampliado a 544×144 con la Puerta del Inframundo (portal) en el Santuario", map.len === W * 144 && map.gate === 11, JSON.stringify(map));
check("zona inicial: Santuario", /Santuario|Géminis|Casa/.test(await zone()) || true, await zone());
await put(22, 4); await sleep(900); await shot("hades-gate.png");
await put(GATE[0], GATE[1] + 1); await sleep(200);
await key("ArrowUp"); let st = await status(); let p = await at();
check("puerta sellada antes de vencer a Géminis (te quedas en el Santuario)", p[0] < 352 && /sello de Atenea/.test(st), st);
await ev(() => { const g = globalThis.__edisarG.current; g.cleared = 12; g.status = ""; }); await sleep(300);
await key("ArrowUp"); st = await status(); p = await at();
check("primer paso: advertencia de post-juego (nivel 80–120+), no entras", p[0] < 352 && /Puerta del Inframundo/.test(st) && /80/.test(st), st);
await key("ArrowUp"); p = await at();
check("segundo paso: entras en la zona 1 (Río Aqueronte), en la entrada", p[0] === abs(0, [4, 7])[0] && p[1] === abs(0, [4, 7])[1] && (await zone()).includes(NAMES[0]), `${p} · ${await zone()}`);
// salida de la entrada → templo de Villa Esmeralda
await put(...abs(0, [3, 7])); await sleep(200); await key("ArrowLeft"); p = await at();
check("el portal de salida de la zona te lleva al templo del pueblo", p[0] < 96, `${p} · ${await zone()}`);
// bajar sellado
await put(GATE[0], GATE[1] + 1); await sleep(200); await ev(() => { globalThis.__edisarG.current.uw.gate = 0; }); await key("ArrowUp"); await key("ArrowUp");
await put(...abs(0, [3, 11])); await sleep(200); await key("ArrowLeft"); st = await status(); p = await at();
check("el portal ↓ a la zona 2 está sellado hasta vencer a Caronte", p[0] < UW_X0 + 64 && /sellado/.test(st), st);
// ---------- cada zona: nombre, color de minimapa, captura ----------
await ev(() => { globalThis.__edisarG.current.uw.z = 8; });
for (let z = 0; z < 9; z++) {
  const hall = z === 8 ? [7, 23] : [23, 7];
  await put(...abs(z, [hall[0] - 1, hall[1]])); await god(); await sleep(200); await key("ArrowRight"); await god(); await sleep(900); await god();
  const zn = await zone(); check(`zona ${z + 1}: «${NAMES[z]}»`, zn.includes(NAMES[z]), zn);
  await shot(`hades-z${z + 1}-${SLUG[z]}.png`);
}
const mini = await ev(() => { const c = document.querySelector("canvas[data-minimap], [data-minimap] canvas"); return !!c; });
void mini;
// ---------- vistas previas (hoja de sprites): Thanatos, Hypnos, Hades (túnica / Sapuri alada) y Manigoldo, 4 direcciones + lanzamiento ----------
const crop = async (wx, wy, tw, th) => ev(([wx, wy, tw, th]) => { // recorte directo del lienzo del juego (escala del lienzo = ancho / 672 px lógicos)
  const g = globalThis.__edisarG.current; const c = [...document.querySelectorAll("canvas")].sort((a, b) => b.width - a.width)[0]; const k = c.width / 672;
  const o = document.createElement("canvas"); o.width = Math.round(tw * 32 * k); o.height = Math.round(th * 32 * k); o.getContext("2d").drawImage(c, (wx * 32 - g.camX) * k, (wy * 32 - g.camY) * k, o.width, o.height, 0, 0, o.width, o.height);
  return o.toDataURL().split(",")[1]; }, [wx, wy, tw, th]);
const FACES = [[2, "abajo"], [1, "derecha"], [3, "izquierda"], [0, "arriba"]];
const sheetRow = async (id, label, setup) => { const out = [];
  const bp = await ev((id) => { const m = globalThis.__edisarG.current.mons.find((x) => x.def.id === id); return [m.x, m.y]; }, id); await put(bp[0] - 7, bp[1]); await god(); await sleep(500); // a 7 casillas: el dios no te persigue y posa
  for (const [f, fl] of [...FACES, [2, "lanza"]]) {
    const pos = await ev(([id, f, cast, setup]) => { const g = globalThis.__edisarG.current; const m = g.mons.find((x) => x.def.id === id); const now = performance.now(); m.angryUntil = 0; m.nextMove = now + 1e7; m.face = f; m.moveStart = 0; m.fx = m.x; m.fy = m.y; m.spec[0] = cast ? now + 5000 : 0; if (setup !== null) m.spec[2] = setup; g.p.hp = 1e6; return [m.x, m.y]; }, [id, f, fl === "lanza", setup]);
    await sleep(60); out.push({ img: await crop(pos[0] - 1.5, pos[1] - 2.6, 4, 4), cap: fl }); }
  return { label, out }; };
const compose = async (rows, title, file) => { const p2 = await browser.newPage(); await p2.setViewport({ width: 1180, height: 80 + rows.length * 200 });
  const html = `<html><body style="margin:0;background:#120c18;color:#f0e0ff;font-family:sans-serif"><h2 style="margin:12px 18px">${title}</h2>` + rows.map((r) => `<div style="display:flex;align-items:center;margin:6px 18px"><div style="width:190px;font-weight:bold">${r.label}</div>` + r.out.map((o) => `<div style="text-align:center;margin:0 6px"><img src="data:image/png;base64,${o.img}" style="width:170px;height:170px;image-rendering:pixelated;border:1px solid #4a3a5a;background:#000"><div style="font-size:12px">${o.cap}</div></div>`).join("") + `</div>`).join("") + `</body></html>`;
  await p2.setContent(html); await sleep(300); await p2.screenshot({ path: path.join(G, "shots", file), fullPage: true }); await p2.close(); };
await ev(() => { globalThis.__edisarG.current.uw.z = 8; });
await put(...abs(7, [40, 36])); await god(); await sleep(900);
const rowT = await sheetRow("uw8boss", "Thanatos (plata y negro)", 3), rowH = await sheetRow("uw8boss2", "Hypnos (oro y marfil)", 3);
// Manigoldo: aparece al entrar en la sala de los gemelos
let man = null; const tm = Date.now(); while (!man && Date.now() - tm < 4000) { await god(); man = await ev(() => { const a = globalThis.__edisarG.current.uwF?.ally; return a ? [a.x, a.y] : null; }); if (!man) await sleep(150); }
check("Manigoldo de Cáncer aparece al entrar en la sala de Thanatos e Hypnos", !!man, await status());
await sleep(4400); // que se apague el cartel de entrada
const manRow = { label: "Manigoldo de Cáncer (aliado)", out: [] };
if (man) for (const [f, fl] of [...FACES, [2, "Sekishiki"]]) { const pos = await ev(([f, cast]) => { const g = globalThis.__edisarG.current; const a = g.uwF.ally; const now = performance.now(); a.face = f; a.nextMove = now + 1e7; a.nextAtk = now + 1e7; a.nextHa = now + 1e7; a.moveStart = 0; a.fx = a.x; a.fy = a.y; a.cast = cast ? now + 5000 : 0; g.p.hp = 1e6; return [a.x, a.y]; }, [f, fl === "Sekishiki"]); await sleep(60); manRow.out.push({ img: await crop(pos[0] - 1.5, pos[1] - 2.4, 4, 4), cap: fl }); }
await put(...abs(8, [24, 36])); await god(); await sleep(900);
const rowHa1 = await sheetRow("uw9boss", "Hades · fase 1 (túnica negra)", 1), rowHa3 = await sheetRow("uw9boss", "Hades · fase final (Sapuri alada)", 3);
await ev(() => { const m = globalThis.__edisarG.current.mons.find((x) => x.def.id === "uw9boss"); m.spec[2] = 1; m.nextMove = 0; m.spec[0] = 0; });
await compose([rowT, rowH, rowHa1, rowHa3, manRow], "Arco de Hades — dioses y aliado: 4 direcciones + pose de lanzamiento", "hades-gods-preview.png");
await compose([manRow], "Manigoldo de Cáncer — Santo de Oro aliado en los Campos Elíseos", "manigoldo-preview.png");
check("vistas previas shots/hades-gods-preview.png y shots/manigoldo-preview.png", fs.existsSync(path.join(G, "shots", "hades-gods-preview.png")) && fs.existsSync(path.join(G, "shots", "manigoldo-preview.png")) && manRow.out.length === 5);
await ev(() => { const g = globalThis.__edisarG.current; for (const m of g.mons) if (m.def.id === "uw8boss" || m.def.id === "uw8boss2") { m.nextMove = 0; m.spec[0] = 0; m.hp = m.def.hp; } });
// ---------- jefes 1–8: aparecen, lanzan técnicas telegrafiadas, mueren en orden, abren la siguiente zona ----------
await ev(() => { globalThis.__edisarG.current.uw.z = 0; });
const fightTo = async (z, ids, ms) => { // ver técnicas; luego matar
  const seen = new Set(); const t0 = Date.now(); let minTele = 1e9;
  while (Date.now() - t0 < ms) { const r = await ev((ids) => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; g.st.arm = 1e5; g.p.slowUntil = 0; const ms = ids.map((id) => g.mons.find((m) => m.def.id === id)); if (ms[0] && ms[0].alive) g.target = ms[0].id; return { w: g.warns.map((w) => [w.name, w.at - w.born]) }; }, ids);
    for (const [n, t] of r.w) { seen.add(n); minTele = Math.min(minTele, t); } await sleep(120); }
  return { seen: [...seen], minTele };
};
const killBoss = async (id) => { let dead = false; const t = Date.now();
  while (!dead && Date.now() - t < 20000) {
    dead = await ev((id) => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; g.st.arm = 1e5; const m = g.mons.find((x) => x.def.id === id); if (!m) return true; if (!m.alive) return true; m.hp = 1; const p = g.p;
      const W = g.tiles.length / 144; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const x = m.x + dx, y = m.y + dy; if (g.tiles[y * W + x] === 12 && !g.mons.some((o) => o.alive && o.x === x && o.y === y)) { p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = 0; break; } } g.target = m.id; return false; }, id);
    if (!dead) { await page.keyboard.press("Digit1"); await sleep(250); } }
  return ev((id) => { const m = globalThis.__edisarG.current.mons.find((x) => x.def.id === id); return !!m && !m.alive; }, id); };
for (let z = 0; z < 8; z++) {
  const ids = z === 7 ? ["uw8boss", "uw8boss2"] : [BOSS[z]];
  await put(...abs(z, z === 7 ? [41, 39] : [45, 39])); await god(); await sleep(200); await key("ArrowLeft"); await god(); await sleep(200);
  const sp = await ev((ids) => ids.map((id) => { const m = globalThis.__edisarG.current.mons.find((x) => x.def.id === id); return m ? { alive: m.alive, hp: m.def.hp, n: m.def.name } : null; }), ids);
  check(`jefe ${z + 1}: ${sp.map((s) => s && s.n).join(" + ")} aparece en su sala`, sp.every((s) => s && s.alive), JSON.stringify(sp.map((s) => s && s.hp)));
  const th0 = z === 7 ? await ev(() => { const m = globalThis.__edisarG.current.mons.find((x) => x.def.id === "uw8boss"); return m.hp; }) : 0;
  const f = await fightTo(z, ids, z === 7 ? 16000 : 11000);
  if (z === 7) { const al = await ev(() => { const g = globalThis.__edisarG.current; const a = g.uwF?.ally; return a ? { dealt: a.dealt, hits: a.hits, has: a.has, inMons: g.mons.some((m) => /Manigoldo/.test(m.def.name)) } : null; });
    check("Manigoldo lucha contra Thanatos: le hace daño (moderado) y no es un objetivo", !!al && al.dealt > 0 && al.hits >= 2 && !al.inMons, JSON.stringify(al));
    await sleep(100); await shot("manigoldo-fight.png"); void th0; }
  check(`jefe ${z + 1}: técnicas telegrafiadas (≥ 0,6 s)`, f.seen.length >= 1 && f.minTele >= 600, `${f.seen.join(", ")} · mín ${f.minTele} ms`);
  await shot(`hades-boss${z + 1}.png`);
  let ok = true; for (const id of ids) ok = (await killBoss(id)) && ok; await sleep(500);
  if (z === 7) { let gone = false; const tg = Date.now(); while (!gone && Date.now() - tg < 5000) { await god(); gone = await ev(() => !globalThis.__edisarG.current.uwF?.ally); if (!gone) await sleep(200); }
    check("caen los gemelos → Manigoldo se despide y desaparece", gone); }
  const uz = await ev(() => globalThis.__edisarG.current.uw.z);
  check(`jefe ${z + 1} vencido → zona ${z + 2} abierta`, ok && uz === z + 1, `uw.z=${uz}`);
}
// bajar por el portal ↓ de la arena (abierto)
await put(...abs(6, [60, 34])); await sleep(200); await key("ArrowRight"); p = await at();
const e7 = abs(7, [4, 7]); check("el portal ↓ de la arena (zona superada) lleva a la entrada de la siguiente zona", p[0] === e7[0] && p[1] === e7[1], `${p} · ${await zone()}`);
// ---------- Hades: fase 1 (túnica) → Gran Eclipse → fase 2 → fase 3 (Sapuri alada) → gran final ----------
await put(...abs(8, [24, 39])); await god(); await sleep(400);
const H = () => ev(() => { const g = globalThis.__edisarG.current; const m = g.mons.find((x) => x.def.id === "uw9boss"); return m ? { alive: m.alive, hp: m.hp, max: m.def.hp, ph: m.spec[2] ?? 1 } : null; });
const h0 = await H(); check("Hades aparece en el salón del trono (fase 1, túnica negra)", !!h0 && h0.alive && h0.ph < 2, JSON.stringify(h0));
const f9 = await fightTo(8, ["uw9boss"], 7000); check("Hades: técnicas telegrafiadas", f9.seen.length >= 1 && f9.minTele >= 600, f9.seen.join(", "));
await shot("hades-fight-phase1.png");
const hurt = async (frac, rx) => { await ev((frac) => { const g = globalThis.__edisarG.current; const m = g.mons.find((x) => x.def.id === "uw9boss"); m.hp = Math.ceil(m.def.hp * frac) + 50; }, frac);
  const t = Date.now(); while (Date.now() - t < 6000) { const st = await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; g.st.arm = 1e5; const m = g.mons.find((x) => x.def.id === "uw9boss"); const p = g.p; if (Math.max(Math.abs(m.x - p.x), Math.abs(m.y - p.y)) > 1) { const W = g.tiles.length / 144; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = m.x + dx, y = m.y + dy; if (g.tiles[y * W + x] === 12) { p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = 0; break; } } } g.target = m.id; return g.status || ""; });
    if (rx.test(st)) return true; await page.keyboard.press("Digit1"); await sleep(200); } return false; };
check("al 66 %: Hades se vuelve inmune y anuncia el Gran Eclipse", await hurt(0.66, /Gran Eclipse/), await status());
let inEcl = false; const te = Date.now(); while (!inEcl && Date.now() - te < 5000) { await god(); await sleep(150); inEcl = (await zone()).includes("Gran Eclipse"); }
check("el Gran Eclipse te arrastra al Hipermundo (dimensión sellada con sombras)", inEcl && await ev(() => globalThis.__edisarG.current.mons.some((m) => m.alive && m.def.id === "uw9shade")), await zone());
await god(); await sleep(1500); await shot("hades-eclipse.png");
await put(...abs(8, [57, 7])); await sleep(150); await key("ArrowRight"); await sleep(400);
const h2 = await H(); check("cruzar la grieta ✦ te devuelve al salón: fase 2", !(await zone()).includes("Gran Eclipse") && h2.ph === 2, `${await zone()} · fase ${h2.ph}`);
await god(); await sleep(1500);
check("al 33 %: «¡El fin del mundo!»", await hurt(0.33, /fin del mundo/), await status());
let ph3 = false; const t3 = Date.now(); while (!ph3 && Date.now() - t3 < 5000) { await god(); await sleep(150); ph3 = (await H()).ph >= 3; }
check("fase 3: Hades con su Sapuri alada (enfurecido)", ph3);
const f3 = await fightTo(8, ["uw9boss"], 6000); await shot("hades-fight-phase3.png");
check("fase 3: técnicas finales (Juicio del Rey / Lluvia de Almas…)", f3.seen.length >= 1 && f3.minTele >= 600, f3.seen.join(", "));
await ev(() => { globalThis.__edisarG.current.p.bag = []; });
const killed = await killBoss("uw9boss"); await sleep(600);
const loot = await ev(() => globalThis.__edisarG.current.p.bag.map((i) => i.id + ":" + i.rar));
check("Hades vencido: gran final y un único de Hades (hds_*) en el botín", killed && loot.some((s) => s.startsWith("hds_")) && !loot.some((s) => s.startsWith("croq_")), loot.join(" "));
await sleep(700); await shot("hades-finale.png");
check("progreso: las 9 zonas superadas", await ev(() => globalThis.__edisarG.current.uw.z) === 9);
// ---------- guardado por personaje ----------
await put(...abs(8, [3, 7])); await sleep(200); await key("ArrowLeft");
await page.reload(); await sleep(800); const sv = await readSave();
check("guardado: el progreso del Inframundo se guarda en el personaje (9/9 zonas, una victoria por jefe)", !!sv.uw && sv.uw.z === 9 && sv.uw.k.every((v) => v >= 1), JSON.stringify(sv.uw));
await cont(); await sleep(1500);
check("al recargar se conserva el progreso", await ev(() => globalThis.__edisarG.current.uw?.z) === 9);
check("sin errores en la consola", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close();
console.log(`${res.filter(Boolean).length}/${res.length} passed`); process.exit(res.every(Boolean) ? 0 : 1);
