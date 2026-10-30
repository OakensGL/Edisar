// v25 (título): // v22: Modo GM (panel, Minato, /gm, guardado), sala de entrenamiento (monjes estilo Splinter), poderes de nivel 100 + Cadenas,
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


await newChar("knight", "Juanca", 30); await page.reload(); await sleep(700); // ya en el título (la partida se guardó al salir)
await seed((d) => { d.cs = { ...(d.cs || {}), owned: [...((d.cs && d.cs.owned) || []), "o_carmesi"], outfit: "o_carmesi" }; });
await page.reload(); await sleep(900);
const t = await ev(() => {
  const cv = document.querySelector("[data-char] canvas"); let red = 0;
  if (cv) { const x = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; for (let i = 0; i < x.length; i += 4) if (x[i] === 0x8a && x[i + 1] === 0x1c && x[i + 2] === 0x2a) red++; }
  const art = [...document.querySelectorAll("[role=img]")].find((e) => getComputedStyle(e).backgroundImage.includes("data:image/webp")); const a = art.getBoundingClientRect(); const b = document.querySelector("[data-create]").getBoundingClientRect();
  const au = document.querySelector("[data-title-music]"); const mute = document.querySelector("[data-mute]");
  return { red, inFrame: b.left > a.left + a.width * 0.29 && b.right < a.left + a.width * 0.71 && b.top > a.top + a.height * 0.72 && b.bottom < a.top + a.height * 0.92,
    src: au ? (au.getAttribute("src") || "").slice(0, 15) : "none", loop: !!au && au.loop, mute: !!mute && getComputedStyle(mute).display !== "none", ver: document.body.innerText.includes("Versión v25") };
});
check("retrato de la lista: lleva el atuendo guardado (Túnica carmesí), no el de la vocación", t.red > 20, `píxeles carmesí ${t.red}`);
check("el menú (Crear personaje) está dentro del marco dorado del arte", t.inFrame);
check("texto de versión v25 en el título", t.ver);
check("música del título: <audio> en bucle con la pista y botón de silencio visible", t.src.startsWith("data:audio/") && t.loop && t.mute, t.src);
await page.click('[data-chars]'); await sleep(600);
const playing = await ev(() => { const a = document.querySelector("[data-title-music]"); return !!a && !a.paused; });
check("suena tras el primer clic (los navegadores bloquean el autoplay antes)", playing);
await page.click("[data-mute]"); await sleep(300);
const muted = await ev(() => { const a = document.querySelector("[data-title-music]"); return !!a && a.paused && document.querySelector("[data-mute]").textContent.includes("🔇"); });
check("🔊/🔇 silencia la música", muted);
await page.click("[data-mute]"); await sleep(300);
await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: path.join(G, "shots", "v25-title.png"), fullPage: true });
await cont(); await sleep(1200);
check("al entrar al juego la música del título se para (el <audio> desaparece)", await ev(() => !document.querySelector("[data-title-music]")));
check("sin errores de consola", errs.length === 0, errs.slice(0, 2).join(" | "));
await browser.close(); console.log(res.every(Boolean) ? "TODO OK (v25)" : "HAY FALLOS"); process.exit(res.every(Boolean) ? 0 : 1);
