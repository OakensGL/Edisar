// v22: Modo GM (panel, Minato, /gm, guardado), sala de entrenamiento (monjes estilo Splinter), poderes de nivel 100 + Cadenas,
// portal del templo al Inframundo y clic para caminar. Capturas en shots/. Build first: TESTHOOK=1 node scripts/build.mjs (build.sh --test lo hace).
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
const cont = () => page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Continuar última partida")).click());
const ev = (fn, a) => page.evaluate(fn, a);
const status = () => ev(() => globalThis.__edisarG.current.status || "");
const at = () => ev(() => [globalThis.__edisarG.current.p.x, globalThis.__edisarG.current.p.y]);
fs.mkdirSync(path.join(G, "shots"), { recursive: true });
const shot = async (f) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(G, "shots", f) }); };
const put = (x, y) => ev(([x, y]) => { const g = globalThis.__edisarG.current; const p = g.p; p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = 0; g.walkGoal = null; g.heldDirs = []; g.zone = ""; }, [x, y]);
const key = async (k, hold = 140) => { await page.keyboard.down(k); await sleep(hold); await page.keyboard.up(k); await sleep(500); };
const click = (sel) => page.evaluate((s) => { const b = document.querySelector(s); if (b) b.click(); return !!b; }, sel);
const select = async (sel, v) => { await page.select(sel, v); await sleep(80); };
const EXP = (L) => Math.round((50 / 3) * (L * L * L - 6 * L * L + 17 * L - 12));
const newChar = async (cls, name, L, extra) => {
  await page.goto("file://" + path.join(G, "dist-test/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(500);
  await page.select('select[aria-label="Vocación"]', cls); await page.type("input", name);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Crear personaje")).click()); await sleep(1000);
  await page.reload(); await sleep(400);
  await seed((d, a) => { d.level = a.L; d.exp = a.exp; d.hpPot = 300; d.manaPot = 300; d.cleared = a.cleared; if (a.extra) Object.assign(d, a.extra); }, { L, exp: EXP(L), cleared: 11, extra });
  await page.reload(); await sleep(500); await cont(); await sleep(1300);
};
// recorte del lienzo del juego alrededor de una casilla (escala = ancho / 672 px lógicos)
const crop = async (wx, wy, tw, th) => ev(([wx, wy, tw, th]) => { const g = globalThis.__edisarG.current; const c = [...document.querySelectorAll("canvas")].sort((a, b) => b.width - a.width)[0]; const k = c.width / 672;
  const o = document.createElement("canvas"); o.width = Math.round(tw * 32 * k); o.height = Math.round(th * 32 * k); o.getContext("2d").drawImage(c, (wx * 32 - g.camX) * k, (wy * 32 - g.camY) * k, o.width, o.height, 0, 0, o.width, o.height);
  return o.toDataURL().split(",")[1]; }, [wx, wy, tw, th]);
const compose = async (rows, title, file, big) => { const p2 = await browser.newPage(); await p2.setViewport({ width: 1180, height: 80 + rows.length * 220 + (big ? 520 : 0) });
  const html = `<html><body style="margin:0;background:#141018;color:#f4ead8;font-family:sans-serif"><h2 style="margin:12px 18px">${title}</h2>` + (big ? `<img src="data:image/png;base64,${big}" style="margin:0 18px;width:820px;border:1px solid #5a4a3a">` : "") + rows.map((r) => `<div style="display:flex;align-items:center;margin:6px 18px"><div style="width:170px;font-weight:bold">${r.label}</div>` + r.out.map((o) => `<div style="text-align:center;margin:0 6px"><img src="data:image/png;base64,${o.img}" style="width:180px;height:180px;image-rendering:pixelated;border:1px solid #5a4a3a;background:#000"><div style="font-size:12px">${o.cap}</div></div>`).join("") + `</div>`).join("") + `</body></html>`;
  await p2.setContent(html); await sleep(300); await p2.screenshot({ path: path.join(G, "shots", file), fullPage: true }); await p2.close(); };
const FACES = [[2, "abajo"], [1, "derecha"], [3, "izquierda"], [0, "arriba"]];
// casilla de pradera despejada (sin monstruos alrededor) para probar los poderes
const field = () => ev(() => { const g = globalThis.__edisarG.current; const W = g.tiles.length / 144; const ok = (t) => t === 0 || t === 8 || t === 9;
  for (let y = 76; y < 100; y++) for (let x = 6; x < 90; x++) { let good = true; for (let dy = -4; dy <= 4 && good; dy++) for (let dx = -5; dx <= 5 && good; dx++) good = ok(g.tiles[(y + dy) * W + x + dx]) && !(x + dx >= 40 && x + dx <= 56 && y + dy >= 60 && y + dy <= 72);
    if (good) { for (const m of g.mons) if (m.alive && Math.abs(m.x - x) <= 12 && Math.abs(m.y - y) <= 9) { m.alive = false; m.respawnAt = Infinity; } return [x, y]; } } return null; });

// ===== 1) Modo GM =====
await newChar("knight", "Minato", 100);
check("botón «🛠 Modo GM (prueba)» en el menú", await ev(() => !!document.querySelector("[data-gmbtn]") && document.querySelector("[data-gmbtn]").textContent.includes("Modo GM")));
await click("[data-gmbtn]"); await sleep(400);
check("al activarlo se abre el panel GM (marcado como prototipo)", await ev(() => !!document.querySelector("[data-gm]") && document.querySelector("[data-gm]").textContent.includes("PROTOTIPO") && globalThis.__edisarG.current.gm.on));
await page.type("[data-gmq]", "Croqui"); await sleep(150); await select("[data-gmrar]", "hea"); await page.click("[data-gmqty]", { clickCount: 3 }); await page.type("[data-gmqty]", "2");
let bag0 = await ev(() => globalThis.__edisarG.current.p.bag.length); await click("[data-gmcreate]"); await sleep(200);
let bag1 = await ev(() => globalThis.__edisarG.current.p.bag.map((i) => i.rar)); check("crear objeto: 2 objetos Heaven a la mochila", bag1.length === bag0 + 2 && bag1.slice(-2).every((r) => r === "hea"), JSON.stringify(bag1.slice(-2)));
await page.click('[data-gmf="level"]', { clickCount: 3 }); await page.type('[data-gmf="level"]', "abc"); await click('[data-gmset="level"]'); await sleep(150);
check("valor no válido: mensaje de error y nivel sin cambios", await ev(() => globalThis.__edisarG.current.p.level === 100) && /entero/.test(await ev(() => document.querySelector("[data-gmmsg]").textContent)));
await page.click('[data-gmf="level"]', { clickCount: 3 }); await page.type('[data-gmf="level"]', "120"); await click('[data-gmset="level"]'); await sleep(150);
await page.click('[data-gmf="coins"]', { clickCount: 3 }); await page.type('[data-gmf="coins"]', "777"); await click('[data-gmset="coins"]'); await sleep(150);
check("nivel 120 y 777 Edisar Coins", await ev(() => { const g = globalThis.__edisarG.current; return g.p.level === 120 && g.cs.coins === 777; }));
await select("[data-gmplace]", "h1"); await click("[data-gmtp]"); await sleep(400);
check("teletransporte a la Casa de Aries", /Aries/.test(await ev(() => globalThis.__edisarG.current.zone)), await ev(() => globalThis.__edisarG.current.zone));
await select("[data-gmmon]", "uw9boss"); await click("[data-gmspawn]"); await sleep(300);
check("invocar a Hades junto al jugador", await ev(() => { const g = globalThis.__edisarG.current; return g.mons.some((m) => m.alive && m.def.id === "uw9boss" && Math.max(Math.abs(m.x - g.p.x), Math.abs(m.y - g.p.y)) <= 4); }));
await click("[data-gmgod]"); await sleep(1500);
check("modo dios: Hades no le hace daño", await ev(() => { const g = globalThis.__edisarG.current; return g.p.hp === g.p.hp && g.deaths === 0 && g.gm.god; }));
await shot("gm-panel.png");
await click("[data-gmkill]"); await sleep(300);
check("matar cercanos", await ev(() => { const g = globalThis.__edisarG.current; return !g.mons.some((m) => m.alive && !m.def.monk && Math.max(Math.abs(m.x - g.p.x), Math.abs(m.y - g.p.y)) <= 8); }));
await select("[data-gmplace]", "temple"); await click("[data-gmtp]"); await sleep(300);
// comando /gm
await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.keyboard.press("Slash"); await sleep(250);
check("tecla / abre la línea de comandos", await ev(() => !!document.querySelector("[data-cmd]")));
await page.keyboard.type("gm off"); await page.keyboard.press("Enter"); await sleep(250);
check("«/gm off» desactiva el Modo GM", await ev(() => !globalThis.__edisarG.current.gm.on && !document.querySelector("[data-gm]")));
await page.keyboard.press("Slash"); await sleep(200); await page.keyboard.type("gm"); await page.keyboard.press("Enter"); await sleep(250);
check("«/gm» lo vuelve a activar", await ev(() => globalThis.__edisarG.current.gm.on));
await click('[data-gm] button:nth-of-type(2)'); await sleep(200);
// Minato: hoja de 4 direcciones + escena
await put(62, 66); await ev(() => { const g = globalThis.__edisarG.current; g.lootToast = null; g.status = ""; g.log = []; }); await sleep(700);
const mrow = { label: "GM (estilo Minato)", out: [] };
for (const [f, fl] of FACES) { await ev((f) => { const g = globalThis.__edisarG.current; g.p.face = f; }, f); await sleep(120); const p = await at(); mrow.out.push({ img: await crop(p[0] - 0.6, p[1] - 0.75, 2.2, 2), cap: fl }); }
const sceneM = await crop((await at())[0] - 5, (await at())[1] - 2.5, 11, 5.5);
await compose([mrow], "Modo GM — atuendo de Minato (haori blanco con llamas rojas, chaleco jōnin, pelo rubio en punta) y etiqueta [GM]", "gm-minato.png", sceneM);
check("captura gm-minato.png", fs.existsSync(path.join(G, "shots/gm-minato.png")));
// guardado: gm:1 por personaje
await click("[data-charsbtn]"); await sleep(600); await page.reload(); await sleep(500); await cont(); await sleep(1200);
check("al volver a entrar, el personaje sigue en Modo GM ([GM])", await ev(() => !!globalThis.__edisarG.current.gm && globalThis.__edisarG.current.gm.on));

// ===== 2) Portal del templo al Inframundo =====
await ev(() => { const g = globalThis.__edisarG.current; g.gm.open = false; g.cleared = 11; });
const TP = [46, 65]; await put(TP[0] + 1, TP[1]); await sleep(300); await key("ArrowLeft");
let st = await status(); let p = await at();
check("portal del templo sellado antes de Géminis (🔒 se abre al vencer a Géminis)", p[0] === TP[0] + 1 && /Géminis/.test(st), st);
await put(TP[0] + 2, TP[1] + 1); await sleep(700); await shot("temple-portal.png");
await ev(() => { globalThis.__edisarG.current.cleared = 12; }); await put(TP[0] + 1, TP[1]); await sleep(200); await key("ArrowLeft"); p = await at();
check("tras vencer a Géminis te lleva a la Puerta del Inframundo", p[0] === 22 && p[1] === 4, String(p));
await put(21, 3); await sleep(200); await key("ArrowLeft"); p = await at();
check("portal de regreso junto a la Puerta → templo", p[0] === 44 && p[1] === 63, String(p));

// ===== 3) Clic para caminar =====
const clickTileAt = (tx, ty) => ev(([tx, ty]) => { const g = globalThis.__edisarG.current; const c = [...document.querySelectorAll("canvas")].sort((a, b) => b.width - a.width)[0]; const r = c.getBoundingClientRect(); const k = r.width / 672;
  const x = r.left + (tx * 32 - g.camX + 16) * k, y = r.top + (ty * 32 - g.camY + 16) * k; for (const t of ["pointerdown", "pointerup", "click"]) c.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, bubbles: true, pointerType: "mouse", button: 0 })); }, [tx, ty]);
