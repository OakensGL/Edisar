// Croqui end-to-end check (copied from /workspace/edisar-croqui/tools/test-croqui.mjs and hardened: 60 s for the random Sifón, mana measured from full, orbs polled).
// Runs on this tree by default (GAME_DIR overrides). Build first: TESTHOOK=1 node scripts/build.mjs (build.sh --test does it).
// (build the copy first: cd $GAME_DIR && TESTHOOK=1 node scripts/build.mjs). Writes shots into $GAME_DIR/shots/croqui-*.png
import path from "node:path"; import fs from "node:fs";
const G = process.env.GAME_DIR || path.resolve(path.dirname(new URL(import.meta.url).pathname), ".."); // default: this edisar-web tree (build with TESTHOOK=1 first)
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
const zone = () => page.evaluate(() => globalThis.__edisarG.current.zone || "");
fs.mkdirSync(path.join(G, "shots"), { recursive: true });
const shot = async (f) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(G, "shots", f) }); };
const ev = (fn, a) => page.evaluate(fn, a);
await page.goto("file://" + path.join(G, "dist-test/index.html")); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(600);
await page.select('select[aria-label="Vocación"]', "warlock");
await page.type("input", "Ikki"); await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Crear personaje")).click()); await sleep(1200);
await page.reload(); await sleep(500);
await seed((d) => { const L = 70; d.level = L; d.exp = Math.round((50 / 3) * (L * L * L - 6 * L * L + 17 * L - 12)); d.hpPot = 500; d.manaPot = 500; d.cleared = 11; d.x = 48; d.y = 73; });
await page.reload(); await sleep(600); await cont(); await sleep(1500);
const croq = () => ev(() => { const g = globalThis.__edisarG.current; const m = (g.byRegion[13] || []).find((x) => x.def.id === "croqui"); return m ? { hp: m.hp, max: m.def.hp, atk: m.def.atk, alive: m.alive, x: m.x, y: m.y } : null; });
const c0 = await croq(); check("Croqui spawned in region 13", !!c0 && c0.alive, JSON.stringify(c0));
// --- Torre de Croqui (overworld, south of Villa Esmeralda) ---
const OYv = 32, DOOR = [65, OYv + 48], GATE = [53, OYv + 48];
const map = await ev(([door, gate]) => { const g = globalThis.__edisarG.current; const W = 352, T = g.tiles; const walk = new Set([0, 4, 5, 7, 8, 9, 11, 12]);
  const bfs = (sx, sy) => { const seen = new Uint8Array(W * 144); const q = [[sx, sy]]; seen[sy * W + sx] = 1; while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= 96 || ny >= 104) continue; const k = ny * W + nx; if (seen[k] || !walk.has(T[k])) continue; seen[k] = 1; if (T[k] !== 11 || (nx === door[0] && ny === door[1])) q.push([nx, ny]); } } return seen; };
  const seen = bfs(44, 63); // temple of Villa Esmeralda
  let road = true; for (let y = 73; y <= 101; y++) if (T[y * W + 48] !== 9) road = false;
  let branch = true; for (let x = 49; x < gate[0]; x++) if (T[gate[1] * W + x] !== 9) branch = false;
  const inBlock = (x, y) => x >= 53 && x <= 67 && y >= 73 && y <= 84;
  return { reach: !!seen[door[1] * W + door[0]], gateOpen: !!seen[gate[1] * W + gate[0]], road, branch, door: T[door[1] * W + door[0]], desert: T[96 * W + 84],
    monsIn: g.mons.filter((m) => m.alive && inBlock(m.x, m.y)).map((m) => m.def.id), trees: (() => { let n = 0; for (let y = 73; y <= 87; y++) for (let x = 36; x <= 76; x++) if (T[y * W + x] === 1) n++; return n; })() };
}, [DOOR, GATE]);
check("road from town (x 48) intact, cobbled branch to the castle gate", map.road && map.branch);
check("walkable path: temple → gate → hall teleport", map.reach && map.gateOpen);
check("teleport tile is inside the castle hall", map.door === 11, `tile ${map.door}`);
check("desert portal removed", map.desert !== 11, `tile ${map.desert}`);
check("dead-tree grove around the castle", map.trees >= 120, `${map.trees} dead trees`);
check("nothing spawns inside the castle", map.monsIn.length === 0, map.monsIn.join(","));
const put = (x, y) => ev(([x, y]) => { const g = globalThis.__edisarG.current; const p = g.p; p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = 0; g.walkGoal = null; }, [x, y]);
await put(49, OYv + 50); await sleep(900); await shot("croqui-tower.png"); // the tower from the grove, next to the town road
await put(48, 73); await sleep(400);
const walkTo = (x, y) => ev(([x, y]) => { const g = globalThis.__edisarG.current; g.walkGoal = { x, y, open: false }; g.chase = false; }, [x, y]);
await walkTo(GATE[0] + 1, GATE[1]); let t9 = Date.now(), atGate = false;
while (!atGate && Date.now() - t9 < 20000) { await sleep(200); atGate = await ev(([x, y]) => { const p = globalThis.__edisarG.current.p; return p.x === x && p.y === y; }, [GATE[0] + 1, GATE[1]]); }
check("the player walks from the town road through the gate into the hall", atGate, await zone());
check("hall zone name", /Torre de Croqui/.test(await zone()), await zone());
await put(60, OYv + 48); await sleep(700); await shot("croqui-hall.png"); // inside the hall: pillars, carpet, teleport
const at = () => ev(() => [globalThis.__edisarG.current.p.x, globalThis.__edisarG.current.p.y]);
const inLair = async () => { const [x, y] = await at(); return y >= 104 && x >= 40; };
await ev(([x, y]) => { const g = globalThis.__edisarG.current; const p = g.p; p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = 0; g.walkGoal = null; }, [DOOR[0] - 1, DOOR[1]]); await sleep(300);
const step = async () => { await page.keyboard.down("ArrowRight"); await sleep(140); await page.keyboard.up("ArrowRight"); await sleep(600); };
await step(); const seal = await ev(() => globalThis.__edisarG.current.status);
check("teleport sealed before Géminis is cleared (you stay in the hall)", !(await inLair()) && /sello turquesa/.test(seal), seal);
await ev(() => { const g = globalThis.__edisarG.current; g.cleared = 12; g.status = ""; }); await sleep(400);
await step(); const st1 = await ev(() => globalThis.__edisarG.current.status);
check("first step shows «Recomendado: grupo (nivel 70+)» warning", /Recomendado: grupo \(nivel 70\+\)/.test(st1) && !(await inLair()), st1);
await step();
check("second step enters the lair antechamber", await inLair() && (await zone()).includes("Guarida"), await zone()); await shot("croqui-antechamber.png");
await ev(() => { const g = globalThis.__edisarG.current; const p = g.p; p.x = 44; p.y = 124; p.fx = 44; p.fy = 124; p.moveStart = 0; });
await page.keyboard.down("ArrowLeft"); await sleep(140); await page.keyboard.up("ArrowLeft"); await sleep(600);
check("the lair exit portal returns you to the castle hall", !(await inLair()) && /Torre de Croqui/.test(await zone()), await zone());
await ev(([x, y]) => { const g = globalThis.__edisarG.current; const p = g.p; p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = 0; g.croqGate = 0; }, [DOOR[0] - 1, DOOR[1]]); await sleep(300);
await step(); await step();
check("re-enter (warning + second step)", await inLair());
// into the arena
await ev(() => { const g = globalThis.__edisarG.current; const p = g.p; p.x = 75; p.y = 123; p.fx = 75; p.fy = 123; p.moveStart = 0; g.p.hp = 1e6; g.st.arm = 1e5; });
let casts = new Set(); const t0 = Date.now();
while (Date.now() - t0 < 14000) { await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; g.st.arm = 1e5; globalThis.__cq = [...new Set([...(globalThis.__cq || []), ...g.warns.map((w) => w.name)])]; }); await sleep(150); }
casts = await ev(() => globalThis.__cq || []); check("Croqui casts several fire powers (random)", casts.length >= 3, casts.join(", "));
check("Venequitos summoned", await ev(() => globalThis.__edisarG.current.byRegion[13].some((m) => m.alive && m.temp && m.def.id === "venequito")));
await shot("croqui-fight.png");
await ev(() => { const g = globalThis.__edisarG.current; const m = g.byRegion[13].find((x) => x.def.id === "croqui"); m.hp = Math.round(m.def.hp * 0.49); g.p.hp = 1e6; g.st.arm = 1e5; });
let inDim = false; const t1 = Date.now(); while (!inDim && Date.now() - t1 < 5000) { await sleep(80); inDim = (await zone()).includes("Otra Dimensi"); }
check("at 50% Croqui sends you to Otra Dimensión", inDim); if (!inDim) console.log("   dbg", JSON.stringify(await ev(() => { const g = globalThis.__edisarG.current; const c = g.croq; return { c: c && { phase: c.phase, dimAt: c.dimAt, dimDone: c.dimDone }, p: [g.p.x, g.p.y, g.p.hp], zone: g.zone, dim: !!g.dim, deaths: g.deaths }; }))); await sleep(2800); await shot("croqui-dimension.png");
check("dimension is Croqui-themed (home=croq, fire shades)", await ev(() => { const g = globalThis.__edisarG.current; return g.dim && g.dim.home === "croq" && g.byRegion[12].some((m) => m.alive && m.def.id === "croq_shade"); }));
await ev(() => { const g = globalThis.__edisarG.current; if (g.dim) g.dim.until = performance.now(); g.p.hp = 1e6; g.st.arm = 1e5; }); await sleep(800);
check("back in the lair after the dimension, phase 2", (await zone()).includes("Croqui") && await ev(() => globalThis.__edisarG.current.croq?.phase === 2), await zone());
await ev(() => { const g = globalThis.__edisarG.current; const m = g.byRegion[13].find((x) => x.def.id === "croqui"); m.hp = Math.round(m.def.hp * 0.19); g.p.hp = 1e6; g.st.arm = 1e5; });
await sleep(800); const mana0 = await ev(() => { const g = globalThis.__edisarG.current; g.p.mana = g.cls.manaBase + (g.p.level - 1) * g.cls.manaPer + g.st.mana; return g.p.mana; });
check("red HP: phase 3 + enraged", await ev(() => { const g = globalThis.__edisarG.current; return g.croq?.phase === 3 && g.byRegion[13].find((x) => x.def.id === "croqui").enraged; }));
await sleep(500); await shot("croqui-redhp.png");
let siph = false; const t2 = Date.now();
while (!siph && Date.now() - t2 < 60000) { await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; g.st.arm = 1e5; const m = g.byRegion[13].find((x) => x.def.id === "croqui"); if (m && m.hp < m.def.hp * 0.15) m.hp = Math.round(m.def.hp * 0.19); }); await sleep(150); siph = await ev(() => (globalThis.__edisarG.current.croq?.siphonUntil ?? 0) > performance.now()); }
check("Sifón Arcano (mana beam) fires in red HP", siph); if (siph) { await sleep(700); await shot("croqui-siphon.png"); }
const mana1 = await ev(() => globalThis.__edisarG.current.p.mana); check("mana is drained", mana1 < mana0, `${Math.round(mana0)} → ${Math.round(mana1)}`);
let orbs = false; const tOrb = Date.now(); while (!orbs && Date.now() - tOrb < 10000) { orbs = await ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; return (g.croq?.orbs.length ?? 0) > 0; }); if (!orbs) await sleep(200); }
check("mana orbs appear", orbs);
const bag0 = await ev(() => globalThis.__edisarG.current.p.bag.length), gold0 = await ev(() => globalThis.__edisarG.current.p.gold);
const killOnce = () => ev(() => { const g = globalThis.__edisarG.current; g.p.hp = 1e6; g.st.arm = 1e5; if (g.croq) g.croq.siphonUntil = 0; const m = g.byRegion[13].find((x) => x.def.id === "croqui"); if (!m.alive) return; m.hp = 1; const p = g.p; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]) { const x = m.x + dx, y = m.y + dy; if (g.tiles[y * 352 + x] === 12 && !g.byRegion[13].some((o) => o.alive && o.x === x && o.y === y)) { p.x = x; p.y = y; p.fx = x; p.fy = y; p.moveStart = 0; break; } } g.target = m.id; });
await ev(() => { globalThis.__edisarG.current.p.bag = []; });
let dead = false; const t3 = Date.now(); while (!dead && Date.now() - t3 < 15000) { await killOnce(); await page.keyboard.press("Digit1"); await sleep(250); dead = await ev(() => !globalThis.__edisarG.current.byRegion[13].find((x) => x.def.id === "croqui").alive); }
check("Croqui can be killed", dead);
const loot = await ev(() => globalThis.__edisarG.current.p.bag.map((i) => i.id + ":" + i.rar));
check("loot: 8 items, ≥1 unique croq_*, no commons", loot.length === 8 && loot.some((s) => s.startsWith("croq_")) && !loot.some((s) => s.endsWith(":com")), loot.join(" "));
const gold1 = await ev(() => globalThis.__edisarG.current.p.gold); check("gold 25k–40k", gold1 - gold0 >= 25000 && gold1 - gold0 <= 40000 + 5000, String(gold1 - gold0));
check("first-kill coins", await ev(() => (globalThis.__edisarG.current.cs?.coins ?? 0) >= 55), String(await ev(() => globalThis.__edisarG.current.cs?.coins)));
await sleep(500); await shot("croqui-loot.png"); void bag0;
// coin shop: the Croqui-only outfit / aura show «Solo de Croqui» instead of a price
await page.evaluate(() => document.querySelector("[data-coinbtn]").click()); await sleep(900);
const cs = await ev(() => { const g = globalThis.__edisarG.current; const owned = g.cs?.owned ?? []; const ids = ["o_croqui", "a_croqui"]; return ids.map((id) => { const card = document.querySelector(`[data-coinitem="${id}"]`); return { id, owned: owned.includes(id), card: !!card, solo: !!card?.querySelector(`[data-croqonly="${id}"]`), txt: card?.textContent ?? "", buy: !!card && [...card.querySelectorAll("button")].some((b) => b.textContent.includes("Comprar")) }; }); });
check("coin shop: Croqui cosmetics show «Solo de Croqui» (no price / buy button)", cs.every((c) => c.card && !c.buy && (c.owned || (c.solo && /Solo de Croqui/.test(c.txt)))), JSON.stringify(cs.map((c) => `${c.id}:${c.owned ? "owned" : c.solo ? "solo" : "?"}`)));
const card = await page.$('[data-coinitem="o_croqui"]'); if (card) { await card.evaluate((e) => e.scrollIntoView({ block: "center" })); await sleep(300); const bb = await page.evaluate(() => { const a = document.querySelector('[data-coinitem="o_croqui"]').getBoundingClientRect(), b = document.querySelector('[data-coinitem="a_croqui"]').getBoundingClientRect(); const x = Math.min(a.left, b.left) - 260, y = Math.min(a.top, b.top) - 40; return { x: Math.max(0, x), y: Math.max(0, y), width: Math.min(900, Math.max(a.right, b.right) - Math.max(0, x) + 20), height: Math.max(a.bottom, b.bottom) - Math.max(0, y) + 20 }; }); await page.screenshot({ path: path.join(G, "shots", "croqui-coinshop.png"), clip: bb }); }
await page.keyboard.press("Escape"); await sleep(200);
check("no console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
const n = res.filter(Boolean).length; console.log(`${n}/${res.length} passed`); await browser.close(); process.exit(n === res.length ? 0 : 1);
