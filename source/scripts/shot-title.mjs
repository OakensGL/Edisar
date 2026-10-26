// 1280x720 title-screen screenshot + check that the embedded title art decoded. Usage: node scripts/shot-title.mjs
import puppeteer from "puppeteer-core"; import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const b = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"], defaultViewport: { width: 1280, height: 720 } });
const p = await b.newPage(); const errs = []; p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); }); p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("file://" + path.join(root, "dist/index.html")); await p.evaluate(() => localStorage.clear()); await p.reload(); await new Promise((r) => setTimeout(r, 1500));
const info = await p.evaluate(async () => {
  const imgs = [...document.images].map((i) => ({ src: i.src.slice(0, 22), ok: i.complete && i.naturalWidth > 0, w: i.naturalWidth, h: i.naturalHeight }));
  const bgs = [...document.querySelectorAll("*")].map((e) => getComputedStyle(e).backgroundImage).filter((s) => s.includes("data:image/webp")).length;
  // decode any embedded webp to be sure it is valid
  const m = document.documentElement.outerHTML.match(/data:image\/webp;base64,[A-Za-z0-9+/=]+/); let dec = null;
  if (m) { const im = new Image(); im.src = m[0]; try { await im.decode(); dec = `${im.naturalWidth}x${im.naturalHeight}`; } catch { dec = "decode failed"; } }
  return { imgs, bgs, dec, start: document.body.innerText.includes("Comenzar"), cont: document.body.innerText.includes("Continuar última partida") };
});
await p.screenshot({ path: path.join(root, "shots/standalone-title.png") });
console.log(JSON.stringify(info), "errors:", errs.length ? errs : "none"); await b.close();