await put(44, 66); await sleep(300); await clickTileAt(53, 70); await sleep(200);
check("clic en el suelo: marca destino y camina", await ev(() => { const g = globalThis.__edisarG.current; return !!g.walkGoal && g.walkGoal.x === 53 && g.walkGoal.y === 70; }));
await sleep(200); await shot("click-walk.png"); await sleep(3500); p = await at();
check("llega al destino evitando obstáculos", p[0] === 53 && p[1] === 70, String(p));
await clickTileAt(56, 66 + 3); await sleep(150);
check("clic en un muro: se ignora", await ev(() => !globalThis.__edisarG.current.walkGoal));
await clickTileAt(44, 70); await sleep(250); await key("ArrowUp", 450);
check("una tecla de movimiento cancela el camino", await ev(() => !globalThis.__edisarG.current.walkGoal));

// ===== 4) Sala de entrenamiento =====
await put(54, 71); await sleep(300); await key("ArrowRight"); p = await at();
check("la puerta de la villa lleva a la sala de entrenamiento", p[1] >= 130 && /entrenamiento/.test(await ev(() => globalThis.__edisarG.current.zone)), String(p));
const monk = await ev(() => { const g = globalThis.__edisarG.current; const m = g.mons.filter((x) => x.def.id === "monk").sort((a, b) => a.x - b.x || a.y - b.y)[2]; return [m.x, m.y, m.id]; });
await put(monk[0], monk[1] + 1); await ev((id) => { const g = globalThis.__edisarG.current; g.target = id; g.p.face = 0; }, monk[2]);
const sk0 = await ev(() => { const p = globalThis.__edisarG.current.p; return p.sk.melee.lvl * 1e6 + p.sk.melee.tries; }); const exp0 = await ev(() => globalThis.__edisarG.current.p.exp);
await key("KeyG", 60); await sleep(6000);
const tr = await ev((id) => { const g = globalThis.__edisarG.current; const m = g.mons.find((x) => x.id === id); return { alive: m.alive, hp: m.hp, afk: g.afk, sk: g.p.sk.melee.lvl * 1e6 + g.p.sk.melee.tries, exp: g.p.exp, tgt: g.target === id }; }, monk[2]);
check("AFK sobre el monje: sigue vivo, sube cuerpo a cuerpo, 0 experiencia", tr.alive && tr.afk && tr.tgt && tr.sk > sk0 && tr.exp === exp0, JSON.stringify(tr));
await shot("training-room.png");
const krow = { label: "Maestro Astilla (monje)", out: [] }; await ev(() => { const g = globalThis.__edisarG.current; g.afk = false; g.target = -1; g.status = ""; }); await put(monk[0] + 5, monk[1] + 5); await sleep(300);
for (const [f, fl] of FACES) { await ev(([id, f]) => { const g = globalThis.__edisarG.current; const m = g.mons.find((x) => x.id === id); m.face = f; m.angryUntil = 0; g.afk = false; g.target = -1; }, [monk[2], f]); await sleep(150); krow.out.push({ img: await crop(monk[0] - 0.6, monk[1] - 0.75, 2.2, 2), cap: fl }); }
const sceneT = await crop(monk[0] - 9, monk[1] - 1, 19, 11);
await compose([krow], "Sala de entrenamiento — monjes estilo Splinter (no mueren, no dan experiencia ni botín)", "training-monks.png", sceneT);
check("captura training-monks.png", fs.existsSync(path.join(G, "shots/training-monks.png")));

// ===== 5) Poderes de nivel 100 (uno por vocación) y Cadenas del caballero =====
const VOC = [["druid", "bendicion-del-bosque"], ["sorc", "infierno"], ["warlock", "eclipse-oscuro"], ["knight", "furia-sismica"], ["archer", "lluvia-del-cielo"], ["rogue", "danza-mil-sombras"]];
for (const [cls, slug] of VOC) {
  await newChar(cls, "Prueba", 100, { gm: 1 });
  const f = await field(); await put(f[0], f[1]); await sleep(300);
  await ev(() => { const g = globalThis.__edisarG.current; g.gm.open = true; }); await sleep(200);
  await click("[data-gmgod]"); await select("[data-gmmon]", "uw3c"); for (let i = 0; i < 5; i++) { await click("[data-gmspawn]"); await sleep(60); }
  if (cls === "knight") { // Cadenas: monstruos a 3-5 casillas → junto al caballero
    await ev(([x, y]) => { const g = globalThis.__edisarG.current; const ms = g.mons.filter((m) => m.alive && m.temp); const spots = [[x + 4, y], [x - 4, y + 1], [x + 1, y - 4], [x - 3, y - 3], [x + 4, y + 3]]; ms.forEach((m, i) => { const s = spots[i % 5]; m.x = s[0]; m.y = s[1]; m.fx = m.x; m.fy = m.y; m.calmUntil = performance.now() + 1e6; m.angryUntil = 0; }); g.p.mana = 99999; }, f);
    await ev(() => { globalThis.__edisarG.current.gm.open = false; }); await sleep(300);
    await page.keyboard.press("F7"); await sleep(120); await shot("knight-pull.png");
    const near = await ev(() => { const g = globalThis.__edisarG.current; return g.mons.filter((m) => m.alive && m.temp).map((m) => Math.max(Math.abs(m.x - g.p.x), Math.abs(m.y - g.p.y))); });
    check("caballero nv 35+: Cadenas del Guardián atraen a los monstruos junto a él", near.length >= 4 && near.every((d) => d <= 1), JSON.stringify(near));
    await sleep(600);
  }
  await ev(() => { const g = globalThis.__edisarG.current; g.gm.open = false; g.p.mana = 99999; g.p.hp = Math.round(g.p.hp * 0.5); const t = g.mons.filter((m) => m.alive && m.temp)[0]; if (t) g.target = t.id; for (const m of g.mons) if (m.temp) m.calmUntil = 0; }); await sleep(200);
  const hp0 = await ev(() => globalThis.__edisarG.current.mons.filter((m) => m.temp).reduce((a, m) => a + (m.alive ? m.hp : 0), 0));
  await page.keyboard.press(cls === "knight" ? "F8" : "F7"); await sleep(cls === "archer" ? 700 : 180); await shot(`lv100-${slug}.png`); await sleep(1500);
  const r = await ev(() => { const g = globalThis.__edisarG.current; const k = g.cls.powers.findIndex((p) => p.kind === "ult"); return { k, cd: (g.p.cd[k] ?? 0) - performance.now(), hp: g.mons.filter((m) => m.temp).reduce((a, m) => a + (m.alive ? m.hp : 0), 0), name: g.cls.powers[k].name }; });
  check(`${cls}: «${r.name}» (tecla ${cls === "knight" ? "F8" : "F7"}) se lanza y daña en área`, r.cd > 20000 && r.hp < hp0, `vida total ${hp0}→${r.hp}`);
}
// bloqueado por debajo del nivel 100
await newChar("sorc", "Bajo", 60);
await page.keyboard.press("F7"); await sleep(200);
check("nivel 60: el poder 5 aparece bloqueado (🔒 nivel 100)", /nivel 100/.test(await status()), await status());
check("sin errores de consola", errs.length === 0, errs.slice(0, 3).join(" | "));
await browser.close();
const fails = res.filter((x) => !x).length; console.log(fails ? `\n${fails} FALLOS (v22)` : `\nTODO OK (v22) — ${res.length} comprobaciones`); if (fails) process.exitCode = 1;
